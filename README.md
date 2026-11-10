# Sober Mindset

**Veni Vidi Vici**
*I came. I saw. I conquered.*

---

## Overview

Sober Mindset is a simple, focused web experience designed to support individuals on their journey toward sobriety.

The goal of this project is to provide clarity, motivation, and practical tools for people who want to build a better, more present life.

This is not just a website — it’s a starting point.

---

## Purpose

Many people struggle silently with alcohol or substance use.
This project aims to:

* Provide encouragement and perspective
* Offer simple, actionable steps toward sobriety
* Create a calm, structured space for reflection and growth
* Make support more accessible

---

## What's on the site

* **The Path** — recovery in five stages (Question, First days, Find your people, Rebuild, Live big). Each stage has a hub page and short pages in reading order, with a "next step" link at the bottom of every page.
* **Tools** — Sober Counter, Urge Surf (craving timer), Daily Check-In, Crew Card (relapse prevention plan), and an AUDIT-C self-check. Everything is stored in the visitor's browser only.
* **Community** — Find Your Room quiz, Find Your Crew directory, Crew Pact (a shareable challenge link), Stories, and a page for families.
* **First Summer** — a 12-week adventure-sport programme for school leavers: the idea, the science, a sport-matching quiz, a sports menu, a week-by-week tracker and a page for schools, parents and clubs.
* **Science** — every research claim on the site with its source.
* **Daily** — reflection, affirmations and gratitude, generated each morning by `scripts/generate-daily.js` (GitHub Action).
* **Help now** — crisis and helpline numbers by country.

---

## How to edit the site

Pages are **generated**. Do not edit the `.html` files in the project root; they are overwritten on every build.

1. Edit the page content in `src/pages/<page>.html`. The block between the `---` lines at the top sets the title, description and so on.
2. Run `npm run build`.
3. Open `index.html`, or run `python3 -m http.server` and visit `http://localhost:8000` (the daily content needs a server).

Other files worth knowing:

| File | What it controls |
| --- | --- |
| `src/site.config.js` | Site address, menu, the stages and the order of pages within them |
| `scripts/build.js` | The page template (header, footer, stage rail, next/back links), `sitemap.xml`, `robots.txt` |
| `resources/css/index.css` | All styling |
| `resources/js/config.js` | Form endpoints and the community chat link (features stay hidden until these are filled in) |
| `resources/js/*.js` | One script per tool |
| `resources/images/web/` | Web-sized copies of the photos. Originals stay in `resources/images/` |

To add a page: create `src/pages/my-page.html` with front matter, add its name to a stage or sequence in `src/site.config.js`, and build. The build fails with a clear message if a link points to a page that does not exist.

---

## Tech Stack

* HTML, CSS and plain JavaScript. No framework and no dependencies.
* A small Node build script (Node 18+).

---

## Vision

Sobriety is not the end of something.
It’s the beginning of everything.

---

## Disclaimer

This project is not a replacement for professional medical or psychological help.
If you are struggling seek support from qualified professionals or trusted organizations.

---

## Author

Created by **teeksONE**

---
