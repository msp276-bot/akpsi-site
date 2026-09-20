/**
 * Per-member points requirement (threshold), keyed by the member's login email
 * (lowercased). Source of truth: the chapter's points spreadsheet, updated each
 * semester by VP Ops. A member not listed here falls back to the role-based
 * default in `pointsRequiredFor` (see `@/lib/points`).
 *
 * To update: replace the values below with the latest spreadsheet, or paste a
 * new export. Emails are Rutgers scarletmail (the accounts members sign in with).
 */
export const POINT_THRESHOLDS: Record<string, number> = {
  "aam489@scarletmail.rutgers.edu": 45,
  "ag2349@scarletmail.rutgers.edu": 35,
  "arp271@scarletmail.rutgers.edu": 30,
  "aam474@scarletmail.rutgers.edu": 30,
  "as4822@scarletmail.rutgers.edu": 45,
  "asj105@scarletmail.rutgers.edu": 35,
  "acw141@scarletmail.rutgers.edu": 30,
  "aj1102@scarletmail.rutgers.edu": 35,
  "an1084@scarletmail.rutgers.edu": 35,
  "aj1010@scarletmail.rutgers.edu": 45,
  "ah1779@scarletmail.rutgers.edu": 45,
  "cjc558@scarletmail.rutgers.edu": 45,
  "cc2354@scarletmail.rutgers.edu": 45,
  "cal407@scarletmail.rutgers.edu": 45,
  "daf234@scarletmail.rutgers.edu": 45,
  "ds2376@scarletmail.rutgers.edu": 45,
  "dn462@scarletmail.rutgers.edu": 30,
  "ds2391@scarletmail.rutgers.edu": 45,
  "efg56@scarletmail.rutgers.edu": 45,
  "iv152@scarletmail.rutgers.edu": 45,
  "ja1425@scarletmail.rutgers.edu": 35,
  "jcc422@scarletmail.rutgers.edu": 45,
  "kk1542@scarletmail.rutgers.edu": 45,
  "joa42@scarletmail.rutgers.edu": 45,
  "jy892@scarletmail.rutgers.edu": 45,
  "kc1529@scarletmail.rutgers.edu": 45,
  "lgp43@scarletmail.rutgers.edu": 30,
  "mv782@scarletmail.rutgers.edu": 35,
  "msp276@scarletmail.rutgers.edu": 35,
  "nrj40@scarletmail.rutgers.edu": 45,
  "ok170@scarletmail.rutgers.edu": 45,
  "ojo17@scarletmail.rutgers.edu": 45,
  "oaa90@scarletmail.rutgers.edu": 35,
  "pc872@scarletmail.rutgers.edu": 45,
  "pa561@scarletmail.rutgers.edu": 35,
  "pk845@scarletmail.rutgers.edu": 45,
  "rm1840@scarletmail.rutgers.edu": 45,
  "rwy8@scarletmail.rutgers.edu": 45,
  "rm1755@scarletmail.rutgers.edu": 45,
  "sr1946@scarletmail.rutgers.edu": 45,
  "sv786@scarletmail.rutgers.edu": 45,
  "sr1975@scarletmail.rutgers.edu": 45,
  "skm199@scarletmail.rutgers.edu": 35,
  "sofia.babu@rutgers.edu": 45,
  "ss5138@scarletmail.rutgers.edu": 45,
  "smg470@scarletmail.rutgers.edu": 30,
  "vn249@scarletmail.rutgers.edu": 30,
  "yhr5@scarletmail.rutgers.edu": 45,
};
