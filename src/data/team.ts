/**
 * Team section.
 * UiEdge is a small Kozhikode software company — 3 owners plus a salaried
 * team. Co-founder names aren't supplied yet, so they're shown as bracketed
 * placeholders, with template photos standing in for real ones.
 */
export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /** Optional — cards without a photo show the member's initial instead. */
  photo?: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Hari",
    role: "Founder & CEO at UiEdge",
    bio: "Leads company strategy and client partnerships, keeping every engagement tied to measurable business outcomes.",
  },
  {
    name: "⟨Co-founder name⟩",
    role: "Co-founder & Head of Products at UiEdge",
    bio: "Owns the UiEdge product line, the veterinary platform and POS system, from roadmap to customer success.",
    photo: "/images/team/team-2.jpg",
  },
  {
    name: "⟨Co-founder name⟩",
    role: "Co-founder & CTO at UiEdge",
    bio: "Leads engineering and architecture across client software and our own products, keeping everything reliable, secure, and built to scale.",
    photo: "/images/team/team-3.jpg",
  },
];
