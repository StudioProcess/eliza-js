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


tap.test('fix goto', async t => {
  const e = await make_eliza({ seed:0 });
  const inputs = [
    'i apologise',
    'well i am good',
    'well you are pitiful',
    'i believe you',
    'you remind me of',
    'who else?',
    'when now?',
    'where else?',
    'why then?',
    'everybody',
    'nobody',
    'noone',
    'i am like him'
  ];
  for (let input of inputs) {
    const res = e.transform(input);
    t.notOk(res.startsWith('goto'), 'testing input: ' + input);
  }
});


tap.test('extra space', async t => {
  const inputs = [
    "You don't argue with me.",
  ];
  for (let input of inputs) {
    const e = await make_eliza({ seed:0, randomize_choices:false });
    const res = e.transform(input);
    t.notMatch( res, /\s\s+/ ); // should not contain 2 or more consecutive whitespaces
  }
});


tap.test('single responses', {bail:true}, async t => {
  const inputs = [
    "Well, my boyfriend made me come here.",
    "It's true. I am unhappy.",
    "Perhaps I could learn to get along with my mother.",
    "My mother takes care of me.",
    "My father.",
    "You are not very aggressive but I think you don't want me to notice that.",
    "You don't argue with me.",
    "My father is afraid of everybody.",
  ];
  // console.log(inputs);
  const expected = [
    "Your boyfriend made you come here ?",
    "I am sorry to hear that you are unhappy.",
    "Tell me more about your family.",
    "Tell me more about your family.",
    "Tell me more about your family.",
    "What makes you think I am not very aggressive ?",
    "Why do you think I don't argue with you ?",
    "Tell me more about your family.",
  ];
  // console.log(expected);
  for (const [idx, input] of inputs.entries()) {
    const e = await make_eliza({ seed:0, randomize_choices:false, debug:false });
    const res = e.transform(input);
    // console.log(idx, input, res);
    t.equal( res, expected[idx], JSON.stringify(input) );
  }
});



// tap.only('example conversation', {bail:true}, async t => {
//   const e = await make_eliza({ seed:0, randomize_choices:false });
//   const inputs = [
//     "Men are all alike.",
//     "They're always bugging us about something or other.",
//     "Well, my boyfriend made me come here.",
//     "He says I'm depressed much of the time.",
//     "It's true. I am unhappy.",
//     "I need some help, that much seems certain.",
//     "Perhaps I could learn to get along with my mother.",
//     "My mother takes care of me.",
//     "My father.",
//     "You are like my father in some ways.",
//     "You are not very aggressive but I think you don't want me to notice that.",
//     "You don't argue with me.",
//     "You are afraid of me.",
//     "My father is afraid of everybody.",
//     "Bullies."
//   ];
//   const expected = [
//     'In what way ?',
//     'Can you think of a specific example ?',
//     'Your boyfriend made you come here ?',
//     'I am sorry to hear that you are depressed.',
//     'Do you think coming here will help you not to be unhappy ?',
//     'What would it mean to you if you got some help ?',
//     'Tell me more about your family.',
//     'Who else in your family takes care of you ?',
//     'Your father ?',
//     'What resemblence do you see ?',
//     'What makes you think I am not very aggressive ?',
//     'Why do you think I don\'t argue with you ?',
//     'Does it please you to believe I am afraid of you ?',
//     'What else comes to your mind when you think of your father ?',
//     'Does that have anything to do with the fact that your boyfriend made you come here ?'
//   ];
// 
//   for (let [idx, input] of inputs.entries()) {
//     const res = e.transform(input);
//     t.equal( res, expected[idx], `step ${idx+1}/${inputs.length} ${JSON.stringify(input)}` );
//   }
// });
