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
  'tag_marker': '@',
  'asterisk_marker': '*',
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

// Note: key, decomp and reasmb patters are treated with contract_whitespce
export function parse_keyword(keywords, key) {
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
    return out;
  }
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
  return out;
}


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
  data.pre = script.pre;
  
  // post
  util.check_object(script, 'post', ['string']);
  data.post = script.post;
  
  // tags
  util.check_object(script, 'tags', ['array']);
  data.tags = script.tags;
  
  // keywords
  util.check_object(script, 'keywords', ['object', 'string']);
  data.keywords = [];
  for (const key of Object.keys(script.keywords)) {
    data.keywords.push( parse_keyword(script.keywords, key) );
  }
  
  return data;
}


export function make_eliza(script, options) {
  options = Object.assign({}, default_options);
  let data = parse_script(script, options);
  // console.log(data);
  
  // console.log( parse_key('hello 3.') );
}

