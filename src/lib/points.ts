/**
 * Points & service-hours requirements.
 *
 * Points and service hours are two SEPARATE tallies (see db/submissions.sql):
 *  - Points come from the VP-Ops event catalog (src/lib/events.ts). The value of
 *    a submission is decided server-side by the event, so there is no per-category
 *    math here anymore.
 *  - Service hours are logged free-form and counted as hours.
 *
 * ⚠️ The REQUIREMENT numbers below are PLACEHOLDERS - the chapter (VP Ops) must
 * confirm the real per-semester requirements. Changing them here updates the
 * progress meters on the Points page.
 */

/** Points required per membership status. "brother" covers active/board/etc. */
export const POINT_REQUIREMENTS = {
  pledge: 30,
  brother: 20,
} as const;

/** Service hours required per membership status. */
export const SERVICE_HOUR_REQUIREMENTS = {
  pledge: 5,
  brother: 5,
} as const;

export function pointsRequiredFor(role: string): number {
  return role === "pledge" ? POINT_REQUIREMENTS.pledge : POINT_REQUIREMENTS.brother;
}

export function serviceHoursRequiredFor(role: string): number {
  return role === "pledge"
    ? SERVICE_HOUR_REQUIREMENTS.pledge
    : SERVICE_HOUR_REQUIREMENTS.brother;
}
