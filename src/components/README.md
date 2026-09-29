# Component Conventions

Conventions for building components in this project.

## Stack

- **Astro** + **TypeScript** (strict), vanilla **CSS**, minimal vanilla **JS**.
- No React, no Tailwind, no UI libraries, no animation libraries (until proven required).

## Structure

```
src/
├── components/   ← reusable UI components (this folder)
├── data/         ← content/constants (site.ts, later projects/blog data)
├── layouts/      ← page shell layouts (BaseLayout.astro)
├── pages/        ← routes (file-based routing)
├── scripts/      ← shared vanilla JS modules (imported by components)
└── styles/       ← global.css (tokens + base) + future feature styles
```

## Naming

- **Component files**: `PascalCase.astro` — e.g. `Header.astro`, `ProjectCard.astro`.
- **Props interface**: `interface Props { ... }` destructured from `Astro.props` with defaults.
- **CSS classes**: `kebab-case`. Component-scoped styles via `<style>` blocks (Astro auto-scopes).
- **Design tokens only**: never hardcode colors/spacing/type — use `var(--token)` from `global.css`.
- **Sections**: `SectionName.astro` under `components/sections/` (introduced in Phase 3).

## Scripting

- Component interactivity: `<script>` inside the component (module scope, no globals).
- Shared logic: `src/scripts/*.ts` imported from components.
- Prefer **progressive enhancement**: working without JS, enhanced with JS.
- Only extract a client-side island when plain Astro + CSS cannot do the job.

## Data

- Static content lives in `src/data/` as typed TS constants (single source of truth).
- Pages read from data; components receive primitives via props.

## Testing / QA

- `npm run check` — Astro + TS type checking (`astro check`).
- `npm run build` — production build must pass before handoff.
- Visual QA against `reference/UI_Image.png` (visual source of truth) at
  1440 / 768 / 390 px widths.
