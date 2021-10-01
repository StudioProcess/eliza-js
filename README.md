# eliza.js

## Usage

```
import { make_eliza } from './eliza-js/index.mjs';

(async () => {
  const eliza = await make_eliza();
  
  console.log( eliza.start() );
  
  while ( ! eliza.is_quit() ) {
    const input = await GET_USER_INPUT();
    console.log( eliza.transform(input) );
  }

})();

```

## Constructor

To construct a chatbot instance call the [make_eliza()](#makeelizaoptions) function supplied by the library:

```
import { make_eliza } from './eliza-js/index.mjs';
const eliza = await make_eliza();
```

Note that the function is async, since it needs to dynamically load the script file.

### make_eliza(options)

Params:
* `options`: (optional) object containing one or more of the following options
    * `debug`: (default `false`)
    * `script`: (default `./script.mjs`)
    * `mem_size`: (default `20`)
    * `randomize_choices`: (default `true`)
    * `capitalize_first_letter`: (default `true`)
    * `memory_marker`: (default `'$'`)
    * `synonym_marker`: (default `@`)
    * `asterisk_marker`: (default `'*'`)
    * `stop_chars`: (default `'.,;:?!'`)
    * `allow_chars`: (default `'\'äöüß'`)
    * `fallback_reply`: (default `'I am at a loss for words.'`)
    * `none_keyword`: (default `'xnone'`)
    * `goto_keyword`: (default `'goto'`)
    * `param_marker_pre`: (default `'('`)
    * `param_marker_post`: (default `')'`)

Returns: 
* Promise that resolves with an [ElizaInstance](#elizainstance) object

## ElizaInstance

An eliza instance is an object with the following functions:
* [get_initial()](#getinitial)
* [start()](#start)
* [transform(text)](#transformtext)
* [is_quit()](#isquit)
* [reset()](#reset)

### get_initial()
or
### start()
### transform(text)
### is_quit()
### reset()
