/**
 * Team section.
 * UiEdge is a small Kozhikode software company — 3 owners plus a salaried
 * team. Real names aren't supplied yet, so roles are shown with bracketed
 * placeholders. Photos reuse existing template paths as placeholders.
 */
export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  photo: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "⟨Founder name⟩",
    role: "Founder & CEO at UiEdge",
    bio: "Leads company strategy and client partnerships, keeping every engagement tied to measurable business outcomes.",
    photo: "/images/team/team-1.jpg",
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
