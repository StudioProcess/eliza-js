import tap from 'tap';
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
  'shuffle_choices': false,
  'fixed_initial': 2,
  'fixed_final':2
};

tap.test("delayed functions", async t => {
  const script = Object.assign({}, base_script);
  script.keywords = {
    'key0': 're0',
    'key1': 're1'
  };
  const e = make_eliza(script, options);
  
  t.resolveMatch( e.get_initial_async(0), 'init1' );
  t.resolveMatch( e.get_initial_async(0), 'init2' );
  // // these will use default delay:
  // t.resolveMatch( e.get_initial_async(), 'init1' ); 
  // t.resolveMatch( e.get_initial_async(), 'init2' );
  
  t.resolveMatch( e.get_final_async(0), 'final1' );
  t.resolveMatch( e.get_final_async(0), 'final2' );
  // // these will use default delay:
  // t.resolveMatch( e.get_final_async(), 'final1' );
  // t.resolveMatch( e.get_final_async(), 'final2' );
  
  t.resolveMatch( e.transform_async('asdf', 0), 'none1' );
  t.resolveMatch( e.transform_async('asdf', 0), 'none2' );
  t.resolveMatch( e.transform_async('key0', 0), 're0' );
  t.resolveMatch( e.transform_async('key1', 0), 're1' );
  // // these will use default delay:
  // t.resolveMatch( e.transform_async('key0'), 're0' );
  // t.resolveMatch( e.transform_async('key1'), 're1' );
});
