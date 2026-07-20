import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Canonical portal roles, ordered from least to most privileged. `president`
 * and `admin` are the only roles allowed to manage the roster (see
 * `canManageRoles` and the Row-Level Security policies in db/schema.sql).
 */
export type MemberRole = "pledge" | "active" | "board" | "president" | "admin";

export const MEMBER_ROLES: MemberRole[] = [
  "pledge",
  "active",
  "board",
  "president",
  "admin",
];

export const ROLE_META: Record<
  MemberRole,
  { label: string; blurb: string }
> = {
  pledge: { label: "Pledge", blurb: "Pledge calendar, resources, cohort updates." },
  active: { label: "Active brother", blurb: "Events, directory, documents, announcements." },
  board: { label: "E-Board", blurb: "Applications, e-board content, publishing." },
  president: { label: "President", blurb: "Everything the e-board can do, plus managing who has access." },
  admin: { label: "Admin (Tech)", blurb: "Full command center access." },
};

/** Roles that may add/remove members and change roles. */
export function canManageRoles(role: MemberRole | null | undefined): boolean {
  return role === "president" || role === "admin";
}

export function roleName(role: MemberRole): string {
  return ROLE_META[role]?.label ?? role;
}

export interface MemberRecord {
  email: string;
  fullName: string;
  role: MemberRole;
  addedBy: string | null;
  updatedAt: string | null;
}

// --- Mock store (used when Supabase is not configured) --------------------
// Keeps the static preview fully functional: the roster lives in localStorage
// so the Role Management screen can be exercised end to end before any backend
// exists. Swapped out automatically once NEXT_PUBLIC_SUPABASE_* are set.

const MOCK_KEY = "akpsi.ot.roster";

const MOCK_SEED: MemberRecord[] = [
  { email: "president@rutgers.edu", fullName: "Chapter President", role: "president", addedBy: "seed", updatedAt: null },
  { email: "admin@rutgers.edu", fullName: "Chapter Admin", role: "admin", addedBy: "seed", updatedAt: null },
  { email: "tech@rutgers.edu", fullName: "Tech Chair", role: "admin", addedBy: "seed", updatedAt: null },
  { email: "member@rutgers.edu", fullName: "Active Brother", role: "active", addedBy: "seed", updatedAt: null },
  { email: "pledge@rutgers.edu", fullName: "New Pledge", role: "pledge", addedBy: "seed", updatedAt: null },
];

function readMock(): MemberRecord[] {
  if (typeof window === "undefined") return [...MOCK_SEED];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    if (!raw) {
      window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_SEED));
      return [...MOCK_SEED];
    }
    return JSON.parse(raw) as MemberRecord[];
  } catch {
    return [...MOCK_SEED];
  }
}

function writeMock(rows: MemberRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sortRoster(rows: MemberRecord[]): MemberRecord[] {
  const rank = (r: MemberRole) => MEMBER_ROLES.indexOf(r);
  return [...rows].sort(
    (a, b) => rank(b.role) - rank(a.role) || a.email.localeCompare(b.email)
  );
}

// --- Public data-access API -----------------------------------------------
// Every function works in both modes. In mock mode "president-only" is only a
// UI convenience; in Supabase mode it is enforced by RLS regardless of client.

export async function listMembers(): Promise<MemberRecord[]> {
  if (!isSupabaseConfigured) return sortRoster(readMock());

  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("members")
    .select("email, full_name, role, added_by, updated_at");
  if (error) throw error;
  return sortRoster(
    (data ?? []).map((row) => ({
      email: row.email as string,
      fullName: (row.full_name as string) ?? "",
      role: row.role as MemberRole,
      addedBy: (row.added_by as string) ?? null,
      updatedAt: (row.updated_at as string) ?? null,
    }))
  );
}

/**
 * Look up a single roster entry by email. Returns null when the address is not
 * on the roster — which, in Supabase mode, is the signal that an authenticated
 * user is not (or no longer) an allowed member and should be signed out.
 */
export async function lookupMember(email: string): Promise<MemberRecord | null> {
  const address = normalizeEmail(email);
  if (!isSupabaseConfigured) {
    return readMock().find((m) => m.email === address) ?? null;
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("members")
    .select("email, full_name, role, added_by, updated_at")
    .eq("email", address)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    email: data.email as string,
    fullName: (data.full_name as string) ?? "",
    role: data.role as MemberRole,
    addedBy: (data.added_by as string) ?? null,
    updatedAt: (data.updated_at as string) ?? null,
  };
}

export async function upsertMember(input: {
  email: string;
  fullName: string;
  role: MemberRole;
  actorEmail?: string | null;
}): Promise<MemberRecord> {
  const email = normalizeEmail(input.email);
  if (!email.endsWith("@rutgers.edu")) {
    throw new Error("Only @rutgers.edu addresses can be added to the roster.");
  }
  const record: MemberRecord = {
    email,
    fullName: input.fullName.trim(),
    role: input.role,
    addedBy: input.actorEmail ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const rows = readMock();
    const existing = rows.find((m) => m.email === email);
    if (existing) {
      existing.fullName = record.fullName;
      existing.role = record.role;
      existing.updatedAt = record.updatedAt;
    } else {
      rows.push(record);
    }
    writeMock(rows);
    return record;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { data, error } = await supabase
    .from("members")
    .upsert(
      {
        email,
        full_name: record.fullName,
        role: record.role,
        added_by: record.addedBy,
        updated_at: record.updatedAt,
      },
      { onConflict: "email" }
    )
    .select("email, full_name, role, added_by, updated_at")
    .single();
  if (error) throw error;
  return {
    email: data.email as string,
    fullName: (data.full_name as string) ?? "",
    role: data.role as MemberRole,
    addedBy: (data.added_by as string) ?? null,
    updatedAt: (data.updated_at as string) ?? null,
  };
}

export async function removeMember(email: string): Promise<void> {
  const address = normalizeEmail(email);
  if (!isSupabaseConfigured) {
    writeMock(readMock().filter((m) => m.email !== address));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.from("members").delete().eq("email", address);
  if (error) throw error;
}
