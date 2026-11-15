import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { POINT_REQUIREMENTS } from "@/lib/points";

/**
 * Points requirements, editable by the e-board in the portal (Point
 * Requirements page). Stored in Supabase `point_requirements` (see
 * db/point-requirements.sql): one row per member login email, plus
 * 'default:pledge' / 'default:brother' fallbacks. Any signed-in member can
 * read; only reviewers can write (enforced by RLS, not this client).
 *
 * Mock mode keeps the same shape in localStorage so the preview works.
 */

export interface Requirements {
  defaults: { pledge: number; brother: number };
  /** Per-member overrides keyed by lowercased login email. */
  byEmail: Record<string, number>;
}

export type DefaultKind = "pledge" | "brother";

const MOCK_KEY = "akpsi.ot.point_requirements";
const DEFAULT_KEY: Record<DefaultKind, string> = {
  pledge: "default:pledge",
  brother: "default:brother",
};

/** Used until the table loads, or if it can't be reached. */
export const FALLBACK_REQUIREMENTS: Requirements = {
  defaults: { pledge: POINT_REQUIREMENTS.pledge, brother: POINT_REQUIREMENTS.brother },
  byEmail: {},
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function fromRows(rows: { key: string; required: number | string }[]): Requirements {
  const out: Requirements = {
    defaults: { ...FALLBACK_REQUIREMENTS.defaults },
    byEmail: {},
  };
  for (const r of rows) {
    const v = Number(r.required);
    if (r.key === DEFAULT_KEY.pledge) out.defaults.pledge = v;
    else if (r.key === DEFAULT_KEY.brother) out.defaults.brother = v;
    else out.byEmail[r.key] = v;
  }
  return out;
}

function readMock(): Requirements {
  if (typeof window === "undefined") return FALLBACK_REQUIREMENTS;
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as Requirements) : FALLBACK_REQUIREMENTS;
  } catch {
    return FALLBACK_REQUIREMENTS;
  }
}

function writeMock(req: Requirements) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(req));
  } catch {
    /* ignore */
  }
}

/** The member's requirement: their own value, else the role default. */
export function requiredFor(
  req: Requirements,
  email: string | null | undefined,
  role: string
): number {
  const own = email ? req.byEmail[normalizeEmail(email)] : undefined;
  if (own !== undefined) return own;
  return role === "pledge" ? req.defaults.pledge : req.defaults.brother;
}

export async function loadRequirements(): Promise<Requirements> {
  if (!isSupabaseConfigured) return readMock();
  const supabase = getSupabase();
  if (!supabase) return FALLBACK_REQUIREMENTS;
  const { data, error } = await supabase
    .from("point_requirements")
    .select("key, required");
  if (error) throw error;
  return fromRows(data ?? []);
}

export async function setDefaultRequirement(kind: DefaultKind, value: number): Promise<void> {
  if (!(value >= 0)) throw new Error("Enter a number of 0 or more.");
  if (!isSupabaseConfigured) {
    const req = readMock();
    writeMock({ ...req, defaults: { ...req.defaults, [kind]: value } });
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("point_requirements")
    .upsert({ key: DEFAULT_KEY[kind], required: value });
  if (error) throw error;
}

/** Set one or more members' own requirement. */
export async function setMemberRequirements(emails: string[], value: number): Promise<void> {
  if (!(value >= 0)) throw new Error("Enter a number of 0 or more.");
  const keys = emails.map(normalizeEmail);
  if (keys.length === 0) return;
  if (!isSupabaseConfigured) {
    const req = readMock();
    const byEmail = { ...req.byEmail };
    for (const k of keys) byEmail[k] = value;
    writeMock({ ...req, byEmail });
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("point_requirements")
    .upsert(keys.map((key) => ({ key, required: value })));
  if (error) throw error;
}

/** Remove a member's own requirement so they fall back to the role default. */
export async function clearMemberRequirement(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!isSupabaseConfigured) {
    const req = readMock();
    const byEmail = { ...req.byEmail };
    delete byEmail[key];
    writeMock({ ...req, byEmail });
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.from("point_requirements").delete().eq("key", key);
  if (error) throw error;
}
