import tap from 'tap';

import * as util from '../util.mjs';
import { make_eliza } from '../index.mjs';


const base_script = {
  'initial': ['str1', 'str2'],
  'final': ['str1', 'str2'],
  'none': ['str1', 'str2'],
  'quit': [ 'quit1', 'quit2' ],
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
  'debug_script': false,
  'debug': false
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

