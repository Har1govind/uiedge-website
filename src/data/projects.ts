/**
 * Projects.
 * UiEdge is early-stage: 2 completed client projects (placeholders below,
 * pending real names/details) plus 2 products UiEdge builds and runs itself
 * (clearly labeled as UiEdge products, not client work, via the `industry`
 * field). Existing template image/logo assets are reused as visual
 * placeholders — no new image assets were created.
 */
export interface Project {
  slug: string;
  title: string;
  year: string;
  image: string;
  logo: string;
  /** "Scope of work" pills — subset of PROJECT_CATEGORIES. */
  scope: string[];
  industry: string;
  timeline: string;
}

export const PROJECT_CATEGORIES = ["Custom Software", "Web & Mobile Apps", "SaaS Products", "UI/UX Design"] as const;

/** Shared case-study copy, kept generic and honest with bracketed placeholders for facts not yet supplied. */
export const PROJECT_CASE_STUDY = {
  introduction:
    "This project started with a business problem, not a feature list. We worked with the client to understand their operations, their users, and where existing tools were falling short, then designed, engineered, and deployed software intended to move real numbers.",
  challenges:
    "The starting point had real constraints. Common issues we work to solve on projects like this include:",
  development:
    "We engineered the solution with reliability and scalability in mind, building on a modern, well-documented stack so it stays fast, secure, and easy to extend as the business grows.",
  liveProjectHref: "#",
  finalThoughts: [
    "⟨Outcome summary: to be added once results are measured and confirmed with the client.⟩",
    "For us at UiEdge, projects like this are where our engineering and product thinking gets tested against real business outcomes.",
  ],
  /** Shared gallery images reused across every project page. */
  gallery: [
    "/images/projects/gallery/engineering-1.jpg",
    "/images/projects/gallery/engineering-2.jpg",
    "/images/projects/gallery/engineering-3.jpg",
  ],
} as const;

export const PROJECTS: Project[] = [
  {
    slug: "project-one",
    title: "⟨Project 1 name⟩",
    year: "2025",
    image: "/images/projects/web-mobile-app.jpg",
    logo: "/images/projects/boltshift-logo.svg",
    scope: ["Web & Mobile Apps", "UI/UX Design"],
    industry: "⟨Client industry⟩",
    timeline: "⟨Project timeline⟩",
  },
  {
    slug: "project-two",
    title: "⟨Project 2 name⟩",
    year: "2025",
    image: "/images/projects/custom-software-dashboard.jpg",
    logo: "/images/projects/ephemeral-logo.svg",
    scope: ["Custom Software", "Web & Mobile Apps"],
    industry: "⟨Client industry⟩",
    timeline: "⟨Project timeline⟩",
  },
  {
    slug: "veterinary-platform",
    title: "Veterinary Management Platform",
    year: "2026",
    image: "/images/projects/veterinary-platform.jpg",
    logo: "/images/projects/powersurge-logo.svg",
    scope: ["SaaS Products", "Custom Software"],
    industry: "UiEdge product: veterinary practice management SaaS",
    timeline: "Ongoing",
  },
  {
    slug: "pos-system",
    title: "POS System",
    year: "2026",
    image: "/images/projects/pos-system.jpg",
    logo: "/images/projects/mastermail-logo.svg",
    scope: ["SaaS Products", "Custom Software"],
    industry: "UiEdge product: point-of-sale & billing SaaS",
    timeline: "Ongoing",
  },
];
