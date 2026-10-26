/* الصف الأول الثانوي — مبني على مستوى الصف (بانتظار الكتاب للمطابقة) */
GRADE({ id:"g10", n:10, stage:"s", ar:"الأول الثانوي", book:"", units:[
{ id:"u1", num:"1", en:"People Who Inspire", ar:"أشخاص ملهمون", pic:"💡",
  words:["inspire|يُلهم","colleague|زميل عمل","neighbor|جار","mentor|مرشد","generous|كريم","ambitious|طموح","creative|مبدع","reliable|يُعتمد عليه","patient|صبور","confident|واثق من نفسه","curious|فضولي / محب للمعرفة","humble|متواضع"],
  grammar:[
    { t:"جمل الصلة: المحددة وغير المحددة",
      p:"<b>المحددة</b> تحدد من نقصد ولا تُفصل بفواصل، ويجوز فيها <span class='en'>that</span>. <b>غير المحددة</b> تضيف معلومة إضافية بين فاصلتين، ولا نستخدم فيها <span class='en'>that</span> أبداً.",
      table:{head:["الأداة","الاستخدام"], rows:[["who","للأشخاص"],["which","للأشياء"],["whose","للملكية"],["where","للأماكن"],["when","للأوقات"]], en:[0]},
      ex:[["The man who lives next door is a pilot.","الرجل الذي يسكن بجوارنا طيار."],["Riyadh, which is the capital, is very big.","الرياض، وهي العاصمة، كبيرة جداً."],["I met a girl whose father is a famous poet.","قابلت فتاة والدها شاعر مشهور."]] }
  ],
  quiz:["The man ___ lives next door is a pilot.|who|which|whose","This is the book ___ changed my life.|that|who|where","Riyadh, ___ is the capital, is very big.|which|that|who","I met a girl ___ father is a famous poet.|whose|who's|which","That's the café ___ we first met.|where|which|when","Do you remember the day ___ we graduated?|when|where|which","My brother, ___ is a doctor, lives in Dammam.|who|that|which","He is a very ___ person. He always helps others.|generous|curious|confident"]},
{ id:"u2", num:"2", en:"Hard Work", ar:"الاجتهاد", pic:"⏱️",
  words:["lately|مؤخراً","exhausted|منهك","research|بحث","project|مشروع","deadline|الموعد النهائي","progress|تقدّم","effort|جهد","patience|صبر","improve|يتحسن / يحسّن","train|يتدرب","concentrate|يركّز","achieve|يحقق"],
  grammar:[
    { t:"المضارع التام المستمر",
      p:"<span class='en'>have / has been +</span> الفعل <span class='en'>+ ing</span>: لنشاط بدأ في الماضي وما زال مستمراً أو انتهى للتو وأثره ظاهر. نؤكد فيه على <b>مدة</b> النشاط.",
      table:{head:["المضارع التام","المضارع التام المستمر"], rows:[["I have finished my project.","I have been working on it all week."],["She has written three emails.","She has been writing emails for two hours."]], en:[0,1]},
      ex:[["How long have you been learning English?","منذ متى وأنت تتعلم الإنجليزية؟"],["I'm exhausted. I've been running.","أنا منهك، كنت أركض."]] }
  ],
  quiz:["I ___ studying for three hours.|have been|has been|am","She has been ___ all morning.|working|worked|work","How long have you been ___ English?|learning|learned|learn","They ___ been waiting since 9.|have|has|are","I'm exhausted. I've been ___ .|running|run|ran","He has ___ his project. It's done.|finished|been finishing|finish","My English has ___ a lot.|improved|improving|improve","We need to meet the ___ on Sunday.|deadline|effort|research"]},
{ id:"u3", num:"3", en:"Big Events", ar:"فعاليات كبرى", pic:"🏟️",
  words:["construct|يشيّد","renovate|يرمّم","launch|يطلق / يدشّن","establish|يؤسس","organize|ينظّم","host|يستضيف","announce|يعلن","cancel|يلغي","postpone|يؤجل","publish|ينشر","broadcast|يبث","stadium|ملعب"],
  grammar:[
    { t:"المبني للمجهول في كل الأزمنة",
      p:"القاعدة دائماً: <span class='en'>be</span> بالزمن المناسب + التصريف الثالث. ومع أفعال مثل <span class='en'>can, must, will</span> نقول: <span class='en'>will be + </span>التصريف الثالث.",
      table:{head:["الزمن","المبني للمجهول"], rows:[["present","is built"],["present continuous","is being built"],["past","was built"],["present perfect","has been built"],["future","will be built"],["modal","must be built"]], en:[0,1]},
      ex:[["A new stadium is being built in Riyadh.","يُبنى الآن ملعب جديد في الرياض."],["Expo 2030 will be hosted by Riyadh.","ستستضيف الرياض إكسبو 2030."],["The match has been postponed.","تم تأجيل المباراة."]] }
  ],
  quiz:["A new stadium ___ built in Riyadh now.|is being|is|was being","The match has ___ postponed.|been|be|being","The results will ___ announced tomorrow.|be|been|being","The museum ___ renovated last year.|was|is|has","The event must ___ organized carefully.|be|been|being","The news ___ broadcast every evening.|is|are|be","The book has been ___ in many languages.|published|publish|publishing","Expo 2030 ___ hosted by Riyadh.|will be|will|is been"]},
{ id:"u4", num:"4", en:"What Did They Say?", ar:"الكلام المنقول", pic:"💬",
  words:["explain|يشرح","reply|يرد","mention|يذكر","admit|يعترف","deny|ينكر","claim|يدّعي","warn|يحذّر","advise|ينصح","complain|يشتكي","whisper|يهمس","announce|يعلن","report|يبلّغ / ينقل"],
  grammar:[
    { t:"الكلام المنقول (Reported Speech)",
      p:"عند نقل كلام شخص نرجع الزمن خطوة للماضي: <span class='en'>am/is → was</span>، <span class='en'>will → would</span>، <span class='en'>can → could</span>. <span class='en'>say</span> بدون مفعول، و <span class='en'>tell</span> يحتاج مفعولاً: <span class='en'>told me</span>. والأوامر تُنقل بـ <span class='en'>to +</span> الفعل.",
      table:{head:["الكلام المباشر","الكلام المنقول"], rows:[["\"I'm tired.\"","She said (that) she was tired."],["\"I will call you.\"","He told me he would call me."],["\"Where do you live?\"","They asked me where I lived."],["\"Be quiet!\"","The teacher told us to be quiet."]], en:[0,1]},
      ex:[["He said that he was busy.","قال إنه مشغول."],["My mom advised me to study hard.","نصحتني أمي أن أذاكر بجد."]] }
  ],
  quiz:["She said that she ___ tired.|was|is|be","He told me he ___ go to Jeddah the next day.|would|will|wills","They asked me where I ___ .|lived|live|do live","She ___ me that she liked the gift.|told|said|say","He ___ that he was busy.|said|told|talked","\"I'm happy.\" → She said she ___ happy.|was|is|were","The teacher asked us ___ quiet.|to be|be|being","My mom ___ me to study hard.|advised|said|explained"]},
{ id:"u5", num:"5", en:"Imagine!", ar:"تخيّل!", pic:"🌠",
  words:["imagine|يتخيل","superpower|قوة خارقة","invisible|غير مرئي","fluent|طليق اللسان","abroad|في الخارج","donate|يتبرع","charity|جمعية خيرية","opportunity|فرصة","million|مليون","island|جزيرة","choose|يختار","dream|حلم"],
  grammar:[
    { t:"الشرط الثاني (Second Conditional)",
      p:"لموقف خيالي أو غير محتمل الآن: <span class='en'>If +</span> الماضي البسيط، <span class='en'>would +</span> الفعل. ونستخدم <span class='en'>were</span> مع كل الضمائر: <span class='en'>If I were you…</span>",
      table:{head:["الشرط الأول (محتمل)","الشرط الثاني (خيالي)"], rows:[["If I have time, I will help you.","If I had time, I would help you."],["If it rains, we'll stay home.","If I were rich, I would travel the world."]], en:[0,1]},
      ex:[["What would you do if you were invisible?","ماذا ستفعل لو كنت غير مرئي؟"],["If I were you, I'd study harder.","لو كنت مكانك لذاكرت أكثر."]] }
  ],
  quiz:["If I ___ a million riyals, I'd help the poor.|had|have|would have","If she were rich, she ___ travel the world.|would|will|is","What would you do if you ___ invisible?|were|are|will be","If I ___ you, I'd study harder.|were|am|be","I ___ buy a car if I had money.|would|will|did","If we lived abroad, we ___ speak another language.|would|will|can to","She would donate to ___ if she won.|charity|million|island","If I could choose a superpower, I ___ fly.|would|will|am"]}
]});
