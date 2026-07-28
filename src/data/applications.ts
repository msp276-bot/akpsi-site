export type ApplicationStatus =
  | "pending"
  | "interview"
  | "accepted"
  | "rejected"
  | "waitlist";

export interface RushApplication {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  gradYear: number;
  major: string;
  gpa: string;
  status: ApplicationStatus;
  submittedAt: string;
  referralSource: string;
  reviewer?: string;
  /** Applicant headshot URL; falls back to an initials monogram when absent. */
  headshot?: string;
  /** Link to the applicant's resume (PDF/Drive). Placeholder until a real
   *  rush form collects uploads. */
  resumeUrl?: string;
  /** One-line "why AKPsi" blurb from the application. */
  pitch?: string;
}

export const applications: RushApplication[] = [
  {
    id: "app-001",
    fullName: "Maya Desai",
    email: "md1023@rutgers.edu",
    phone: "(732) 555-0104",
    gradYear: 2028,
    major: "Finance",
    gpa: "3.72",
    status: "pending",
    submittedAt: "2026-07-18T14:30:00",
    referralSource: "Friend",
    pitch: "Want to grow into consulting and build a real network before recruiting season.",
  },
  {
    id: "app-002",
    fullName: "Daniel Kim",
    email: "dk814@rutgers.edu",
    phone: "(848) 555-0192",
    gradYear: 2027,
    major: "Business Analytics",
    gpa: "3.61",
    status: "interview",
    submittedAt: "2026-07-17T19:10:00",
    referralSource: "Info Session",
    reviewer: "Sofia Romano",
    pitch: "Looking for mentorship and case-prep reps ahead of internship recruiting.",
  },
  {
    id: "app-003",
    fullName: "Layla Brooks",
    email: "lb550@rutgers.edu",
    phone: "(973) 555-0148",
    gradYear: 2029,
    major: "Marketing",
    gpa: "3.88",
    status: "accepted",
    submittedAt: "2026-07-16T09:45:00",
    referralSource: "Social Media",
    reviewer: "Marcus Lee",
    pitch: "Excited to run brand campaigns for chapter events and meet driven people.",
  },
  {
    id: "app-004",
    fullName: "Omar Haddad",
    email: "oh233@rutgers.edu",
    phone: "(201) 555-0170",
    gradYear: 2028,
    major: "Supply Chain Management",
    gpa: "3.54",
    status: "pending",
    submittedAt: "2026-07-18T11:05:00",
    referralSource: "Class flyer",
    pitch: "First-gen student who wants structure, accountability, and a professional community.",
  },
  {
    id: "app-005",
    fullName: "Priya Raman",
    email: "pr881@rutgers.edu",
    phone: "(609) 555-0133",
    gradYear: 2027,
    major: "Accounting",
    gpa: "3.95",
    status: "waitlist",
    submittedAt: "2026-07-15T16:20:00",
    referralSource: "Alumni referral",
    reviewer: "Ethan Cohen",
    pitch: "Targeting Big Four audit; want interview reps and older brothers who've been through it.",
  },
  {
    id: "app-006",
    fullName: "Jordan Ellis",
    email: "je427@rutgers.edu",
    phone: "(732) 555-0111",
    gradYear: 2029,
    major: "Information Technology",
    gpa: "3.40",
    status: "pending",
    submittedAt: "2026-07-19T08:15:00",
    referralSource: "Tabling",
    pitch: "Switching into product; hoping the brotherhood pushes me out of my comfort zone.",
  },
];
