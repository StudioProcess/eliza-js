export function script_error(message) {
  throw { name: 'script error', message };
}

export function type(x) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  if (x === null) return 'null';
  if (Array.isArray(x)) return 'array';
  return typeof x;
}

export function check_array(script, prop, allow_types=null) {
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

export function check_object(script, prop, allow_types=null) {
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

export function replace_whitespace(str, replacement='_') {
  return str.trim().replace(/\s+/g, replacement);
}

export function contract_whitespace(str) {
  return replace_whitespace(str, ' ');
}

// // remove whitespace before punctuation
// export function fix_punctuation(str, punc='.,:;!?') {
//   const pattern = '\\s+([' + regex_escape(punc) + ']+)';
//   return str.replace(new RegExp(pattern, 'g'), '$1');
// }

// https://stackoverflow.com/a/6969486
// added '-' to be escaped (for use in character classes)
export function regex_escape(str) {
  return str.replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&'); // $& means the whole matched string
}

// fn is a mapping function, which receives two parameters (key and value)
// and returns a single value (mapped_key)
export function map_obj_keys(obj, fn) {
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

export function rnd_int(max, func=Math.random) {
  return Math.floor(func() * max);
}

export function curry(fn, ...args1) {
  return function(...args2) {
    return fn(...args1.concat(args2));
  };
}

export function curry_right(fn, ...args1) {
  return function(...args2) {
    return fn(...args2.concat(args1));
  };
}

export function obj_empty(obj) {
  return Object.keys(obj).length === 0;
}

// shuffle array in place
// https://stackoverflow.com/a/2450976
export function shuffle(array, rnd=Math.random) {
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
export function shuffle_fixed(array, keep_fixed=0, rnd=Math.random) {
  const fixed = array.slice(0, keep_fixed);
  const rest = array.slice(keep_fixed);
  return fixed.concat( shuffle(rest, rnd) );
}

// resolve with response after x seconds
export function resolve_delayed(response, delay) {
  return new Promise( (resolve, reject) => {
    setTimeout(() => { resolve(response); }, delay*1000);
  });
}

// second order function hat adds a delay parameter to a function
// the delay can be a single number or [delay_min, delay_max]
export function add_delay(fn, rnd=Math.random, default_delay=[1,3]) {
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
export function is_node() {
  return typeof process === 'object';
}

// apply JSON.stringify, but only on node.js
// used to get cleaner output in the browser, and proper quoting of strings in node
export function stringify_node(obj) {
  if (is_node()) return JSON.stringify(obj);
  return obj;
}
