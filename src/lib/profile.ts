import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Member self-edit profiles. A member proposes changes to their own major /
 * company / LinkedIn / photo; nothing goes live until a president/admin approves.
 * Writes go through SECURITY DEFINER RPCs (see db/member-profiles.sql) so a
 * member can only touch their own pending fields. Mock mode uses localStorage so
 * the flow is demoable in preview.
 */

const MOCK_KEY = "akpsi.ot.profiles";
const AVATAR_BUCKET = "avatars";

export interface MemberProfile {
  email: string;
  major: string | null;
  company: string | null;
  linkedin: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  pendingMajor: string | null;
  pendingCompany: string | null;
  pendingLinkedin: string | null;
  pendingPhotoPath: string | null;
  pendingPhotoUrl: string | null;
  hasPending: boolean;
}

export interface ApprovedProfile {
  email: string;
  major: string | null;
  company: string | null;
  linkedin: string | null;
  photoUrl: string | null;
}

export interface ProfileEditInput {
  major: string;
  company: string;
  linkedin: string;
  /** A newly picked photo, or null to keep the current one. */
  photoFile: File | null;
  /** The photo_path already on file (kept when no new photo is picked). */
  currentPhotoPath: string | null;
}

type Row = {
  email: string;
  major: string | null;
  company: string | null;
  linkedin: string | null;
  photo_path: string | null;
  pending_major: string | null;
  pending_company: string | null;
  pending_linkedin: string | null;
  pending_photo_path: string | null;
  has_pending: boolean;
};

// --- Mock store ------------------------------------------------------------

function readMock(): Row[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as Row[]) : [];
  } catch {
    return [];
  }
}

function writeMock(rows: Row[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be full (data-url photos are large) */
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// avatars is a public bucket: photo_path resolves to a stable public URL. In
// mock mode the path IS a data URL, so return it as-is.
function photoUrl(path: string | null): string | null {
  if (!path) return null;
  if (!isSupabaseConfigured || path.startsWith("data:")) return path;
  const supabase = getSupabase();
  return supabase?.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl ?? null;
}

function mapRow(row: Row): MemberProfile {
  return {
    email: row.email,
    major: row.major,
    company: row.company,
    linkedin: row.linkedin,
    photoPath: row.photo_path,
    photoUrl: photoUrl(row.photo_path),
    pendingMajor: row.pending_major,
    pendingCompany: row.pending_company,
    pendingLinkedin: row.pending_linkedin,
    pendingPhotoPath: row.pending_photo_path,
    pendingPhotoUrl: photoUrl(row.pending_photo_path),
    hasPending: row.has_pending,
  };
}

// --- Public API ------------------------------------------------------------

export async function getMyProfile(email: string): Promise<MemberProfile | null> {
  const me = email.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const row = readMock().find((r) => r.email === me);
    return row ? mapRow(row) : null;
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("email", me)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function submitProfileEdit(
  email: string,
  input: ProfileEditInput
): Promise<void> {
  const me = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const photoPath = input.photoFile
      ? await fileToDataUrl(input.photoFile)
      : input.currentPhotoPath;
    const rows = readMock();
    const existing = rows.find((r) => r.email === me);
    const next: Row = {
      email: me,
      major: existing?.major ?? null,
      company: existing?.company ?? null,
      linkedin: existing?.linkedin ?? null,
      photo_path: existing?.photo_path ?? null,
      pending_major: input.major.trim() || null,
      pending_company: input.company.trim() || null,
      pending_linkedin: input.linkedin.trim() || null,
      pending_photo_path: photoPath,
      has_pending: true,
    };
    writeMock([next, ...rows.filter((r) => r.email !== me)]);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");

  let photoPath = input.currentPhotoPath;
  if (input.photoFile) {
    const ext = input.photoFile.name.split(".").pop() || "jpg";
    photoPath = `${me}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(photoPath, input.photoFile, { upsert: true });
    if (upErr) throw upErr;
  }

  const { error } = await supabase.rpc("submit_profile_edit", {
    p_major: input.major.trim() || null,
    p_company: input.company.trim() || null,
    p_linkedin: input.linkedin.trim() || null,
    p_photo_path: photoPath,
  });
  if (error) throw error;
}

/** Pending edits awaiting approval (president/admin view). */
export async function listPendingProfiles(): Promise<MemberProfile[]> {
  if (!isSupabaseConfigured) {
    return readMock().filter((r) => r.has_pending).map(mapRow);
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("has_pending", true);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
}

export async function approveProfile(email: string): Promise<void> {
  const target = email.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((r) => r.email === target);
    if (row) {
      row.major = row.pending_major;
      row.company = row.pending_company;
      row.linkedin = row.pending_linkedin;
      row.photo_path = row.pending_photo_path;
      row.pending_major = row.pending_company = row.pending_linkedin = row.pending_photo_path = null;
      row.has_pending = false;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.rpc("approve_profile_edit", { p_email: target });
  if (error) throw error;
}

export async function rejectProfile(email: string): Promise<void> {
  const target = email.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((r) => r.email === target);
    if (row) {
      row.pending_major = row.pending_company = row.pending_linkedin = row.pending_photo_path = null;
      row.has_pending = false;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.rpc("reject_profile_edit", { p_email: target });
  if (error) throw error;
}

/** Approved (live) profile overrides, for layering onto the directory. */
export async function listApprovedProfiles(): Promise<ApprovedProfile[]> {
  if (!isSupabaseConfigured) {
    return readMock()
      .filter((r) => r.major || r.company || r.linkedin || r.photo_path)
      .map((r) => ({
        email: r.email,
        major: r.major,
        company: r.company,
        linkedin: r.linkedin,
        photoUrl: photoUrl(r.photo_path),
      }));
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("member_profiles")
    .select("email, major, company, linkedin, photo_path");
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Pick<Row, "email" | "major" | "company" | "linkedin" | "photo_path">;
    return {
      email: row.email,
      major: row.major,
      company: row.company,
      linkedin: row.linkedin,
      photoUrl: photoUrl(row.photo_path),
    };
  });
}
