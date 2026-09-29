/**
 * Team section.
 * UiEdge is a small Kozhikode studio — 3 owners plus a salaried team.
 * Real names aren't supplied yet, so roles are shown with bracketed
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
    role: "Founder & Design Lead at UiEdge",
    bio: "Leads product strategy and design direction, keeping every project rooted in business goals, not just aesthetics.",
    photo: "/images/team/team-1.jpg",
  },
  {
    name: "⟨Co-founder name⟩",
    role: "Co-founder & Product Lead at UiEdge",
    bio: "Owns the UiEdge product line — the veterinary platform and POS system — and shapes how client work and owned products inform each other.",
    photo: "/images/team/team-2.jpg",
  },
  {
    name: "⟨Co-founder name⟩",
    role: "Co-founder & Engineering Lead at UiEdge",
    bio: "Turns design into fast, reliable software, and supports the team through clean development and handoff.",
    photo: "/images/team/team-3.jpg",
  },
];
