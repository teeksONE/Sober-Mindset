// Renders an Instagram card (1080 x 1350 PNG) and a caption file for each
// approved daily reading. Output goes to social/, which is not part of the site.
//
//   npm run cards               every approved date
//   npm run cards -- 11         one month (also: november)
//   npm run cards -- 11-12      one date (several dates or months can be listed)
//
// Uses the Chrome or Chromium already installed on this machine, driven over
// its DevTools connection. No packages to install. Set CHROME_PATH if the
// browser is somewhere unusual.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, CONTENT, ALL_DATES, loadEntries } from "./daily-lib.js";

const HANDLE = "@yoursobermindset";
const WIDTH = 1080;
const HEIGHT = 1350;
const FONT_MAX = 46; // px. The reading is set at the largest size that fits,
const FONT_MIN = 31; // and reported as a failure if it overflows at this size.
const OUT_CARDS = join(ROOT, "social", "cards");
const OUT_CAPTIONS = join(ROOT, "social", "captions");
const TEMPLATE = join(ROOT, "scripts", "cards", "template.html");

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// Two hashtags per theme, added to three that go on every post.
const BASE_TAGS = ["#sobriety", "#recovery", "#yoursobermindset"];
const THEME_TAGS = {
    "Starting": ["#sobercurious", "#dayone"],
    "Cravings": ["#cravings", "#urgesurfing"],
    "People": ["#sobercommunity", "#support"],
    "Body": ["#soberhealth", "#healing"],
    "Feelings": ["#mentalhealth", "#emotionalsobriety"],
    "Time": ["#soberlife", "#newhabits"],
    "Money and work": ["#soberliving", "#goals"],
    "Identity": ["#sobernotboring", "#selfrespect"],
    "Setbacks": ["#relapseprevention", "#keepgoing"],
    "Adventure": ["#soberadventures", "#getoutside"],
    "Giving back": ["#gratitude", "#givingback"],
    "Occasions": ["#alcoholfree", "#soberholidays"],
};
const DEFAULT_THEME = "Daily reading";
const DEFAULT_TAGS = ["#soberlife", "#alcoholfree"];

// The theme for each date comes from the Subject column of the plan.
function loadThemes() {
    const themes = {};
    const file = join(CONTENT, "plan.md");
    if (!existsSync(file)) return themes;
    const known = Object.keys(THEME_TAGS).join("|");
    for (const m of readFileSync(file, "utf8").matchAll(new RegExp(`^\\| (\\d\\d-\\d\\d) \\| (${known}) \\|`, "gm"))) themes[m[1]] = m[2];
    return themes;
}

const dayOfYear = (id) => ALL_DATES.indexOf(id) + 1; // leap-year numbering, so 02-29 is 60

// Captions are plain text: straight quotes, no dashes other than hyphens.
function plain(s) {
    return s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/\u2026/g, "...").replace(/\u00a0/g, " ");
}

function caption(entry, theme) {
    const tags = [...BASE_TAGS, ...(THEME_TAGS[theme] || DEFAULT_TAGS)];
    return [
        entry.reading.map(plain).join("\n\n"),
        "",
        "Today's reading, gratitude and affirmations: link in bio.",
        "",
        tags.join(" "),
        `ALT: Book-page card titled ${plain(entry.title)}. Full text in caption.`,
        "",
    ].join("\n");
}

// Which dates to render: everything approved, or only what the arguments name.
function wanted(args) {
    if (!args.length) return null;
    const dates = new Set();
    for (const raw of args) {
        const a = raw.toLowerCase();
        const monthIndex = MONTH_NAMES.findIndex((m) => m === a || m.slice(0, 3) === a);
        const mm = /^\d{1,2}$/.test(a) ? a.padStart(2, "0") : monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : null;
        if (/^\d\d-\d\d$/.test(a) && ALL_DATES.includes(a)) dates.add(a);
        else if (mm && ALL_DATES.some((d) => d.startsWith(mm + "-"))) ALL_DATES.filter((d) => d.startsWith(mm + "-")).forEach((d) => dates.add(d));
        else throw new Error(`"${raw}" is not a date (MM-DD) or a month (11 or november)`);
    }
    return dates;
}

// ─── Headless browser ────────────────────────────────
function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ].filter(Boolean);
    const found = candidates.find((p) => existsSync(p));
    if (!found) throw new Error("Could not find Chrome or Chromium. Set CHROME_PATH to the browser's location.");
    return found;
}

async function launch() {
    const profile = mkdtempSync(join(tmpdir(), "sm-cards-"));
    const proc = spawn(findChrome(), [
        "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
        "--hide-scrollbars", "--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check",
        "--disable-extensions", "--allow-file-access-from-files", "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });

    const wsUrl = await new Promise((resolve, reject) => {
        let buf = "";
        const timer = setTimeout(() => reject(new Error("The browser did not start within 20 seconds")), 20000);
        proc.stderr.on("data", (d) => {
            buf += d;
            const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
            if (m) { clearTimeout(timer); resolve(m[1]); }
        });
        proc.on("exit", (code) => { clearTimeout(timer); reject(new Error(`The browser exited early (code ${code})`)); });
    });

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error("Could not connect to the browser")); });
    let nextId = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (!msg.id || !pending.has(msg.id)) return;
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const close = () => {
        try { ws.close(); } catch { /* already closed */ }
        proc.kill();
        try { rmSync(profile, { recursive: true, force: true }); } catch { /* temp folder, safe to leave */ }
    };
    return { send, close };
}

async function evaluate(send, sessionId, expression) {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
}

// ─── Main ────────────────────────────────────────────
const only = wanted(process.argv.slice(2));
const themes = loadThemes();
const approved = loadEntries().filter((e) => e.status === "approved" && ALL_DATES.includes(e.id));
const entries = approved.filter((e) => !only || only.has(e.id));
if (only) {
    const skipped = [...only].filter((d) => !approved.some((e) => e.id === d));
    if (skipped.length) console.log(`Skipped (not approved): ${skipped.join(", ")}`);
}
if (!entries.length) { console.log("Nothing to render."); process.exit(0); }

mkdirSync(OUT_CARDS, { recursive: true });
mkdirSync(OUT_CAPTIONS, { recursive: true });

const browser = await launch();
const failed = [];
const sizes = [];
try {
    const { targetId } = await browser.send("Target.createTarget", { url: pathToFileURL(TEMPLATE).href });
    const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
    await browser.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false }, sessionId);
    await evaluate(browser.send, sessionId, `new Promise((r) => document.readyState === "complete" ? r() : addEventListener("load", () => r()))`);
    const fontsLoaded = await evaluate(browser.send, sessionId, `Promise.all(["500 20px 'Cormorant Garamond'", "600 20px 'Cormorant Garamond'", "italic 500 20px 'Cormorant Garamond'", "500 20px 'Jost'"].map((f) => document.fonts.load(f))).then((r) => r.every((faces) => faces.length > 0), () => false)`);
    if (!fontsLoaded) throw new Error("The card fonts did not load from scripts/cards/fonts/");

    for (const entry of entries) {
        const theme = themes[entry.id] || DEFAULT_THEME;
        const card = { theme, handle: HANDLE, title: entry.title, reading: entry.reading, page: dayOfYear(entry.id), maxSize: FONT_MAX, minSize: FONT_MIN };
        const result = await evaluate(browser.send, sessionId, `renderCard(${JSON.stringify(card)})`);
        if (!result.fits) {
            failed.push(`${entry.id} "${entry.title}" (${entry.reading.join(" ").split(/\s+/).length} words)`);
            continue; // never save a card with cut-off text
        }
        const shot = await browser.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } }, sessionId);
        writeFileSync(join(OUT_CARDS, `${entry.id}.png`), Buffer.from(shot.data, "base64"));
        writeFileSync(join(OUT_CAPTIONS, `${entry.id}.txt`), caption(entry, theme));
        sizes.push(result.size);
        console.log(`${entry.id}  page ${String(card.page).padStart(3)}  ${result.size}px  ${result.lines} lines  ${entry.title}`);
    }
} finally {
    browser.close();
}

console.log(`\nRendered ${sizes.length} of ${entries.length} cards to social/cards/ with captions in social/captions/`);
if (sizes.length) console.log(`Reading font size: ${Math.min(...sizes)}px to ${Math.max(...sizes)}px (allowed range ${FONT_MIN}px to ${FONT_MAX}px)`);
if (failed.length) {
    console.log(`\nDid not fit at the minimum size (${FONT_MIN}px), so no card was saved:\n` + failed.map((f) => "  - " + f).join("\n"));
    process.exitCode = 1;
}
