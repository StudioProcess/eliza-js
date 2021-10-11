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
