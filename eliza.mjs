function script_error(message) {
  throw { name: 'script error', message };
}

function type(x) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  if (x === null) return 'null';
  if (Array.isArray(x)) return 'array';
  return typeof x;
}

function check_array(script, prop, allow_types=null) {
  if ( ! script.hasOwnProperty(prop) ) {
    script_error(`script is missing '${prop}'`);
  }
  if ( type(script[prop]) != 'array' ) {
    script_error(`'${prop}' needs to be an array`);
  }
  if (allow_types) {
    for ( const [idx, val] of script[prop].entries() ) {
      const type_matches = allow_types.map( t => type(val) === t );
      if (type_matches.every( x => x == false )) {
        script_error(`'${prop}': index ${idx} needs to be ${allow_types.join(' or ')} (not ${type(val)})`);
      }
    }
  }
}

function check_object(script, prop, allow_types=null) {
  if ( ! script.hasOwnProperty(prop) ) {
    script_error(`script is missing '${prop}'`);
  }
  if ( type(script[prop]) !== 'object' ) {
    script_error(`'${prop}' needs to be an object`);
  }
  if (allow_types) {
    for ( const [key, val] of Object.entries(script[prop]) ) {
      const type_matches = allow_types.map( t => type(val) === t );
      if (type_matches.every( x => x == false )) {
        script_error(`'${prop}': '${key}' needs to be ${allow_types.join(' or ')} (not ${type(val)})`);
      }
    }
  }
}

function replace_whitespace(str, replacement='_') {
  return str.trim().replace(/\s+/g, replacement);
}

function contract_whitespace(str) {
  return replace_whitespace(str, ' ');
}

// // remove whitespace before punctuation
// export function fix_punctuation(str, punc='.,:;!?') {
//   const pattern = '\\s+([' + regex_escape(punc) + ']+)';
//   return str.replace(new RegExp(pattern, 'g'), '$1');
// }

// https://stackoverflow.com/a/6969486
// added '-' to be escaped (for use in character classes)
function regex_escape(str) {
  return str.replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&'); // $& means the whole matched string
}

// fn is a mapping function, which receives two parameters (key and value)
// and returns a single value (mapped_key)
function map_obj_keys(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map( ([k, v]) => [fn(k,v), v] ) // value is passed through, key is produced by mapping function
  );
}

// // fn is a mapping function, which receives two parameters (key and value)
// // and returns an array of two values [mapped_key, mapped_value];
// export function map_obj(obj, fn) {
//   return Object.fromEntries(
//     Object.entries(obj).map( ([k, v]) => fn(k,v) )
//   );
// }

function rnd_int(max, func=Math.random) {
  return Math.floor(func() * max);
}

function obj_empty(obj) {
  return Object.keys(obj).length === 0;
}

// shuffle array in place
// https://stackoverflow.com/a/2450976
function shuffle(array, rnd=Math.random) {
  let currentIndex = array.length,  randomIndex;
  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(rnd() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// shuffle but keep first x elements as is. Returns new array
function shuffle_fixed(array, keep_fixed=0, rnd=Math.random) {
  const fixed = array.slice(0, keep_fixed);
  const rest = array.slice(keep_fixed);
  return fixed.concat( shuffle(rest, rnd) );
}

// resolve with response after x seconds
function resolve_delayed(response, delay) {
  return new Promise( (resolve, reject) => {
    setTimeout(() => { resolve(response); }, delay*1000);
  });
}

// second order function hat adds a delay parameter to a function
// the delay can be a single number or [delay_min, delay_max]
function add_delay(fn, rnd=Math.random, default_delay=[1,3]) {
  return function delayed_fn(...args) {
    // console.log('got args', args)
    // console.log('expected fn', fn.length);
    const rest = args.slice(0, fn.length); // expected number of args
    const res = fn(...rest);
    let delay = args[fn.length]; // the arg after the expected number of args for fn
    if (delay == undefined) delay = default_delay;
    if (Array.isArray(delay)) {
      delay = delay[0] + rnd() * (delay[1] - delay[0]);
    }
    return resolve_delayed(res, delay);
  };
}

// very cheap test for node.js
function is_node() {
  return typeof process === 'object';
}

// apply JSON.stringify, but only on node.js
// used to get cleaner output in the browser, and proper quoting of strings in node
function stringify_node(obj) {
  if (is_node()) return JSON.stringify(obj);
  return obj;
}

function parse_key(key) {
  key = contract_whitespace("" + key);
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

function get_decomp_pattern(decomp, tag_patterns={}, tag_marker='#', wildcard_marker='*') {
  // expand tags
  const tag_re = new RegExp( `${regex_escape(tag_marker)}(\\S+)`, 'gi' ); // match all tags eg. #happy in "* i am * #happy *"
  let out = decomp.replace(tag_re, (match, p1) => {
    if ( Object.keys(tag_patterns).includes(p1) ) return tag_patterns[p1]; // replace with tag regex pattern
    return p1; // remove tag marker
  });
  
  // expand wildcard expressions
  const wild_re = new RegExp( `\\s*${regex_escape(wildcard_marker)}\\s*`, 'g' );
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

function set_mem_flag(obj, key, memory_marker) {
  if ( obj[key].startsWith(memory_marker) ) {
    obj[key] = obj[key].substring(memory_marker.length).trimStart();
    obj.mem_flag = true;
  }
}

// Required options: wildcard_marker, memory_marker, tag_marker
// Note: key, decomp and reasmb patters are treated with contract_whitespce
function parse_keyword(keywords, key, options, tag_patterns={}) {
  const rules = keywords[key];
  const out = {};
  Object.assign( out, parse_key(key) ); // adds key and rank properties to output
  
  // rules can be object, array or string
  if (type(rules) == 'string') {
    // if string, it is interpreted as a single reassembly rule for a decomp of '*'
    out.rules = [{
      "decomp": "*",
      "reasmb": [ contract_whitespace(rules) ]
    }];
  } else if (type(rules) == 'array') {
    // if array, interpret as array of reassembly rules for a decomp of '*'
    check_array(keywords, key, ['string']);
    out.rules = [{
      "decomp": "*",
      "reasmb": rules.map(contract_whitespace)
    }];
  } else {
    // rules in an object: {decomp: [reasmb, ...], ...}
    // check that it has only array or string values
    check_object(keywords, key, ['array', 'string']);
    out.rules = [];
    for (const [decomp, reassemblies ] of Object.entries(rules)) {
      // reasmb_rules can be array or string
      if (type(reassemblies) === 'string') {
        out.rules.push({
          "decomp": contract_whitespace(decomp),
          "reasmb": [ reassemblies ]
        });
      } else {
        // reassamblies is an array
        // check that it only has string values
        check_array(rules, decomp, ['string']);
        out.rules.push({
          "decomp": contract_whitespace(decomp),
          "reasmb": reassemblies.map(contract_whitespace)
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
function parse_script(script, options) {
  script = Object.assign({}, script);
  const data = {};
  
  // check script as a whole
  if (typeof script !== 'object') script_error('script needs to be an object');
  
  // options (optional)
  if ( type(script.options) == 'object' ) {
    data.options = Object.assign( {}, options, script.options );
  } else {
    data.options = Object.assign( {}, options );
  }
  options = data.options;
  
  // initial
  check_array(script, 'initial', ['string']);
  data.initial = script.initial;
  
  // final
  check_array(script, 'final', ['string']);
  data.final = script.final;
  
  // quit
  check_array(script, 'quit', ['string']);
  data.quit = script.quit;
  
  // none
  check_array(script, 'none', ['string']);
  data.none = script.none;
  
  // pre
  check_object(script, 'pre', ['string']);
  data.pre = map_obj_keys(script.pre, contract_whitespace);
  
  // post
  check_object(script, 'post', ['string']);
  data.post = map_obj_keys(script.post, contract_whitespace);
  
  // tags
  check_object(script, 'tags', ['array']);
  data.tags = map_obj_keys(script.tags, replace_whitespace); // tags can't contain whitespace
  
  // patterns (regexes)
  data.pre_pattern = '';
  if (! obj_empty(data.pre) ) {
    data.pre_pattern = `\\b(${Object.keys(data.pre).map(regex_escape).join('|')})\\b`;
  }
  data.post_pattern = '';
  if (! obj_empty(data.post) ) {
    data.post_pattern = `\\b(${Object.keys(data.post).map(regex_escape).join('|')})\\b`;
  }
  data.tag_patterns = Object.fromEntries(
    Object.entries(data.tags).map( ([tag, tagged_words]) => {
      return [ tag, '(' + tagged_words.map(regex_escape).join('|') + ')' ];
    })
  );
  
  // keywords
  check_object(script, 'keywords', ['object', 'array', 'string']);
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

function normalize_input(text, options) {
  // DO NOT lowercase (preserve capitalization for output)
  if (options.lowercase_input) text = text.toLowerCase();
  
  // ignore all characters that arent explicitly allowed
  // A-Z 0-9 and space are always allowed (as well as stop chars)
  const ignore_pattern = '[^a-zA-Z0-9 ' 
    + regex_escape(options.allow_chars)
    + regex_escape(options.stop_chars)
    + ']';
  text = text.replace(new RegExp(ignore_pattern, 'g'), ' ');
  text = contract_whitespace(text);
  const stop_pattern = '[' + regex_escape(options.stop_chars) + ']';
  text = text.replace(new RegExp(stop_pattern, 'g'), '.');
  const stop_word_pattern = '\\b(' + options.stop_words.map(regex_escape).join('|') + ')\\b';
  text = text.replace(new RegExp(stop_word_pattern, 'g'), '.');
  return text;
}

/*
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (global, pool, math) {
//
// The following constants are related to IEEE 754 limits.
//

var width = 256,        // each RC4 output is 0 <= x < 256
    chunks = 6,         // at least six RC4 outputs for each double
    digits = 52,        // there are 52 significant digits in a double
    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
function seedrandom(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  var prng = function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  prng.int32 = function() { return arc4.g(4) | 0; };
  prng.quick = function() { return arc4.g(4) / 0x100000000; };
  prng.double = prng;

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      function(prng, seed, is_math_call, state) {
        if (state) {
          // Load the arc4 state from the given state if it has an S array.
          if (state.S) { copy(state, arc4); }
          // Only provide the .state method if requested via options.state.
          prng.state = function() { return copy(arc4, {}); };
        }

        // If called as a method of Math (Math.seedrandom()), mutate
        // Math.random because that is how seedrandom.js has worked since v1.0.
        if (is_math_call) { math[rngname] = prng; return seed; }

        // Otherwise, it is a newer calling convention, so return the
        // prng directly.
        else return prng;
      })(
  prng,
  shortseed,
  'global' in options ? options.global : (this == math),
  options.state);
}

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
}
//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
function autoseed() {
  try {
    var out;
    if (nodecrypto && (out = nodecrypto.randomBytes)) {
      // The use of 'out' to remember randomBytes makes tight minified code.
      out = out(width);
    } else {
      out = new Uint8Array(width);
      (global.crypto || global.msCrypto).getRandomValues(out);
    }
    return tostring(out);
  } catch (e) {
    var browser = global.navigator,
        plugins = browser && browser.plugins;
    return [+new Date, global, plugins, global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if ((typeof module) == 'object' && module.exports) {
  module.exports = seedrandom;
  // When in node.js, try using crypto package for autoseeding.
  try {
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if ((typeof define) == 'function' && define.amd) {
  define(function() { return seedrandom; });
} else {
  // When included as a plain script, set up Math.seedrandom global.
  math['seed' + rngname] = seedrandom;
}


// End anonymous scope, and pass initial values.
})(
  // global: `self` in browsers (including strict mode and web workers),
  // otherwise `this` in Node and other environments
  (typeof self !== 'undefined') ? self : undefined,
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

var seedrandom = /*#__PURE__*/Object.freeze({
  __proto__: null
});

if ('default' in seedrandom) Math.seedrandom = undefined; // set Math.seedrandom in node


const default_options = {
  'debug': false,
  'debug_options': false,
  'debug_script': false,
  'memory_size': 100,
  'shuffle_choices': false,
  'lowercase_input': true,
  'lowercase_output': false,
  'seed': -1,
  
  'wildcard_marker': '*',
  'tag_marker': '#',
  'memory_marker': '@',
  'goto_marker': '=',
  'param_marker_pre': '$',
  'param_marker_post': '',
  
  'stop_chars': '.,;:?!',
  'stop_words': ['but'],
  'allow_chars': '\'äöüß-',
  'fallback_reply': 'I am at a loss for words.',
  
  'fixed_initial': 0,
  'fixed_final': 0
};


function make_eliza(script, options={}) {
  options = Object.assign({}, default_options, options);
  
  const data = parse_script(script, options);
  options = data.options; // get options after parsing (script can override options)
  
  if (options.debug_options) console.log('options:', options);
  
  // define a log function (does nothing if debug option is false)
  const log = options.debug ? console.log : () => {};
  // add a dir function as property
  log.dir = options.debug ? console.dir : () => {}; 
  
  const seed = options.seed < 0 ? undefined : options.seed;
  
  // variables
  let quit, mem, rnd, last_none, last_initial, last_final;
  
  function reset() {
    quit = false;
    mem = [];
    rnd = new Math.seedrandom(seed); // initialize rng
    last_none = -1;
    last_initial = -1;
    last_final = -1;
    for (let k of data.keywords) {
      for (let r of k.rules) {
        r.last_choice = -1;
      }
    }
  }
  
  function get_initial() {
    last_initial++;
    if (last_initial >= data.initial.length) last_initial = 0;
    if (last_initial == 0) {
      data.initial = shuffle_fixed(data.initial, options.fixed_initial, rnd);
    }
    return data.initial[ last_initial ];
  }
  
  function get_final() {
    last_final++;
    if (last_final >= data.final.length) last_final = 0;
    if (last_final == 0) {
      data.final = shuffle_fixed(data.final, options.fixed_final, rnd);
    }
    return data.final[ last_final ];
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
      const idx = rnd_int(mem.length, rnd);
      return mem.splice(idx, 1)[0];
    }
    return mem.shift();
  }
  
  // execute transformation rule on text
  // possibly produce a reply
  // options: shuffle_choices
  function exec_rule(keyword, text) {
    // iterate through all rules in the keyword (decomp -> reasmb)
    for (const [idx, rule] of keyword.rules.entries()) {
      // check if decomp rule matches input
      const decomp_regex = new RegExp(rule.decomp_pattern, 'i');
      const decomp_match = text.match(decomp_regex); // first match of decomp pattern
      if ( decomp_match ) {
        log('rule ' + idx + ' matched:', rule);
        // choose next reasmb rule
        let reasmb_idx = rule.last_choice + 1 ;
        if (reasmb_idx >= rule.reasmb.length) reasmb_idx = 0; // wrap around
        if (reasmb_idx == 0 && options.shuffle_choices) {
          shuffle(rule.reasmb, rnd); // shuffle choices
        }
        const reasmb = rule.reasmb[reasmb_idx];
        rule.last_choice = reasmb_idx;
        log('reasmb ' + reasmb_idx + ' chosen:', stringify_node(reasmb));
        // detect goto directive
        // matches goto marker (optional whitespace) then the keyword to go to
        const goto_regex = RegExp('^' + regex_escape(options.goto_marker) + '\\s*(.*)', 'i');
        const goto_match = reasmb.match(goto_regex);
        if (goto_match) {
          const goto_key = data.keywords.find( x => x.key == goto_match[1] );
          if (goto_key !== undefined) {
            log('jumping to keyword:', stringify_node(goto_key));
            return exec_rule(goto_key, text);
          }
        }
        // substitute positional parameters in reassembly rule
        let reply = reasmb;
        const param_regex = new RegExp(regex_escape(options.param_marker_pre) + '([0-9]+)' + regex_escape(options.param_marker_post), 'g');
        reply = reply.replace(param_regex, (match, p1) => {
          const param = parseInt(p1);
          if (Number.isNaN(param) || param <= 0) return ''; // couldn't parse parameter
          // tags are counted as params as well, since they are a capture group in the decomp pattern!
          let val = decomp_match[param]; // capture groups start at idx 1, params as well!
          if (val === undefined) return '';
          val = val.trim();
          // post-process param value
          let val_post = val;
          if (data.post_pattern) { // could be empty
            const post_regex = new RegExp(data.post_pattern, 'gi');
            val_post = val_post.replace(post_regex, (match, p1) => data.post[p1.toLowerCase()]);
          }
          log('param (' + param + '):', stringify_node(val), '->', stringify_node(val_post));
          return val_post;
        });
        reply = reply.trim();
        if (rule.mem_flag) {
          mem_push(reply); // don't use this reply now, save it
          log('reply memorized:', stringify_node(reply));
        }
        else return reply;
      }
    }
    return '';
  }
  
  function transform(text = '') {
    text = normalize_input(text, options); // Note: will not remove stop_chars
    log(' '); 
    log('transforming (normalized):', stringify_node(text));
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
      if (data.pre_pattern) { // could be empty
        const pre_regex = new RegExp(data.pre_pattern, 'gi');
        part = part.replace(pre_regex, (match, p1) => data.pre[p1.toLowerCase()]);
      }
      // look for keywords
      for (const keyword of data.keywords) {
        const key_regex = new RegExp(`\\b${regex_escape(keyword.key)}\\b`, 'i');
        if ( key_regex.test(part) ) {
          log('keyword found (in part ' + idx + '):', keyword);
          const reply = exec_rule(keyword, part);
          if (reply != '') {
            log('reply:', stringify_node(reply));
            return reply;
          }
        }
      }
    }
    
    // nothing matched, try mem
    log('no reply generated through keywords');
    let reply = mem_pop();
    if (reply != '') {
      log('using memorized reply:', stringify_node(reply));
      return reply;
    }
    
    // nothing in mem, try none
    log('no reply memorized');
    if (data.none.length > 0) {
      last_none++;
      if (last_none >= data.none.length) last_none = 0;
      if (last_none == 0 && options.shuffle_choices) {
        data.none = shuffle(data.none, rnd);
      }
      const reply = data.none[last_none];
      if (reply != '') {
        log('using none reply:', stringify_node(reply));
        return reply;
      }
    }
    
    // last resort
    log('using fallback reply:', stringify_node(options.fallback_reply));
    return options.fallback_reply;
  }
  
  function transform_postprocess(text) {
    let reply = transform(text);
    if (options.lowercase_output) reply = reply.toLowerCase();
    reply = contract_whitespace(reply);
    // reply = util.fix_punctuation(reply);
    return reply;
  }
  
  reset();
  
  // log script after reset (last choice computed)
  if (options.debug_script) {
    console.log('script:'); console.dir(data, {depth:2});
  }
  
  return {
    get_initial,
    get_final,
    transform: transform_postprocess,
    is_quit,
    reset,
    get_options,
    // delayed versions of text-generating functions:
    get_initial_async: add_delay(get_initial),
    get_final_async: add_delay(get_final),
    transform_async: add_delay(transform_postprocess)
  };
}

async function make_eliza_async(script_url, options={}) {
  const script = (await import(script_url)).default;
  return make_eliza(script, options);
}

export { make_eliza, make_eliza_async };
