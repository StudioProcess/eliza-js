import * as util from './util.mjs';
// import script from './script.mjs';
// console.log(script);

const default_options = {
  'debug': false,
  'script': './script.mjs',
  'mem_size': 20,
  'randomize_choices': false,
  'capitalize_first_letter': true,
  'memory_marker': '$',
  'synonym_marker': '@',
  'asterisk_marker': '*',
  'stop_chars': '.,;:?!',
  'allow_chars': '\'äöüß',
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
    if (options.debug) console.log('syn_patterns', script.syn_patterns);
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
    // if (offset == 0) {
    //   if (offset + match.length == string.length) return '\\s*(.*)\\s*';
    //   return '\\s*(.*)\\s*\\b';
    // }
    // return '\\b\\s*(.*)\\s*'
    return '\\s*(.*)\\s*';
  });
  // expand whitespace
  out = out.replace(/\s+/g, '\\s+');
  return out;
}


function normalize_input(text, options) {
  text = text.toLowerCase();
  // ignore all characters that arent explicitly allowed
  // a-z and space are always allowed
  const ignore_pattern = '[^a-z ' 
    + util.regex_escape(options.allow_chars)
    + util.regex_escape(options.stop_chars)
    + ']';
  text = text.replace(new RegExp(ignore_pattern, 'g'), ' ');
  text = util.contract_ws(text);
  const stop_pattern = '[' + util.regex_escape(options.stop_chars) + ']';
  text = text.replace(new RegExp(stop_pattern, 'g'), '.');
  return text;
}


export async function make_eliza(options = {}) {
  
  // handle options
  options = Object.assign({}, default_options, options);
  if (options.debug) console.log('options:', options);
  
  // load script
  const script = (await import(options.script)).default;
  
  // parse script and convert it from canonical form to internal use

  // check for keywords or install empty structure to prevent any errors
  if ( !script.keywords || !Array.isArray(script.keywords || script.keywords.length == 0) ) {
    script.keywords = [['###',0,[['###',[]]]]];
  }
  
  // parse keywords script to a more readable object structure
  script.keywords_new = script.keywords.map(parse_keyword);
  if (options.debug) console.log('script:', script);
  
  // convert rules to regexps
  // expand synonyms and insert asterisk expressions for backtracking
  for ( const [k, keyword] of script.keywords_new.entries() ) {

    // console.log(keyword);
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
  script.pre = util.lowercase_obj(script.pre);
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
  script.post = util.lowercase_obj(script.post);
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
  
  // variables
  let quit, mem, last_choice;
  
  function reset() {
    quit = false;
    mem = [];
    last_choice = [];
    for (let k = 0; k < script.keywords.length; k++) {
      last_choice[k] = [];
      const rules = script.keywords[k][2]; // transformation rules
      for (let i = 0; i < rules.length; i++) {
        last_choice[k][i] = -1;
      }
    }
    for (let k of script.keywords_new) {
      for (let r of k.rules) {
        r.last_choice = -1;
      }
    }
  }
  
  reset();
  
  if (options.debug) console.log('last_choice', last_choice);
  
  function get_initial() {
    return script.initial[ util.rnd_int(script.initial.length) ];
  }
  
  function get_final() {
    return script.final[ util.rnd_int(script.final.length) ];
  }
  
  function is_quit() {
    return quit;
  }
  
  function get_config() {
    return options;
  }
  
  function mem_push(t) {
    mem.push(t);
    if (mem.length > options.mem_size) mem.shift();
  }
  
  function mem_pop() {
    if (mem.length == 0) return '';
    if (options.randomize_choices) {
      const idx = util.rnd_int(mem.length);
      return mem.splice(idx, 1)[0];
    }
    return mem.shift();
  }
  
  // execute transformation rule on text
  // possibly produce a reply
  function exec_rule(keyword, text) {
    console.log('executing rule', keyword.key);
    // iterate through all rules in the keyword (decomp -> reasmb)
    for (const rule of keyword.rules) {
      console.log(rule);
      // check if decomp rule matches input
      const decomp_regex = new RegExp(rule.decomp_regex);
      const decomp_match = text.match(decomp_regex); // first match of decomp pattern
      if ( decomp_match ) {
        // choose reasmb rule (random or last_choice+1)
        const reasmb_idx = options.randomize_choices ? util.rnd_int(rule.reasmb.length) : rule.last_choice + 1 ;
        if (reasmb_idx >= rule.reasmb.length) reasmb_idx = 0;
        const reasmb = rule.reasmb[reasmb_idx];
        rule.lastIndex = reasmb_idx;
        console.log('reasmb chosen', reasmb_idx, reasmb);
        // detect goto directive
        const goto_regex = RegExp('^' + util.regex_escape(options.goto_keyword) + ' (\\s+)');
        const goto_match = reasmb.match(goto_regex);
        if (goto_match) {
          const goto_key = script.keywords_new[ goto_match[1] ];
          if (goto_key !== undefined) return exec_rule(goto_key, text);
        }
        // substitute positional parameters in reassembly rule
        let reply = reasmb;
        const param_regex = new RegExp(util.regex_escape(options.param_marker_pre) + '([0-9]+)' + util.regex_escape(options.param_marker_post), 'g');
        console.log(param_regex);
        reply = reply.replace(param_regex, (match, p1) => {
          const param = parseInt(p1);
          if (Number.isNaN(param) || param <= 0) return ''; // couldn't parse parameter
          const val = decomp_match[param]; // capture groups start at idx 1, params as well!
          if (val === undefined) return '';
          // post-process param value
          const post_regex = new RegExp(script.post_pattern, 'g');
          val = val.replace(post_regex, (match, p1) => script.post[p1]);
          return val;
        });
        if (rule.mem_flag) mem_push(reply);
        return reply;
      }
    }
    return '';
  }
  
  function transform(text) {
    text = normalize_input(text, options);
    console.log(text);
    let parts = text.split('.');
    // trim and remove empty parts
    parts = parts.map(x => x.trim()).filter( x => x !== '');
    console.log(parts);
    
    // for each part...
    for (let [idx, part] of parts.entries()) {
      // check for quit expression
      if (script.quit.includes(part)) {
        quit = true;
        return get_final();
      }
      // pre-process
      const pre_regex = new RegExp(script.pre_pattern, 'g');
      part = part.replace(pre_regex, (match, p1) => script.pre[p1]);
      
      // look for keywords
      for (const keyword of script.keywords_new) {
        const key_regex = new RegExp(`\\b${util.regex_escape(keyword.key)}\\b`, 'i');
        if ( key_regex.test(part) ) {
          console.log('keyword found', keyword, part);
          const reply = exec_rule(keyword, part);
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
  
  return {
    get_initial,
    get_final,
    is_quit,
    get_config,
    transform,
  };
}

function try_regex(regex, str) {
  let res = str.match(new RegExp(regex));
  if (res == null) return null;
  return res.slice(1);
}

export async function test() {
  // let str = '* i * you *';
  // let regex = decomp_to_regex(str);
  // // regex = "\\s*(.*)\\s*\\bi\\b\\s*(.*)\\s*\\byou\\b\\s*(.*)\\s*"; // orig
  // let input = "i you"
  // let res = try_regex(regex, input);
  // console.log( res );
  // 
  // return;
  const eliza = await make_eliza({'debug': true});
  console.log(eliza);
  // console.log( eliza.get_initial() );
  eliza.transform('hello always, and dont recollect something other?#?#?wetjdk &*(#&@+) and so don ');
  
}
