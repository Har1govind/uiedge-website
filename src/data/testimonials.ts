/**
 * Homepage testimonials.
 * UiEdge has completed 2 client projects so far — no real testimonials have
 * been collected yet. Entries below are clearly bracketed placeholders, not
 * fabricated quotes.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "⟨Real client quote: collect after project 1⟩",
    name: "⟨Client name⟩",
    role: "⟨Company⟩",
    avatar: "/images/testimonials/james.jpg",
  },
  {
    quote: "⟨Real client quote: collect after project 2⟩",
    name: "⟨Client name⟩",
    role: "⟨Company⟩",
    avatar: "/images/testimonials/emily.jpg",
  },
];
