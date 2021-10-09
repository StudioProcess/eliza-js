export function type(x) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  if (x === null) return 'null';
  if (Array.isArray(x)) return 'array';
  return typeof x;
}

export function check_array(script, prop, allow_types=null) {
  if ( ! script.hasOwnProperty(prop) ) {
    throw `script is missing '${prop}'`;
  }
  if ( type(script[prop]) != 'array' ) {
    throw `'${prop}' needs to be an array`;
  }
  if (allow_types) {
    for ( const [idx, val] of script[prop].entries() ) {
      const type_matches = allow_types.map( t => type(val) === t );
      if (type_matches.every( x => x == false )) {
        throw `'${prop}': index ${idx} needs to be ${allow_types.join(' or ')} (not ${type(val)})`;
      }
    }
  }
}

export function check_object(script, prop, allow_types=null) {
  if ( ! script.hasOwnProperty(prop) ) {
    throw `script is missing '${prop}'`;
  }
  if ( type(script[prop]) !== 'object' ) {
    throw `'${prop}' needs to be an object`;
  }
  if (allow_types) {
    for ( const [key, val] of Object.entries(script[prop]) ) {
      const type_matches = allow_types.map( t => type(val) === t );
      if (type_matches.every( x => x == false )) {
        throw `'${prop}': '${key}' needs to be ${allow_types.join(' or ')} (not ${type(val)})`;
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

