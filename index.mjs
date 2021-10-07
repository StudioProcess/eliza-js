// browser adds Math.seedrandom(), node populates seedrandom.default
import * as seedrandom from './node_modules/seedrandom/seedrandom.js';
if ('default' in seedrandom) Math.seedrandom = seedrandom.default; // set Math.seedrandom in node

import * as util from './util.mjs';

const default_options = {
  'debug': false,
  'debug_options': false,
  'debug_script': false,
  'script': './script.mjs',
  'mem_size': 20,
  'seed': -1,
  'randomize_choices': false,
  'capitalize_first_letter': true,
  'memory_marker': '$',
  'synonym_marker': '@',
  'asterisk_marker': '*',
  'stop_chars': '.,;:?!',
  'stop_words': ['but'],
  'allow_chars': '\'äöüß-',
  'fallback_reply': 'I am at a loss for words.',
  'none_keyword': 'xnone',
  'goto_keyword': 'goto',
  'param_marker_pre': '(',
  'param_marker_post': ')',
};



function parse_rule(r) {
  return {
    "decomp": r[0],
    "reasmb": r[1]
  };
}

function parse_keyword(key) {
  // ["<key>", <rank>, [
  //   ["<decomp>", [
  //     "<reasmb>",
  //     "<reasmb>",
  //     "<reasmb>"
  //   ]],
  //   ["<decomp>", [
  //     "<reasmb>",
  //     "<reasmb>",
  //     "<reasmb>"
  //   ]]
  // ]]
  const rules = key[2].map(parse_rule);
  return {
    "key":   key[0],
    "rank":  key[1],
    "rules": rules
  };
}

function set_memory_flag(rule, options) {
  rule.mem_flag = false;
  if ( rule.decomp.startsWith(options.memory_marker) ) {
    rule.decomp = rule.decomp.substring(options.memory_marker.length).trimStart();
    rule.mem_flag = true;
  }
  return rule;
}

function expand_synonyms(decomp, script, options) {
  // (only once:) produce synonym list eg. { be: "(be|am|is|are|was)",  ... }
  if (!script.syn_patterns || typeof script.syn_patterns != 'object') {
    script.syn_patterns = {};
    if ((script.synon) && (typeof script.synon == 'object')) {
      for (const syn of Object.keys(script.synon)) {
        const escaped_syn = util.regex_escape(syn);
        const escaped_synons = script.synon[syn].map(util.regex_escape);
        script.syn_patterns[syn] = '(' + escaped_syn + '|' + escaped_synons.join('|') + ')';
      }
    }
  }
  // expand synonyms
  const sre = new RegExp(`${options.synonym_marker}(\\S+)`, 'g'); // match all synonyms eg. @happy in "* i am * @happy *"
  const res = decomp.replace(sre, (match, p1) => {
    if ( Object.keys(script.syn_patterns).includes(p1) ) return script.syn_patterns[p1]; // replace with synonym regex pattern
    return p1; // remove synonym marker
  });
  return res;
}

function decomp_to_regex(decomp, options) {
  // expand asterisk expressions
  const as = util.regex_escape(options.asterisk_marker);
  const asre = new RegExp(`\\s*${as}\\s*`, 'g');
  let out = decomp.replace(asre, (match, offset, string) => {
    /*
      Note: This crashes node/chrome (v8); See branch v8-crash
      capture words with whitespace in-between (or the empty string)
      won't include trailing whitespace
      (?:) ... non-capturing group
      \s*\S+ ... a single word w/leading whitespace
      (\s*\S+)* ... multiple words with whitespace in-between (no trailing whitespace!)
    */
    // return '\\s*((?:\\s*\\S+)*)\\s*'; 
    
    // Note: this can include trailing whitespace into the capture group -> trim later
    // return '\\s*(.*)\\s*';
    
    // We need word boundary markers, so decomp='* you * me *' does NOT match "what do you mean."
    // Note: this can include trailing whitespace into the capture group -> trim later
    let pattern = '\\s*(.*)\\s*';
    if (match.length !== string.length) { // there's more than the match
      if (offset == 0) pattern = pattern + '\\b'; // append word boundary marker
      else pattern = '\\b' + pattern; // prepend word boundary marker
    }
    return pattern;
  });
  // expand whitespace
  // TODO: remove dependency on this, by preprocessing whitespace
  out = out.replace(/\s+/g, '\\s+');
  return out;
}

function normalize_input(text, options) {
  // TODO(?): DO NOT lowercase (preserve capitalization for output)
  text = text.toLowerCase();
  
  // ignore all characters that arent explicitly allowed
  // A-Z and space are always allowed
  const ignore_pattern = '[^a-zA-Z ' 
    + util.regex_escape(options.allow_chars)
    + util.regex_escape(options.stop_chars)
    + ']';
  text = text.replace(new RegExp(ignore_pattern, 'g'), ' ');
  text = util.contract_ws(text);
  const stop_pattern = '[' + util.regex_escape(options.stop_chars) + ']';
  text = text.replace(new RegExp(stop_pattern, 'g'), '.');
  const stop_word_pattern = '\\b(' + options.stop_words.map(util.regex_escape).join('|') + ')\\b';
  text = text.replace(new RegExp(stop_word_pattern, 'g'), '.');
  return text;
}

function parse_script(script, options, log) {
  script = Object.assign({}, script); // make a new object (don't alter incoming)
  
  // check for keywords or install empty structure to prevent any errors
  if ( !script.keywords || !Array.isArray(script.keywords || script.keywords.length == 0) ) {
    script.keywords = [['###',0,[['###',[]]]]];
  }
  
  // parse keywords script to a more readable object structure
  script.keywords_new = script.keywords.map(parse_keyword);
  
  // convert rules to regexps
  // expand synonyms and insert asterisk expressions for backtracking
  for ( const [k, keyword] of script.keywords_new.entries() ) {

    // log(keyword);
    keyword.orig_idx = k; // save original index for sorting
    for (const r of keyword.rules) {
      // check mem flag and store it in the rule
      set_memory_flag(r, options);
      
      // expand synonyms
      r.decomp_regex = expand_synonyms(r.decomp, script, options);
    
      // expand asterisk expressions
      r.decomp_regex = decomp_to_regex(r.decomp_regex, options);
    }
  }
  
  // sort keywords
  script.keywords_new.sort( (a,b) => {
    // sort by rank
    if ( a.rank > b.rank ) return -1;
    else if ( a.rank < b.rank ) return 1;
    // or original index
    else if ( a.orig_idx > b.orig_idx ) return 1;
    else if ( a.orig_idx < b.orig_idx ) return -1;
    else return 0;
  });
  
  // convert pre and post to object (if necessary)
  if (script.pre && Array.isArray(script.pre)) {
    const obj = {};
    const len = script.pre.length % 2 == 0 ? script.pre.length : script.pre.length - 1;
    for (let i=0; i<len; i+=2) {
      obj[ script.pre[i] ] = script.pre[ i+1 ];
    }
    script.pre = obj;
  } else {
    script.pre = {'####': '####'}; // default (should not match)
  }
  script.pre = util.lowercase_obj_keys(script.pre);
  script.pre_pattern = `\\b(${Object.keys(script.pre).map(util.regex_escape).join('|')})\\b`;
  if (script.post && Array.isArray(script.post)) {
    const obj = {};
    const len = script.post.length % 2 == 0 ? script.post.length : script.post.length - 1;
    for (let i=0; i<len; i+=2) {
      obj[ script.post[i] ] = script.post[ i+1 ];
    }
    script.post = obj;
  } else {
    script.post = {'####': '####'}; // default (should not match)
  }
  script.post = util.lowercase_obj_keys(script.post);
  script.post_pattern = `\\b(${Object.keys(script.post).map(util.regex_escape).join('|')})\\b`;
  
  // check for quit and install default if missing
  if (!script.quit || !Array.isArray(script.quit)) {
    script.quit = [];
  }
  script.quit = script.quit.map(x => x.toLowerCase());
  
  // check for initial and install default if missing
  if (!script.initial || !Array.isArray(script.initial)) {
    script.initial = [''];
  }
  // check for final and install default if missing
  if (!script.final || !Array.isArray(script.final)) {
    script.final = [''];
  }
  
  return script;
}



export async function make_eliza(options = {}) {
  
  // handle options
  options = Object.assign({}, default_options, options);
  if (options.debug_options) console.log('options:', options);
  
  // define a log function (does nothing if debug option is false)
  const log = options.debug ? console.log : () => {};
  // add a dir function as property
  log.dir = options.debug ? console.dir : () => {}; 
  
  // initialize rng
  const seed = options.seed < 0 ? undefined : options.seed;
  const rnd = new Math.seedrandom(seed);
  
  // load script
  // this import will only happen once over multiple make_eliza() calls. don't alter it.
  const script_raw = (await import(options.script)).default;
  
  // parse script and convert it from canonical form to internal use
  const script = parse_script(script_raw, options, log);
  
  // variables
  let quit, mem;
  // let last_choice;
  
  function reset() {
    quit = false;
    mem = [];
    // last_choice = [];
    // for (let k = 0; k < script.keywords.length; k++) {
    //   last_choice[k] = [];
    //   const rules = script.keywords[k][2]; // transformation rules
    //   for (let i = 0; i < rules.length; i++) {
    //     last_choice[k][i] = -1;
    //   }
    // }
    for (let k of script.keywords_new) {
      for (let r of k.rules) {
        r.last_choice = -1;
      }
    }
  }
  
  function get_initial() {
    return script.initial[ util.rnd_int(script.initial.length, rnd) ];
  }
  
  function get_final() {
    return script.final[ util.rnd_int(script.final.length, rnd) ];
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
      const decomp_regex = new RegExp(rule.decomp_regex, 'i');
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
        const goto_regex = RegExp('^' + util.regex_escape(options.goto_keyword) + ' (\\S+)');
        const goto_match = reasmb.match(goto_regex);
        if (goto_match) {
          const goto_key = script.keywords_new.find( x => x.key == goto_match[1] );
          if (goto_key !== undefined) return exec_rule(goto_key, text);
        }
        // substitute positional parameters in reassembly rule
        let reply = reasmb;
        const param_regex = new RegExp(util.regex_escape(options.param_marker_pre) + '([0-9]+)' + util.regex_escape(options.param_marker_post), 'g');
        reply = reply.replace(param_regex, (match, p1) => {
          const param = parseInt(p1);
          if (Number.isNaN(param) || param <= 0) return ''; // couldn't parse parameter
          let val = decomp_match[param]; // capture groups start at idx 1, params as well!
          if (val === undefined) return '';
          val = val.trim();
          // post-process param value
          const post_regex = new RegExp(script.post_pattern, 'gi');
          const val_post = val.replace(post_regex, (match, p1) => script.post[p1.toLowerCase()]);
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
      if (script.quit.includes(part)) {
        quit = true;
        return get_final();
      }
      // pre-process
      const pre_regex = new RegExp(script.pre_pattern, 'gi');
      part = part.replace(pre_regex, (match, p1) => script.pre[p1.toLowerCase()]);
      
      // look for keywords
      for (const keyword of script.keywords_new) {
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
    
    // nothing in mem, try xnone
    // TODO
    const none_keyword = script.keywords_new.find(x => x.key == options.none_keyword);
    if (none_keyword) {
      reply = exec_rule(none_keyword, ' '); // TODO run xnone rule on all parts?
      if (reply != '') return reply;
    }
    
    // last resort
    return options.fallback_reply;
  }
  
  reset();
  
  // log script after reset (last choice computed)
  if (options.debug_script) {
    console.log('script:'); console.dir(script, {depth:2});
  }
  
  return {
    get_initial,
    transform,
    is_quit,
    reset,
    get_options,
  };
}
