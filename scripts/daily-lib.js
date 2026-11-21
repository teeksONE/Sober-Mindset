// Shared reader for the daily readings in content/daily/.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT = join(ROOT, "content", "daily");
export const OUT = join(ROOT, "daily");

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const ALL_DATES = DAYS_IN_MONTH.flatMap((n, m) =>
    Array.from({ length: n }, (_, d) => `${String(m + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`),
);

// Splits a month file into entries. Tolerant of missing blank lines, so a
// hand edit does not silently drop an entry; missing fields come back empty
// and are reported by check-daily.
export function parseEntries(file) {
    const text = readFileSync(join(CONTENT, file), "utf8").replace(/\r\n/g, "\n");
    const entries = [];
    const heads = [...text.matchAll(/^## (\S+) · (.*)$/gm)];
    heads.forEach((h, i) => {
        const block = text.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : text.length);
        const status = (block.match(/^status:\s*(\S+)\s*$/m) || [])[1] || "";
        const grat = (block.match(/^\*\*Gratitude:\*\*\s*(.*)$/m) || [])[1] || "";
        const affLine = (block.match(/^\*\*Affirmations:\*\*\s*(.*)$/m) || [])[1] || "";
        const reading = block
            .replace(/^status:.*$/m, "")
            .replace(/^\*\*Gratitude:\*\*.*$/m, "")
            .replace(/^\*\*Affirmations:\*\*.*$/m, "")
            .split(/\n\s*\n/)
            .map((p) => p.replace(/\s+/g, " ").trim())
            .filter(Boolean);
        entries.push({
            id: h[1],
            title: h[2].trim(),
            status,
            reading,
            gratitude: grat.trim(),
            affirmations: affLine.split(",").map((s) => s.trim()).filter(Boolean).map(Number),
            file,
        });
    });
    return entries;
}

export function monthFiles() {
    return readdirSync(CONTENT).filter((f) => /^\d\d-[a-z]+\.md$/.test(f)).sort();
}

export function loadEntries() {
    return monthFiles().flatMap(parseEntries);
}

export function loadFallback() {
    return parseEntries("fallback.md")[0];
}

// Numbered lines in affirmations.md: "12. Text of the affirmation. *(Topic)*"
export function loadAffirmations() {
    const text = readFileSync(join(CONTENT, "affirmations.md"), "utf8");
    const out = {};
    const dupes = [];
    for (const m of text.matchAll(/^(\d+)\. (.+?)(?: \*\(.*\)\*)?\s*$/gm)) {
        if (out[m[1]]) dupes.push(m[1]);
        out[m[1]] = m[2].trim();
    }
    return { affirmations: out, dupes };
}
