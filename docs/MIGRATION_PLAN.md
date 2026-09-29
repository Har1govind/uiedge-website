# Fabrica → Astro Migration Plan (Phase 1: Analysis & Architecture)

**Source of truth:** live site https://fabrica.framer.media/ (DOM/CSS captured to `reference/`)
**Theme decision (user):** dark theme matching `reference/UI_Image.png` (header `#141414`, dark sections)
**Layout decision (user):** match the current live site's header layout (inline nav + hamburger at all widths, no header CTA pill)
**Rules:** no redesign, no invented sections, no new dependencies, no React unless necessary.

---

## PART 1 — Live site analysis (all measurements taken Aug 2026)

### 1. Complete page structure (measured from live DOM)

```
header (Desktop/Phone variants)
└─ Top bar: logo + nav links + hamburger      (60px, overlays page top)
└─ Body: full-screen mobile menu overlay
main
├─ 1. Hero            (dark #0a0a0a, ~1267px @1440)
├─ 2. Projects        (grid of 6, dark)
├─ 3. Advantages      ("Why choose us", 2 stats, dark)
├─ 4. Services        (4 service cards, dark content)
├─ 5. Showreel        ("About us", 4 steps, video CTA, dark)
├─ 6. Testimonials    (4.9/5 rating, 3 cards + client logos, dark)
├─ 7. Text            (animated stat counters + approach copy, dark)
├─ 8. Bento           (case study metrics + chart, dark)
├─ 9. Pricing         (toggle, $2,490 card, dark)
├─ 10. Team           (4 members + "Apply now", white card container)
├─ 11. FAQ            (6 accordion items)
├─ 12. Blog           (2 posts + "See all")
├─ 13. Phone          (mobile-only section — verify at ≤809px)
footer
└─ Newsletter + Client Success Manager card + nav/social/legal
```

### 2. Header / navigation (measured)

| Property | Value |
|---|---|
| Height | 60px |
| Position | fixed overlay (wrapper), z-index high |
| Background (dark theme) | `#141414` + `backdrop-filter: blur(7px)` |
| Logo | "fabrica®" — Inter SemiBold 20px, letter-spacing `-0.04em`, line-height 110%, white |
| Inline nav (≥1200) | Studio · Projects**27** · Blog · Contact — Inter 600 16px, centered, white; "27" is a superscript |
| Right side | Hamburger button (≈59×22, two 2px lines) — **visible at all widths** |
| CTA pill | **None** in header (CTA lives in hero) |
| Mobile menu | Full-screen overlay; links 60px/600 (Home, Studio, Projects, Blog, Contact), `hello@fabrica.com`, team card, socials |

Layout: logo left · nav centered · hamburger right. Header padding `19px 36px` (desktop) / `19px 32px` (tablet) / `19px 20px` (mobile).

### 3. Hero (measured)

- Dark background `#0a0a0a`, hero height ~1267px @1440, content gap 110px.
- **Giant wordmark**: "fabrica" — Inter SemiBold, ~201px, `-0.06em`, line-height 120%, white; scales to container width (Framer *fit-text* via SVG foreignObject). A huge "®" (~908px) is layered, plus "Studio" (~51px) below-right, right-aligned.
- **Service pills** (right column, right-aligned): Branding and Identity · Social Media Marketing · Web Design and Development · SEO Optimization.
- **Bottom row**: H1 *"No generic websites. No empty marketing promises. Just tools and strategies that help your business grow and your brand shine."* — second sentence at `rgba(255,255,255,0.7)`. Below: "© 2025 fabrica® Studio".
- **CTA card** → `/contact`: white rounded card (radius 16px, inner image radius 12px, portrait 170×216), "Let's talk" label + "Team Lead at fabrica® / Lauren Thompson".
- Top 60px sits under the fixed header (hero starts at y=0; content has internal top offset).

### 4–15. Sections, spacing, containers (measured)

**Container system:** max-width `1520px`; page/section padding `36px` (≥1200) / `32px` (810–1199) / `20px` (≤809).
**Vertical rhythm:** section content gap 70px; Services & Pricing padding `200px` / `100px` (tablet) / `50px` (mobile); `main` gap 190px / 120px / 50px.
**Breakpoints (Framer):** `1200px` desktop, `810px` tablet, `809px` mobile.

| # | Section | Content (verbatim) | Key visuals |
|---|---|---|---|
| 2 | Projects | "(27) Projects." + "©2025" · "We've helped businesses across industries achieve their goals…" | 6 cards: Boltshift/2025, Ephemeral/2025, Powersurge/2024, Mastermail/2024, Warpspeed/2023, CloudWatch/2020 — 750×540 images + logo SVGs |
| 3 | Advantages | "Why choose us" · "Proven results for every project…" · "Let's talk today" + button | "No fluff, just results." · 2 stats: 01 Successful projects completed (50+), 02 Customer satisfaction rate (99%) |
| 4 | Services | "What we do" · "Services. (4)" | 4 cards (001 Web design and development, 002 Social media marketing, 003 SEO optimization, 004 Branding and identity), each: description + 6 category pills (e.g. Packaging design, Logo design, Rebranding, Typography, Guidelines, Visual identity) + "6+" |
| 5 | Showreel | "About us" · "fabrica®" · "How we launch websites and marketing campaigns." | 4 numbered steps (01–04: communicates every step / customized solutions / transparent pricing / proven track record) + "Watch showreel (2016-25©)" video CTA + 1912×1402 image |
| 6 | Testimonials | "Testimonials" · "Experiences." · "©2025" · 4.9/5 · "56+ Trusted by clients worldwide" · "Leave a review" | 3 cards (James Carter/Wilson & Co, Emily Davis/StartUp Hub, Anna Martinez) + 140×140 avatars + client logo SVGs |
| 7 | Text | Counters: 0m+ Ad impressions managed, 0+ Successful projects launched, 0% Client satisfaction rate, 0k+ Monthly visitors driven through SEO | "fabrica® · Every project we take on is designed for long-term success." + approach paragraphs |
| 8 | Bento | "Case study UX/UI Redesign, Frontend Optimization" · "Live website" | Metrics: Page speed +48%, Bounce rate −23%; Conversion 4.2%→5.9%; quote (Angela Smith); "100 Pagespeed score"; "+30% Quarterly visits" + chart (Dec +1k, Jan +1.3k, Feb +1.1k, …) |
| 9 | Pricing | "Simple pricing" · "Pricing." · Per project / Monthly toggle | "$2,490 /project" (+ "$1,490" marketing add-on); features: Homepage + up to 4 inner pages, Design and Development, Mobile-Optimized Design, Delivery 3–4 weeks; "Get in touch"; "Looking for more?" + George Stern card |
| 10 | Team | "fabrica®" · "The faces behind the projects." · "Be part of our mission / Apply now" | 4 members (Lauren Thompson Team Lead, Michael Wilson Full Stack Dev, Sarah Johnson Creative Director, Christopher Miller UX/UI Designer); white card container; "See all" |
| 11 | FAQ | "FAQ." · "Got questions? We've got answers…" | 6 accordion items (build timeline, custom vs templates, SEO included, subscription model, +2) |
| 12 | Blog | "Newest trends and insights from our team." · "Stay informed…" · "See all" | 2 posts: Feb 2 2025 "How a well-designed website can transform your business", Jan 26 2025 "The Psychology of Color in Branding"; then "fabrica® What's new in digital?" + 1137×825 image |
| 13 | Phone | Mobile-only section | verify at ≤809px |
| 14 | Footer | "Whether you're looking to build a stunning website…" + Client Success Manager (George Stern) · Newsletter subscribe · (312) 555-2468 · hello@fabrica.com · Navigation (Home/Studio/Projects/Blog) · Social (Twitter/Instagram/Dribbble) · "© 2025 fabrica® Studio. All rights reserved." · Privacy Policy · Terms of Service · "Built in Framer" · "Created by Anatolii Dmitrienko" | bg `#f5f5f5` on live light scheme → **dark** in rebuild |

### 16. Scroll behavior
- Header is fixed (wrapper) and stays at top on scroll (verified at 1440 & 390).
- Live site uses **Lenis** smooth-scroll (`class="lenis"`) — optional nicety, not required for fidelity.

### 17–18. Animations & hover
- **Entrance animations**: Framer `data-framer-appear-id` — sections fade/slide in on scroll (opacity 0.001→1, translateY −40px).
- **Counters**: JS-animated numbers (0m+, 0+, 0%, 0k+, 4.9/5, 50+, 56+).
- **Hover**: link color/opacity transitions (e.g. `transition: color .2s`), CTA/button micro-interactions.
- Accordion expand/collapse (FAQ), pricing toggle, hamburger→X.

### 19. Sticky/fixed elements
Header only (fixed overlay). Mobile menu is a fixed full-screen panel.

### 20. Forms / interactive
- Footer **newsletter subscribe** form.
- `/contact` page form ("Send Message") — page not yet built.
- Pricing toggle, FAQ accordion, mobile menu, counters.

### 21. External scripts
- Framer runtime (not replicable/needed), Google Fonts (Geist + Inter — project already self-hosts both via `@fontsource`), Lenis.

### 22. Fonts
- **Inter** (400/500/600) — body + display text (logo 600, links 600, wordmark 600).
- **Geist** (Google Font) — loaded by the live site; verify which presets use it during implementation (project already has `@fontsource/geist-sans`).
- Letter-spacing habits: `-0.04em` (logo), `-0.06em` (wordmark/headlines).

### 23. SEO metadata
- Title pattern, meta description, OG/Twitter tags, Organization JSON-LD — already implemented in `BaseLayout.astro`; update theme-color to dark (`#141414`), keep canonical env-driven.

### 24. Framer-specific behaviors to recreate in Astro
- **fit-text wordmark** (scale "fabrica" to container width) → CSS `clamp()`/`vw` or a tiny vanilla fit-text script.
- **Color-scheme variants** (light/dark) → we build the dark theme only.
- **`ssr-variant`/`hidden-*` classes** → ignore, pure CSS breakpoints instead.
- **Variant system** ("Desktop"/"Phone"/"Closed"/"Open") → CSS media queries + a small class toggle for menu/accordion/pricing.
- **`data-framer-appear-id`** scroll reveals → tiny IntersectionObserver script (vanilla).

---

## PART 2 — Proposed Astro architecture

```
src/
  layouts/BaseLayout.astro      (exists — keep SEO shell; fonts already self-hosted)
  pages/
    index.astro                 (rewrite with measured section order)
    studio.astro                (NEW)
    projects.astro              (NEW)
    blog.astro                  (NEW)
    contact.astro               (NEW)
  components/
    Header.astro                (rewrite: dark, hamburger-at-all-widths, no CTA)
    MobileMenu.astro            (full-screen overlay)
    Hero.astro                  (rewrite: wordmark + pills + H1 + CTA card)
    ProjectsSection.astro
    AdvantagesSection.astro
    ServicesSection.astro
    ShowreelSection.astro
    TestimonialsSection.astro
    StatsBand.astro             (animated counters)
    ApproachSection.astro
    BentoCaseStudy.astro
    PricingSection.astro        (with Per project/Monthly toggle)
    TeamSection.astro
    FAQSection.astro            (accordion)
    BlogSection.astro
    NewsletterSection.astro
    Footer.astro                (rewrite: dark)
    atoms/  Button.astro, SectionHeading.astro, Pill.astro, Counter.astro, FitText.astro
  data/
    site.ts                     (exists — extend)
    projects.ts / services.ts / testimonials.ts / blog.ts / team.ts / faq.ts / pricing.ts (extend to match live content)
  styles/
    global.css                  (dark design tokens + utilities)
  lib/  reveal.ts, menu.ts, accordion.ts, counters.ts, pricing-toggle.ts   (tiny vanilla scripts)
public/
  images/    (download 60 live assets from framerusercontent.com, descriptive names)
  icons/     (social + UI SVGs)
  fonts/     (already via @fontsource — no files needed)
```

**Determination of element types**

| Element | Type | Why |
|---|---|---|
| Layout shell, sections, cards, footer | Astro components | Static markup + scoped CSS |
| Wordmark, pills, headings, grids | Static HTML + CSS | No runtime state |
| Header menu, FAQ accordion, pricing toggle | Vanilla `<script>` | No data layer, tiny state |
| Counters, scroll reveal | Vanilla `<script>` (IntersectionObserver/requestAnimationFrame) | Tiny, no framework |
| Fit-text wordmark | CSS `clamp()` primary + optional tiny JS | Framer uses JS fit-text |
| React islands | **None** | Nothing requires them — no new dependencies |

**Routes to recreate**

| URL | Purpose | Sections | Components | Assets | Interactions | Responsive |
|---|---|---|---|---|---|---|
| `/` | Homepage | all 13 + footer | all above | all 60 images | menu, counters, accordion, toggle, reveal | 3 breakpoints |
| `/studio` | Agency story + team | header, hero-lite, about, process, team, CTA, footer | Hero, TeamSection, shared | team portraits | reveal | 3 breakpoints |
| `/projects` | Portfolio index | header, list/grid, footer | ProjectCard list | project images | reveal | 3 breakpoints |
| `/blog` | Blog index | header, post grid, footer | BlogCard list | post images | reveal | 3 breakpoints |
| `/contact` | Contact + form | header, form ("Send Message"), info, footer | ContactForm (vanilla) | — | form submit | 3 breakpoints |

*(Note: live site has no dedicated legal pages — Privacy/Terms are footer links only. Verify and decide whether to stub them.)*

**Implementation order**

1. **Design tokens** — rewrite `global.css` to the dark theme: bg `#121212`, section `#0a0a0a`, header `#141414`, text `#fff` / `rgba(255,255,255,.7)`, container `1520px`, padding `36/32/20`, section rhythm `200/100/50`, fonts Inter 400–600 + Geist.
2. **Assets** — download all 60 live images into `public/images/` (verbatim from framerusercontent.com).
3. **Header + MobileMenu** — 60px dark fixed header, logo left, centered links (with `27` superscript), hamburger at all widths, full-screen menu, no CTA pill.
4. **Hero** — wordmark (fit-text), "Studio", pills, H1, © line, CTA card.
5. **Projects** → 6. **Advantages** → 7. **Services** → 8. **Showreel** → 9. **Testimonials** → 10. **Stats/Text + Approach** → 11. **Bento** → 12. **Pricing** (toggle) → 13. **Team** → 14. **FAQ** (accordion) → 15. **Blog + newsletter** → 16. **Footer**.
17. **Global interactions** — reveal script, counters, menu/accordion/toggle wiring.
18. **Remaining routes** — `/studio`, `/projects`, `/blog`, `/contact` (content from live subpages; capture them first).
19. **Responsive QA** — verify ≥1200 / 810–1199 / ≤809 against live + reference screenshots.
20. **Final QA** — `astro check`, `npm run build`, run dev server, browser screenshot comparison vs https://fabrica.framer.media/ and `reference/UI_Image.png`.

**Known open items**
- Exact reference header: `#141414` dominant; confirm border/bottom line and blur on the dark header during implementation.
- Which text presets use Geist (vs Inter) — verify from live CSS presets.
- The `Phone` mobile-only section's purpose/content — inspect at ≤809px.
- Footer "Built in Framer" credit — keep or adapt for the Astro build (content decision).
- Services/Pricing/Footer were `#f5f5f5` in the live light scheme → become dark in this rebuild (per chosen reference theme); text colors invert accordingly.
