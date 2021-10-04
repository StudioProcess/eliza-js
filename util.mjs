// https://stackoverflow.com/a/6969486
export function regex_escape(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function contract_ws(str) {
  return str.trim().replace(/\s+/g, ' ');
}

export function rnd_int(max, func=Math.random) {
  return Math.floor(func() * max);
}

export function lowercase_obj(obj) {
  const out = {};
  for ( const [key, val] of Object.entries(obj) ) {
    out[key.toLowerCase()] = ("" + val).toLowerCase();
  }
  return out;
}
