# UiEdge — Portfolio Deck: Build Brief for VS Code AI

Replace every `⟦PLACEHOLDER⟧` with real content before sharing with a client.

---

# PART A — CONTEXT PROMPT (paste at the top of your AI session)

> You are helping build a **client-facing portfolio deck** for **UiEdge**. Read this carefully — it defines who UiEdge is, how it must sound, and how it must look. Do not deviate from these rules.

**Who UiEdge is**
UiEdge is a **strategy-first digital product studio** based in Kozhikode, Kerala, India (uiedge.in). It is **not a design agency** — never use that phrase. UiEdge designs _and builds_ websites, apps, and SaaS products, and also ships **its own software products** (a veterinary management platform and a POS system). That hybrid — client work plus owned products — is the core differentiator. Its industry classification is **Software Development**, not Design Services.

**Core belief:** _Design is business strategy._ Every engagement starts from business goals, user psychology, and scalability, and targets measurable outcomes (conversions, adoption, efficiency, brand perception). Lead with the client's outcome, never with tools or aesthetics.

**Brand name spelling (strict):** always **UiEdge**. Never UIEdge, uiEdge, UIedge, or Uiedge.

**Voice (apply to all copy):**

- Professional, not corporate
- Confident, not arrogant
- Educational, not complicated
- Premium, not expensive-sounding
- Friendly, not casual
- Insightful — **no buzzwords, no generic agency clichés** ("we're passionate about pixels", "we bring your vision to life", "synergy", etc. are banned)

**Contact / links (use these exactly):**

- Email: `admin@uiedge.in`
- Website: `uiedge.in`
- LinkedIn: `linkedin.com/company/uiedge`
- Instagram: `uiedge.in`

**Design system (match the live site — read the real tokens, don't guess):**

- **Type:** Space Grotesk for display/headings, JetBrains Mono for labels/eyebrows/metrics/code-feel accents. If the live site already defines these, reuse the exact font setup.
- **Aesthetic:** minimal, modern, clean. Generous whitespace. Strict grid — everything aligns. Tight, accessible colour palette (pull the exact hex values from the site's CSS/Tailwind config). Meaningful micro-interactions only (subtle hover, fade-up on slide enter) — never decorative animation for its own sake.
- **One story per screen.** Don't cram. Let each slide breathe.
- The deck's own polish **is a work sample.** Sloppy spacing or misalignment discredits the whole pitch. Treat it as a flagship UI.

**The job of the deck:** a client who reads it should feel UiEdge is (a) a real product company, (b) strategic and safe to bet on, and (c) premium. Depth and thinking beat volume — UiEdge is early-stage, so we win on how we present, not how much.

---

# PART B — TECHNICAL SPEC (the deck mechanics + download button)

**Format:** a set of full-viewport **16:9 slides** (like PowerPoint), stacked vertically with CSS scroll-snap, plus optional left/right arrow keys and on-screen prev/next controls. A fixed **"Download deck (PDF)"** button sits bottom-right; clicking it exports **all slides** into a single multi-page PDF.

### Folder structure

```
/portfolio            (or /deck)
  index.(html|jsx|astro)   ← the deck page
  slides/                  ← one component/section per slide (Slide01 … Slide16)
  deck.css                 ← slide + print rules (or Tailwind classes)
  assets/                  ← images, mockups, logos, screenshots
  lib/exportPdf.(js|ts)    ← the download-all logic
```

### Slide sizing rules

- Every slide is a fixed **1280×720** canvas (16:9), centered, with `aspect-ratio: 16/9`. On small screens, scale the slide down to fit width (`transform: scale()` or `clamp()` type sizing) — never let content reflow unpredictably, because it must export cleanly.
- Use `scroll-snap-type: y mandatory` on the container and `scroll-snap-align: start` on each slide.
- Consistent inner padding (e.g. 64–80px). Same margins on every slide.

### Slide skeleton (repeat for each)

Every slide shares a layout system:

- **Eyebrow** (JetBrains Mono, uppercase, letter-spaced, small) — e.g. `01 / ABOUT`
- **Headline** (Space Grotesk, large)
- **Body / content zone** (grid)
- **Footer strip** on every slide: tiny `uiedge.in` left, `admin@uiedge.in` center, slide number right.

### The download button (export all slides → one PDF)

Use **html2canvas + jsPDF** (most reliable for pixel-faithful slides). CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

Export logic (adapt to your framework):

```js
async function downloadDeck() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280, 720],
  });
  const slides = document.querySelectorAll(".slide");
  for (let i = 0; i < slides.length; i++) {
    const canvas = await html2canvas(slides[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const img = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage([1280, 720], "landscape");
    pdf.addImage(img, "PNG", 0, 0, 1280, 720);
  }
  pdf.save("UiEdge-Portfolio-2026.pdf");
}
```

**Notes for the AI:**

- Set `useCORS: true` and host images locally (in `assets/`) so html2canvas can capture them. Remote hotlinked images may render blank.
- Temporarily force all slides to full opacity/visible before capture if you use fade-in-on-scroll animations, then restore.
- Show a small "Preparing PDF…" state while it runs.
- Also add a `@media print` fallback so `Ctrl/Cmd+P → Save as PDF` produces clean one-slide-per-page output (each slide `break-after: page`).

### Alternative (only if a .pptx file is explicitly needed)

Use **PptxGenJS** to emit a real editable `.pptx`. Heavier to build; only do this if a client asks for an editable PowerPoint. Default to the PDF path above.

---

# PART C — PAGE-BY-PAGE MANIFEST (content + images per slide)

_16 slides. Each slide lists: purpose, exact content to include, and the image(s) to source. `⟦…⟧` = you fill in with real data before sending._

> **Image sourcing rules (read once, apply everywhere):**
>
> - **Best images = your real work.** Your two real websites and your product UIs are the strongest assets. Screenshot them, drop into device mockups.
> - **Device mockups (free):** `shots.so`, `cleanmock.com`, `mockuphone.com`, `rotato.app`. Put website shots in a browser frame, app/product shots in phone or laptop frames. Never show a bare screenshot.
> - **Photos (free, royalty-free):** Unsplash (`unsplash.com`), Pexels (`pexels.com`). Download and store locally in `assets/`. Search terms are given per slide below.
> - **Illustrations (free):** `undraw.co` (recolour to your brand hex), `storyset.com`.
> - **Icons (free):** Lucide (`lucide.dev`) or Phosphor (`phosphoricons.com`) — one set only, matched to your line weight.
> - Compress every image (TinyPNG / squoosh) so the deck opens instantly and the PDF stays light.
> - Keep the palette tight — recolour illustrations/icons to your brand tokens so nothing clashes.

---

### Slide 01 — Cover / Hero

**Purpose:** first impression = premium product studio.
**Content:**

- UiEdge logo (top-left).
- Big headline: your positioning line — _"From Digitalization to Automation, We Build Around Your Vision."_
- Sub-line: _"A strategy-first digital product studio — we design and build websites, apps, and SaaS products where design is business strategy."_
- Small footer: `uiedge.in` · Kochi, India · 2026.
  **Images:** a clean abstract/gradient background OR a subtle grid/mesh matching the site. Optional: a faint device-mockup collage bleeding off the right edge.
  _Unsplash search:_ `minimal gradient dark`, `abstract mesh gradient`, `clean workspace macbook`.

---

### Slide 02 — About UiEdge

**Purpose:** establish identity + the hybrid differentiator.
**Content (3–4 sentences, from Part A):**

- Who you are + core belief (_design is business strategy_).
- The hybrid angle: you build client products **and** your own software (vet platform + POS). Say it plainly — this is your identity.
- 3 quick stat chips (JetBrains Mono): e.g. `⟦2⟧ owned products in build` · `⟦9⟧-step delivery process` · `Kochi → Pan-India → Gulf → Global`.
  **Images:** a team/office/founder photo if you have one (authentic > stock). If not, a clean brand-mark composition or an `undraw` illustration recoloured to brand.
  _Unsplash search:_ `design studio team working`, `startup office minimal`.

---

### Slide 03 — What We Do (services overview)

**Purpose:** show range without listing 40 things.
**Content:** a clean grid of **5–6 buckets**, each with an icon + one line:

1. **Product Strategy & Discovery** — UX audits, research, MVP scoping, roadmaps.
2. **UX / UI Design** — websites, mobile apps, SaaS dashboards, enterprise & admin UI, design systems.
3. **Web Design & Development** — sites, landing pages, e-commerce, web apps, performance & SEO.
4. **Mobile Apps** — iOS, Android, cross-platform, PWAs.
5. **Product & Engineering** — MVP builds, frontend, integrations, dev-handoff support.
6. **Branding & Growth** — identity, decks, and digital marketing retainers.
   **Images:** icons only (Lucide/Phosphor), one per bucket. No photos — keep it crisp.

---

### Slide 04 — Our Process (the 9 steps)

**Purpose:** prove you're a system, not a freelancer — quietly removes client risk.
**Content:** the 9 steps as a horizontal/numbered flow, each with a one-line **business value** (not just the activity):

1. **Discovery** — align on business goals before design.
2. **Research** — understand real users, not assumptions.
3. **Strategy** — decide what to build and why.
4. **Wireframing** — structure before style; cheaper to change early.
5. **UI Design** — premium, on-brand, conversion-focused screens.
6. **Prototype** — test the experience before code.
7. **Testing** — validate with real users, reduce risk.
8. **Dev Handoff** — clean specs so build matches design.
9. **Optimization** — measure and improve after launch.
   **Images:** none needed — a well-designed numbered flow _is_ the visual. Use connecting lines/dots and mono numerals.

---

### Slide 05 — Case Study 1 · Overview

**Purpose:** depth over volume. Lead with the **business problem**, not the visuals.
**Content (Part 3 arc):**

- **Context:** ⟦client, industry, where they were — 2–3 sentences⟧.
- **The challenge:** ⟦the real business problem — low conversions, looked untrustworthy, couldn't scale⟧.
- **The goal:** ⟦measurable success — more enquiries, faster load, clearer message⟧.
- **Our approach:** ⟦the key strategic decisions and why — nav simplified 9→5, structure, type/colour rationale tied to the goal⟧.
  **Images:** a wireframe → final progression, OR a before/after split. Add 1–2 annotation callouts (_"simplified nav 9→5 → faster decisions"_).

---

### Slide 06 — Case Study 1 · Solution & Outcome

**Content:**

- Full-scroll shot of the finished site inside a **browser mockup**.
- **Outcome:** hard metrics if you have them; otherwise qualitative — _"from an outdated, hard-to-trust site to a clean, fast, conversion-focused presence; loads in under 2s, fully responsive, accessible."_
- A 2–3 line **client testimonial** ⟦ask the client for this⟧.
  **Images:** browser-framed full-page screenshot (shots.so). Optional small mobile mockup beside it to show responsiveness.

---

### Slide 07 — Case Study 2 · Overview

Same structure as Slide 05, for your ⟦second real website⟧.

---

### Slide 08 — Case Study 2 · Solution & Outcome

Same structure as Slide 06, for the second project.

_(If you build 1–2 honest "Concept" redesigns later, add them here as extra slides labelled **Concept**.)_

---

### Slide 09 — Our Products · Veterinary Management Software

**Purpose:** the secret weapon — you ship real products, most studios don't.
**Content:**

- Product name + one-liner: ⟦what it does, who it's for — clinics/vets⟧.
- The problem it solves ⟦2–3 lines⟧.
- 3–4 key features as chips.
- A line that lands the point: _"We don't just design products — we build and run our own."_
  **Images:** product UI screenshots in a **laptop + phone mockup**. If UI isn't final, use polished high-fidelity Figma frames.
  _Illustration fallback:_ `storyset` "veterinary" / "dashboard", recoloured.

---

### Slide 10 — Our Products · POS System

Same structure as Slide 09, for the POS product.
**Content:** name, one-liner ⟦who it's for — retail/outlets⟧, problem, features, pricing model teaser (per-outlet subscription).
**Images:** POS UI in device mockups; optional a clean retail-counter photo.
_Unsplash search:_ `retail point of sale counter`, `cafe checkout tablet`.

---

### Slide 11 — Capabilities & Tools

**Purpose:** signal competence and range.
**Content:** grouped logos/labels:

- **Design:** Figma, design systems, prototyping.
- **Build:** ⟦your real stack — e.g. Astro, Next.js, React, Tailwind⟧.
- **Platforms:** Web · iOS · Android · SaaS dashboards · Enterprise/CRM/ERP.
- **Handoff & quality:** specs, accessibility (WCAG), performance.
  **Images:** greyscale tool logos in a tidy row (Figma, React, etc.), or clean labelled chips. Keep monochrome so it stays premium.

---

### Slide 12 — Why UiEdge (differentiators)

**Purpose:** the persuasion core. 4–6 sharp reasons.
**Content:**

- **We build our own products** — we think in products and outcomes, not deliverables.
- **Strategy first** — design tied to business goals and measurable results.
- **A real, proven process** — defined milestones, transparent pricing, clear revisions.
- **Premium craft** — this deck is the proof.
- **Fast, clear communication** — responsiveness in sales = responsiveness in delivery.
- **Honest scarcity** — a limited number of projects each month to protect quality.
  **Images:** icon per reason (Lucide). No photos.

---

### Slide 13 — Social Proof

**Purpose:** the single biggest deal-mover.
**Content:** 1–3 testimonials (real, from your 4–5 clients) + client logos if allowed. If thin now, keep the slide clean with one strong quote and leave tasteful space to grow — never fake it.
**Images:** client logos (greyscale). Optional small avatar per testimonial.

---

### Slide 14 — How We Work Together (engagement + pricing)

**Purpose:** filter tyre-kickers, feel safe and transparent.
**Content:** good/better/best framing with **"starting from"** ranges (₹):

- **Business Website** — from ₹60,000.
- **Premium / Custom Website** — from ₹1,25,000.
- **Mobile App Design (MVP)** — from ₹90,000.
- **SaaS Dashboard / Web App** — from ₹1,50,000.
- **Care Plan (monthly)** — from ₹8,000/mo.
- Note: _"40–50% advance, milestone-based. Final scope after a free discovery call."_
- **Bundling line:** _"Business Website ₹75,000 + Care Plan ₹12,000/month."_
  **Images:** none — a clean pricing table is the visual. Highlight the middle tier ("Most popular").

---

### Slide 15 — Our Reach / Industries (optional but strong)

**Purpose:** show you understand many worlds.
**Content:** industries served as chips — HealthTech, FinTech, Education, SaaS, Enterprise, Real Estate, Retail, Logistics, AI, Startups — and target markets: Kerala → Pan-India → Gulf → Global.
**Images:** a subtle map graphic or industry-icon grid.

---

### Slide 16 — Contact / CTA

**Purpose:** one easy next step.
**Content:**

- Big line: _"Let's build something worth betting on."_
- **Single CTA:** _"Book a free 30-minute strategy call."_
- `admin@uiedge.in` · `uiedge.in` · `linkedin.com/company/uiedge` · Instagram `uiedge.in`.
- The **Download deck (PDF)** button lives here too (plus its fixed bottom-right instance).
  **Images:** clean brand-mark close, or a faint version of the cover background for bookending.

---

# BUILD CHECKLIST (give this to the AI as the definition of done)

- [ ] Deck lives at `/portfolio`, inherits the site's real fonts + colour tokens (read them, don't invent).
- [ ] 16 fixed 1280×720 slides, scroll-snap, arrow-key + on-screen navigation.
- [ ] Consistent eyebrow / headline / footer system on every slide.
- [ ] Every image stored locally in `assets/`, compressed, in a device mockup where relevant.
- [ ] Real content replaces every `⟦PLACEHOLDER⟧` (no lorem ipsum in the shared version).
- [ ] "Download deck (PDF)" button exports all 16 slides into one landscape PDF via html2canvas + jsPDF.
- [ ] `@media print` fallback gives clean one-slide-per-page PDF via browser print.
- [ ] Mobile: slides scale to fit width without breaking layout.
- [ ] Brand name renders as **UiEdge** everywhere; the phrase "design agency" appears nowhere.
- [ ] Micro-interactions are subtle (fade-up on enter, gentle hover) and disabled/forced-visible during PDF capture.

---

_Reminder: the deck's polish is itself the pitch. If your own materials are flawless, the client trusts you with theirs. Put your strongest case study first — attention is highest on slide one after the cover._
