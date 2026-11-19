// اختبارات النطق (بدون مكتبات خارجية): node --test tests/
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const NT = require("../js/narration-text.js");

/* متصفح وهمي: Audio و speechSynthesis ومؤقتات يتحكم فيها الاختبار */
function browser({ voices = [{ name: "Google US English", lang: "en-US" }], audio = true, speech = true, playError, gender = "f" } = {}) {
  const players = [], utterances = [], timers = new Map(), events = new Map(), docEvents = new Map(), errors = [];
  let nextTimer = 0;
  class Audio {
    constructor() { players.push(this); this.listeners = {}; }
    addEventListener(n, f) { this.listeners[n] = f; }
    removeEventListener(n) { delete this.listeners[n]; }
    play() { return playError ? Promise.reject(playError) : Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const synth = {
    voices, getVoices() { return this.voices; },
    addEventListener(n, f) { events.set(n, f); }, removeEventListener(n, f) { if (events.get(n) === f) events.delete(n); },
    speak(u) { utterances.push(u); }, resume() {}, cancel() { this.cancelled = (this.cancelled || 0) + 1; }
  };
  const document = { hidden: false, addEventListener(n, f) { docEvents.set(n, f); } };
  const lib = { clips: {
    apple: "a1a1a1a1a1a1a1a1", "close::v": "c0c0c0c0c0c0c0c0", "close::a": "c1c1c1c1c1c1c1c1",
    "how old are you": ["m0m0m0m0m0m0m0m0", "f0f0f0f0f0f0f0f0"], onlymale: ["m9m9m9m9m9m9m9m9", ""]
  } };
  const ctx = vm.createContext({
    Audio: audio ? Audio : undefined, speechSynthesis: speech ? synth : undefined,
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
    NarrationText: NT, NARRATION_AUDIO: lib, document,
    Store: { profile: () => ({ gender }) },
    addEventListener(n, f) { docEvents.set("win:" + n, f); },
    setTimeout(f) { const id = ++nextTimer; timers.set(id, f); return id; }, clearTimeout(id) { timers.delete(id); },
    isFinite, Math, Promise
  });
  ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../js/narration.js"), "utf8"), ctx);
  return {
    N: ctx.Narration, ctx, players, utterances, synth, events, timers, errors, document, docEvents,
    speak(t, o) { return ctx.Narration.speak(t, { onError: m => errors.push(m), ...o }); },
    fireTimer() { const [id, f] = timers.entries().next().value; timers.delete(id); f(); }
  };
}

test("the promise resolves only when the recording actually ends", async () => {
  const b = browser(); let done = false;
  const p = b.speak("Apple").then(ok => { done = true; return ok; });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(done, false, "must not resolve before the clip ends");
  assert.equal(b.players[0].src, "audio/f/a1a1a1a1a1a1a1a1.mp3");
  b.players[0].onended();
  assert.equal(await p, true);
  assert.equal(b.timers.size, 0, "no timers left behind");
});

test("Slower uses the same recording at 0.8 with pitch preserved", async () => {
  const b = browser(); const p = b.speak("apple", { slow: true });
  const a = b.players[0];
  assert.equal(a.playbackRate, 0.8);
  assert.equal(a.preservesPitch, true); assert.equal(a.webkitPreservesPitch, true); assert.equal(a.mozPreservesPitch, true);
  a.onended(); assert.equal(await p, true);
});

test("stop cancels, settles the pending promise and removes callbacks", async () => {
  const b = browser(); const p = b.speak("apple");
  b.N.stop();
  assert.equal(await p, false);
  assert.equal(b.players[0].paused, true);
  assert.equal(b.players[0].onended, null);
  assert.equal(b.timers.size, 0);
  assert.equal(b.utterances.length, 0);
});

test("a new word replaces the old one; a late 'ended' from the old clip is ignored", async () => {
  const b = browser(); const first = b.speak("apple"); const oldEnd = b.players[0].onended;
  const second = b.speak("close", { meaning: "أغلق" });
  oldEnd && oldEnd();
  assert.equal(await first, false);
  assert.equal(b.players.length, 1, "one audio element is reused");
  assert.equal(b.players[0].src, "audio/f/c0c0c0c0c0c0c0c0.mp3");
  b.players[0].onended(); assert.equal(await second, true);
});

test("hiding the tab and leaving the page stop playback", async () => {
  const b = browser(); const p = b.speak("apple");
  b.document.hidden = true; b.docEvents.get("visibilitychange")();
  assert.equal(await p, false);
  const p2 = b.speak("apple"); b.docEvents.get("win:pagehide")();
  assert.equal(await p2, false);
});

test("the learner's voice is used, with the other voice as backup", async () => {
  const m = browser({ gender: "m" }); m.speak("How old are you?");
  assert.equal(m.players[0].src, "audio/m/m0m0m0m0m0m0m0m0.mp3");
  const f = browser({ gender: "f" }); f.speak("how old are you");
  assert.equal(f.players[0].src, "audio/f/f0f0f0f0f0f0f0f0.mp3", "same key without punctuation or case");
  const only = browser({ gender: "f" }); only.speak("onlymale");
  assert.equal(only.players[0].src, "audio/m/m9m9m9m9m9m9m9m9.mp3");
});

test("the curriculum meaning selects the two pronunciations of 'close'", async () => {
  const b = browser();
  const near = b.speak("close", { meaning: "قريب" });
  assert.equal(b.players[0].src, "audio/f/c1c1c1c1c1c1c1c1.mp3");
  b.players[0].onended(); await near;
  const shut = b.speak("Close", { meaning: "أغلق" });
  assert.equal(b.players[0].src, "audio/f/c0c0c0c0c0c0c0c0.mp3");
  b.players[0].onended(); assert.equal(await shut, true);
});

test("a failed recording falls back once to an English device voice and awaits it", async () => {
  const b = browser({ voices: [{ name: "Maged", lang: "ar-SA" }, { name: "Daniel", lang: "en-GB" }, { name: "Jenny Natural", lang: "en-US" }] });
  const p = b.speak("apple"); const err = b.players[0].onerror;
  err(); err();
  assert.equal(b.utterances.length, 1, "fallback runs once");
  assert.equal(b.utterances[0].voice.name, "Jenny Natural");
  assert.equal(b.utterances[0].lang, "en-US");
  b.utterances[0].onend(); assert.equal(await p, true);
  assert.equal(b.timers.size, 0);
});

test("a missing recording uses the device voice with question intonation", async () => {
  const b = browser(); const p = b.speak("where is the bank");
  assert.equal(b.players.length, 0);
  assert.equal(b.utterances[0].text, "Where is the bank?");
  b.utterances[0].onend(); assert.equal(await p, true);
});

test("device voices that arrive late are still used, then the listener is removed", async () => {
  const b = browser({ voices: [] }); const p = b.speak("new word", { slow: true });
  assert.equal(b.utterances.length, 0);
  b.synth.voices = [{ name: "Samantha", lang: "en-US" }];
  b.events.get("voiceschanged")();
  assert.equal(b.utterances[0].rate, 0.72);
  b.utterances[0].onend(); assert.equal(await p, true);
  assert.equal(b.events.size, 0);
});

test("an Arabic device voice is never used to teach English", async () => {
  const b = browser({ voices: [{ name: "Maged", lang: "ar-SA" }] });
  const p = b.speak("new word"); b.fireTimer();
  assert.equal(await p, false);
  assert.equal(b.utterances.length, 0);
  assert.equal(b.errors.length, 1);
});

test("blocked autoplay asks the learner to tap Listen and plays nothing else", async () => {
  const e = new Error("blocked"); e.name = "NotAllowedError";
  const b = browser({ playError: e });
  assert.equal(await b.speak("apple"), false);
  assert.match(b.errors[0], /اضغط زر الاستماع/);
  assert.equal(b.utterances.length, 0);
});

test("a late rejected play() cannot restart stopped speech", async () => {
  const b = browser({ playError: new Error("network") });
  const p = b.speak("apple"); b.N.stop();
  await Promise.resolve();
  assert.equal(await p, false);
  assert.equal(b.utterances.length, 0);
  assert.equal(b.errors.length, 0);
});

test("no audio and no speech API give a friendly error", async () => {
  const b = browser({ audio: false, speech: false });
  assert.equal(await b.speak("apple"), false);
  assert.equal(b.errors.length, 1);
});

test("text normalization removes hints, emoji, Arabic and blanks but keeps English punctuation", () => {
  assert.equal(NT.clean("It's (very) cold! 🥶 (بارد)"), "It's (very) cold!");
  assert.equal(NT.key("My brother is in ___ grade. (5)"), "my brother is in grade");
  assert.equal(NT.key("I ___ brush my teeth. (100%)".replace("___", "always")), "i always brush my teeth");
  assert.equal(NT.spoken("how old are you"), "How old are you?");
  assert.equal(NT.spoken("Do my homework", true), "Do my homework.", "vocabulary phrases are not questions");
  assert.equal(NT.spoken("could you help me"), "Could you help me?");
  assert.equal(NT.spoken("2 + 1 = three"), "2 plus 1 equals three.");
  assert.equal(NT.spoken('"I\'m happy." → She said she was happy.'), '"I\'m happy.". She said she was happy.');
  assert.equal(NT.key("close", "قريب"), "close::a");
  assert.equal(NT.key("Close", "أغلق"), "close::v");
  assert.equal(NT.key("Close the door."), "close the door", "sentences keep context instead of a sense key");
  assert.equal(NT.key("Hello!"), NT.key("hello"), "end punctuation does not change the recording");
});
