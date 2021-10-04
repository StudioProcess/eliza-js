import tap from 'tap';
import seedrandom from 'seedrandom';
import { make_eliza } from '../index.mjs';

const rng = new seedrandom(0);
/**
 * Random number
 * Call patterns:
 *   rnd()     -> [0, 1)
 *   rnd(a)    -> [0, a)
 *   rnd(a, b) -> [a, b)
 */
export function rnd(a, b) {
  let min = 0;
  let max = 1;
  if (b == undefined) {
    if (a != undefined) max = a;
  } else if (a != undefined) {
    min = a;
    max = b;
  }
  return min + rng() * (max-min);
}

// let e;
// 
// tap.before(async () => {
//   e = await make_eliza({ seed:0 });
// });



tap.test('assorted inputs', async t => {
  const inputs = [
    'Hello',
    'I\'m fine',
    'How are you?',
    'Please, don\'t lecture me!',
    'Bye',
    'But I am so sad',
    'I\'ve none',
    'Because I want to'
  ];
  
  const e = await make_eliza({ seed:0 });

  for (const input of inputs) {
    t.doesNotThrow(() => {
      e.transform(input);
    }, 'testing input: ' + input);
  }
});



tap.test('random inputs', async t => {
  const ROUNDS = 10;
  const STR_LEN = 50;
  const e = await make_eliza({ seed:0 });

  function rnd_string(len = 1) {
    let str = "";
    for (let i=0; i<len; i++) {
      let val = Math.floor(rnd(128));
      str += String.fromCharCode(val);
    }
    return str;
  }
  
  for (let i=0; i<ROUNDS; i++) {
    let str = rnd_string(STR_LEN);
    t.doesNotThrow(() => {
      e.transform(str);
    }, 'testing input: ' + str);
  }
});