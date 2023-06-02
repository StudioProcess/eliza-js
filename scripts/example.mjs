export default {
  
  // override options
  "options": {
    // randomly choose of reassembly rules and none-replies (instead of sequentially)
    "shuffle_choices": false,
    // transform input text to lowercase
    "lowercase_input": true,
    // lowercase input when checking for quit phrase (only relevant when lowercase_input is false)
    "lowercase_input_quit": true,
    // transform output text to lowercase (responses will be fully lowercase)
    "lowercase_output": false,
    // characters that delineate parts of the input
    // parts will be transformed in the order they appear in
    // if a part doesn't produce a response, the next part is tried
    "stop_chars": ".,;:?!",
    // words that delineate parts of the input
    "stop_words": ["but"],
    // allow these charaters in the input text
    // everything else will be removed
    // A-Z, a-z, 0-9 are always allowed
    "allow_chars": "'äöüß-",
    "allow_emoji": true,
    // how many initial responses remain fixed (not chosen randomly)
    "fixed_initial": 2,
    // how many final responses remain fixed (not chosen randomly)
    "fixed_final": 1,
    
    // sometimes the parts the bot should react to are at the end of the sentence
    // this option will cause the parts to be processed backwards
    // has no effect, if shuffle_parts is true
    "reverse_parts": false,
    // causes parts to be processed in random order
    // overrides reverse_parts
    "shuffle_parts": false,
  },

  // list of initial sentences from eliza (randomly chosen)
  "initial": [
    "Hello, I'm Knigge.",
    "Pleased to meet you.",
    "How do you do. Please tell me your problem.",
    "What is bothering you?"
  ],

  // list of final sentences from eliza (randomly chosen)
  "final": [
    "It was nice talking to you.",
    "Goodbye.",
    "See you later."
  ],
  
  // list of replies for empty queries
  "empty": [
    "You are saying nothing?",
    "Say something!"
  ],
  
  // list of fallback replies
  // use these when no reply can be generated from the keyword-based transformation rules
  "none": [
    "I am not sure I understand you fully.",
    "Please go on.",
    "What does that suggest to you?",
    "Do you feel strongly about discussing such things?"
  ],

  // list of quit commands
  // quit, if one of these is the *only* input (or part)
  "quit": [
    "bye",
    "goodbye",
    "done",
    "exit",
    "quit",
  ],
  
  // quit, if one of these occurs *anywhere* in the input
  "quit*": [
    "quit right now",
  ],

  // pre-processing substitutions
  // applied to the input string, matches *complete words*
  "pre": {
    "dont": "don't",
    "cant": "can't",
    "wont": "won't",
    "dreamed": "dreamt",
    "dreams": "dream",
    "were": "was",
    "i'm": "i am",
    "you're": "you are",
    "mom": "mother",
    "dad": "father",
  },

  // post-processing substitutions
  // applied to parameters during reassembly, matches *complete words*
  "post": {
    "am": "are",
    "your": "my",
    "me": "you",
    "you are": "I am",
    "i am": "you are",
    "myself": "yourself",
    "yourself": "myself",
    "i": "you",
    "you": "I",
    "my": "your",
  },

  // tag definitions
  // to be used in decomposition rules (with '#')
  "tags": {
    "belief": ["feel", "think", "believe", "wish"],
    "family": ["mother", "father", "sister", "brother", "wife", "children"],
    "want": ["want", "need"],
    "sad": ["sad", "unhappy", "depressed", "sick"],
    "happy": ["happy", "elated", "glad", "better"],
    "cant": ["can't", "cannot"],
    "everyone": ["everyone", "everybody", "nobody", "noone"],
    "am": ["am", "is", "are", "was"],
  },


  // keywords and associated transformation rules
  //
  // a keyword can optionally be followed by a rank number (default is 0) e.g. "hello 10"
  // 
  // rules can be written in the following four forms:
  //   1. <keyword>: <reassembly>
  //   2. <keyword>: [ <reassembly>, ... ]
  //   3. <keyword>: { <decomposition>: <reassembly>, ... }
  //   4. <keyword>: { <decomposition>: [ <reassembly>, ... ], ... }
  // 
  // special characters:
  //   * ............. wildcard (in decomposition): represents arbitrary text
  //   #<tag> ........ tag (in decomposition): refer to tags e.g. #belief
  //   $<n> .......... parameter (in reassembly): refer to wildcards/tags in the
  //                   decomposition e.g. $1, $2 etc.
  //   = <keyword> ... jump marker (in reassembly) jump to another keyword
  //   @ ............. memory marker (at start of keyword or decomposition):
  //                   save reply from this keyword or decomposition for later,
  //                   when no keywords generate a reply. continue with next
  //                   matching decomposition or keyword.
  "keywords": {
    
    // form 1
    "name": "I am not interested in names.",
    "how": "= what",
    "alike 10": "= dit",
    "certainly": "= yes",
    "😀 5": "Are you happy?",
    "scheiße": "EXCUSE ME?",
    "weiß": "What DO you know?",
    
    // form 2
    "sorry 5": [
      "Please don't apologize.",
      "Apologies are not necessary.",
      "What feelings do you have when you apologize?",
    ],
    "what": [
      "Why do you ask?",
      "Does that question interest you?",
    ],
    "dit": [
      "In what way?",
      "What resemblance to you see?",
      "How?"
    ],
    "yes": [
      "You seem quite positive.",
      "You are sure.",
      "I see.",
      "I understand."
    ],
    
    // form 3
    "you": {
      "* you remind me of *": "= dit",
      "* you are *": "What makes you think I am $2?",
      "* you * me": "Why do you think I $2 you?",
      "* you *": "We were discussing you - not me.",
    },
    
    // form 4
    "remember 5": {
      "* i remember *": [
        "Do you often think of $2?",
        "Does thinking of $2 bring anything else to mind?",
        "What else do you remember?",
        "Why do you remember $2 just now?",
        "What in the present situation reminds you of $2?",
        "What is the connection between me and $2?",
      ],
      "* do you remember *": [
        "Did you think I would forget $2?",
        "Why do you think I should recall $2 now?",
        "What about $2?",
        "= what",
        "You mentioned $2?"
      ]
    },
    
    // forms 3 and 4 can be combined
    "why": {
      "* why don't you *": [
        "Do you believe I don't $2?",
        "Perhaps I will $2 in good time?",
        "Should you $2 yourself?",
        "You want me to $2?",
        "= what"
      ],
      "* why can't I *": "Do you think you should be able to $2?",
    },
    
    // memory
    "my 2": {
      "@ * my *": [
        "Lets discuss further why your $2.",
        "Earlier you said your $2.",
      ],
      "* my *": [
        "Your $2?",
        "Why do you say your $2?",
      ]
    },
    
    // tags
    "i 1": {
      "* i #want *" : [
        "What would it mean to you if you got $3?",
        "Why do you want $3?",
      ],
      "* i am * #sad *": [
        "I am sorry to hear you are $3.",
        "Do you think coming here will help you not to be $3?",
      ],
      "* i am * #happy *": [
        "How have I helped you to be $3?",
        "Has your treatment made you $3?",
      ],
      "* i #belief i *": [
        "Do you really think so?",
        "But you are not sure you $3.",
      ],
      "* i * #belief * you *": "= you",
    }
  }
  
};