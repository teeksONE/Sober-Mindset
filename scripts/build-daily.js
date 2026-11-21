// Turns approved daily readings into JSON for the site. Run with `npm run build-daily`.
//   daily/01.json … daily/12.json   approved entries, keyed by MM-DD
//   daily/affirmations.json         the numbered affirmation pool
//   daily/fallback.json             shown for any date that is not approved yet

import { mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { OUT, loadEntries, loadFallback, loadAffirmations } from "./daily-lib.js";

const shape = (e) => ({ title: e.title, reading: e.reading, gratitude: e.gratitude, affirmations: e.affirmations });
const write = (name, data) => writeFileSync(join(OUT, name), JSON.stringify(data, null, 1) + "\n");

mkdirSync(OUT, { recursive: true });
// Clear previous output so an entry moved back to draft does not linger.
for (const f of readdirSync(OUT)) if (/^(\d\d|affirmations|fallback)\.json$/.test(f)) rmSync(join(OUT, f));

const months = {};
for (let m = 1; m <= 12; m++) months[String(m).padStart(2, "0")] = {};
let approved = 0;
for (const e of loadEntries()) {
    if (e.status !== "approved") continue;
    months[e.id.slice(0, 2)][e.id] = shape(e);
    approved++;
}
for (const [mm, entries] of Object.entries(months)) write(`${mm}.json`, entries);

write("affirmations.json", loadAffirmations().affirmations);
write("fallback.json", shape(loadFallback()));

console.log(`Daily: published ${approved} approved entries (${366 - approved} dates will show the fallback)`);
