import * as util from './util.mjs';

export function parse_key(key) {
  key = util.contract_whitespace("" + key);
  const matches = key.match(/ (-?\d*)$/); // space followed by numbers at end of string
  // -> needs a preceding whitespace, so a number alone will be (correctly) considered a key (default rank 0)
  if (matches) {
    return {
      'key': key.substring(0, matches.index),
      'rank': parseInt(matches[1])
    };
  }
  return { 'key': key, 'rank': 0 };
}

export function get_decomp_pattern(decomp, tag_patterns={}, tag_marker='#', wildcard_marker='*') {
  // expand tags
  const tag_re = new RegExp( `${util.regex_escape(tag_marker)}(\\S+)`, 'giu' ); // match all tags eg. #happy in "* i am * #happy *"
  let out = decomp.replace(tag_re, (match, p1) => {
    if ( Object.keys(tag_patterns).includes(p1) ) return tag_patterns[p1]; // replace with tag regex pattern
    return p1; // remove tag marker
  });
  
  // expand wildcard expressions
  const wild_re = new RegExp( `\\s*${util.regex_escape(wildcard_marker)}\\s*`, 'gu' );
  out = out.replace(wild_re, (match, offset, string) => {
    // We need word boundary markers, so decomp='* you * me *' does NOT match "what do you mean."
    // Note: this can include trailing whitespace into the capture group -> trim later
    let pattern = '(.*)'; // TODO: could we get rid of the \\s* ? we will ever have at most one whitespace there and will trim anyway
    if (match.length !== string.length) { // there's more than the wildcard
      if (offset == 0) {
        // wildcard is at the beginning: append word boundary marker
        pattern = pattern + '\\b'; 
      } else if (offset + match.length == string.length) {
        // wildcard is at the end: prepend word boundary marker
        pattern = '\\b' + pattern; 
      } else {
        // wildcard is in the middle: markers on both sides
        pattern = '\\b' + pattern + '\\b';
      }
    }
    return pattern;
  });
  return '^' + out + '$';
}

export function set_mem_flag(obj, key, memory_marker) {
  if ( obj[key].startsWith(memory_marker) ) {
    obj[key] = obj[key].substring(memory_marker.length).trimStart();
    obj.mem_flag = true;
  }
}

// Required options: wildcard_marker, memory_marker, tag_marker
// Note: key, decomp and reasmb patters are treated with contract_whitespce
export function parse_keyword(keywords, key, options, tag_patterns={}) {
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
  
  // add mem flags (before decomp patterns are created)
  set_mem_flag(out, 'key', options.memory_marker); // ... for the whole keyword
  for (const rule of out.rules) {
    set_mem_flag(rule, 'decomp', options.memory_marker); // ... for each decomp rule
    // if the whole key has a mem flag, flag all the rules
    if (out.mem_flag) rule.mem_flag = true;
  }
  
  // add decomp patterns
  for (const rule of out.rules) {
    rule.decomp_pattern = get_decomp_pattern(rule.decomp, tag_patterns, options.tag_marker, options.wildcard_marker);
  }
  
  return out;
}

// Required options: wildcard_marker, memory_marker, tag_marker
export function parse_script(script, options) {
  script = Object.assign({}, script);
  const data = {};
  
  // check script as a whole
  if (typeof script !== 'object') util.script_error('script needs to be an object');
  
  // options (optional)
  if ( util.type(script.options) == 'object' ) {
    data.options = Object.assign( {}, options, script.options );
  } else {
    data.options = Object.assign( {}, options );
  }
  options = data.options;
  
  // initial
  util.check_array(script, 'initial', ['string']);
  data.initial = script.initial;
  
  // final
  util.check_array(script, 'final', ['string']);
  data.final = script.final;
  
  // quit
  util.check_array(script, 'quit', ['string']);
  data.quit = script.quit;
  
  // quit
  util.check_array(script, 'quit*', ['string']);
  data['quit*'] = script['quit*'];
  
  // none
  util.check_array(script, 'none', ['string']);
  data.none = script.none;
  
  // empty
  util.check_array(script, 'empty', ['string']);
  data.empty = script.empty;
  
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
  data.pre_pattern = '';
  if (! util.obj_empty(data.pre) ) {
    // data.pre_pattern = `\\b(${Object.keys(data.pre).map(util.regex_escape).join('|')})\\b`;
    // word boundaries (\b) only work with basic latin characters (not ß, umlauts etc.)
    // -> use non-capturing (?:), whitespace or start/end of input as boundary
    data.pre_pattern = `(?:^|\\s)(${Object.keys(data.pre).map(util.regex_escape).join('|')})(?:$|\\s)`;
  }
  data.post_pattern = '';
  if (! util.obj_empty(data.post) ) {
    // data.post_pattern = `\\b(${Object.keys(data.post).map(util.regex_escape).join('|')})\\b`;
    data.post_pattern = `(?:^|\\s)(${Object.keys(data.post).map(util.regex_escape).join('|')})(?:$|\\s)`;
  }
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
  // DO NOT lowercase (preserve capitalization for output)
  if (options.lowercase_input) text = text.toLowerCase();
  
  // ignore all characters that arent explicitly allowed
  // A-Z 0-9 and space are always allowed (as well as stop chars)
  const ignore_pattern = '[^a-zA-Z0-9 '
    + util.regex_escape(options.allow_chars)
    + util.regex_escape(options.stop_chars)
    // This doesn't work on Safari: https://bugs.webkit.org/show_bug.cgi?id=205477
    + ((options.allow_emoji && !util.has_regex_emoji_bug()) ? '\\p{Emoji_Presentation}' : '')
    + ']';
  text = text.replace(new RegExp(ignore_pattern, 'gu'), ' ');
  // separate emoji by spaces (no need to check for bug, this works)
  if (options.allow_emoji) {
    text = text.replace(new RegExp('\\p{Emoji_Presentation}', 'gu'), ' $& ');
  }
  text = util.contract_whitespace(text);
  const stop_pattern = '[' + util.regex_escape(options.stop_chars) + ']';
  text = text.replace(new RegExp(stop_pattern, 'gu'), '.');
  const stop_word_pattern = '\\b(' + options.stop_words.map(util.regex_escape).join('|') + ')\\b';
  text = text.replace(new RegExp(stop_word_pattern, 'gu'), '.');

  return text;
}
