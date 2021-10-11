# eliza.js

## Installation

### For use in a Node.js project

Install:

```
npm install github:StudioProcess/eliza-js
```

### For development

Requirements:
* node >= 14.0.0
* npm >= 7.24.0

Clone git repo:

```
git clone https://github.com/StudioProcess/eliza-js
```

Install dependencies:

```
cd eliza-js
npm install
```

Start dev server:

```
npm start
```

## Usage

```
import { make_eliza_async } from './node_modules/eliza-js/index.mjs';

(async () => {
  const eliza = await make_eliza_async('./script.mjs');
  
  console.log( 'Eliza: ' + eliza.get_initial() );
  
  while ( ! eliza.is_quit() ) {
    const input = await GET_USER_INPUT();
    console.log( 'You:   ' + input )''
    console.log( 'Eliza: ' + eliza.transform(input) );
  }

})();

```

## Constructor

To construct a chatbot instance call the [make_eliza_async()](#make_eliza_asyncscript_url-options) function supplied by the library:

```
import { make_eliza_async } from './eliza-js/index.mjs';
const eliza = await make_eliza_async('./script.mjs');
```

Note that the function is async, since it needs to dynamically load the script file.

If you've got a script object already, you can use [make_eliza()](#make_elizascript-options) instead.

### make_eliza_async(script_url, options)

Params:
* `script_url`: URL to script (.mjs with a default export, e.g. [script.mjs](script.mjs))
* `options`: (optional) object containing one or more of the following options
    * `debug`: (default `false`)
    * `debug_options`: (default `false`)
    * `debug_script`: (default `false`)
    * `mem_size`: (default `20`)
    * `seed`: (default `-1`)
    * `shuffle_choices`: (default `false`)
    * `capitalize_first_letter`: (default `true`)
    * `memory_marker`: (default `'$'`)
    * `synonym_marker`: (default `@`)
    * `asterisk_marker`: (default `'*'`)
    * `stop_chars`: (default `'.,;:?!'`)
    * `stop_words`: (default `['but']`)
    * `allow_chars`: (default `'\'äöüß-'`)
    * `fallback_reply`: (default `'I am at a loss for words.'`)
    * `none_keyword`: (default `'xnone'`)
    * `goto_keyword`: (default `'goto'`)
    * `param_marker_pre`: (default `'('`)
    * `param_marker_post`: (default `')'`)

Returns: 
* Promise that resolves with an [ElizaInstance](#elizainstance) object

### make_eliza(script, options)

Params:
* `script`: script object (see e.g. the default export in [script.mjs](script.mjs))
* `options`: (optional) see [make_eliza_async()](#make_eliza_asyncscript_url-options)

Returns:
* A new [ElizaInstance](#elizainstance) object


## ElizaInstance

An eliza instance is an object with the following functions:
* [get_initial()](#get_initial)
* [transform(text)](#transformtext)
* [transform_delay(text, delay)](#transform_delaytext-delay)
* [is_quit()](#is_quit)
* [reset()](#reset)
* [get_options()](#get_options)

### get_initial()

Get an initial greeting from Eliza. Use at the beginning of the conversation.

Params:
* None

Returns:
* String. Initial sentence from Eliza.

### transform(text)

To talk to Eliza, an input text is 'transformed' into a reply. Use to get Eliza's replies to user inputs.

Params:
* `text`: The input sentence.

Returns:
* String. Eliza's response.

### transform_delay(text, delay)

Asyncronous version of [transform()](#transformtext), that adds a delay to Eliza's response.

Params:
* `text`: The input sentence.
* `delay`: (Default `[1, 3]`) Delay in seconds before response is returned. Either a single number or an array with two numbers `[delay_min, delay_max]` in which case the delay is a random number between the two values.

Returns:
* Promise that resolves to a string with Eliza's response.

### is_quit()

Check if a quit phrase (like 'goodbye') has been encountered since the start of the conversation. Call after every [transform()](#transformtext) to check if a quit condition has been reached, in which case the conversation should be stopped.

Params:
* None

Returns:
* Boolean. `true` if a quit condition has been encountered so far, `false` otherwise.

### reset()

Reset Eliza's internal state to initial conditions. Use to start a new conversation without creating a new chatbot instance (which reloads and reparses the script).

Params:
* None

Returns:
* None

### get_options()

Retrieve options object used to construct the chatbot instance. See [make_eliza_async()](#make_eliza_asyncscript_url-options).

Params:
* None

Returns:
* The options object.
