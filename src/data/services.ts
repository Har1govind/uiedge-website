/**
 * The four numbered services.
 * `count` is the "+N" badge shown after the category list.
 */
export interface Service {
  number: string;
  title: string;
  description: string;
  categories: string[];
  count: string;
}

export const SERVICES: Service[] = [
  {
    number: "(001)",
    title: "UI/UX Design",
    description:
      "Interfaces designed around user psychology and business goals — for websites, mobile apps, SaaS dashboards, and enterprise tools.",
    categories: [
      "Web UI/UX",
      "Mobile apps",
      "SaaS dashboards",
      "Enterprise/CRM/ERP",
      "Design systems",
      "Usability testing",
    ],
    count: "6+",
  },
  {
    number: "(002)",
    title: "Product Strategy & Discovery",
    description:
      "Before design, clarity. We define what to build and why, so the product serves real business outcomes.",
    categories: [
      "UX audits",
      "User research",
      "MVP scoping",
      "Roadmapping",
      "Information architecture",
      "Conversion strategy",
    ],
    count: "6+",
  },
  {
    number: "(003)",
    title: "Web & App Development",
    description:
      "We don't just hand off files — we build fast, responsive, SEO-ready websites and apps and support the engineering handoff.",
    categories: [
      "Website design & build",
      "Landing pages",
      "Web apps",
      "Mobile (iOS/Android/cross-platform)",
      "Performance",
      "Dev handoff",
    ],
    count: "6+",
  },
  {
    number: "(004)",
    title: "Our Own Products",
    description:
      "Few studios ship their own software. We build and run a veterinary management platform and a POS system — proof we think in products, not just deliverables.",
    categories: ["Veterinary practice platform", "POS system", "SaaS subscriptions"],
    count: "3+",
  },
];
