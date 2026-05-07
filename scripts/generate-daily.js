import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DAILY_DIR = join(ROOT, "daily");

const client = new Anthropic();

const today = new Date();
const yyyy = today.getUTCFullYear();
const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
const dd = String(today.getUTCDate()).padStart(2, "0");
const dateISO = `${yyyy}-${mm}-${dd}`;
const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
});

const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
        reflection: {
            type: "object",
            additionalProperties: false,
            properties: {
                theme: { type: "string" },
                quote: { type: "string" },
                quoteAuthor: { type: "string" },
                reading: { type: "string" },
                meditation: { type: "string" },
            },
            required: ["theme", "quote", "quoteAuthor", "reading", "meditation"],
        },
        affirmations: {
            type: "array",
            items: { type: "string" },
        },
        gratitude: {
            type: "object",
            additionalProperties: false,
            properties: {
                prayer: { type: "string" },
                closing: { type: "string" },
            },
            required: ["prayer", "closing"],
        },
    },
    required: ["reflection", "affirmations", "gratitude"],
};

const systemPrompt = `You write daily content for a sobriety wellness site called "Sober Mindset".

VOICE: The site is written from the perspective of someone 11 years sober (got sober Nov 12, 2014, at age 29). They got sober through AA and credit AA's principles for the foundation — fellowship, honesty, gratitude, one day at a time. They now write for the version of themselves that was 22 and convinced sobriety meant a smaller life. Their lived sobriety includes ski seasons in Whistler, skydiving, hunting, travel, real friendships — the full life they couldn't access drunk.

AUDIENCE: Skews 20s–30s. People who think sobriety means church basements, decaf, and giving up on fun. The job is to speak to them as someone who has been there, not as a wellness influencer or a pamphlet.

TONE: Warm, grounded, honest, never preachy. Avoid clichés and toxic positivity. AA principles (gratitude, presence, willingness, one day at a time) belong here — they're part of the foundation. But don't write like AA literature. Write like someone who has lived it talking to someone who hasn't yet.`;

const userPrompt = `Today is ${dateLabel}. Generate today's daily content.

Reflection — a daily reading appropriate to this time of year. Drawing on AA principles is fine when it fits, but feel free to pull from literature, philosophy, athletes/writers/thinkers who have spoken about presence, agency, or building a life worth showing up for. The "reading" should be 180–260 words across 2–3 paragraphs. Themes can include: showing up for the small ordinary things, the life sobriety makes possible, agency over reaction, presence, building habits, the work of becoming someone you can live with. Avoid AA copyrighted text directly. The "quote" should be from a real source — literature, philosophy, athletes, writers — not generic.

Affirmations — exactly three. Grounded, specific to recovery — not generic positivity. First-person ("I am...", "Today I..."). Lean toward agency, capability, presence, and the life that's actually possible — not just self-soothing.

Gratitude — a short reflection of gratitude (2–4 sentences) appropriate for someone in sobriety. Can be in the AA gratitude tradition (acknowledging struggle, the gift of another day, small ordinary blessings) but does not need explicit religious framing. Followed by a brief closing line.`;

const message = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    system: systemPrompt,
    output_config: {
        format: { type: "json_schema", schema },
    },
    messages: [{ role: "user", content: userPrompt }],
});

const textBlock = message.content.find((b) => b.type === "text");
if (!textBlock) {
    throw new Error("No text block in response");
}
const data = JSON.parse(textBlock.text);

const out = {
    date: dateISO,
    generatedAt: new Date().toISOString(),
    ...data,
};

mkdirSync(DAILY_DIR, { recursive: true });
writeFileSync(join(DAILY_DIR, "today.json"), JSON.stringify(out, null, 2) + "\n");
writeFileSync(join(DAILY_DIR, `${dateISO}.json`), JSON.stringify(out, null, 2) + "\n");

console.log(`Daily content written for ${dateISO}`);
console.log(
    `Tokens: ${message.usage.input_tokens} in, ${message.usage.output_tokens} out`,
);
