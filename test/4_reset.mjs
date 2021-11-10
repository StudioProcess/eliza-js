import tap from 'tap';
import { make_eliza } from '../index.mjs';

const base_script = {
  "options": {
    "seed": 1,
    // how many initial responses remain fixed (not chosen randomly)
    "fixed_initial": 2,
    // how many final responses remain fixed (not chosen randomly)
    "fixed_final": 1,
  },
  'initial': ['init0', 'init1', 'init2', 'init3', 'init4'],
  'final': ['final0', 'final1', 'final2', 'final3', 'final4'],
  'quit': [ 'quit1', 'quit2' ],
  'none': [ 'none1', 'none2' ],
  'pre': {},
  'post': {},
  'tags': {},
  'keywords': {}
};

tap.test("reset", async t => {
  const script = Object.assign({}, base_script);
  const e = make_eliza(script);

  t.equal(e.get_initial(), script.initial[0]);
  t.equal(e.get_initial(), script.initial[1]);
  t.equal(e.get_initial(), script.initial[3]);
  t.equal(e.get_initial(), script.initial[4]);
  t.equal(e.get_final(), script.final[0]);
  t.equal(e.get_final(), script.final[4]);
  t.equal(e.get_final(), script.final[2]);
  t.equal(e.get_final(), script.final[1]);
  e.reset();
  t.equal(e.get_initial(), script.initial[0]);
  t.equal(e.get_initial(), script.initial[1]);
  t.equal(e.get_initial(), script.initial[3]);
  t.equal(e.get_initial(), script.initial[4]);
  t.equal(e.get_final(), script.final[0]);
  t.equal(e.get_final(), script.final[4]);
  t.equal(e.get_final(), script.final[2]);
  t.equal(e.get_final(), script.final[1]);
  e.reset();
  t.equal(e.get_initial(), script.initial[0]);
  t.equal(e.get_initial(), script.initial[1]);
  t.equal(e.get_initial(), script.initial[3]);
  t.equal(e.get_initial(), script.initial[4]);
  t.equal(e.get_final(), script.final[0]);
  t.equal(e.get_final(), script.final[4]);
  t.equal(e.get_final(), script.final[2]);
  t.equal(e.get_final(), script.final[1]);
});

tap.test("async", async t => {
  const script = Object.assign({}, base_script);
  const e = make_eliza(script);
  
  t.resolveMatch(e.get_initial_async(0), script.initial[0]);
  t.resolveMatch(e.get_initial_async(0), script.initial[1]);
  t.resolveMatch(e.get_initial_async(0), script.initial[3]);
  t.resolveMatch(e.get_initial_async(0), script.initial[4]);
  t.resolveMatch(e.get_final_async(0), script.final[0]);
  t.resolveMatch(e.get_final_async(0), script.final[4]);
  t.resolveMatch(e.get_final_async(0), script.final[2]);
  t.resolveMatch(e.get_final_async(0), script.final[1]);
  e.reset();
  t.resolveMatch(e.get_initial_async(0), script.initial[0]);
  t.resolveMatch(e.get_initial_async(0), script.initial[1]);
  t.resolveMatch(e.get_initial_async(0), script.initial[3]);
  t.resolveMatch(e.get_initial_async(0), script.initial[4]);
  t.resolveMatch(e.get_final_async(0), script.final[0]);
  t.resolveMatch(e.get_final_async(0), script.final[4]);
  t.resolveMatch(e.get_final_async(0), script.final[2]);
  t.resolveMatch(e.get_final_async(0), script.final[1]);
  e.reset();
  t.resolveMatch(e.get_initial_async(0), script.initial[0]);
  t.resolveMatch(e.get_initial_async(0), script.initial[1]);
  t.resolveMatch(e.get_initial_async(0), script.initial[3]);
  t.resolveMatch(e.get_initial_async(0), script.initial[4]);
  t.resolveMatch(e.get_final_async(0), script.final[0]);
  t.resolveMatch(e.get_final_async(0), script.final[4]);
  t.resolveMatch(e.get_final_async(0), script.final[2]);
  t.resolveMatch(e.get_final_async(0), script.final[1]);
});
