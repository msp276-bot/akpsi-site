import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  applications as MOCK_SEED,
  type RushApplication,
} from "@/data/applications";

/**
 * Rush application pipeline.
 *
 *  - Public applicants SUBMIT (insert + optional resume upload) with the anon
 *    key; RLS lets them insert but not read (see db/rush-applications.sql).
 *  - Reviewers (board/president/admin) LIST applications and record keep/pass
 *    decisions; resumes come back as short-lived signed URLs.
 *  - Mock mode (no Supabase env) uses localStorage + the seed deck so the whole
 *    flow is demoable in preview.
 */

export type Decision = "keep" | "pass";

export interface NewApplication {
  fullName: string;
  email: string;
  phone?: string;
  gradYear?: number;
  major: string;
  gpa?: string;
  referralSource?: string;
  pitch?: string;
  resumeFile?: File | null;
}

const MOCK_KEY = "akpsi.ot.applications";
const RESUME_BUCKET = "resumes";

function newId(): string {
  return `app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Mock store ------------------------------------------------------------

function readMock(): RushApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as RushApplication[]) : [];
  } catch {
    return [];
  }
}

function writeMock(rows: RushApplication[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be full */
  }
}

// --- Supabase row mapping --------------------------------------------------

type Row = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  grad_year: number | null;
  major: string | null;
  gpa: string | null;
  referral_source: string | null;
  pitch: string | null;
  resume_path: string | null;
  status: RushApplication["status"];
  decision: Decision | null;
  reviewer: string | null;
  created_at: string;
};

async function mapRow(row: Row): Promise<RushApplication> {
  let resumeUrl: string | undefined;
  if (row.resume_path) {
    const supabase = getSupabase();
    const { data } = (await supabase?.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(row.resume_path, 60 * 60)) ?? { data: null };
    resumeUrl = data?.signedUrl ?? undefined;
  }
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    gradYear: row.grad_year ?? 0,
    major: row.major ?? "",
    gpa: row.gpa ?? "",
    status: row.status,
    submittedAt: row.created_at,
    referralSource: row.referral_source ?? "",
    reviewer: row.reviewer ?? undefined,
    resumeUrl,
    pitch: row.pitch ?? undefined,
    decision: row.decision,
  };
}

// --- Public API ------------------------------------------------------------

/** Submit a rush application (public / logged-out). */
export async function submitApplication(input: NewApplication): Promise<void> {
  const email = input.email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const record: RushApplication = {
      id: newId(),
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      gradYear: input.gradYear ?? 0,
      major: input.major.trim(),
      gpa: input.gpa?.trim() || "",
      status: "pending",
      submittedAt: new Date().toISOString(),
      referralSource: input.referralSource?.trim() || "",
      pitch: input.pitch?.trim() || undefined,
      decision: null,
    };
    writeMock([record, ...readMock()]);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");

  let resumePath: string | null = null;
  if (input.resumeFile) {
    const ext = input.resumeFile.name.split(".").pop() || "pdf";
    resumePath = `${newId()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(resumePath, input.resumeFile, { upsert: false });
    if (upErr) throw upErr;
  }

  const { error } = await supabase.from("rush_applications").insert({
    full_name: input.fullName.trim(),
    email,
    phone: input.phone?.trim() || null,
    grad_year: input.gradYear ?? null,
    major: input.major.trim(),
    gpa: input.gpa?.trim() || null,
    referral_source: input.referralSource?.trim() || null,
    pitch: input.pitch?.trim() || null,
    resume_path: resumePath,
  });
  if (error) throw error;
}

/** Reviewer view: every application (RLS limits this to board/president/admin). */
export async function listApplications(): Promise<RushApplication[]> {
  if (!isSupabaseConfigured) {
    // Seed deck + anything submitted locally in this browser.
    return [...readMock(), ...MOCK_SEED];
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("rush_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((r) => mapRow(r as Row)));
}

/** President records a keep/pass decision. */
export async function setApplicationDecision(
  id: string,
  decision: Decision,
  reviewerEmail: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((r) => r.id === id);
    if (row) {
      row.decision = decision;
      row.reviewer = reviewerEmail;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("rush_applications")
    .update({ decision, reviewer: reviewerEmail })
    .eq("id", id);
  if (error) throw error;
}
