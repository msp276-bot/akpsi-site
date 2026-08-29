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
  /**
   * CSS object-position for the headshot inside its 3:4 tile. Defaults to
   * "center" (50% 50%). Use a smaller Y (e.g. "center 20%") to lift a face
   * that sits too low in the crop.
   */
  photoPosition?: string;
  /** Optional zoom (e.g. 1.3) for photos with heavy headroom that object-position alone can't lift. */
  photoScale?: number;
  linkedin?: string;
}

/**
 * Omicron Tau chapter roster (real members). Imported from the chapter roster
 * spreadsheet - board holds their e-board titles; actives and alumni are grouped
 * by founding cohort. Majors/bios/photos can be layered in later per person.
 */
const rawMembers: Omit<Member, "slug">[] = [
  // ---------------- BOARD (E-Board) ----------------
  { id: "b1", name: "Abhinav Gunda", position: "President", group: "board", cohort: "Alpha Founding", classYear: "2027", photo: "/members/abhinav-gunda.jpg" },
  { id: "b2", name: "Akhil Jonnalagadda", position: "Executive Vice President", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/akhil-jonnalagadda.jpg" },
  { id: "b3", name: "Prakruti Ankem", position: "Vice President of Operations", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/prakruti-ankem.jpg" },
  { id: "b4", name: "Marvin Patel", position: "Vice President of Finance", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/marvin-patel.jpg" },
  { id: "b5", name: "Ankitha Jagadeesh", position: "Vice President of Membership", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/ankitha-jagadeesh.jpg" },
  { id: "b7", name: "Ashna Narielwala", position: "Vice President of Alumni Relations", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/ashna-narielwala.jpg" },
  { id: "b8", name: "Simone Mehta", position: "Vice President of Risk Management", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/simone-mehta.jpg" },
  { id: "b9", name: "Mahir Varanasi", position: "Vice President of Internal Affairs", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/mahir-varanasi.jpg" },
  { id: "b10", name: "Oluwatomisin Abiola", position: "Vice President of Professional Development", group: "board", cohort: "Beta Founding", classYear: "2028", photo: "/members/oluwatomisin-abiola.jpg" },

  // ---------------- ACTIVES ----------------
  { id: "a2", name: "Rayyan Ahmed", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/rayyan-ahmed.jpg" },
  { id: "a3", name: "Justin Arnoldi", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/justin-arnoldi.jpg" },
  { id: "a4", name: "Jayden Arya", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2027", photo: "/members/jayden-arya.jpg" },
  { id: "a5", name: "Anika Batki", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/anika-batki.jpg" },
  { id: "a6", name: "John Baylock", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/john-baylock.jpg" },
  { id: "a7", name: "Joseph Anthony Candelaria", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/joseph-anthony-candelaria.jpg" },
  { id: "a8", name: "Carolyn Chang", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/carolyn-chang.jpg" },
  { id: "a9", name: "Parthivi Chauhan", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/parthivi-chauhan.jpg" },
  { id: "a10", name: "Krishv Chivukula", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/krishv-chivukula.jpg" },
  { id: "a11", name: "Chris'Anthony Clark-Stokes", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/chris-anthony-clark-stokes.jpg" },
  { id: "a12", name: "David Fordjour", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/david-fordjour.jpg" },
  { id: "a13", name: "Emmett Glennon", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/emmett-glennon.jpg" },
  { id: "a14", name: "Sweemit Goswami", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/sweemit-goswami.jpg" },
  { id: "a16", name: "Ashwin Harikumar", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/ashwin-harikumar.jpg" },
  { id: "a17", name: "Ashritha Janyavula", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/ashritha-janyavula.jpg" },
  { id: "a18", name: "Neha Jillella", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/neha-jillella.jpg" },
  { id: "a19", name: "Olivia Karanxha", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/olivia-karanxha.jpg" },
  { id: "a20", name: "Pranay Karthikeyan", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/pranay-karthikeyan.jpg" },
  { id: "a21", name: "Judy Ku", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/judy-ku.jpg" },
  { id: "a22", name: "Gavin Lam", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/gavin-lam.jpg" },
  { id: "a23", name: "Caleb Liu", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/caleb-liu.jpg" },
  { id: "a24", name: "Colin Lopes", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/colin-lopes.jpg" },
  { id: "a25", name: "Ridhee Maddula", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/ridhee-maddula.jpg" },
  { id: "a26", name: "Rajvi Maniar", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/rajvi-maniar.jpg" },
  { id: "a27", name: "Aashay Marathe", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/aashay-marathe.jpg" },
  { id: "a43", name: "Aditya Mehta", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2027", photo: "/members/aditya-mehta.jpg" },
  { id: "a28", name: "Vinesh Nagavelli", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/vinesh-nagavelli.jpg" },
  { id: "a29", name: "Dhruv Naruka", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/dhruv-naruka.jpg" },
  { id: "a44", name: "Olivia Occhipinti", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027" },
  { id: "a30", name: "Laksh Panchal", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/laksh-panchal.jpg" },
  { id: "a31", name: "Adarsh Patel", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/adarsh-patel.jpg" },
  { id: "a32", name: "Shruthi Raju", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/shruthi-raju.jpg" },
  { id: "a33", name: "Yusuf Rehman", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/yusuf-rehman.jpg" },
  { id: "a34", name: "Sahil Reshamdalal", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/sahil-reshamdalal.jpg" },
  { id: "a35", name: "Aishwarya Sarkar", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/aishwarya-sarkar.jpg" },
  { id: "a36", name: "Srihari Arthi Senthilkumar", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2028", photo: "/members/srihari-arthi-senthilkumar.jpg" },
  { id: "a37", name: "Dev Shah", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/dev-shah.jpg" },
  { id: "a38", name: "Diya Sivasubramani", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/diya-sivasubramani.jpg" },
  { id: "a39", name: "Arish Sumnani", position: "Active Brother", group: "actives", cohort: "Beta Founding", classYear: "2028", photo: "/members/arish-sumnani.jpg" },
  { id: "a40", name: "Satviki Vasireddy", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/satviki-vasireddy.jpg" },
  { id: "a41", name: "Ishita Vinay", position: "Active Brother", group: "actives", cohort: "Alpha Tau", classYear: "2029", photo: "/members/ishita-vinay.jpg" },
  { id: "a42", name: "Alison Wilkerson", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/alison-wilkerson.jpg" },
  { id: "a43", name: "Anthony Yang", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/anthony-yang.jpg" },
  { id: "a44", name: "Justin Yang", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/justin-yang.jpg" },
  { id: "a45", name: "Renee Ye", position: "Active Brother", group: "actives", cohort: "Alpha Founding", classYear: "2027", photo: "/members/renee-ye.jpg" },

  // ---------------- ALUMNI ----------------
  { id: "al1", name: "Nikhil Badlani", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/nikhil-badlani.jpg" },
  { id: "al2", name: "Aryaman Kumar", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/aryaman-kumar.jpg" },
  { id: "al3", name: "Alexis Lu", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/alexis-lu.jpg" },
  { id: "al4", name: "Chirag Tahiliani", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/chirag-tahiliani.jpg" },
  { id: "al5", name: "Jaimie Wu", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/jaimie-wu.jpg" },
  { id: "al6", name: "Eric Ye", position: "Alumni", group: "alumni", cohort: "Alpha Founding", classYear: "2026", photo: "/members/eric-ye.jpg" },
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
