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
