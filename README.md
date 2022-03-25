# eliza.js

## Installation

### For use in a Node.js project

Install:

```
npm install github:StudioProcess/eliza-js
```

### For use in a web project

Single file builds are available in the [build/](build/) folder:
* [build/eliza.mjs](build/eliza.mjs) (ES Module)
* [build/eliza.js](build/eliza.js) (CommonJS Module)

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

```javascript
import { make_eliza_async } from 'eliza-js';

(async () => {
  const eliza = await make_eliza_async('./scripts/example.mjs');
  
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

```javascript
import { make_eliza_async } from 'eliza-js';
const eliza = await make_eliza_async('./scripts/example.mjs');
```

Note that the function is async, since it needs to dynamically load the script file.

If you've got a script object already, you can use [make_eliza()](#make_elizascript-options) instead.

### make_eliza_async(script_url, options)

Params:
* `script_url`: URL to script (.mjs with a default export, e.g. [scripts/example.mjs](scripts/example.mjs))
* `options`: (optional) object containing one or more of the following options
    * `debug`: (default `false`)
    * `debug_options`: (default `false`)
    * `debug_script`: (default `false`)
    * `memory_size`: (default `100`)
    * `shuffle_choices`: (default `false`)
    * `lowercase_input`: (default `true`)
    * `lowercase_input_quit`: (default `true`)
    * `lowercase_output`: (default `false`)
    * `seed`: (default `-1`)
    * `wildcard_marker`: (default `'*'`)
    * `tag_marker`: (default `'#'`)
    * `memory_marker`: (default `'@'`)
    * `goto_marker`: (default `'='`)
    * `param_marker_pre`: (default `'$'`)
    * `param_marker_post`: (default `''`)
    * `stop_chars`: (default `'.,;:?!'`)
    * `stop_words`: (default `['but']`)
    * `allow_chars`: (default `'\'äöüß-'`)
    * `fallback_reply`: (default `'I am at a loss for words.'`)
    * `fixed_initial`: (default: `0`)
    * `fixed_final`: (default: `0`)

Returns: 
* Promise that resolves with an [ElizaInstance](#elizainstance) object

### make_eliza(script, options)

Params:
* `script`: script object (see e.g. the default export in [scripts/example.mjs](scripts/example.mjs)) or string. Allowed strings are JSON source text with //-style comments (see [scripts/example.json](scripts/example.json)) or mjs source text with a single default export (see [scripts/example.mjs](scripts/example.mjs)).
* `options`: (optional) see [make_eliza_async()](#make_eliza_asyncscript_url-options)

Returns:
* A new [ElizaInstance](#elizainstance) object


## ElizaInstance

An eliza instance is an object with the following functions:
* [get_initial()](#get_initial)
* [get_final()](#get_final)
* [transform(text)](#transformtext)
* [is_quit()](#is_quit)
* [reset()](#reset)
* [get_options()](#get_options)

Additionally, it contains async versions of the three text-generating functions, which add a delay before an answer is returned:
* [get_initial_async(delay)](#get_initial_asyncdelay)
* [get_final_async(delay)](#get_final_asyncdelay)
* [transform_async(text, delay)](#transform_asynctext-delay)

### get_initial()

Get an initial greeting from Eliza. Use at the beginning of the conversation.

Params:
* None

Returns:
* String. Initial sentence from Eliza.

### get_final()

Get a farewell message from Eliza. Can be used at the end of the conversation to get more final messages. Note when [is_quit()](#is_quit) returns true, the first final message has already been received, as the return value of the last [transform()](#transformtext).

Params:
* None

Returns:
* String. Final sentence from Eliza.

### transform(text)

To talk to Eliza, an input text is 'transformed' into a reply. Use to get Eliza's replies to user inputs.

Params:
* `text`: The input sentence.

Returns:
* String. Eliza's response.

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

### get_initial_async(delay)

Asyncronous version of [get_initial()](#get_initial), that adds a delay to Eliza's response.

Params:
* `delay`: See [transform_async(text, delay)](#transform_asynctext-delay)

Returns:
* Promise that resolves to a string with Eliza's response.

### get_final_async(delay)

Asyncronous version of [get_final()](#get_final), that adds a delay to Eliza's response.

Params:
* `delay`: See [transform_async(text, delay)](#transform_asynctext-delay)

Returns:
* Promise that resolves to a string with Eliza's response.

### transform_async(text, delay)

Asyncronous version of [transform()](#transformtext), that adds a delay to Eliza's response.

Params:
* `text`: The input sentence.
* `delay`: (Default `[1, 3]`) Delay in seconds before response is returned. Either a single number or an array with two numbers `[delay_min, delay_max]` in which case the delay is a random number between the two values.

Returns:
* Promise that resolves to a string with Eliza's response.
