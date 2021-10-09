import * as util from './util.mjs';

// browser adds Math.seedrandom(), node populates seedrandom.default
// import * as seedrandom from './node_modules/seedrandom/seedrandom.js';
// if ('default' in seedrandom) Math.seedrandom = seedrandom.default; // set Math.seedrandom in node


const default_options = {
  'debug': false,
  'debug_options': false,
  'debug_script': false,
  'memory_size': 100,
  'seed': -1,
  
  'memory_marker': '$',
  'tag_marker': '#',
  'wildcard_marker': '*',
  'goto_marker': '->',
  'param_marker_pre': '(',
  'param_marker_post': ')',
  
  'stop_chars': '.,;:?!',
  'stop_words': ['but'],
  'allow_chars': '\'äöüß-',
  'fallback_reply': 'I am at a loss for words.',
};


export function parse_key(key) {
  key = util.contract_whitespace("" + key);
  const matches = key.match(/ (\d*)$/); // space followed by numbers at end of string
  // -> needs a preceding whitespace, so a number alone will be (correctly) considered a key (default rank 0)
  if (matches) {
    return {
      'key': key.substring(0, matches.index),
      'rank': parseInt(matches[1])
    };
  }
  return { 'key': key, 'rank': 0 };
}

function get_decomp_pattern(decomp, tag_patterns, tag_marker='#', wildcard_marker='*') {
  // expand tags
  const tag_re = new RegExp( `${util.regex_escape(tag_marker)}(\\S+)`, 'g' ); // match all tags eg. #happy in "* i am * #happy *"
  let out = decomp.replace(tag_re, (match, p1) => {
    if ( Object.keys(tag_patterns).includes(p1) ) return tag_patterns[p1]; // replace with tag regex pattern
    return p1; // remove tag marker
  });
  
  // expand wildcard expressions
  const wild_re = new RegExp( `\\s*${util.regex_escape(wildcard_marker)}\\s*`, 'g' );
  out = out.replace(wild_re, (match, offset, string) => {
    // We need word boundary markers, so decomp='* you * me *' does NOT match "what do you mean."
    // Note: this can include trailing whitespace into the capture group -> trim later
    let pattern = '\\s*(.*)\\s*'; // TODO: could we get rid of the \\s* ? we will ever have at most one whitespace there and will trim anyway
    if (match.length !== string.length) { // there's more than the match
      if (offset == 0) pattern = pattern + '\\b'; // append word boundary marker
      else pattern = '\\b' + pattern; // prepend word boundary marker
    }
    return pattern;
  });
  return out;
}

function set_mem_flag(obj, key, memory_marker) {
  if ( obj[key].startsWith(memory_marker) ) {
    obj[key] = obj[key].substring(memory_marker.length).trimStart();
    obj.mem_flag = true;
  }
}

// Required options: wildcard_marker, memory_marker, tag_marker
// Note: key, decomp and reasmb patters are treated with contract_whitespce
export function parse_keyword(keywords, key, options, tag_patterns) {
  const rules = keywords[key];
  const out = {};
  Object.assign( out, parse_key(key) ); // adds key and rank properties to output
  
  // rules can be object or string
  // if string, it is interpreted as a single reassembly rule for a decomp of '*'
  if (util.type(rules) == 'string') {
    out.rules = [{
      "decomp": "*",
      "reasmb": [ util.contract_whitespace(rules) ]
    }];
  } else {
    // rules in an object: {decomp: [reasmb, ...], ...}
    // check that it has only array or string values
    util.check_object(keywords, key, ['array', 'string']);
    out.rules = [];
    for (const [decomp, reassemblies ] of Object.entries(rules)) {
      // reasmb_rules can be array or string
      if (util.type(reassemblies) === 'string') {
        out.rules.push({
          "decomp": util.contract_whitespace(decomp),
          "reasmb": [ reassemblies ]
        });
      } else {
        // reassamblies is an array
        // check that it only has string values
        util.check_array(rules, decomp, ['string']);
        out.rules.push({
          "decomp": util.contract_whitespace(decomp),
          "reasmb": reassemblies.map(util.contract_whitespace)
        });
      }
    }
  }
  // add decomp patterns
  for (const rule of out.rules) {
    rule.decomp_pattern = get_decomp_pattern(rule.decomp, tag_patterns, options.tag_marker, options.wildcard_marker);
  }
  // add mem flags
  set_mem_flag(out, 'key', options.memory_marker); // ... for the whole keyword
  for (const rule of out.rules) {
    set_mem_flag(rule, 'decomp', options.memory_marker); // ... for each decomp rule
  }
  return out;
}

// Required options: wildcard_marker, memory_marker, 
export function parse_script(script, options) {
  script = Object.assign({}, script);
  const data = {};
  
  // check script as a whole
  if (typeof script !== 'object') throw 'script needs to be an object';
  
  // initial
  util.check_array(script, 'initial', ['string']);
  data.initial = script.initial;
  
  // final
  util.check_array(script, 'final', ['string']);
  data.final = script.final;
  
  // none
  util.check_array(script, 'none', ['string']);
  data.none = script.none;
  
  // pre
  util.check_object(script, 'pre', ['string']);
  data.pre = util.map_obj_keys(script.pre, util.contract_whitespace);
  
  // post
  util.check_object(script, 'post', ['string']);
  data.post = util.map_obj_keys(script.post, util.contract_whitespace);
  
  // tags
  util.check_object(script, 'tags', ['array']);
  data.tags = util.map_obj_keys(script.tags, x => util.contract_whitespace(x, '_')); // tags can't contain whitespace
  
  // patterns (regexes)
  data.pre_pattern = `\\b(${Object.keys(data.pre).map(util.regex_escape).join('|')})\\b`;
  data.post_pattern = `\\b(${Object.keys(data.post).map(util.regex_escape).join('|')})\\b`;
  data.tag_patterns = Object.fromEntries(
    Object.entries(data.tags).map( ([tag, tagged_words]) => {
      return [ tag, '(' + tagged_words.map(util.regex_escape).join('|') + ')' ];
    })
  );
  
  // keywords
  util.check_object(script, 'keywords', ['object', 'string']);
  data.keywords = Object.keys(script.keywords).map( (key, idx) => {
    const parsed_keyword = parse_keyword(script.keywords, key, options, data.tag_patterns);
    parsed_keyword.orig_idx = idx;
    return parsed_keyword;
  });
  
  // sort keywords
  data.keywords.sort( (a,b) => {
    // sort by rank
    if ( a.rank > b.rank ) return -1;
    else if ( a.rank < b.rank ) return 1;
    // or original index
    else if ( a.orig_idx > b.orig_idx ) return 1;
    else if ( a.orig_idx < b.orig_idx ) return -1;
    else return 0;
  });
  
  return data;
}


export function make_eliza(script, options={}) {
  options = Object.assign({}, options, default_options);
  const data = parse_script(script, options);
  console.dir(data.keywords, {depth: 3});
  // console.log(data);
  
  // console.log( parse_key('hello 3.') );
}

