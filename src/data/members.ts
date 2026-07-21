export type MemberGroup = "board" | "directors" | "actives" | "alumni";

/** Founding cohort a brother joined with. */
export type Cohort = "Alpha Founding" | "Beta Founding" | "Alpha Tau";

export interface Member {
  id: string;
  slug: string;
  name: string;
  position: string;
  major?: string;
  minor?: string;
  group: MemberGroup;
  /** Founding class the brother joined with (Alpha/Beta Founding, Alpha Tau). */
  cohort?: Cohort;
  classYear: string;
  industry?: string;
  bio?: string;
  photo?: string; // real photo url; falls back to initials when absent
  linkedin?: string;
}

/**
 * Omicron Tau chapter roster (real members). Imported from the chapter roster
 * spreadsheet — board holds their e-board titles; actives and alumni are grouped
 * by founding cohort. Majors/bios/photos can be layered in later per person.
 */
const rawMembers: Omit<Member, "slug">[] = [
  // ---------------- BOARD (E-Board) ----------------
  { id: "b1", name: "Olivia Occhipinti", position: "President", group: "board", cohort: "Alpha Founding", classYear: "2027" },
  { id: "b2", name: "Akhil Jonnalagadda", position: "Executive Vice President", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b3", name: "Prakruti Ankem", position: "Vice President of Operations", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b4", name: "Marvin Patel", position: "Vice President of Finance", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b5", name: "Ankitha Jagadeesh", position: "Vice President of Membership", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b6", name: "Aditya Mehta", position: "Vice President of Marketing", group: "board", cohort: "Beta Founding", classYear: "2027" },
  { id: "b7", name: "Ashna Narielwala", position: "Vice President of Alumni Relations", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b8", name: "Simone Mehta", position: "Vice President of Risk Management", group: "board", cohort: "Beta Founding", classYear: "2028" },
  { id: "b9", name: "Mahir Varanasi", position: "Vice President of Internal Affairs", group: "board", cohort: "Beta Founding", classYear: "2028" },

  // ---------------- ACTIVES ----------------
  { id: "a1", name: "Oluwatomisin Abiola", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a2", name: "Rayyan Ahmed", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a3", name: "Justin Arnoldi", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a4", name: "Jayden Arya", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2027" },
  { id: "a5", name: "Anika Batki", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a6", name: "John Baylock", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a7", name: "Joseph Anthony Candelaria", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a8", name: "Carolyn Chang", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a9", name: "Parthivi Chauhan", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a10", name: "Krishv Chivukula", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a11", name: "Chris'Anthony Clark-Stokes", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a12", name: "David Fordjour", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a13", name: "Emmett Glennon", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a14", name: "Sweemit Goswami", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a15", name: "Abhinav Gunda", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a16", name: "Ashwin Harikumar", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a17", name: "Ashritha Janyavula", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a18", name: "Neha Jillella", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a19", name: "Olivia Karanxha", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a20", name: "Pranay Karthikeyan", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a21", name: "Judy Ku", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a22", name: "Gavin Lam", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a23", name: "Caleb Liu", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a24", name: "Colin Lopes", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a25", name: "Ridhee Maddula", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a26", name: "Rajvi Maniar", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a27", name: "Aashay Marathe", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a28", name: "Vinesh Nagavelli", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a29", name: "Dhruv Naruka", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a30", name: "Laksh Panchal", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a31", name: "Adarsh Patel", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a32", name: "Shruthi Raju", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a33", name: "Yusuf Rehman", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a34", name: "Sahil Reshamdalal", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a35", name: "Aishwarya Sarkar", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a36", name: "Srihari Arthi Senthilkumar", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028" },
  { id: "a37", name: "Dev Shah", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a38", name: "Diya Sivasubramani", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a39", name: "Arish Sumnani", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028" },
  { id: "a40", name: "Satviki Vasireddy", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a41", name: "Ishita Vinay", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029" },
  { id: "a42", name: "Alison Wilkerson", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a43", name: "Anthony Yang", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a44", name: "Justin Yang", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a45", name: "Renee Ye", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },

  // ---------------- ALUMNI ----------------
  { id: "al1", name: "Nikhil Badlani", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
  { id: "al2", name: "Aryaman Kumar", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
  { id: "al3", name: "Alexis Lu", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
  { id: "al4", name: "Chirag Tahiliani", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
  { id: "al5", name: "Jaimie Wu", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
  { id: "al6", name: "Eric Ye", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026" },
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
  alumni: "Alumni",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
