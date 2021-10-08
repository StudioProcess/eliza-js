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

export function contract_whitespace(str) {
  return str.trim().replace(/\s+/g, ' ');
}
