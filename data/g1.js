/* الصف الأول الابتدائي — مبني على مستوى الصف (بانتظار الكتاب للمطابقة) */
GRADE({ id:"g1", n:1, stage:"p", ar:"الأول الابتدائي", book:"", units:[
{ id:"u1", num:"1", en:"Hello!", ar:"التحية والتعارف", pic:"👋",
  words:["hello|مرحباً|👋","goodbye|مع السلامة|🙋","good morning|صباح الخير|🌅","good night|تصبح على خير|🌙","thank you|شكراً|🙏","yes|نعم|✅","no|لا|❌","name|اسم|📛","boy|ولد|👦","girl|بنت|👧","teacher|معلم|🧑‍🏫","friend|صديق|🤝","school|مدرسة|🏫"],
  grammar:[
    { t:"ما اسمك؟ (What's your name?)",
      p:"نسأل عن الاسم بـ <span class='en'>What's your name?</span> ونجيب بـ <span class='en'>My name is…</span> أو <span class='en'>I'm…</span>",
      ex:[["What's your name? My name is Ali.","ما اسمك؟ اسمي علي."],["I'm Sara. Nice to meet you!","أنا سارة. تشرفت بمعرفتك!"]] },
    { t:"كيف حالك؟ (How are you?)",
      p:"نسأل عن الحال بـ <span class='en'>How are you?</span> ونجيب بـ <span class='en'>I'm fine, thank you.</span>",
      ex:[["Hello! How are you?","مرحباً! كيف حالك؟"],["I'm fine, thank you.","أنا بخير، شكراً."],["Goodbye! See you tomorrow.","مع السلامة! أراك غداً."]] }
  ],
  quiz:["___ is your name?|What|Who|How","My ___ is Ali.|name|is|I","How ___ you?|are|is|am","I'm fine, thank ___ .|you|me|your","Good ___ ! (صباح الخير)|morning|night|bye","___ ! See you tomorrow.|Goodbye|Hello|Thanks","I ___ a student.|am|is|are","She is a ___ . 👧|girl|boy|teacher"]},
{ id:"u2", num:"2", en:"Colors", ar:"الألوان", pic:"🎨",
  words:["red|أحمر|🔴","blue|أزرق|🔵","green|أخضر|🟢","yellow|أصفر|🟡","orange|برتقالي|🟠","purple|بنفسجي|🟣","black|أسود|⚫","white|أبيض|⚪","brown|بني|🟤","pink|وردي|🩷"],
  grammar:[
    { t:"ما لونه؟ (What color is it?)",
      p:"نسأل عن اللون بـ <span class='en'>What color is it?</span> ونجيب بـ <span class='en'>It's…</span>. واللون في الإنجليزي يأتي <b>قبل</b> الشيء: <span class='en'>a red apple</span> = تفاحة حمراء.",
      ex:[["What color is it? It's green.","ما لونه؟ إنه أخضر."],["It's a red apple.","إنها تفاحة حمراء."],["The sky is blue.","السماء زرقاء."]] }
  ],
  quiz:["What ___ is it? It's blue.|color|name|number","It's ___ red apple.|a|an|two","The sun is ___ . ☀️|yellow|blue|black","Grass is ___ .|green|pink|white","The sky is ___ .|blue|brown|red","Milk is ___ .|white|black|green","It ___ a pink flower.|is|am|are","What color ___ it?|is|are|am"]},
{ id:"u3", num:"3", en:"Numbers", ar:"الأرقام", pic:"🔢",
  words:["one|واحد|1️⃣","two|اثنان|2️⃣","three|ثلاثة|3️⃣","four|أربعة|4️⃣","five|خمسة|5️⃣","six|ستة|6️⃣","seven|سبعة|7️⃣","eight|ثمانية|8️⃣","nine|تسعة|9️⃣","ten|عشرة|🔟"],
  grammar:[
    { t:"كم عددها؟ (How many?) والجمع",
      p:"نسأل عن العدد بـ <span class='en'>How many…?</span>. وعند الجمع نضيف <span class='en'>s</span> غالباً: <span class='en'>one cat → two cats</span>.",
      table:{head:["واحد","أكثر من واحد"], rows:[["one book","three books"],["one pen","five pens"],["one ball","two balls"]], en:[0,1]},
      ex:[["How many pens? Three pens.","كم قلماً؟ ثلاثة أقلام."],["How old are you? I'm seven.","كم عمرك؟ عمري سبع سنوات."]] }
  ],
  quiz:["How ___ apples?|many|much|old","I have two ___ .|cats|cat|cates","3 + 2 = ___|five|four|six","10 = ___|ten|nine|one","How ___ are you? I'm six.|old|many|are","one book, three ___|books|book|bookes","7 = ___|seven|six|eight","I ___ six years old.|am|is|are"]},
{ id:"u4", num:"4", en:"Animals", ar:"الحيوانات", pic:"🐱",
  words:["cat|قطة|🐱","dog|كلب|🐶","bird|طائر|🐦","fish|سمكة|🐟","horse|حصان|🐴","cow|بقرة|🐮","duck|بطة|🦆","camel|جمل|🐪","lion|أسد|🦁","rabbit|أرنب|🐰","sheep|خروف|🐑","frog|ضفدع|🐸","elephant|فيل|🐘"],
  grammar:[
    { t:"ما هذا؟ (What is it?) و a / an",
      p:"نسأل <span class='en'>What is it?</span> ونجيب <span class='en'>It's a…</span>. نستخدم <span class='en'>an</span> قبل الكلمة التي تبدأ بحرف علة <span class='en'>(a, e, i, o, u)</span>، و <span class='en'>a</span> قبل غيرها.",
      table:{head:["a","an"], rows:[["a cat","an elephant"],["a dog","an egg"],["a fish","an apple"]], en:[0,1]},
      ex:[["What is it? It's a camel.","ما هذا؟ إنه جمل."],["It's an elephant.","إنه فيل."]] }
  ],
  quiz:["What ___ it? It's a dog.|is|are|am","It's ___ cat.|a|an|two","It's ___ elephant.|an|a|two","The ___ says moo.|cow|cat|duck","A ___ can fly.|bird|fish|camel","A ___ lives in water.|fish|horse|dog","This ___ a rabbit.|is|are|am","It's ___ egg. 🥚|an|a|two"]},
{ id:"u5", num:"5", en:"My Body", ar:"جسمي", pic:"🙂",
  words:["eye|عين|👁️","ear|أذن|👂","nose|أنف|👃","mouth|فم|👄","hand|يد|✋","foot|قدم|🦶","leg|ساق|🦵","arm|ذراع|💪","hair|شعر|💇","tooth|سن|🦷","face|وجه|😀"],
  grammar:[
    { t:"عندي… (I have)",
      p:"نقول ما نملكه بـ <span class='en'>I have…</span>، ونشير بـ <span class='en'>This is my…</span>. وبعض الكلمات جمعها مختلف: <span class='en'>foot → feet</span> و <span class='en'>tooth → teeth</span>.",
      ex:[["I have two eyes.","عندي عينان."],["This is my nose.","هذا أنفي."],["Touch your head!","المس رأسك!"]] }
  ],
  quiz:["I have two ___ . 👁️👁️|eyes|eye|ears","I have one ___ . 👃|nose|noses|hand","This ___ my hand.|is|are|am","Touch ___ head!|your|you|yours","I see with my ___ .|eyes|ears|feet","I hear with my ___ .|ears|nose|mouth","I eat with my ___ .|mouth|leg|hair","I walk with my ___ .|legs|ears|eyes"]}
]});
