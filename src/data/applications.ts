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
  gradYear: number;
  major: string;
  gpa: string;
  status: ApplicationStatus;
  submittedAt: string;
  referralSource: string;
  reviewer?: string;
}

export const applications: RushApplication[] = [
  {
    id: "app-001",
    fullName: "Maya Desai",
    email: "md1023@rutgers.edu",
    gradYear: 2028,
    major: "Finance",
    gpa: "3.72",
    status: "pending",
    submittedAt: "2026-07-18T14:30:00",
    referralSource: "Friend",
  },
  {
    id: "app-002",
    fullName: "Daniel Kim",
    email: "dk814@rutgers.edu",
    gradYear: 2027,
    major: "Business Analytics",
    gpa: "3.61",
    status: "interview",
    submittedAt: "2026-07-17T19:10:00",
    referralSource: "Info Session",
    reviewer: "Sofia Romano",
  },
  {
    id: "app-003",
    fullName: "Layla Brooks",
    email: "lb550@rutgers.edu",
    gradYear: 2029,
    major: "Marketing",
    gpa: "3.88",
    status: "accepted",
    submittedAt: "2026-07-16T09:45:00",
    referralSource: "Social Media",
    reviewer: "Marcus Lee",
  },
];
