import tap from 'tap';
import seedrandom from 'seedrandom';
import { make_eliza } from '../index.mjs';
import { readFileSync } from 'fs';

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


tap.test('example conversation', {bail:true}, async t => {
  const e = await make_eliza({ seed:0, randomize_choices:false, debug:false });
  const inputs = [
    "Men are all alike.",
    "They're always bugging us about something or other.",
    "Well, my boyfriend made me come here.",
    "He says I'm depressed much of the time.",
    "It's true. I am unhappy.",
    "I need some help, that much seems certain.",
    "Perhaps I could learn to get along with my mother.",
    "My mother takes care of me.",
    "My father.",
    "You are like my father in some ways.",
    "You are not very aggressive but I think you don't want me to notice that.",
    "You don't argue with me.",
    "You are afraid of me.",
    "My father is afraid of everybody.",
    "Bullies."
  ];
  const expected = [
    'In what way ?',
    'Can you think of a specific example ?',
    'Your boyfriend made you come here ?',
    'I am sorry to hear that you are depressed.',
    'Do you think coming here will help you not to be unhappy ?',
    'What would it mean to you if you got some help ?',
    'Tell me more about your family.',
    'Who else in your family takes care of you ?',
    'Your father ?',
    'What resemblence do you see ?',
    'What makes you think I am not very aggressive ?',
    'Why do you think I don\'t argue with you ?',
    'Does it please you to believe I am afraid of you ?',
    'What else comes to your mind when you think of your father ?',
    'Does that have anything to do with the fact that your boyfriend made you come here ?'
  ];

  for (let [idx, input] of inputs.entries()) {
    const res = e.transform(input);
    t.equal( res, expected[idx], `step ${idx+1}/${inputs.length} ${JSON.stringify(input)}` );
  }
});


tap.test('parry vs. eliza', {bail:true}, async t => {
  // const data = readFileSync('./test/data/rfc439.txt', {encoding: 'utf8'});
  // const data_answers = readFileSync('./test/data/rfc439_answers.txt', {encoding: 'utf8'});
  // let parry = data.split('\n').filter(x => x.startsWith('   *')).map(x => x.substring(4));
  // let expected = data_answers.split('\n').filter(x => x.startsWith('ELIZA: ')).map(x => x.substring(7));
  // console.log(parry);
  // console.log(expected);
  const parry = [
    'People get on my nerves sometimes.',
    'You should pay more attention.',
    "You're entitled to your own opinion.",
    'It bothers me just to be around people in general.',
    'I went to the track at Bay Meadows a while back.',
    'I went to the races.',
    'Horseracing interests me.',
    "There's a lot of crooked gambling going on there.",
    "It's clear to me if not to you.",
    'I went to the races.',
    'I gamble on horses.',
    'I went to the races.',
    'Gambling has been nothing but trouble to me.',
    "I've had experience with crooks gambling at the track.",
    "I've already told you enough about that.",
    'I went to the races.',
    'Do you know anything about bookies?',
    "A bookie didn't pay me off once.",
    'I beat up the bookie who did not pay off, and I thought he might use',
    'What do you know about racketeers?',
    'What experience have you had gambling?',
    'I like horseraces.',
    'I know the mob controls the big rackets.',
    'Have you ever really thought about the MAFIA?',
    "Let's talk about something else.",
    'You keep asking me the same things, why not change the topic?',
    'What do you mean?',
    'I thought I told you, people get on my nerves.',
    "Well, I don't know.",
    'I would say so.',
    'I would rather not discuss that anymore.',
    'I guess so.',
    'What are you getting at?',
    "It's not a matter or like or dislike.",
    'I am getting tired of answering the same questions over and over.',
    'Why do you need to know that?',
    "I don't understand your motives.",
    "Shouldn't I be?",
    "That's just the way it is.",
    'So?',
    'You harp on the same questions too much.',
    "I don't get you.",
    "It's about time you showed some interest in my feelings.",
    'I will help you if I trust you.',
    'Maybe yes, maybe no.',
    'Really?',
    'In my opinion you have a one-track mind.',
    'I used to go to the track every week.',
    'I avoid racetracks now because the races are fixed.',
    "I'd rather not discuss it.",
    "That's something I don't want to go into.",
    'I went to the races.',
    "It's none of your business.",
    "I don't confide in strangers.",
    "Let's change the subject.",
    'I went to the races.',
    "What's wrong with you that you keep on bugging me about this?",
    'The way you repeat yourself is getting ridiculous.',
    'There are some tricky operators down there.',
    'The guys involved in the horseracing racket.',
    'You are a real nag.',
    'I have had enough of this.',
  ];
  const expected = [
    'Your nerves sometimes ?',
    'We were discussing you -- not me.',
    'What makes you think I am entitled to my own opinion ?',
    'Does that have anything to do with the fact that your nerves sometimes ?',
    'You say you went to the track at bay meadows a while back ?',
    'Can you elaborate on that ?',
    "I'm not sure I understand you fully.",
    'Please go on.',
    "Do you think it's likely that not to I ?",
    'Do you say you went to the races for some special reason ?',
    "That's quite interesting.",
    'You say you went to the races ?',
    'What does that suggest to you ?',
    'Can you elaborate on that ?',
    "Perhaps in your fantasies we 've already told each other.",
    'Do you say you went to the races for some special reason ?',
    'Oh, I know anything about bookies ?',
    'Do you feel strongly about discussing such things ?',
    "That's quite interesting.",
    "You're not really talking about me -- are you ?",
    'What are your feelings now ?',
    'You say you like horseraces ?',
    'Can you elaborate on that ?',
    'We were discussing you -- not me.',
    'That is interesting. Please continue.',
    'In what way ?',
    'Oh, I mean ?',
    'Do you wish to told me ?',
    "Don't you really know ?",
    'Do you say you would say so for some special reason ?',
    "That's quite interesting.",
    'You say you guess so ?',
    'Why are you interested in whether I am getting at or not ?',
    'Tell me more about that.',
    'What resemblence do you see ?',
    "You're not really talking about me -- are you ?",
    'Why are you concerned over my motives ?',
    'Can you elaborate on that ?',
    'Does talking about this bother you ?',
    "I'm not sure I understand you fully.",
    'What does that similarity suggest to you ?',
    "Why don't you get I ?",
    'Why do you say your feelings ?',
    'Do you wish that you trust I ?',
    "You don't seem quite certain.",
    'Lets discuss further why your feelings.',
    'Does that suggest anything else which belongs to you ?',
    'Do you say you used to go to the track every week for some special reason ?',
    'Did you think they might not be fixed ?',
    "That's quite interesting.",
    'Do you wish to be able to want to go into ?',
    'You say you went to the races ?',
    'What about your own business ?',
    'Does that trouble you ?',
    'Earlier you said your opinion I have a one-track mind.',
    'Can you elaborate on that ?',
    'Why do you think I keep on bugging you ?',
    'What are your feelings now ?',
    'Would you like it if they were not some tricky operators down there ?',
    'Please go on.',
    'Does it please you to believe I am a real nag ?',
    'Do you say you have had enough of this for some special reason ?',
  ];

  const e = await make_eliza({ seed:0, randomize_choices:false, debug:false });
  for (let [idx, input] of parry.entries()) {
    const res = e.transform(input);
    t.equal( res, expected[idx], `line ${idx+1}: ` + JSON.stringify(input) );
  }
});

