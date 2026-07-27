/**
 * Points / service-hours configuration.
 *
 * ⚠️ PLACEHOLDER VALUES - the chapter (VP Ops) must confirm the real categories,
 * point values, and per-role requirements. Everything below is a reasonable
 * default so the submission + points UI is fully functional today; changing a
 * number here changes it everywhere (the submit form, the points math, and the
 * "outstanding" calculation). No backend change is needed to edit these.
 */

export type SubmissionKind = "service_hours" | "points";

export interface PointCategory {
  id: string;
  label: string;
  kind: SubmissionKind;
  /**
   * For `points` categories: points awarded per approved submission.
   * For `service_hours` categories: points awarded per hour submitted.
   */
  pointsPer: number;
  /** Short helper shown under the field in the submit form. */
  hint?: string;
}

export const POINT_CATEGORIES: PointCategory[] = [
  {
    id: "service",
    label: "Service / Volunteer Hours",
    kind: "service_hours",
    pointsPer: 1,
    hint: "Enter the number of hours. Attach a photo as proof.",
  },
  {
    id: "professional",
    label: "Professional Event",
    kind: "points",
    pointsPer: 2,
    hint: "Workshops, info sessions, networking nights.",
  },
  {
    id: "social",
    label: "Social / Brotherhood Event",
    kind: "points",
    pointsPer: 1,
    hint: "Chapter socials, retreats, brotherhood events.",
  },
  {
    id: "fundraising",
    label: "Fundraising (RUDM, philanthropy)",
    kind: "points",
    pointsPer: 2,
    hint: "Dance Marathon, donation drives, philanthropy.",
  },
];

export function getCategory(id: string): PointCategory | undefined {
  return POINT_CATEGORIES.find((c) => c.id === id);
}

/**
 * Points required per membership status. "brother" covers active/board/etc.;
 * pledges have their own (usually higher) requirement. PLACEHOLDER numbers.
 */
export const POINT_REQUIREMENTS = {
  pledge: 30,
  brother: 20,
} as const;

export function requirementFor(role: string): number {
  return role === "pledge" ? POINT_REQUIREMENTS.pledge : POINT_REQUIREMENTS.brother;
}

/**
 * Points a single submission is worth, given its category and (for service
 * hours) the number of hours.
 */
export function pointsForSubmission(categoryId: string, hours: number | null): number {
  const cat = getCategory(categoryId);
  if (!cat) return 0;
  if (cat.kind === "service_hours") {
    return Math.max(0, (hours ?? 0) * cat.pointsPer);
  }
  return cat.pointsPer;
}
