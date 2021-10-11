import * as util from './util.mjs';
import { parse_script, normalize_input } from './parse.mjs';

// browser adds Math.seedrandom(), node populates seedrandom.default
import * as seedrandom from './node_modules/seedrandom/seedrandom.js';
if ('default' in seedrandom) Math.seedrandom = seedrandom.default; // set Math.seedrandom in node


const default_options = {
  'debug': false,
  'debug_options': false,
  'debug_script': false,
  'memory_size': 100,
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
};


export function make_eliza(script, options={}) {
  options = Object.assign({}, default_options, options);
  
  if (options.debug_options) console.log('options:', options);
  
  // define a log function (does nothing if debug option is false)
  const log = options.debug ? console.log : () => {};
  // add a dir function as property
  log.dir = options.debug ? console.dir : () => {}; 
  
  const seed = options.seed < 0 ? undefined : options.seed;
  
  const data = parse_script(script, options);
  
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
          let val_post = val;
          if (data.post_pattern) { // could be empty
            const post_regex = new RegExp(data.post_pattern, 'gi');
            val_post = val_post.replace(post_regex, (match, p1) => data.post[p1.toLowerCase()]);
          }
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
      if (data.pre_pattern) { // could be empty
        const pre_regex = new RegExp(data.pre_pattern, 'gi');
        part = part.replace(pre_regex, (match, p1) => data.pre[p1.toLowerCase()]);
      }
      // look for keywords
      for (const keyword of data.keywords) {
        const key_regex = new RegExp(`\\b${util.regex_escape(keyword.key)}\\b`, 'i');
        if ( key_regex.test(part) ) {
          log('keyword found (part ' + idx + '):', keyword);
          const reply = exec_rule(keyword, part);
          if (reply != '') {
            log('reply:', JSON.stringify(reply));
            return reply;
          }
        }
      }
    }
    
    // nothing matched, try mem
    log('no reply generated through keywords');
    let reply = mem_pop();
    if (reply != '') {
      log('using memorized reply:', JSON.stringify(reply));
      return reply;
    }
    
    // nothing in mem, try none
    log('no reply memorized');
    if (data.none.length > 0) {
      if (++last_none >= data.none.length) last_none = 0;
      const reply = data.none[last_none];
      if (reply != '') {
        log('using none reply:', JSON.stringify(reply));
        return reply;
      }
    }
    
    // last resort
    log('using fallback reply:', JSON.stringify(options.fallback_reply));
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
