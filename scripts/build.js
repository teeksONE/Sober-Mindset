// Builds the site: src/pages/*.html (content + front matter) -> ./*.html
// Zero dependencies. Run with `npm run build`.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import config from "../src/site.config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "pages");

const esc = (s = "") =>
    String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ─── Load pages ──────────────────────────────────────
function parse(file) {
    const raw = readFileSync(join(SRC, file), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) throw new Error(`${file}: missing front matter`);
    const meta = {};
    for (const line of m[1].split("\n")) {
        if (!line.trim()) continue;
        const i = line.indexOf(":");
        if (i < 0) throw new Error(`${file}: bad front matter line "${line}"`);
        meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    if (!meta.title || !meta.description) throw new Error(`${file}: title and description are required`);
    return { slug: file.replace(/\.html$/, ""), meta, body: m[2] };
}

const pages = Object.fromEntries(
    readdirSync(SRC)
        .filter((f) => f.endsWith(".html"))
        .map((f) => parse(f))
        .map((p) => [p.slug, p]),
);

const page = (slug) => {
    if (!pages[slug]) throw new Error(`Unknown page "${slug}" referenced in site.config.js or a template tag`);
    return pages[slug];
};
const href = (slug) => (slug === "index" ? "index.html" : `${slug}.html`);

// ─── Reading order ───────────────────────────────────
const journey = ["path", ...config.stages.flatMap((s) => [s.slug, ...s.pages])];
const sequences = { ...config.sequences, path: { ...config.sequences.path, pages: journey } };

function locate(slug) {
    for (const [id, seq] of Object.entries(sequences)) {
        const i = seq.pages.indexOf(slug);
        if (i >= 0) return { id, seq, i };
    }
    return null;
}
const stageOf = (slug) => config.stages.find((s) => s.slug === slug || s.pages.includes(slug));

// ─── Fragments ───────────────────────────────────────
function header(p) {
    const links = config.nav
        .map((n) => `<a href="${n.href}"${n.section === p.meta.section ? ' aria-current="true"' : ""}>${n.label}</a>`)
        .join("\n            ");
    return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
    <div class="header-inner">
        <a class="brand" href="index.html" aria-label="${config.siteName} — home">
            <img src="resources/images/web/icon-192.png" alt="" width="40" height="40">
            <span>Sober Mindset</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
            <span class="nav-toggle-bars" aria-hidden="true"></span><span class="sr-only">Menu</span>
        </button>
        <nav class="site-nav" id="site-nav" aria-label="Main">
            ${links}
        </nav>
        <a class="help-btn" href="help.html">Help now</a>
    </div>
</header>`;
}

function stageRail(p) {
    const cur = stageOf(p.slug);
    if (!cur && p.slug !== "path") return "";
    const chips = config.stages
        .map(
            (s) =>
                `<li><a href="${href(s.slug)}"${cur && s.n === cur.n ? ' aria-current="step"' : ""}><span class="rail-n">${s.n}</span><span class="rail-name">${s.name}</span></a></li>`,
        )
        .join("");
    return `<nav class="stage-rail" aria-label="Stages of the path"><ol>${chips}</ol></nav>`;
}

function hero(p) {
    const st = stageOf(p.slug);
    let kicker = p.meta.kicker || "";
    if (!kicker && st) {
        const all = [st.slug, ...st.pages];
        kicker =
            p.slug === st.slug
                ? `Stage ${st.n} of 5 · ${st.name}`
                : `Stage ${st.n} · ${st.name} · ${all.indexOf(p.slug)} of ${st.pages.length}`;
    }
    const img = p.meta.heroImage
        ? `<img class="page-hero-img" src="resources/images/web/${p.meta.heroImage}" alt="">`
        : "";
    return `<section class="page-hero${p.meta.heroImage ? " has-image" : ""}">
    ${img}
    <div class="page-hero-inner">
        ${kicker ? `<p class="kicker">${kicker}</p>` : ""}
        <h1>${p.meta.title}</h1>
        ${p.meta.lede ? `<p class="hero-lede">${p.meta.lede}</p>` : ""}
        ${p.meta.quote ? `<blockquote class="hero-quote"><p>“${p.meta.quote}”</p>${p.meta.quoteAuthor ? `<cite>${p.meta.quoteAuthor}</cite>` : ""}</blockquote>` : ""}
    </div>
</section>`;
}

function pager(p) {
    if (p.meta.pager === "none") return "";
    const loc = locate(p.slug);
    if (!loc) return "";
    const { seq, i } = loc;
    const prev = i > 0 ? page(seq.pages[i - 1]) : null;
    const nextSlug = p.meta.next || seq.pages[i + 1] || seq.then;
    const next = nextSlug ? page(nextSlug) : null;
    const st = stageOf(p.slug);
    const nextStage = next ? stageOf(next.slug) : null;
    let nextLabel = "Next";
    if (!seq.pages[i + 1] && !p.meta.next) nextLabel = "Where to next";
    else if (nextStage && st && nextStage.n !== st.n) nextLabel = `Next stage · ${nextStage.name}`;
    else if (nextStage && next.slug === nextStage.slug) nextLabel = `Stage ${nextStage.n} of 5`;
    return `<nav class="pager" aria-label="Continue reading">
    ${prev ? `<a class="pager-prev" href="${href(prev.slug)}"><span class="pager-label">Back</span><span class="pager-title">${prev.meta.nav || prev.meta.title}</span></a>` : "<span></span>"}
    ${next ? `<a class="pager-next" href="${href(next.slug)}"><span class="pager-label">${nextLabel}</span><span class="pager-title">${next.meta.nav || next.meta.title}</span>${p.meta.nextWhy ? `<span class="pager-why">${p.meta.nextWhy}</span>` : ""}</a>` : ""}
</nav>`;
}

function cardList(slugs, numbered = false) {
    return `<ol class="step-list${numbered ? " numbered" : ""}">
${slugs
    .map((s) => page(s))
    .map(
        (q) =>
            `    <li><a class="step-card" href="${href(q.slug)}"><span class="step-card-title">${q.meta.nav || q.meta.title}</span><span class="step-card-text">${q.meta.card || q.meta.description}</span><span class="step-card-go" aria-hidden="true">→</span></a></li>`,
    )
    .join("\n")}
</ol>`;
}

function pathOverview() {
    return config.stages
        .map((s) => {
            const hub = page(s.slug);
            return `<section class="stage-block" id="stage-${s.n}">
    <div class="stage-block-head">
        <span class="stage-num">${s.n}</span>
        <div>
            <p class="kicker">Stage ${s.n} · ${s.name}</p>
            <h2><a href="${href(s.slug)}">${hub.meta.title}</a></h2>
            <p>${hub.meta.card || hub.meta.description}</p>
        </div>
    </div>
    ${cardList(s.pages)}
</section>`;
        })
        .join("\n");
}

function stageCards() {
    return `<ol class="stage-cards">
${config.stages
    .map((s) => {
        const hub = page(s.slug);
        return `    <li><a href="${href(s.slug)}"><span class="stage-num">${s.n}</span><span class="stage-card-title">${hub.meta.ask || hub.meta.title}</span><span class="stage-card-text">${hub.meta.card || hub.meta.description}</span></a></li>`;
    })
    .join("\n")}
</ol>`;
}

function expand(p) {
    return p.body
        .replace(/\{\{stage-pages\}\}/g, () => cardList(stageOf(p.slug).pages, true))
        .replace(/\{\{sequence-pages:(\w+)\}\}/g, (_, id) => cardList(sequences[id].pages.slice(1)))
        .replace(/\{\{path-overview\}\}/g, pathOverview)
        .replace(/\{\{stage-cards\}\}/g, stageCards)
        .replace(/\{\{years-sober\}\}/g, () => {
            const d = new Date(config.soberDate);
            const now = new Date();
            let y = now.getFullYear() - d.getFullYear();
            if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) y--;
            return `<span data-years-since="${config.soberDate}">${y}</span>`;
        });
}

function footer() {
    const col = (title, links) =>
        `<div><h2>${title}</h2><ul>${links.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>`;
    return `<footer class="site-footer">
    <div class="footer-help">
        <p><strong>In crisis right now?</strong> You don't have to get through tonight alone.</p>
        <a class="btn btn-accent" href="help.html">Find a helpline</a>
    </div>
    <div class="footer-cols">
        ${col("The Path", config.stages.map((s) => [`${s.n}. ${s.name}`, href(s.slug)]))}
        ${col("Tools", sequences.tools.pages.slice(1).map((s) => [page(s).meta.nav || page(s).meta.title, href(s)]))}
        ${col("Community", [...sequences.community.pages.slice(1).map((s) => [page(s).meta.nav || page(s).meta.title, href(s)])])}
        ${col("More", [
            ["First Summer programme", "first-summer.html"],
            ["The science", "science.html"],
            ["Daily reflection", "daily.html"],
            ["About", "about.html"],
            ["Contact", "about.html#contact"],
            ["Help now", "help.html"],
        ])}
    </div>
    <div class="footer-base">
        <p>Sober Mindset &copy; <span data-year>2026</span> — One day at a time.</p>
        <p class="footer-disclaimer">This site shares lived experience and published research. It is not medical advice and is not a substitute for a doctor or counsellor. Not affiliated with Alcoholics Anonymous World Services or any other organisation mentioned.</p>
    </div>
</footer>`;
}

function jsonLd(p, canonical) {
    const items = [];
    if (p.slug === "index") {
        items.push({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: config.siteName,
            url: config.siteUrl,
            description: p.meta.description,
        });
    } else {
        const crumbs = [{ name: "Home", url: config.siteUrl }];
        const loc = locate(p.slug);
        if (loc && loc.seq.pages[0] !== p.slug) {
            const hub = page(loc.seq.pages[0]);
            crumbs.push({ name: hub.meta.nav || hub.meta.title, url: config.siteUrl + href(hub.slug) });
        }
        const st = stageOf(p.slug);
        if (st && st.slug !== p.slug) {
            const hub = page(st.slug);
            crumbs.push({ name: hub.meta.nav || hub.meta.title, url: config.siteUrl + href(hub.slug) });
        }
        crumbs.push({ name: p.meta.nav || p.meta.title, url: canonical });
        items.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
        });
        items.push({
            "@context": "https://schema.org",
            "@type": p.meta.schema || "Article",
            headline: p.meta.title,
            description: p.meta.description,
            url: canonical,
            image: config.siteUrl + "resources/images/web/" + (p.meta.heroImage || "lao-road.jpg"),
            publisher: { "@type": "Organization", name: config.siteName, url: config.siteUrl },
        });
    }
    return items.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n    ");
}

function render(p) {
    const canonical = config.siteUrl + (p.slug === "index" ? "" : href(p.slug));
    const title = p.slug === "index" ? p.meta.seoTitle || p.meta.title : `${p.meta.seoTitle || p.meta.title} — ${config.siteName}`;
    const ogImage = config.siteUrl + "resources/images/web/" + (p.meta.heroImage || "lao-road.jpg");
    const custom = p.meta.layout === "custom";
    return `<!DOCTYPE html>
<!-- GENERATED FILE — do not edit. Edit src/pages/${p.slug}.html and run: npm run build -->
<html lang="en-AU">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(p.meta.description)}">
    <link rel="canonical" href="${canonical}">
    <meta name="theme-color" content="#56704f">
    <link rel="icon" type="image/png" href="resources/images/web/icon-192.png">
    <link rel="apple-touch-icon" href="resources/images/web/icon-192.png">
    <meta property="og:site_name" content="${config.siteName}">
    <meta property="og:title" content="${esc(p.meta.seoTitle || p.meta.title)}">
    <meta property="og:description" content="${esc(p.meta.description)}">
    <meta property="og:type" content="${p.slug === "index" ? "website" : "article"}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${ogImage}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="resources/css/index.css">
    ${jsonLd(p, canonical)}
</head>
<body class="section-${p.meta.section || "home"} page-${p.slug}">
${header(p)}
${stageRail(p)}
<main id="main">
${custom ? "" : hero(p)}
${expand(p)}
${pager(p)}
</main>
${footer()}
<script src="resources/js/config.js"></script>
<script src="resources/js/site.js"></script>
${p.meta.script ? `<script src="resources/js/${p.meta.script}"></script>` : ""}
</body>
</html>
`;
}

// ─── Write ───────────────────────────────────────────
const problems = [];
for (const p of Object.values(pages)) {
    const html = render(p);
    for (const m of html.matchAll(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g)) {
        if (!pages[m[1]]) problems.push(`${p.slug}: link to missing page ${m[1]}.html`);
    }
    for (const m of html.matchAll(/(?:src|href)="(resources\/[^"]+)"/g)) {
        if (!existsSync(join(ROOT, m[1]))) problems.push(`${p.slug}: missing file ${m[1]}`);
    }
    writeFileSync(join(ROOT, href(p.slug)), html);
}

const inAnySequence = new Set(Object.values(sequences).flatMap((s) => s.pages));
const today = new Date().toISOString().slice(0, 10);
const urls = Object.values(pages)
    .map((p) => {
        const pr = p.slug === "index" ? "1.0" : inAnySequence.has(p.slug) ? "0.8" : "0.6";
        return `  <url><loc>${config.siteUrl}${p.slug === "index" ? "" : href(p.slug)}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`;
    })
    .join("\n");
writeFileSync(
    join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}sitemap.xml\n`);

console.log(`Built ${Object.keys(pages).length} pages + sitemap.xml + robots.txt`);
if (problems.length) {
    console.error("\nProblems:\n" + [...new Set(problems)].map((s) => "  - " + s).join("\n"));
    process.exit(1);
}
