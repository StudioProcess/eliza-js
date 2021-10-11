import tap from 'tap';

import * as util from '../util.mjs';
import * as parse from '../parse.mjs';


tap.test("type function", async t => {
  t.equal( util.type(null), 'null' );
  t.equal( util.type([]), 'array' );
  t.equal( util.type({}), 'object' );
  t.equal( util.type(""), 'string');
  t.equal( util.type(), 'undefined' );
  t.equal( util.type(undefined), 'undefined' );
});

tap.test("check_array function", async t => {
  const obj = {
    'array': [],
    'no array 1': '',
    'no array 2': {},
    'array with strings': ['str1', 'str2'],
    'array with objects': [{}, {}],
    'array with arrays': [[], []],
    'array with string and object': ["", {}],
  };
  t.doesNotThrow(() => util.check_array(obj, 'array'));
  t.throws(() => util.check_array(obj, 'no array 1'));
  t.throws(() => util.check_array(obj, 'no array 2'));
  t.doesNotThrow(() => util.check_array(obj, 'array with strings', ['string']));
  t.doesNotThrow(() => util.check_array(obj, 'array with objects', ['object']));
  t.doesNotThrow(() => util.check_array(obj, 'array with arrays', ['array']));
  t.doesNotThrow(() => util.check_array(obj, 'array with string and object', ['string', 'object']));
  
  t.throws(() => util.check_array(obj, 'not present'));
  t.throws(() => util.check_array(obj, 'array with strings', ['object']));
  t.throws(() => util.check_array(obj, 'array with strings', ['array', 'object']));
  t.throws(() => util.check_array(obj, 'array with string and object', ['array']));
});

tap.test("check_object function", async t => {
  const obj = {
    'object': {},
    'no object 1': '',
    'no object 2': [],
    'object with strings': {'1':'str1', '2':'str2'},
    'object with objects': {'1':{}, '2':{}},
    'object with arrays': {'1':[], '2':[]},
    'object with string and object': {'1':'', '2':{}},
  };
  t.doesNotThrow(() => util.check_object(obj, 'object'));
  t.throws(() => util.check_object(obj, 'no object 1'));
  t.throws(() => util.check_object(obj, 'no object 2'));
  t.doesNotThrow(() => util.check_object(obj, 'object with strings', ['string']));
  t.doesNotThrow(() => util.check_object(obj, 'object with objects', ['object']));
  t.doesNotThrow(() => util.check_object(obj, 'object with arrays', ['array']));
  t.doesNotThrow(() => util.check_object(obj, 'object with string and object', ['string', 'object']));
  t.throws(() => util.check_object(obj, 'not present'));
  t.throws(() => util.check_object(obj, 'object with strings', ['object']));
  t.throws(() => util.check_object(obj, 'object with strings', ['array', 'object']));
  t.throws(() => util.check_acheck_objectrray(obj, 'object with string and object', ['array']));
});

tap.test("contract_whitespace function", async t => {
  t.equal( util.contract_whitespace(' one    two  three  '), 'one two three', 'spaces' );
  t.equal( util.contract_whitespace(' one   two '), 'one two', 'tab characters' );
  t.equal( util.contract_whitespace(' one\n two\n\n three  '), 'one two three', 'newlines' );
});

tap.test("parse_key function", async t => {
  t.hasStrict( parse.parse_key('  hello 10  '), {key:'hello', rank:10} );
  t.hasStrict( parse.parse_key('  hello   10  '), {key:'hello', rank:10} );
  t.hasStrict( parse.parse_key('one two 102'), {key:'one two', rank:102} );
  t.hasStrict( parse.parse_key('hello'), {key:'hello', rank:0} );
  t.hasStrict( parse.parse_key('  one    two  '), {key:'one two', rank:0} );
  t.hasStrict( parse.parse_key('10 10'), {key:'10', rank:10} );
  t.hasStrict( parse.parse_key('10'), {key:'10', rank:0} );
  t.hasStrict( parse.parse_key('  10'), {key:'10', rank:0} );
  t.hasStrict( parse.parse_key('  10  '), {key:'10', rank:0} );
  t.hasStrict( parse.parse_key(10), {key:'10', rank:0} );
  t.hasStrict( parse.parse_key(' hello  -10   '), {key:'hello', rank:-10} );
});


tap.test("parse_keyword function", async t => {
  const obj = {
    'key1': 'str',
    '  key 2  10 ': 'str',
    'key3': { 'decomp1': ['reasmb1', 'reasmb2'], 'decomp2': ['reasmb3', 'reasmb4'] },
    'key4': { 'decomp1': 'reasmb1', 'decomp2': ['reasmb2', 'reasmb3'] },
    'key5': '  one   two    three ',
    ' key6   10 ': { '  decomp  one ': [' re   one ', ' re  two  '], '  decomp   two ': ['re  three ', 're  four  ']  },
    'key7': [ 're1', 're2' ],

    'fail1': { 'decomp1': 0 },
    'fail2': { 'decomp1': ['reasmb1', 1] },
    'fail3': { 'decomp1': ['reasmb1', []] },
    'fail4': { 'decomp1': ['reasmb1', {}] },
    'fail5': { 'decomp1': ['reasmb1', null] },
  };
  const options = { wildcard_marker:'*', tag_marker:'#', memory_marker:'@' };
  const parse_keyword = util.curry_right(parse.parse_keyword, options);
  t.hasStrict( parse_keyword(obj, 'key1'), {key:'key1', rank:0, rules: [{"decomp": "*", "reasmb": ['str']}]} );
  t.hasStrict( parse_keyword(obj, '  key 2  10 '), {key:'key 2', rank:10, rules: [{"decomp": "*", "reasmb": ['str']}]} );
  t.hasStrict( parse_keyword(obj, 'key3'), {key:'key3', rank:0, rules: [{'decomp': 'decomp1', 'reasmb': ['reasmb1', 'reasmb2']}, {'decomp': 'decomp2', 'reasmb': ['reasmb3', 'reasmb4']}]} );
  t.hasStrict( parse_keyword(obj, 'key4'), {key:'key4', rank:0, rules: [{'decomp': 'decomp1', 'reasmb': ['reasmb1']}, {'decomp': 'decomp2', 'reasmb': ['reasmb2', 'reasmb3']}]} );
  t.hasStrict( parse_keyword(obj, 'key5'), {key:'key5', rank:0, rules: [{"decomp": "*", "reasmb": ['one two three']}]} );
  t.hasStrict( parse_keyword(obj, ' key6   10 '), {key:'key6', rank:10, rules: [{'decomp': 'decomp one', 'reasmb': ['re one', 're two']}, {'decomp': 'decomp two', 'reasmb': ['re three', 're four']}]} );
  t.hasStrict( parse_keyword(obj, 'key7'), {key:'key7', rank:0, rules: [{'decomp': '*', 'reasmb': ['re1', 're2']}]});
  
  t.throws(() => parse_keyword(obj, 'fail1'), 'reasmb not string or array');
  t.throws(() => parse_keyword(obj, 'fail2'), 'reasmb array contains something other than string');
  t.throws(() => parse_keyword(obj, 'fail3'), 'reasmb array contains something other than string');
  t.throws(() => parse_keyword(obj, 'fail4'), 'reasmb array contains something other than string');
  t.throws(() => parse_keyword(obj, 'fail5'), 'reasmb array contains something other than string');
});


tap.test("parse_script function", async t => {
  const options = { wildcard_marker:'*', tag_marker:'#', memory_marker:'@' };
  const parse_script = util.curry_right(parse.parse_script, options);
  const script_base = {
    'pre': { 'k1': 'v1', 'k2': 'v2'},
    'post': { 'k1': 'v1', 'k2': 'v2'},
    'quit': [ 'quit1', 'quit2' ],
    'tags': { 'k1': ['str1', 'str2'], 'k2': ['str3', 'str4'] },
    'keywords': {}
  };
  const script_shuffled = { // these can be shuffled in the parsed data
    'initial': ['str1', 'str2'],
    'final': ['str1', 'str2'],
    'none': ['str1', 'str2'],
  }
  const script1 = Object.assign({}, script_base, script_shuffled)
  const expected1 = Object.assign({}, script_base);
  expected1.keywords = [];
  const parsed1 = parse_script(script1);
  t.hasStrict(parsed1, expected1, 'keywords empty');
  
  // check if all shuffled elements are present
  for (const key in Object.keys(script_shuffled)) {
    t.match( new Set(script_shuffled[key]), new Set(parsed1[key]) );
  }
  
  script1.keywords = {
    "key1": "str1",
    "key2 1": {
      "decomp1": "re1",
      "decomp2": ["re1", "re2"]
    },
    "key3": [ "re1", "re2" ]
  };
  expected1.keywords = [
    { key: 'key2', rank: 1, rules: [ {decomp:'decomp1', reasmb:['re1']}, {decomp:'decomp2', reasmb:['re1', 're2']} ]},
    { key: 'key1', rank: 0, rules: [ {decomp:'*', reasmb:['str1']} ]},
    { key: 'key3', rank: 0, rules: [] }
  ];
  t.hasStrict(parse_script(script1), expected1);
});

tap.test("get_decomp_pattern", async t => {
  t.equal(parse.get_decomp_pattern('*'), '^(.*)$');
  t.equal(parse.get_decomp_pattern('* key'), '^(.*)\\bkey$');
  t.equal(parse.get_decomp_pattern('key *'), '^key\\b(.*)$');
  t.equal(parse.get_decomp_pattern('* key *'), '^(.*)\\bkey\\b(.*)$');
  t.equal(parse.get_decomp_pattern('* key1 * key2 *'), '^(.*)\\bkey1\\b(.*)\\bkey2\\b(.*)$');
});

