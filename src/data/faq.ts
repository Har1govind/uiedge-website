/**
 * FAQ accordion.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does UiEdge do?",
    answer:
      "UiEdge is a software services and product company. We build custom software, web and mobile apps, and SaaS platforms for businesses in Kerala, South India, and worldwide. We also build and sell our own software products, a veterinary management platform and a POS system.",
  },
  {
    question: "What kind of software can you build?",
    answer:
      "Business applications, CRM/ERP and internal tools, customer-facing web and mobile apps, SaaS platforms, APIs, and integrations with the tools you already use. If it runs in a browser, on a phone, or in the cloud, we can scope it.",
  },
  {
    question: "How long does a project take?",
    answer:
      "A website typically takes 3–5 weeks, an MVP 6–12 weeks, and larger platforms are delivered in phased releases. You get a detailed timeline after the discovery call.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Websites start from ₹60,000, mobile app MVPs from ₹90,000, and SaaS dashboards from ₹1,50,000; custom software is quoted on scope. We price on scope, not hours, and you get a fixed, milestone-based quote after discovery.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "Yes. Our Care Plan (from ₹8,000/mo) keeps your software maintained, secure, and improving after launch.",
  },
  {
    question: "Can I use your products instead of building from scratch?",
    answer:
      "Yes. Our veterinary platform and POS system are available as SaaS subscriptions. Get in touch for a demo.",
  },
  {
    question: "Where is UiEdge located, and which areas do you serve?",
    answer:
      "We're a software development company based in Kozhikode (Calicut), Kerala. We work with businesses across Kerala, including Kochi, Thiruvananthapuram, Thrissur, Kannur, and Malappuram, and across South India in Bengaluru, Chennai, Coimbatore, and Hyderabad.",
  },
  {
    question: "Do you work with clients outside India?",
    answer: "Yes. We serve clients in the Gulf and around the world, working fully remote with clear milestones and regular demos.",
  },
];
