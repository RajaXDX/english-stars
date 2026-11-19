/* ============================================================
   NarrationText — تنظيف النص الإنجليزي قبل النطق، ومفتاح التسجيل.
   مشترك بين المتصفح (js/narration.js) وأداة التوليد (scripts/*).
   أي تعديل هنا يغيّر المفاتيح: أعد توليد المكتبة بعده.
   ============================================================ */
(function (root) {
  /* كلمات يتغير نطقها حسب المعنى. يُحدَّد المعنى من الترجمة العربية في المنهج.
     القيمة: [[نوع الكلمة, نمط المعنى العربي], ...] — أول نوع هو الافتراضي.
     v فعل، n اسم، a صفة. أداة التوليد تأخذ النطق من Misaki داخل سياق يطابق النوع
     (مثل "to live" و "the desert")، ثم تراجعه في قائمة المراجعة. */
  const HOMOGRAPHS = {
    close:      [["v", /أغلق|يغلق|اغلق/], ["a", /قريب|مقرّب|مقرب/]],
    live:       [["v", /يسكن|يعيش/], ["a", /مباشر|حي/]],
    wind:       [["n", /رياح|ريح/], ["v", /يلف|يدير/]],
    read:       [["v", /يقرأ|اقرأ/]],
    desert:     [["n", /صحراء/], ["v", /يهجر|يترك/]],
    graduate:   [["v", /يتخرج|تخرج/], ["n", /خريج/]],
    wound:      [["n", /جرح|إصابة/]],
    produce:    [["v", /ينتج|أنتج/], ["n", /منتجات|خضار/]],
    conduct:    [["v", /يُجري|يجري|يدير/], ["n", /سلوك/]],
    import:     [["v", /يستورد/], ["n", /واردات/]],
    estimate:   [["v", /يقدّر|يقدر/], ["n", /تقدير/]],
    transport:  [["v", /ينقل/], ["n", /نقل|مواصلات/]],
    extract:    [["v", /يستخرج/], ["n", /مستخلص/]],
    reject:     [["v", /يرفض/]],
    refund:     [["n", /استرداد/], ["v", /يعيد/]],
    suspect:    [["n", /مشتبه/], ["v", /يشك/]],
    content:    [["n", /محتوى/], ["a", /راضٍ|راض/]],
    conflict:   [["n", /صراع|نزاع/]],
    survey:     [["n", /استطلاع|مسح/]],
    discount:   [["n", /خصم/]],
    impact:     [["n", /أثر|تأثير/]],
    subject:    [["n", /مادة|موضوع/]],
    address:    [["n", /العنوان|عنوان/]],
    console:    [["n", /جهاز/]],
    deliberate: [["a", /متعمد|متعمّد/]],
    record:     [["n", /رقم قياسي|سجل/], ["v", /يسجل|يسجّل/]],
    present:    [["n", /هدية|الحاضر/], ["v", /يقدّم|يقدم|يعرض/]],
    object:     [["n", /شيء|جسم/], ["v", /يعترض/]],
    minute:     [["n", /دقيقة/], ["a", /صغير جداً|دقيق/]],
    tear:       [["n", /دمعة/], ["v", /يمزق/]],
    lead:       [["v", /يقود/], ["n", /رصاص/]],
    bow:        [["n", /قوس/], ["v", /ينحني/]]
  };

  function clean(text) {
    return String(text).normalize("NFKC")
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/\([^)]*[؀-ۿ][^)]*\)/g, " ")      // تلميحات المنهج بالعربي: (صباح الخير)
      .replace(/\([\d\s.%+\-]+\)/g, " ")                    // تلميحات رقمية: (1) (100%)
      .replace(/[؀-ۿ]+/g, " ")                    // أي ترجمة عربية متبقية
      .replace(/[\p{Extended_Pictographic}️‍⃣]/gu, "")   // الإيموجي
      .replace(/_{2,}/g, " ")                               // علامة الفراغ
      .replace(/\s*→\s*/g, " → ")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?;:])/g, "$1")
      .trim();
  }

  /* نوع الكلمة (v/n/a) إذا كانت من الكلمات متعددة النطق، وإلا null */
  function sense(text, meaning) {
    const w = clean(text).toLowerCase().replace(/[.!?]+$/, "");
    const senses = HOMOGRAPHS[w];
    if (!senses) return null;
    if (meaning) for (const [pos, re] of senses) if (re.test(meaning)) return pos;
    return senses[0][0];
  }

  /* المفتاح: النص المنظّف بحروف صغيرة بدون علامة النهاية. للكلمات متعددة النطق يُضاف نوعها: "close::a" */
  function key(text, meaning) {
    const value = clean(text).toLowerCase().replace(/[.!?]+$/, "").trim();   // علامة النهاية لا تغيّر التسجيل
    if (!value) return "";
    const pos = sense(value, meaning);
    return pos ? value + "::" + pos : value;
  }

  /* النص كما يُنطق: حرف كبير في البداية، نقطة في النهاية، وعلامة استفهام للأسئلة.
     isWord: مدخل من قائمة المفردات (مثل "Do my homework") فلا يُعامل الفعل المساعد كسؤال */
  function spoken(text, isWord) {
    let value = clean(text)
      .replace(/\s→\s/g, ". ")
      .replace(/(\d)\s*\+\s*(\d)/g, "$1 plus $2")
      .replace(/(\S)\s*=\s*(\S)/g, "$1 equals $2")
      .replace(/\bi\b/g, "I");
    if (!value) return "";
    value = value[0].toUpperCase() + value.slice(1);
    if (!/[.!?"]$/.test(value)) {
      /* سؤال: يبدأ بأداة استفهام أو فعل مساعد، وفيه أكثر من كلمة ("How old are you") */
      const wh = /^(how|what|what's|who|where|when|why|whose|which)\b/i.test(value);
      const aux = /^(is|are|am|do|does|did|can|could|will|would|have|has|should|may)\s+(i|you|he|she|it|we|they|there|this|that)\b/i.test(value);
      const question = isWord ? wh : (wh || aux) && /\s/.test(value);
      value += question ? "?" : ".";
    }
    return value;
  }

  /* اسم ملف التسجيل: بصمة FNV-1a (64 بت من بصمتين) لمفتاح العبارة.
     نفس العبارة = نفس الملف في كل الصفوف والأنشطة. */
  function fnv(str, basis) {
    let h = basis >>> 0;
    for (const b of new TextEncoder().encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }
  const fileId = k => fnv(k, 0x811c9dc5) + fnv(k, 0x050c5d1f);
  /* الاسم القديم (قبل المفاتيح): بصمة النص بعد حذف ___ والأقواس فقط — لقراءة التسجيلات السابقة */
  const legacyId = t => fileId(String(t).replace(/___/g, " ").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().toLowerCase());

  const api = { clean, key, spoken, sense, fileId, legacyId, HOMOGRAPHS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NarrationText = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
