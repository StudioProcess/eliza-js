import tap from 'tap';

import * as util from '../util.mjs';
import { make_eliza } from '../index.mjs';


const base_script = {
  'initial': ['init1', 'init2'],
  'final': ['final1', 'final2'],
  'quit': [ 'quit1', 'quit2' ],
  'none': [ 'none1', 'none2' ],
  'pre': {},
  'post': {},
  'tags': {}
};

const options = {
  'wildcard_marker': '*',
  'tag_marker': '#',
  'memory_marker': '@',
  'goto_marker': '=',
  'param_marker_pre': '$',
  'param_marker_post': '',
  'fallback_reply': 'fallback',
  'debug_script': false,
  'debug': false,
};


tap.test("keyword rank", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    'key0': 'reply0',
    'key1 10': 'reply1',
    'key2 1': 'reply2',
    'key3': 'reply3',
    'key4 2': 'reply4'
  };
  const e = make_eliza(script, options);
  
  t.equal( e.transform('key0 key1 key2 key3 key4'), 'reply1', 'all keys present' );
  t.equal( e.transform('key0 bla key1 bla key2 bla key3 bla key4'), 'reply1', 'all keys with bla inbetween' );
  t.equal( e.transform('key0 key2 key3 key4'), 'reply4', '2nd highest' );
  t.equal( e.transform('key0 key2 key3'), 'reply2', '3rd highest' );
  t.equal( e.transform('key0 key3'), 'reply0', '4th highest' );
  t.equal( e.transform('key3 key0'), 'reply0', '4th highest (order)' );
});

tap.test("recomp cycling", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    'key1': ['re1', 're2', 're3'],
    'key2': 're4'
  };
  const e = make_eliza(script, options);
  
  t.equal( e.transform('bla key1 bla'), 're1');
  t.equal( e.transform('bla key1 bla'), 're2');
  t.equal( e.transform('bla key1 bla'), 're3');
  t.equal( e.transform('bla key1 bla'), 're1');
  t.equal( e.transform('bla key2 bla'), 're4');
  t.equal( e.transform('bla key2 bla'), 're4');
});


tap.test("none", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    'key1': ['re1', 're2', 're3'],
    'key2': 're4'
  };
  const e = make_eliza(script, options);
  t.equal( e.transform('bla bla'), 'none1');
  t.equal( e.transform('bla bla'), 'none2');
  t.equal( e.transform('bla bla'), 'none1');
});


tap.test("fallback", async t => {
  const script = Object.assign({}, base_script, {none: []});
  
  script.keywords = {
    'key1': ['re1', 're2', 're3'],
    'key2': 're4'
  };
  const e = make_eliza(script, options);
  t.equal( e.transform('bla bla'), 'fallback');
  t.equal( e.transform('bla bla'), 'fallback');
  t.equal( e.transform('bla bla'), 'fallback');
});


tap.test("memory", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    '@ key1': ['re1', 're2', 're3'],
    '@key2': 're4',
    'key3': {
      '* key3 x *': 're5',
      '@ * key3 y *': 're6',
      '@* key3 z *': 're7'
    },
    'key4': 're8'
  };
  const e = make_eliza(script, options);
  t.equal( e.transform('key0'), 'none1');
  t.equal( e.transform('key1 key4'), 're8');
  t.equal( e.transform('key1 key4'), 're8');
  t.equal( e.transform('key0'), 're1');
  t.equal( e.transform('key0'), 're2');
  t.equal( e.transform('key0'), 'none2');
  
  t.equal( e.transform('key0'), 'none1');
  t.equal( e.transform('key2 key4'), 're8');
  t.equal( e.transform('key2 key4'), 're8');
  t.equal( e.transform('key0'), 're4');
  t.equal( e.transform('key0'), 're4');
  t.equal( e.transform('key0'), 'none2');
  
  t.equal( e.transform('key0'), 'none1');
  t.equal( e.transform('key3 x key4'), 're5');
  t.equal( e.transform('key3 y key4'), 're8');
  t.equal( e.transform('key3 z key4'), 're8');
  t.equal( e.transform('key0'), 're6');
  t.equal( e.transform('key0'), 're7');
  t.equal( e.transform('key0'), 'none2');
  
  t.equal( e.transform('key2'), 're4', 'immediately retrieve memory');
});


tap.test("jump/goto", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    'key1': ['re1', 're2', '= key2', 're3'],
    'key2': 're4',
    'key3': ['re5', '=key4', 're6'],
    'key4': ['re7', 're8'],
    'key5': '= key3',
    'key6': '= key4',
    'key7': '= key5'
  };
  const e = make_eliza(script, options);
  t.equal( e.transform('key1'), 're1');
  t.equal( e.transform('key1'), 're2');
  t.equal( e.transform('key1'), 're4');
  t.equal( e.transform('key1'), 're3');
  t.equal( e.transform('key1'), 're1');
  
  t.equal( e.transform('key3'), 're5');
  t.equal( e.transform('key3'), 're7');
  t.equal( e.transform('key3'), 're6');
  t.equal( e.transform('key3'), 're5');
  t.equal( e.transform('key3'), 're8');
  t.equal( e.transform('key3'), 're6');
  t.equal( e.transform('key3'), 're5');
  t.equal( e.transform('key3'), 're7');
  t.equal( e.transform('key3'), 're6');
  t.equal( e.transform('key3'), 're5');
  t.equal( e.transform('key3'), 're8');
  t.equal( e.transform('key3'), 're6');
  
  t.equal( e.transform('key5'), 're5');
  t.equal( e.transform('key5'), 're7');
  t.equal( e.transform('key5'), 're6');
  t.equal( e.transform('key5'), 're5');
  t.equal( e.transform('key5'), 're8');
  t.equal( e.transform('key5'), 're6');
  t.equal( e.transform('key5'), 're5');
  t.equal( e.transform('key5'), 're7');
  t.equal( e.transform('key5'), 're6');
  t.equal( e.transform('key5'), 're5');
  t.equal( e.transform('key5'), 're8');
  t.equal( e.transform('key5'), 're6');

  t.equal( e.transform('key6'), 're7');
  t.equal( e.transform('key6'), 're8');
  t.equal( e.transform('key6'), 're7');
  t.equal( e.transform('key6'), 're8');
  
  t.equal( e.transform('key7'), 're5');
  t.equal( e.transform('key7'), 're7');
  t.equal( e.transform('key7'), 're6');
  t.equal( e.transform('key7'), 're5');
  t.equal( e.transform('key7'), 're8');
  t.equal( e.transform('key7'), 're6');
  t.equal( e.transform('key7'), 're5');
  t.equal( e.transform('key7'), 're7');
  t.equal( e.transform('key7'), 're6');
  t.equal( e.transform('key7'), 're5');
  t.equal( e.transform('key7'), 're8');
  t.equal( e.transform('key7'), 're6');
});


tap.test("wildcards (decomp/reasmb)", async t => {
  const script = Object.assign({}, base_script);
  
  script.keywords = {
    'key1': {
      'x * key1 *': 're2',
      '* x key1 *': 're3',
      '* key1 * x': 're4',
      '* key1 x *': 're5',
      '* key1 *': 're1',
    },
    'key2': {
      '* key2 *': [ '$1 x $2', '$2 x $1' ]
    },
    'key3': {
      '* key3 *': [ '$0', 'x$0', 'x $0', '$1', '$2', '$3', 'x$3', 'x  $3', '$1$2', '$1$1$2$2','$0$1$2$3' ]
    }
  };
  const e = make_eliza(script, options);
  
  t.equal( e.transform('a key1 b'), 're1');
  t.equal( e.transform('x bla key1 bla'), 're2');
  t.equal( e.transform('bla x key1 bla'), 're3');
  t.equal( e.transform('bla key1 bla x'), 're4');
  t.equal( e.transform('bla key1 x bla'), 're5');
  t.equal( e.transform('bla key1 bla'), 're1');
  
  t.equal( e.transform('a key2 b'), 'a x b');
  t.equal( e.transform('a key2 b'), 'b x a');
  t.equal( e.transform('bla bla key2 blu blu'), 'bla bla x blu blu');
  t.equal( e.transform('bla bla key2 blu blu'), 'blu blu x bla bla');
  
  t.equal( e.transform('a key3 b'), 'none1');
  t.equal( e.transform('a key3 b'), 'x');
  t.equal( e.transform('a key3 b'), 'x');
  t.equal( e.transform('a key3 b'), 'a');
  t.equal( e.transform('a key3 b'), 'b');
  t.equal( e.transform('a key3 b'), 'none2');
  t.equal( e.transform('a key3 b'), 'x');
  t.equal( e.transform('a key3 b'), 'x');
  t.equal( e.transform('a key3 b'), 'ab');
  t.equal( e.transform('a key3 b'), 'aabb');
  t.equal( e.transform('a key3 b'), 'ab');
});


tap.test("tags", async t => {
  const script = Object.assign({}, base_script, {
    'tags': {
      'tag1': ['t11', 't12', 't13'],
      'tag2': ['t21', 't22']
    }
  });
  script.keywords = {
    'key1': {
      '#tag1 * key1 *': 're1',
      '* key1 * #tag1': 're2',
      '* #tag1 * key1 *': 're3',
      '*': 're4'
    },
    'key2': {
      '* key2 * #tag2 *': ['$1', '$2', '$3', '$4']
    }
  };
  const e = make_eliza(script, options);
  t.equal( e.transform('t11 key1'), 're1');
  t.equal( e.transform('t11 bla key1'), 're1');
  t.equal( e.transform('t11 bla key1 bla'), 're1');
  t.equal( e.transform('t12 key1'), 're1');
  t.equal( e.transform('t13 key1'), 're1');
  
  t.equal( e.transform('key1 t11'), 're2');
  t.equal( e.transform('key1 bla t11'), 're2');
  t.equal( e.transform('bla key1 bla t11'), 're2');
  
  t.equal( e.transform('bla t11 key1'), 're3');
  t.equal( e.transform('bla t12 bla key1'), 're3');
  t.equal( e.transform('bla t13 bla key1 bla'), 're3');
  
  t.equal( e.transform('key1'), 're4');
  t.equal( e.transform('bla key1 bla'), 're4');
  
  t.equal( e.transform('a a key2 b b t21 c c'), 'a a');
  t.equal( e.transform('a a key2 b b t21 c c'), 'b b');
  t.equal( e.transform('a a key2 b b t21 c c'), 't21');
  t.equal( e.transform('a a key2 b b t21 c c'), 'c c');
  
  t.equal( e.transform('key2 t22'), 'none1');
  t.equal( e.transform('key2 t22'), 'none2');
  t.equal( e.transform('key2 t22'), 't22');
  t.equal( e.transform('key2 t22'), 'none1');
});

