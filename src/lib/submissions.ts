import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Points & service-hours submissions.
 *
 * Two kinds of submission (see db/submissions.sql), tallied separately:
 *  - type "points": links a `point_events` catalog entry. The point value is
 *    decided SERVER-SIDE by the event (the client-sent value is ignored).
 *  - type "service_hours": free-form (org/what + hours). Counted as hours.
 *
 * Dual implementation:
 *  - Supabase mode: rows in `submissions`, proof photos in the `proofs` bucket.
 *    Read/write is enforced by Row-Level Security, NOT this client.
 *  - Mock mode: localStorage, per-browser (a behaviour demo, not shared).
 */

export type SubmissionStatus = "pending" | "approved" | "denied";
export type SubmissionType = "service_hours" | "points";

export interface Submission {
  id: string;
  submitterEmail: string;
  submitterName: string;
  type: SubmissionType;
  /** Linked event (points submissions) or null (service hours). */
  eventId: string | null;
  /** Event title for display (joined in Supabase; carried in mock). */
  eventTitle: string | null;
  /** Service: what/where. Points: optional note. */
  eventDescription: string;
  hours: number | null;
  points: number;
  /** Displayable proof image (mock: data URL; Supabase: signed URL). */
  proof: string | null;
  proofPath: string | null;
  status: SubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface NewSubmission {
  submitterEmail: string;
  submitterName: string;
  type: SubmissionType;
  /** points only: the chosen event. */
  eventId: string | null;
  /** points only: title + value, used for the mock store and optimistic UI. */
  eventTitle: string | null;
  pointsValue: number;
  eventDescription: string;
  /** service only. */
  hours: number | null;
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
  type: SubmissionType;
  event_id: string | null;
  event_description: string;
  hours: number | null;
  points: number;
  proof_path: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  point_events: { title: string } | null;
};

// Select list including the joined event title.
const SELECT = "*, point_events(title)";

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
    type: row.type,
    eventId: row.event_id,
    eventTitle: row.point_events?.title ?? null,
    eventDescription: row.event_description,
    hours: row.hours,
    points: Number(row.points),
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
  const email = normalizeEmail(input.submitterEmail);
  const isPoints = input.type === "points";

  if (!isSupabaseConfigured) {
    const proof = input.proofFile ? await fileToDataUrl(input.proofFile) : null;
    const record: Submission = {
      id: newId(),
      submitterEmail: email,
      submitterName: input.submitterName,
      type: input.type,
      eventId: isPoints ? input.eventId : null,
      eventTitle: isPoints ? input.eventTitle : null,
      eventDescription: input.eventDescription.trim(),
      hours: isPoints ? null : input.hours,
      points: isPoints ? input.pointsValue : 0,
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

  // points/status are computed by the server-side trigger; we don't send them.
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      submitter_email: email,
      submitter_name: input.submitterName,
      type: input.type,
      event_id: isPoints ? input.eventId : null,
      event_description: input.eventDescription.trim(),
      hours: isPoints ? null : input.hours,
      proof_path: proofPath,
    })
    .select(SELECT)
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
    .select(SELECT)
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
    .select(SELECT)
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
  // reviewer/time are stamped by the server-side trigger.
  const { error } = await supabase.from("submissions").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Undo a decision: send an approved/denied submission back to Pending. */
export async function reopenSubmission(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((s) => s.id === id);
    if (row) {
      row.status = "pending";
      row.reviewedBy = null;
      row.reviewedAt = null;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  // Setting status back to 'pending' makes the trigger clear the review stamp.
  const { error } = await supabase
    .from("submissions")
    .update({ status: "pending" })
    .eq("id", id);
  if (error) throw error;
}

/** Approved POINTS (points-type submissions only). */
export function approvedPoints(submissions: Submission[]): number {
  return submissions
    .filter((s) => s.status === "approved" && s.type === "points")
    .reduce((sum, s) => sum + s.points, 0);
}

/** Approved SERVICE HOURS (service-type submissions only). */
export function approvedServiceHours(submissions: Submission[]): number {
  return submissions
    .filter((s) => s.status === "approved" && s.type === "service_hours")
    .reduce((sum, s) => sum + (s.hours ?? 0), 0);
}

export function pendingCount(submissions: Submission[]): number {
  return submissions.filter((s) => s.status === "pending").length;
}
