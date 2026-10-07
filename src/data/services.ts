/**
 * The numbered services.
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
    title: "Custom Software Development",
    description:
      "Software built around how your business actually runs, from internal tools and workflow automation to full CRM, ERP, and operations platforms.",
    categories: [
      "Business applications",
      "CRM / ERP systems",
      "Workflow automation",
      "Admin panels & dashboards",
      "Legacy modernisation",
      "Third-party integrations",
    ],
    count: "6+",
  },
  {
    number: "(002)",
    title: "Web & Mobile App Development",
    description:
      "Fast, secure, scalable web and mobile applications, engineered end to end, from API and database to the interface your users touch.",
    categories: [
      "Web applications",
      "iOS & Android apps",
      "Cross-platform (Flutter / React Native)",
      "APIs & backend",
      "Corporate websites",
      "E-commerce",
    ],
    count: "6+",
  },
  {
    number: "(003)",
    title: "SaaS & Product Engineering",
    description:
      "Take a product idea from MVP to a subscription business, with multi-tenant architecture, billing, analytics, and a roadmap built for growth.",
    categories: [
      "MVP development",
      "Multi-tenant SaaS",
      "Subscriptions & billing",
      "Product roadmapping",
      "Analytics & reporting",
      "Scaling & re-architecture",
    ],
    count: "6+",
  },
  {
    number: "(004)",
    title: "UI/UX & Product Design",
    description:
      "Design that makes software easy to adopt: research-led interfaces for apps, SaaS dashboards, and enterprise tools, handed straight to our own engineers.",
    categories: [
      "UX research & audits",
      "Web & app UI",
      "SaaS dashboards",
      "Design systems",
      "Prototyping",
      "Usability testing",
    ],
    count: "6+",
  },
  {
    number: "(005)",
    title: "Cloud, DevOps & Support",
    description:
      "We don't disappear after launch. Hosting, deployment pipelines, monitoring, security updates, and ongoing feature development under a support plan.",
    categories: [
      "Cloud setup (AWS / GCP / Azure)",
      "CI/CD pipelines",
      "Monitoring & backups",
      "Security & updates",
      "Performance tuning",
      "Care plans",
    ],
    count: "6+",
  },
  {
    number: "(006)",
    title: "UiEdge Products",
    description:
      "Ready-to-use software we build, own, and run: a veterinary practice management platform and a point-of-sale system, available as SaaS subscriptions.",
    categories: ["Veterinary management platform", "POS & billing system", "SaaS subscriptions"],
    count: "3+",
  },
];
