import * as util from './util.mjs';

// browser adds Math.seedrandom(), node populates seedrandom.default
import * as seedrandom from './node_modules/seedrandom/seedrandom.js';
if ('default' in seedrandom) Math.seedrandom = seedrandom.default; // set Math.seedrandom in node


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

export function get_decomp_pattern(decomp, tag_patterns, tag_marker='#', wildcard_marker='*') {
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

export function set_mem_flag(obj, key, memory_marker) {
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
  
  // rules can be object, array or string
  if (util.type(rules) == 'string') {
    // if string, it is interpreted as a single reassembly rule for a decomp of '*'
    out.rules = [{
      "decomp": "*",
      "reasmb": [ util.contract_whitespace(rules) ]
    }];
  } else if (util.type(rules) == 'array') {
    // if array, interpret as array of reassembly rules for a decomp of '*'
    util.check_array(keywords, key, ['string']);
    out.rules = [{
      "decomp": "*",
      "reasmb": rules.map(util.contract_whitespace)
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
  if (typeof script !== 'object') util.script_error('script needs to be an object');
  
  // initial
  util.check_array(script, 'initial', ['string']);
  data.initial = script.initial;
  
  // final
  util.check_array(script, 'final', ['string']);
  data.final = script.final;
  
  // quit
  util.check_array(script, 'quit', ['string']);
  data.quit = script.quit;
  
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
  data.tags = util.map_obj_keys(script.tags, util.replace_whitespace); // tags can't contain whitespace
  
  // patterns (regexes)
  data.pre_pattern = `\\b(${Object.keys(data.pre).map(util.regex_escape).join('|')})\\b`;
  data.post_pattern = `\\b(${Object.keys(data.post).map(util.regex_escape).join('|')})\\b`;
  data.tag_patterns = Object.fromEntries(
    Object.entries(data.tags).map( ([tag, tagged_words]) => {
      return [ tag, '(' + tagged_words.map(util.regex_escape).join('|') + ')' ];
    })
  );
  
  // keywords
  util.check_object(script, 'keywords', ['object', 'array', 'string']);
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

export function normalize_input(text, options) {
  // TODO(?): DO NOT lowercase (preserve capitalization for output)
  text = text.toLowerCase();
  
  // ignore all characters that arent explicitly allowed
  // A-Z and space are always allowed
  const ignore_pattern = '[^a-zA-Z ' 
    + util.regex_escape(options.allow_chars)
    + util.regex_escape(options.stop_chars)
    + ']';
  text = text.replace(new RegExp(ignore_pattern, 'g'), ' ');
  text = util.contract_whitespace(text);
  const stop_pattern = '[' + util.regex_escape(options.stop_chars) + ']';
  text = text.replace(new RegExp(stop_pattern, 'g'), '.');
  const stop_word_pattern = '\\b(' + options.stop_words.map(util.regex_escape).join('|') + ')\\b';
  text = text.replace(new RegExp(stop_word_pattern, 'g'), '.');
  return text;
}


export function make_eliza(script, options={}) {
  options = Object.assign({}, default_options, options);
  
  if (options.debug_options) console.log('options:', options);
  
  // define a log function (does nothing if debug option is false)
  const log = options.debug ? console.log : () => {};
  // add a dir function as property
  log.dir = options.debug ? console.dir : () => {}; 
  
  const seed = options.seed < 0 ? undefined : options.seed;
  
  const data = parse_script(script, options);
  console.dir(data, {depth: 3});
  
  // variables
  let quit, mem, rnd, last_none;
  
  function reset() {
    quit = false;
    mem = [];
    rnd = new Math.seedrandom(seed); // initialize rng
    last_none = -1;
    for (let k of data.keywords) {
      for (let r of k.rules) {
        r.last_choice = -1;
      }
    }
  }
  
  function get_initial() {
    return data.initial[ util.rnd_int(data.initial.length, rnd) ];
  }
  
  function get_final() {
    return data.final[ util.rnd_int(data.final.length, rnd) ];
  }
  
  function is_quit() {
    return quit;
  }
  
  function get_options() {
    return options;
  }
  
  function mem_push(t) {
    mem.push(t);
    if (mem.length > options.mem_size) mem.shift();
  }
  
  function mem_pop() {
    if (mem.length == 0) return '';
    if (options.randomize_choices) {
      const idx = util.rnd_int(mem.length, rnd);
      return mem.splice(idx, 1)[0];
    }
    return mem.shift();
  }
  
  // execute transformation rule on text
  // possibly produce a reply
  function exec_rule(keyword, text) {
    // iterate through all rules in the keyword (decomp -> reasmb)
    for (const [idx, rule] of keyword.rules.entries()) {
      // check if decomp rule matches input
      const decomp_regex = new RegExp(rule.decomp_pattern, 'i');
      const decomp_match = text.match(decomp_regex); // first match of decomp pattern
      if ( decomp_match ) {
        log('rule ' + idx + ' matched:', rule)
        // choose reasmb rule (random or last_choice+1)
        let reasmb_idx = options.randomize_choices ? util.rnd_int(rule.reasmb.length, rnd) : rule.last_choice + 1 ;
        if (reasmb_idx >= rule.reasmb.length) reasmb_idx = 0;
        const reasmb = rule.reasmb[reasmb_idx];
        rule.last_choice = reasmb_idx;
        log('reasmb ' + reasmb_idx + ' chosen:', JSON.stringify(reasmb));
        // detect goto directive
        const goto_regex = RegExp('^' + util.regex_escape(options.goto_marker) + ' (\\S+)');
        const goto_match = reasmb.match(goto_regex);
        if (goto_match) {
          const goto_key = data.keywords.find( x => x.key == goto_match[1] );
          if (goto_key !== undefined) return exec_rule(goto_key, text);
        }
        // substitute positional parameters in reassembly rule
        let reply = reasmb;
        const param_regex = new RegExp(util.regex_escape(options.param_marker_pre) + '([0-9]+)' + util.regex_escape(options.param_marker_post), 'g');
        reply = reply.replace(param_regex, (match, p1) => {
          const param = parseInt(p1);
          if (Number.isNaN(param) || param <= 0) return ''; // couldn't parse parameter
          // tags are counted as params as well, since they are a capture group in the decomp pattern!
          let val = decomp_match[param]; // capture groups start at idx 1, params as well!
          if (val === undefined) return '';
          val = val.trim();
          // post-process param value
          const post_regex = new RegExp(data.post_pattern, 'gi');
          const val_post = val.replace(post_regex, (match, p1) => data.post[p1.toLowerCase()]);
          log('param (' + param + '):', JSON.stringify(val), '->', JSON.stringify(val_post));
          return val_post;
        });
        if (rule.mem_flag) {
          mem_push(reply); // don't use this reply now, save it
          log('reply memorized: ', JSON.stringify(reply));
        }
        else return reply;
      }
    }
    return '';
  }
  
  function transform(text) {
    text = normalize_input(text, options);
    log('transforming (normalized):', JSON.stringify(text));
    let parts = text.split('.');
    // trim and remove empty parts
    parts = parts.map(x => x.trim()).filter( x => x !== '');
    log('parts:', parts);
    
    // for each part...
    for (let [idx, part] of parts.entries()) {
      // check for quit expression
      if (data.quit.includes(part)) {
        quit = true;
        return get_final();
      }
      // pre-process
      const pre_regex = new RegExp(data.pre_pattern, 'gi');
      part = part.replace(pre_regex, (match, p1) => data.pre[p1.toLowerCase()]);
      
      // look for keywords
      for (const keyword of data.keywords) {
        const key_regex = new RegExp(`\\b${util.regex_escape(keyword.key)}\\b`, 'i');
        if ( key_regex.test(part) ) {
          log('keyword found (part ' + idx + '):', keyword);
          const reply = exec_rule(keyword, part);
          log('reply:', JSON.stringify(reply));
          if (reply != '') return reply;
        }
      }
    }
    
    // nothing matched, try mem
    let reply = mem_pop();
    if (reply != '') return reply;
    
    // nothing in mem, try none
    if (data.none.length > 0) {
      if (++last_none >= data.none.length) last_none = 0;
      const reply = data.none[last_none];
      if (reply != '') return reply;
    }
    
    // last resort
    return options.fallback_reply;
  }
  
  function transform_delay(text, delay=[1,3]) {
    const response = transform(text);
    if (Array.isArray(delay)) {
      delay = delay[0] + rnd() * (delay[1] - delay[0]);
    }
    return new Promise( (resolve, reject) => {
      setTimeout(() => { resolve(response); }, delay*1000);
    });
  }
  
  reset();
  
  // log script after reset (last choice computed)
  if (options.debug_script) {
    console.log('script:'); console.dir(data, {depth:2});
  }
  
  return {
    get_initial,
    transform,
    transform_delay,
    is_quit,
    reset,
    get_options,
  };
}

export async function make_eliza_async(script_url, options={}) {
  const script = (await import(script_url)).default;
  return make_eliza(script, options);
}
