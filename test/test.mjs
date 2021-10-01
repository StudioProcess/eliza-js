import tap from 'tap';

// console.log(tap);
import * as eliza from '../index.mjs';

// console.log(e);

const e = await eliza.make_eliza();

console.log(e.get_initial());
console.log(e.is_quit());
