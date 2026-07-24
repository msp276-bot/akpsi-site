/**
 * Chapter social links - single source of truth for header + Media page.
 * The existing footer links are intentionally left untouched (build spec §5.3);
 * update those separately if desired.
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/rutgers.akpsi/",
  linkedin: "https://www.linkedin.com/company/rutgers-alphakappapsi",
} as const;

/** True once a real URL (not the "#" placeholder) has been set. */
export function hasSocialUrl(url: string): boolean {
  return url !== "#" && url.trim().length > 0;
}
