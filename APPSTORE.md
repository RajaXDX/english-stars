# نشر «نجوم الإنجليزي» على App Store

> نفس طريقة «تحدي رجا»: Capacitor يغلّف الموقع، وماك سحابي في GitHub Actions يبني ويوقّع ويرفع، لأن Xcode لا يعمل على ويندوز.
> حساب المطوّر موجود أصلاً (Team `LW7F5B2CJ4`)، فلا رسوم جديدة: الـ99 دولاراً السنوية تغطي كل تطبيقاتك.

## ما جُهِّز في المستودع ✅

| الملف | الغرض |
|---|---|
| `capacitor.config.json` | هوية التطبيق `com.rajaxdx.englishstars` والاسم «نجوم الإنجليزي» |
| `ios/` | مشروع Xcode: iPhone فقط، عمودي، عربي، توقيع يدوي لـ`English Stars AppStore` |
| `ios/App/App/AppDelegate.swift` | الصوت يعمل حتى لو زر الصامت مفعّل (النطق هو محتوى التطبيق) |
| `ios/App/App/Info.plist` | لغة عربية، arm64، إقرار التشفير (لا سؤال امتثال في كل رفعة) |
| `tools/build-www.cjs` | يجمع الموقع في `www/` (≈56 ميغابايت، أغلبها الصوت) ويتأكد أن كل ملف مشار إليه موجود، وأنه لا شيء سرّي داخله |
| `tools/fetch-fonts.cjs` + `fonts/` | الخطوط محفوظة داخل التطبيق بدل Google: لا طلبات شبكة إطلاقاً |
| `tools/make-icons.py` | أيقونة 1024 بلا شفافية وشاشة البداية من `icons/logo.svg` |
| `tools/store-shots.cjs` | لقطات المتجر بالمقاسين المطلوبين |
| `.github/workflows/ios.yml` | يبني ويوقّع ويرفع (ويبني بلا توقيع مع كل دفع لفرع `ios-app`) |
| `.github/workflows/verify-secrets.yml` | يفحص الأسرار في دقيقتين قبل بناء كامل |
| `privacy.html` | سياسة الخصوصية — آبل تشترط رابطها، ومربوطة من صفحة «ملفي» داخل التطبيق |
| `store/store-listing.md` | كل نصوص المتجر والتصنيف وملصق الخصوصية وملاحظات المراجعة |
| `store/screenshots/` | ٥ لقطات لكل مقاس (6.9 و 6.5) |

### ما يتغيّر داخل التطبيق فقط
`IS_APP` في `js/core.js` (يتحقق من `window.Capacitor`):
- لا عامل خدمة (WKWebView لا يحتاجه؛ كل الملفات داخل التطبيق).
- يختفي قسم «تثبيت التطبيق / أضف للشاشة الرئيسية» — آبل ترفض ذكر طرق تثبيت أخرى.
- لا يظهر تنبيه «غير متصل»: التطبيق يعمل كاملاً بلا إنترنت.
- رابط تقرير ولي الأمر يشير للموقع المنشور (`SITE_URL`) لا إلى `capacitor://localhost`.
- نص «أين يُحفظ تقدمك؟» يقول «داخل التطبيق» و«حذف التطبيق يضيع التقدم».

---

## الخطوات المتبقية (في حسابك)

### ١. معرّف التطبيق وملف التزويد
- developer.apple.com ← Identifiers ← **+** ← App IDs ← Bundle ID: `com.rajaxdx.englishstars` (بلا Capabilities إضافية)
- Profiles ← **+** ← **App Store Connect** ← المعرّف أعلاه ← شهادة **Apple Distribution** الموجودة (نفس شهادة «تحدي رجا») ← الاسم بالضبط: **`English Stars AppStore`**
- نزّل الملف `.mobileprovision`.

> يمكن تنفيذ هذه الخطوة آلياً بمفتاح API الموجود — اطلبها من Claude.

### ٢. أنشئ التطبيق في App Store Connect
My Apps ← **+** ← New App: iOS · الاسم `نجوم الإنجليزي` · العربية · Bundle ID `com.rajaxdx.englishstars` · SKU `englishstars`.
(آبل لا تسمح بإنشاء التطبيق عبر الـAPI، فهذه يدوية.)

### ٣. الأسرار الثمانية في مستودع english-stars
Settings ← Secrets and variables ← Actions. **سبعة منها نفس قيم «تحدي رجا»** (الشهادة وكلمة مرورها وسلسلة المفاتيح ومفتاح الـAPI والفريق)، والجديد فقط:

| السرّ | القيمة |
|---|---|
| `PROVISIONING_PROFILE_BASE64` | ملف `English Stars AppStore.mobileprovision` الجديد مُرمّزاً base64 |
| `BUILD_CERTIFICATE_BASE64`, `P12_PASSWORD`, `KEYCHAIN_PASSWORD` | كما في «تحدي رجا» (`apple-signing/distribution.p12`) |
| `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_ID`, `APPSTORE_PRIVATE_KEY` | كما في «تحدي رجا» |
| `TEAM_ID` | `LW7F5B2CJ4` |

### ٤. افحص الأسرار
Actions ← **فحص الأسرار** ← Run workflow.

### ٥. البناء والرفع
Actions ← **iOS** ← Run workflow ← `upload = true`. يظهر البناء في TestFlight خلال ١٥–٦٠ دقيقة. جرّبه على جوالك من TestFlight قبل الإرسال.

> ملاحظة: «Run workflow» يظهر فقط بعد دمج فرع `ios-app` في `main`.

### ٦. صفحة المتجر والإرسال
انسخ من [`store/store-listing.md`](store/store-listing.md)، ارفع اللقطات، اختر البناء، ثم Add for Review ← Submit.

---

## قبل الإرسال: تأكد من هذه

- [ ] **الصوت مكتمل؟** التطبيق يحزم الصوت الموجود في المستودع لحظة البناء. لو توليد ElevenLabs لم يكتمل، ابنِ بعد اكتماله (أو اقبل أن تكون بعض العبارات بأصوات Microsoft الحالية — كلها تعمل).
- [ ] **`privacy.html` منشور** على `rajaxdx.github.io/english-stars/privacy.html` (ينشر عند دمج الفرع في `main`).
- [ ] جرّب من TestFlight: زر الصامت مفعّل والصوت يعمل، والتطبيق يعمل في وضع الطيران.

## الخطر الحقيقي: بند 4.2 (الحد الأدنى للوظائف)
آبل ترفض «موقع مغلّف». وضعنا جيد: كل المحتوى (١٢ صفاً، ~٤٠٠٠ كلمة، ~٩٠٠٠ مقطع صوتي) داخل التطبيق، يعمل بلا إنترنت، بلا أي كود أو خط من الشبكة، وتمارين تفاعلية حقيقية. لا تكتب في الوصف أنه «نسخة من الموقع».

## بعد النشر
**تحديث:** عدّل الموقع، ارفع `MARKETING_VERSION` في `ios/App/App.xcodeproj/project.pbxproj` (مثلاً 1.1)، ثم شغّل السير برفع. رقم البناء يتولّد تلقائياً.
تحديثات الموقع لا تصل للتطبيق وحدها — كل محتوى جديد يحتاج بناءً ورفعاً جديدين.

## إعادة توليد الأصول
```sh
npm install
node tools/fetch-fonts.cjs     # فقط عند تغيير الخطوط في index.html
python tools/make-icons.py     # بعد تغيير icons/logo.svg
node tools/build-www.cjs       # يبنيه السير تلقائياً
```
