// Checks the daily readings in content/daily/. Run with `npm run check-daily`.
// Errors stop the build. Flags are things for a person to look at.

import { ALL_DATES, loadEntries, loadFallback, loadAffirmations } from "./daily-lib.js";

const WORDS_MIN = 80;
const WORDS_MAX = 120;
const OVERLAP_FLAG = 0.38; // share of the shorter reading's distinctive words also found in the other

const errors = [];
const flags = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const flag = (id, msg) => flags.push(`${id}: ${msg}`);

const entries = loadEntries();
const fallback = loadFallback();
const { affirmations, dupes } = loadAffirmations();
const affCount = Object.keys(affirmations).length;

// ─── Dates: 366, no gaps, no repeats, right file ─────
const byDate = new Map();
for (const e of entries) {
    if (!ALL_DATES.includes(e.id)) err(e.id, `not a valid MM-DD date (in ${e.file})`);
    else if (byDate.has(e.id)) err(e.id, `appears twice (${byDate.get(e.id).file} and ${e.file})`);
    else byDate.set(e.id, e);
    if (e.id.slice(0, 2) !== e.file.slice(0, 2)) err(e.id, `is in the wrong month file (${e.file})`);
}
for (const d of ALL_DATES) if (!byDate.has(d)) err(d, "has no entry");

// ─── Affirmation pool ────────────────────────────────
for (const n of dupes) err(`affirmation ${n}`, "number is used twice in affirmations.md");
for (const [n, text] of Object.entries(affirmations)) {
    if ((text.match(/[.!?](\s|$)/g) || []).length !== 1) flag(`affirmation ${n}`, "is not a single sentence");
    if (/—/.test(text)) flag(`affirmation ${n}`, "contains an em dash");
    if (/\bactually\b/i.test(text)) flag(`affirmation ${n}`, 'contains "actually"');
}

// ─── Voice rules (flags) ─────────────────────────────
// [pattern, label, applies to gratitude line as well as reading]
const BANNED = [
    [/—/g, "em dash", true],
    [/\bactually\b/gi, 'the word "actually"', true],
    [/\b(I|I'm|I've|I'll|I'd|my|me|mine|we|our|us)\b/g, "first person in the reading", false],
    [/[“”"]/g, "quotation marks", true],
    [/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|weekends|summer|winter|autumn|spring|rain|raining|rainy|sunny|snowing|heatwave)\b/gi, "weekday, season or weather", true],
    [/\b(god|pray|prayer|prayers|praying|blessed|blessing|blessings|faith|soul|higher power|amen)\b/gi, "religious language", true],
    [/(?:\bnot\b|n't)[^.?!]{0,70}[.,;]\s*(?:it|that|this|they|you)(?:'s|'re| is| are| only| need| needs)\b/gi, '"not X, it\'s Y" construction', false],
    [/(?:^|[.!?] )(?:[A-Za-z']+[.!?] ){2,}[A-Za-z']+[.!?]/g, "run of one-word sentences", false],
    [/keep coming back|one day at a time|easy does it|let go and let|it works if you work it|progress,? not perfection/gi, "recovery slogan", true],
];

function checkVoice(e) {
    const reading = e.reading.join(" ");
    for (const [re, label, both] of BANNED) {
        const text = both ? `${reading} ${e.gratitude}` : reading;
        for (const m of text.matchAll(re)) {
            const at = text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20).trim();
            flag(e.id, `${label}: "…${at}…"`);
        }
    }
}

// ─── Each entry: fields, lengths, affirmations ───────
function checkEntry(e) {
    if (!e.title) err(e.id, "has no title");
    if (!["draft", "approved"].includes(e.status)) err(e.id, `status must be "draft" or "approved" (found "${e.status}")`);
    if (!e.reading.length) err(e.id, "has no reading");
    else {
        const words = e.reading.join(" ").split(/\s+/).length;
        if (words < WORDS_MIN || words > WORDS_MAX) err(e.id, `reading is ${words} words (should be ${WORDS_MIN} to ${WORDS_MAX})`);
    }
    if (!e.gratitude) err(e.id, "has no gratitude line");
    else {
        if (!/^Today I'm grateful /.test(e.gratitude)) flag(e.id, 'gratitude line does not start "Today I\'m grateful"');
        const n = (e.gratitude.match(/[.!?](\s|$)/g) || []).length;
        if (n < 1 || n > 2) err(e.id, `gratitude line should be one or two sentences (found ${n})`);
    }
    if (e.affirmations.length !== 3) err(e.id, `needs exactly three affirmation numbers (found ${e.affirmations.length})`);
    for (const n of e.affirmations) if (!affirmations[n]) err(e.id, `affirmation ${n} does not exist`);
    if (new Set(e.affirmations).size !== e.affirmations.length) err(e.id, "repeats an affirmation within itself");
    checkVoice(e);
}
[...byDate.values()].forEach(checkEntry);
if (!fallback) errors.push("fallback.md: no fallback entry found");
else checkEntry(fallback);

// ─── Trios: no repeats, balanced use ─────────────────
const trios = new Map();
const uses = {};
for (const e of [...byDate.values(), ...(fallback ? [fallback] : [])]) {
    if (e.affirmations.length !== 3) continue;
    const key = [...e.affirmations].sort((a, b) => a - b).join(",");
    if (trios.has(key)) err(e.id, `has the same three affirmations as ${trios.get(key)}`);
    else trios.set(key, e.id);
    if (e.id !== "fallback") for (const n of e.affirmations) uses[n] = (uses[n] || 0) + 1;
}
const counts = Object.keys(affirmations).map((n) => uses[n] || 0);
const mean = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
const lo = Math.min(...counts);
const hi = Math.max(...counts);
for (const n of Object.keys(affirmations)) {
    const c = uses[n] || 0;
    if (Math.abs(c - mean) > 1.5) err(`affirmation ${n}`, `is used ${c} times; the average is ${mean.toFixed(1)}`);
}

// ─── Repeats across readings (flags) ─────────────────
const firstSentence = (e) => (e.reading.join(" ").split(/(?<=[.!?])\s/)[0] || "").toLowerCase();
function dupes_of(label, keyFn) {
    const seen = new Map();
    for (const e of byDate.values()) {
        const k = keyFn(e);
        if (!k) continue;
        if (seen.has(k)) flag(e.id, `${label} is the same as ${seen.get(k)}: "${k}"`);
        else seen.set(k, e.id);
    }
}
dupes_of("title", (e) => e.title.toLowerCase());
dupes_of("opening sentence", firstSentence);
dupes_of("gratitude line", (e) => e.gratitude.toLowerCase());

const STOP = new Set(
    "a an the and or of to in is it you your with for that on at as be can are when one what how from this by not do does have has was will than more own they them there their then if but so still day today sober drink drinking something someone may".split(" "),
);
const wordSet = (e) => new Set((e.reading.join(" ").toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length > 3 && !STOP.has(w)));
const list = [...byDate.values()].map((e) => [e, wordSet(e)]);
for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
        const [a, wa] = list[i];
        const [b, wb] = list[j];
        let shared = 0;
        for (const w of wa) if (wb.has(w)) shared++;
        const overlap = shared / Math.max(1, Math.min(wa.size, wb.size));
        if (overlap >= OVERLAP_FLAG) flag(a.id, `shares ${Math.round(overlap * 100)}% of its distinctive words with ${b.id} ("${a.title}" / "${b.title}")`);
    }
}

// ─── Report ──────────────────────────────────────────
const approved = [...byDate.values()].filter((e) => e.status === "approved").length;
const draft = [...byDate.values()].filter((e) => e.status === "draft").length;
console.log(`Daily readings: ${byDate.size} of 366 dates · ${approved} approved · ${draft} draft`);
console.log(`Affirmations: ${affCount} in the pool · each used ${lo === hi ? lo : `${lo} to ${hi}`} times · ${trios.size} different trios`);
if (fallback) console.log(`Fallback entry: ${fallback.status}`);
if (flags.length) console.log(`\nFlags to look at (${flags.length}):\n` + flags.map((f) => "  - " + f).join("\n"));
if (errors.length) {
    console.error(`\nErrors (${errors.length}):\n` + errors.map((e) => "  - " + e).join("\n"));
    process.exit(1);
}
console.log(flags.length ? "\nNo errors." : "No errors and no flags.");
