/* 
  this crashes node and chrome (V8)
  works in safari
  
  seems to infinitely loop on index.mjs:291 (call to String.match)
  w/quite a brutal regex:
  
  // const text = "you are not very aggressive but i think you don't want me to notice that"
  // const decomp_regex = new RegExp('\s*((?:\s*\S+)*)\s*are\s+you\s*((?:\s*\S+)*)\s*');
  // const decomp_match = text.match(decomp_regex);
  // console.log(decomp_match);
  
  ^ this works on its own, but not in the sequence below.
  6th input is the one that hangs.
  
  changing the regex in index.mjs:106 to '\\s*(.*)\\s*' makes it not hang
*/
import { make_eliza } from '../index.mjs';

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
  "Who else in your family takes care of you ?",
  "Tell me more about your family.",
  "What makes you think I am not very aggressive ?",
  "Why do you think I don't argue with you ?",
  "Tell me more about your family.",
];
// console.log(expected);
for (const [idx, input] of inputs.entries()) {
  const e = await make_eliza({ seed:0, randomize_choices:false });
  if (idx == 5) debugger;
  const res = e.transform(input);
  console.log(idx, input, res);
  console.log( res, expected[idx] );
  console.log();
}

