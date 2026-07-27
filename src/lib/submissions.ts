import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { pointsForSubmission } from "@/lib/points";

/**
 * Service-hours / brother-points submissions.
 *
 * Dual implementation, mirroring `roles.ts`:
 *  - Supabase mode (NEXT_PUBLIC_SUPABASE_* set): rows live in the `submissions`
 *    table, proof photos in the `proofs` Storage bucket. Who can read/write what
 *    is enforced by Row-Level Security (see db/submissions.sql), NOT this client.
 *  - Mock mode: everything lives in localStorage so the flow is demoable in the
 *    static preview. ⚠️ Mock mode is per-browser - a pledge's submission will
 *    NOT reach the reviewer on another device. Real cross-user review needs
 *    Supabase to be live.
 */

export type SubmissionStatus = "pending" | "approved" | "denied";

export interface Submission {
  id: string;
  submitterEmail: string;
  submitterName: string;
  categoryId: string;
  eventDescription: string;
  hours: number | null;
  points: number;
  /** Displayable proof image (mock: data URL; Supabase: signed URL). */
  proof: string | null;
  /** Storage path (Supabase only) used to resolve `proof`. */
  proofPath: string | null;
  status: SubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface NewSubmission {
  submitterEmail: string;
  submitterName: string;
  categoryId: string;
  eventDescription: string;
  hours: number | null;
  /** Proof image as a File (from the upload input). */
  proofFile: File | null;
}

const MOCK_KEY = "akpsi.ot.submissions";
const PROOF_BUCKET = "proofs";

function newId(): string {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// --- Mock store ------------------------------------------------------------

function readMock(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

function writeMock(rows: Submission[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be full (data-url proofs are large) */
  }
}

function byNewest(a: Submission, b: Submission) {
  return b.createdAt.localeCompare(a.createdAt);
}

// --- Supabase row mapping --------------------------------------------------

type Row = {
  id: string;
  submitter_email: string;
  submitter_name: string;
  category_id: string;
  event_description: string;
  hours: number | null;
  points: number;
  proof_path: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

async function mapRow(row: Row): Promise<Submission> {
  let proof: string | null = null;
  if (row.proof_path) {
    const supabase = getSupabase();
    const { data } = (await supabase?.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(row.proof_path, 60 * 60)) ?? { data: null };
    proof = data?.signedUrl ?? null;
  }
  return {
    id: row.id,
    submitterEmail: row.submitter_email,
    submitterName: row.submitter_name,
    categoryId: row.category_id,
    eventDescription: row.event_description,
    hours: row.hours,
    points: row.points,
    proof,
    proofPath: row.proof_path,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

// --- Public API ------------------------------------------------------------

export async function createSubmission(input: NewSubmission): Promise<Submission> {
  const points = pointsForSubmission(input.categoryId, input.hours);
  const email = normalizeEmail(input.submitterEmail);

  if (!isSupabaseConfigured) {
    const proof = input.proofFile ? await fileToDataUrl(input.proofFile) : null;
    const record: Submission = {
      id: newId(),
      submitterEmail: email,
      submitterName: input.submitterName,
      categoryId: input.categoryId,
      eventDescription: input.eventDescription.trim(),
      hours: input.hours,
      points,
      proof,
      proofPath: null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };
    writeMock([record, ...readMock()]);
    return record;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");

  let proofPath: string | null = null;
  if (input.proofFile) {
    const ext = input.proofFile.name.split(".").pop() || "jpg";
    proofPath = `${email}/${newId()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(proofPath, input.proofFile, { upsert: false });
    if (upErr) throw upErr;
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      submitter_email: email,
      submitter_name: input.submitterName,
      category_id: input.categoryId,
      event_description: input.eventDescription.trim(),
      hours: input.hours,
      points,
      proof_path: proofPath,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function listMySubmissions(email: string): Promise<Submission[]> {
  const address = normalizeEmail(email);
  if (!isSupabaseConfigured) {
    return readMock()
      .filter((s) => s.submitterEmail === address)
      .sort(byNewest);
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("submitter_email", address)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((r) => mapRow(r as Row)));
}

/** Reviewer view: every submission. RLS restricts this to managers/VP-Ops. */
export async function listAllSubmissions(): Promise<Submission[]> {
  if (!isSupabaseConfigured) {
    return readMock().sort(byNewest);
  }
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((r) => mapRow(r as Row)));
}

export async function reviewSubmission(
  id: string,
  status: Exclude<SubmissionStatus, "pending">,
  reviewerEmail: string
): Promise<void> {
  const reviewer = normalizeEmail(reviewerEmail);
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((s) => s.id === id);
    if (row) {
      row.status = status;
      row.reviewedBy = reviewer;
      row.reviewedAt = new Date().toISOString();
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("submissions")
    .update({
      status,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Approved points a set of submissions is worth. */
export function approvedPoints(submissions: Submission[]): number {
  return submissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.points, 0);
}

export function pendingCount(submissions: Submission[]): number {
  return submissions.filter((s) => s.status === "pending").length;
}
