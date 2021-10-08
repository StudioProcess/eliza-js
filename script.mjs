export default {

  // list of initial sentences from eliza (randomly chosen)
  "initial": [
    "How do you do. Please tell me your problem.",
  ],

  // list of final sentences from eliza (randomly chosen)
  "final": [
    "Goodbye. It was nice talking to you.",
  ],

  // list of quit keywords
  "quit": [
    "bye",
    "goodbye",
    "done",
    "exit",
    "quit",
  ],
  
  "none": [
    "I'm not sure I understand you fully.",
    "Please go on.",
    "What does that suggest to you ?",
    "Do you feel strongly about discussing such things ?",
    "That is interesting. Please continue.",
    "Tell me more about that.",
    "Does talking about this bother you ?",
  ],

  // pre-processing substitutions
  // applied to the input string  
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
  
  // how -> what
  // when -> what
  // alike -> dit
  // same -> dit
  // certainly -> yes
  // maybe -> perhaps
  // "machine", "computer",
  // "machines", "computer",
  // "computers", "computer",

  // post-processing substitutions
  // applied to parameters during reassembly
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

  // tag definitions (i.e. synonyms)
  // to be used in decompositon rules (with '@')
  "tags": {
    "belief": ["feel", "think", "believe", "wish"],
    "family": ["mother", "father", "sister", "brother", "wife", "children"],
    "want": ["want", "need"],
    "sad": ["sad", "unhappy", "depressed", "sick"],
    "happy": ["happy", "elated", "glad", "better"],
    "cannot": ["cannot", "can't"],
    "everyone": ["everyone", "everybody", "nobody", "noone"],
    "am": ["am", "is", "are", "was"],
  },

  "keywords": {
    "sorry 0": {
      "*": [
        "Please don't apologise.",
        "Apologies are not necessary.",
        "What feelings do you have when you apologize?",
        "I've told you that apologies are not required.",
      ]
    },
    
    "remember 5": {
      "* i remember *": [
        "Do you often think of (2)?",
        "Does thinking of (2) bring anything else to mind?",
        "What else do you remember?",
        "Why do you remember (2) just now?",
        "What in the present situation reminds you of (2)?",
        "What is the connection between me and (2)?",
      ],
      "* do you remember *": [
        "Did you think I would forget (2)?",
        "Why do you think I should recall (2) now?",
        "What about (2)?",
        "-> what",
        "You mentioned (2)?"
      ]
    },
    
    "how": "-> what",
    "when": "-> what",
    "alike 10": "-> dit",
    "same 10": "-> dit",
    "certainly": "-> yes",
    
    "$ my": {
      "* my *": [
        "Lets discuss further why your (2).",
        "Earlier you said your (2).",
        "But your (2).",
        "Does that have anything to do with the fact that your (2)?",
      ]
    },
    
    "i": {
      "* i #belief i *": [
        "Do you really think so?",
        "But you are not sure you (2).",
        "Do you really doubt you (2)?",
      ]
    }
  }

};