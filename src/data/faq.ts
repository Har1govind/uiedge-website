/**
 * FAQ accordion.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does UiEdge actually do?",
    answer:
      "We're a strategy-first product studio. We design and build websites, apps, and SaaS products — and we build our own software too. Every project starts from your business goals, not just how it looks.",
  },
  {
    question: "How long does a project take?",
    answer:
      "Most websites ship in 3–5 weeks across clear milestones. We give you a full timeline after the discovery call.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Websites start from ₹60,000 and scale with complexity. We price on scope and outcomes, not hours — you get a fixed quote after discovery.",
  },
  {
    question: "Do you use templates?",
    answer: "No. Every product is custom-designed around your users and goals.",
  },
  {
    question: "Do you handle development too?",
    answer:
      "Yes — we design and build, and support clean dev handoff so what ships matches what we designed.",
  },
  {
    question: "What makes UiEdge different?",
    answer:
      "We build and run our own software products. That means we understand products end-to-end, not just the design layer.",
  },
  {
    question: "Do you work with clients outside Kerala?",
    answer: "Yes — we work across India, the Gulf, and globally, remotely.",
  },
];
