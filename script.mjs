export default {

  // list of initial sentences from eliza (randomly chosen)
  "initial": [
    "How do you do. Please tell me your problem."
  ],

  // list of final sentences from eliza (randomly chosen)
  "final": [
    "Goodbye."
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
    "I am not sure I understand you fully.",
    "Please go on.",
    "What does that suggest to you?",
    "Do you feel strongly about discussing such things?"
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

  // tag definitions
  // to be used in decompositon rules (with '#')
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
  // rules can be written in the following four forms:
  //   <keyword>: <reassembly>
  //   <keyword>: [ <reassembly>, ... ]
  //   <keyword>: { <decomposition>: <reassembly>, ... }
  //   <keyword>: { <decomposition>: [ <reassembly>, ... ], ... }
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
    
    "if 3": {
      "* if *": [
        "Do you think it's likely that $2?",
        "Do you wish that $2?",
        "What do you think about $2?",
        "Really, if $2?"
      ]
    },
    
    "dreamt 4": {
      "* you dreamt *": [
        "Really, $2?",
        "Have you ever fantasied $2 while you were awake?",
        "Have you dreamt $2 before?",
        "= dream"
      ]
    },
    
    "dream 3": [
      "What does that dream suggest to you?",
      "Do you dream often?",
      "What persons appear in your dreams?",
      "Don't you believe that dream has something to do with your problem?"
    ],
    
    "how": "= what",
    "when": "= what",
    "alike 10": "= dit",
    "same 10": "= dit",
    "certainly": "= yes",
    
    "perhaps": [
      "You don't seem quite certain.",
      "Why the uncertain tone?",
      "Can't you be more positive?",
      "You aren't sure.",
      "Don't you know?"
    ],
    
    "maybe": "= perhaps",
    
    "name": [
      "I am not interested in names.",
      "I've told you before, I don't care about names - please continue.",
    ],
    
    "deutsch": "= xfremd",
    "francais": "= xfremd",
    "italiano": "= xfremd",
    "espanol": "= xfremd",
    
    "xfremd": "I am sorry, I speak only english.",
    
    "hello": "How do you do. Please state your problem.",
    
    "computer 50": [
      "Do computers worry you?",
      "Why do you mention computers?",
      "What do you think machines have to do with your problem?",
      "Don't you think, coputers can help people?",
      "What about machines worries you?",
      "What do you think about machines?"
    ],
    
    "machine 50": "= computer",
    "machines 50": "= computer",
    "computers 50": "= computer",
    
    "am": {
      "* am I *": [
        "Do you believe you are $2?",
        "Would you want to be $2?",
        "Wou wish I would tell you you are $2?",
        "What would it mean if you were $2?"
      ],
      "*": [
        "Why do you say 'am'?",
        "I don't understand that."
      ]
    },
    
    "are": {
      "* are you *": [
        "Why are you interested in whether I am $2 or not?",
        "Would you prefer if i weren't $2?",
        "Perhaps I am $2 in your fantasies?",
        "Do you sometimes think I am $2?",
        "= what"
      ],
      "* are *": [
        "Did you think they might not be $2?",
        "Would you like it if thet were not $2?",
        "What if they were not $2?",
        "Possibly they are $2."
      ]
    },
    
    "your": {
      "* your *": [
        "Why are you concerned over my $2?",
        "What about your own $2?",
        "Are you worried about someone elses $2?",
        "Really, my $2?"
      ]
    },
    
    "was 2": {
      "* was I *": [
        "What if you were $2?",
        "Do you think you were $2?",
        "Were you?",
        "What would it mean if you were $2?",
        "What does '$2' suggest to you?",
        "= what"
      ],
      "* I was *": [
        "Were you really?",
        "Why do you tell me you were $2 now?",
        "Perhaps I already knew you were $2."
      ],
      "* was you *": [
        "Would you like to believe I was $2?",
        "What suggests that I was $2?",
        "What do you think?",
        "Perhaps I was $2?",
        "What if I had been $2?"
      ]
    },
    
    "i 1": {
      "* i #want *" : [
        "What would it mean to you if you got $3?",
        "Why do you want $3?",
        "Suppose you got $3 soon.",
        "What if you never got $3?",
        "What would getting $3 mean to you?",
        "What does wanting $3 have to do with this discussion?",
      ],
      "* i am * #sad *": [
        "I am sorry to hear you are $3.",
        "Do you think coming here will help you not to be $3?",
        "I'm sure it's not pleasant to be $3.",
        "Can you explain what made you $3?"
      ],
      "* i am * #happy *": [
        "How have I helped you to be $3?",
        "Has your treatment made you $3?",
        "What makes you $3 just now?",
        "Can you explain why you are suddenly $3?",
      ],
      "* I was *": "= was",
      "* i #belief i *": [
        "Do you really think so?",
        "But you are not sure you $3.",
        "Do you really doubt you $3?",
      ],
      "* i * #belief * you *": "= you",
      "* i am *": [
        "Is it because you are $2 that you came to me?",
        "How long have you been $2?",
        "Do you believe it normal to be $2?",
        "Do you enjoy being $2?"
      ],
      "* i #cant *": [
        "How do you know you can't $3?",
        "Hav you tried?",
        "Perhaps you could $3 now?",
        "Do you really want to be able to $3?"
      ],
      "* i don't *": [
        "Don't you really $2?",
        "Why don't you $2?",
        "Do you wish to be able to $2?",
        "Does that trouble you?"
      ],
      "* i feel *": [
        "Tell me more about such feelings.",
        "Do you often feel $2?",
        "Do you enjoy feeling $2?",
        "Of what does feeling $2 remind you?",
      ],
      "* i * you *": [
        "Perhaps in your fantasy we $2 each other?",
        "Do you wish to $2 me?",
        "You seem to need to $2 me?",
        "Do you $2 anyone else?"
      ],
      "*": [
        "You say $1?",
        "Can you elaborate on that?",
        "Do you say $1 for some special reason?",
        "That's quite interesting."
      ]
    },
    
    "you": {
      "* you remind me of *": "= dit",
      "* you are *": [
        "What makes you think I am $2?",
        "Does it please you to believe I am $2?",
        "Do you sometimes wish you were $2?",
        "Perhaps you would like to be $2?"
      ],
      "* you * me": [
        "Why do you think I $2 you?",
        "You like to think I $2 you - don't you?",
        "What makes you think I $2 you?",
        "Really, I $2 you?",
        "Do you wish to believe I $2 you?",
        "Suppose I did $2 you - what would that mean?",
        "Does someone else believe I $2 you?",
      ],
      "* you *": [
        "We were discussing you - not me.",
        "Oh, I $2?",
        "You're not really talking about me - are you?",
        "What are your feelings now?"
      ]
    },
    
    "yes": [
      "You seem quite positive.",
      "You are sure.",
      "I see.",
      "I understand."
    ],
    
    "no": [
      "Are you saying 'no' just to be negative?",
      "You are being a bit negative.",
      "Why not?",
      "Why 'no'?"
    ],
    
    "my 2": {
      "@ * my *": [
        "Lets discuss further why your $2.",
        "Earlier you said your $2.",
        "But your $2.",
        "Does that have anything to do with the fact that your $2?",
      ],
      "* my * #family *": [
        "Tell me more about your family.",
        "Who else in your family $4?",
        "Your $3?",
        "What else comes to mind when you think of your $3?"
      ],
      "* my *": [
        "Your $2?",
        "Why do you say your $2?",
        "Does that suggest anything else which belongs to you?",
        "Is it important to you that your $2?"
      ]
    },
    
    "can": {
      "* can you *": [
        "You believe I can $2 don't you?",
        "= what",
        "You want me to be able to $2?",
        "Perhaps you would like to be able to $2 yourself?"
      ],
      "* can i *": [
        "Whether or not you can $2 depends on you more than on me.",
        "Do you want to be able to $2?",
        "Perhaps you don't want to $2?",
        "= what"
      ]
    },
    
    "what": [
      "Why do you ask?",
      "Does that question interest you?",
      "What is it you really want to know?",
      "Are such questions much on your mind?",
      "What answer would please you most?",
      "What do you think?",
      "What comes to your mind when you ask that?",
      "Have you asked such questions before?",
      "Have you asked anyone else?"
    ],
    
    "because": [
      "Is that the real reason?",
      "Don't any other reasons come to mind?",
      "Does that reason seem to explain anything else?",
      "What other reasons might there be?"
    ],
    
    "why": {
      "* why don't you *": [
        "Do you believe I don't $2?",
        "Perhaps I will $2 in good time?",
        "Should you $2 yourself?",
        "You want me to $2?",
        "= what"
      ],
      "* why can't I *": [
        "Do you think you should be able to $2?",
        "Do you want to be able to $2?",
        "Do you believe this will help you to $2?",
        "Have you any idea why you can't $2?",
        "= what"
      ]
    },
    
    "everyone 2": {
      "* #everyone *": [
        "Really, $2?",
        "Surely not $2?",
        "Can you think of anyone in particular?",
        "Who, for example?",
        "You are thinking of a very special person?",
        "Who, may I ask?",
        "Someone special perhaps?",
        "You have a particular person in mind, don't you?",
        "Who do you think you're talking about?"
      ]
    },
    
    "everybody 2": "= everyone",
    "nobody 2": "= everyone",
    "noone 2": "= everyone",
    
    "always 1": [
      "Can you think of a specific example?",
      "When?",
      "What incident are you thinking of?",
      "Really, always?"
    ],
    
    "like 10 ": {
      "* #am * like *": "= dit"
    },
    
    "dit": [
      "In what way?",
      "What resemblance to you see?",
      "What does that similarity suggest to you?",
      "What other connections to you see?",
      "What do you suppose that resemblance means?",
      "What is the connection, do you suppose?",
      "Could there really be some connection?",
      "How?"
    ]
  }


};