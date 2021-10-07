// https://stackoverflow.com/a/6969486
// added '-' to be escaped (for use in character classes)
export function regex_escape(str) {
  return str.replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&'); // $& means the whole matched string
}

export function contract_ws(str) {
  return str.trim().replace(/\s+/g, ' ');
}

export function rnd_int(max, func=Math.random) {
  return Math.floor(func() * max);
}

export function lowercase_obj_keys(obj) {
  const out = {};
  for ( const [key, val] of Object.entries(obj) ) {
    out[key.toLowerCase()] = ("" + val);
  }
  return out;
}
