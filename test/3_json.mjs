import tap from 'tap';

import * as util from '../util.mjs';

import { readFileSync } from 'fs';

tap.test("stripping // comments", async t => {
  t.equal(util.strip_comments(`line 1
    // comment 1
    line 2
    line 3
    // comment 2
    line 4`), `line 1

    line 2
    line 3

    line 4`);
});

tap.test("stripping export default", async t => {
  t.equal(util.strip_export('    export   default {}'), '{}');
  t.equal(util.strip_export('    export   default {};  '), '{}');
});

tap.test("read json w/comments", async t => {
  t.match(util.read_eliza_script(`// comment 0
    [ 0,
    // comment 1
    1,
    2,
    // comment 2
    3]`), [0,1,2,3]);
});

tap.test("read mjs", async t => {
  t.match(util.read_eliza_script(`export default {
    // comment 0
    "a":0,
    // comment 1
    "b":1,
    "c":2,
    // comment 2
    "d":3};`), {a:0,b:1,c:2,d:3});
});

tap.test("read example script", async t => {
  let data = readFileSync('scripts/example.mjs', {encoding:'utf8'});
  data = util.read_eliza_script(data);
  let expected = (await import('../scripts/example.mjs')).default;
  t.match(data, expected);
});
