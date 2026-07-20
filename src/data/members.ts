export type MemberGroup = "board" | "directors" | "actives";

export interface Member {
  id: string;
  slug: string;
  name: string;
  position: string;
  major: string;
  minor?: string;
  group: MemberGroup;
  classYear: string;
  industry?: string;
  bio?: string;
  photo?: string; // real photo url; falls back to initials when absent
  linkedin?: string;
}

/**
 * Mock chapter roster for the Omicron Tau chapter.
 * Replace with real member data — the shape is intentionally flat and
 * easy to hand off / import from a CMS or spreadsheet.
 */
const rawMembers: Omit<Member, "slug">[] = [
  // ---------------- BOARD ----------------
  {
    id: "b1",
    name: "Ava Thompson",
    position: "President",
    major: "Business Analytics & Information Technology",
    minor: "Economics",
    group: "board",
    classYear: "2026",
    industry: "Consulting",
    bio: "Ava leads the Omicron Tau chapter with a focus on member development and alumni engagement. She spent last summer consulting in New York and is passionate about building a chapter culture that balances professional rigor with genuine brotherhood.",
    linkedin: "#",
  },
  {
    id: "b2",
    name: "Marcus Lee",
    position: "VP Professional Development",
    major: "Finance",
    minor: "Computer Science",
    group: "board",
    classYear: "2026",
    industry: "Investment Banking",
    linkedin: "#",
  },
  {
    id: "b3",
    name: "Priya Nair",
    position: "VP Internal",
    major: "Marketing",
    minor: "Psychology",
    group: "board",
    classYear: "2027",
    industry: "Brand Management",
    linkedin: "#",
  },
  {
    id: "b4",
    name: "Daniel Okafor",
    position: "VP External",
    major: "Supply Chain Management",
    minor: "Political Science",
    group: "board",
    classYear: "2026",
    industry: "Operations",
    linkedin: "#",
  },
  {
    id: "b5",
    name: "Sofia Romano",
    position: "VP Membership",
    major: "Accounting",
    minor: "Spanish",
    group: "board",
    classYear: "2027",
    industry: "Public Accounting",
    linkedin: "#",
  },
  {
    id: "b6",
    name: "Ethan Cohen",
    position: "VP Finance",
    major: "Finance",
    minor: "Mathematics",
    group: "board",
    classYear: "2026",
    industry: "Asset Management",
    linkedin: "#",
  },
  {
    id: "b7",
    name: "Maya Patel",
    position: "VP Marketing",
    major: "Marketing",
    minor: "Digital Communication",
    group: "board",
    classYear: "2027",
    industry: "Product Marketing",
    linkedin: "#",
  },

  // ---------------- DIRECTORS ----------------
  {
    id: "d1",
    name: "Jordan Rivera",
    position: "Director of Events",
    major: "Business Administration",
    minor: "Sociology",
    group: "directors",
    classYear: "2027",
    industry: "Event Management",
    linkedin: "#",
  },
  {
    id: "d2",
    name: "Hannah Kim",
    position: "Director of Alumni Relations",
    major: "Human Resource Management",
    minor: "Labor Studies",
    group: "directors",
    classYear: "2027",
    industry: "Human Resources",
    linkedin: "#",
  },
  {
    id: "d3",
    name: "Chris Alvarez",
    position: "Director of Community Service",
    major: "Management",
    minor: "Environmental Studies",
    group: "directors",
    classYear: "2028",
    industry: "Nonprofit",
    linkedin: "#",
  },
  {
    id: "d4",
    name: "Grace Sullivan",
    position: "Director of Technology",
    major: "Computer Science",
    minor: "Business Administration",
    group: "directors",
    classYear: "2027",
    industry: "Software Engineering",
    linkedin: "#",
  },
  {
    id: "d5",
    name: "Omar Haddad",
    position: "Director of Fundraising",
    major: "Finance",
    minor: "Economics",
    group: "directors",
    classYear: "2028",
    industry: "Private Equity",
    linkedin: "#",
  },

  // ---------------- ACTIVES ----------------
  {
    id: "a1",
    name: "Isabella Chen",
    position: "Active Member",
    major: "Business Analytics & Information Technology",
    minor: "Statistics",
    group: "actives",
    classYear: "2028",
    industry: "Data Analytics",
    linkedin: "#",
  },
  {
    id: "a2",
    name: "Noah Williams",
    position: "Active Member",
    major: "Finance",
    minor: "Real Estate",
    group: "actives",
    classYear: "2028",
    industry: "Real Estate",
    linkedin: "#",
  },
  {
    id: "a3",
    name: "Leila Ahmadi",
    position: "Active Member",
    major: "Marketing",
    minor: "Art History",
    group: "actives",
    classYear: "2029",
    industry: "Advertising",
    linkedin: "#",
  },
  {
    id: "a4",
    name: "Tyler Brooks",
    position: "Active Member",
    major: "Accounting",
    minor: "Information Technology",
    group: "actives",
    classYear: "2028",
    industry: "Audit",
    linkedin: "#",
  },
  {
    id: "a5",
    name: "Zoe Martinez",
    position: "Active Member",
    major: "Supply Chain Management",
    minor: "Data Science",
    group: "actives",
    classYear: "2029",
    industry: "Logistics",
    linkedin: "#",
  },
  {
    id: "a6",
    name: "Aiden Park",
    position: "Active Member",
    major: "Management",
    minor: "Entrepreneurship",
    group: "actives",
    classYear: "2028",
    industry: "Startups",
    linkedin: "#",
  },
  {
    id: "a7",
    name: "Nina Volkov",
    position: "Active Member",
    major: "Economics",
    minor: "Mathematics",
    group: "actives",
    classYear: "2029",
    industry: "Economic Research",
    linkedin: "#",
  },
  {
    id: "a8",
    name: "Jamal Carter",
    position: "Active Member",
    major: "Finance",
    minor: "Computer Science",
    group: "actives",
    classYear: "2028",
    industry: "Fintech",
    linkedin: "#",
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const members: Member[] = rawMembers.map((m) => ({
  ...m,
  slug: slugify(m.name),
}));

export function getMemberBySlug(slug: string): Member | undefined {
  return members.find((m) => m.slug === slug);
}

export const GROUP_LABELS: Record<MemberGroup, string> = {
  board: "Board",
  directors: "Directors",
  actives: "Actives",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
