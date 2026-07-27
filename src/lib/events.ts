import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Point-events catalog. VP Ops (board/president/admin) creates events worth a
 * fixed number of points; brothers pick one when submitting for points. Who can
 * write is enforced by Row-Level Security (see db/submissions.sql), NOT here.
 *
 * Dual implementation, mirroring roles.ts / submissions.ts:
 *  - Supabase mode: rows in the `point_events` table.
 *  - Mock mode: localStorage, so the flow is demoable in the static preview.
 */

export interface PointEvent {
  id: string;
  title: string;
  pointsValue: number;
  description: string;
  /** ISO date (yyyy-mm-dd) or null. */
  eventDate: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface NewPointEvent {
  title: string;
  pointsValue: number;
  description: string;
  eventDate: string | null;
}

const MOCK_KEY = "akpsi.ot.point_events";

function newId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const MOCK_SEED: PointEvent[] = [
  {
    id: "evt_seed_workshop",
    title: "Professional Workshop",
    pointsValue: 2,
    description: "Resume, interview, or industry workshops.",
    eventDate: null,
    active: true,
    createdBy: "seed",
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "evt_seed_social",
    title: "Chapter Social",
    pointsValue: 1,
    description: "Brotherhood socials and retreats.",
    eventDate: null,
    active: true,
    createdBy: "seed",
    createdAt: new Date(0).toISOString(),
  },
];

function readMock(): PointEvent[] {
  if (typeof window === "undefined") return [...MOCK_SEED];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    if (!raw) {
      window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_SEED));
      return [...MOCK_SEED];
    }
    return JSON.parse(raw) as PointEvent[];
  } catch {
    return [...MOCK_SEED];
  }
}

function writeMock(rows: PointEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
}

type Row = {
  id: string;
  title: string;
  points_value: number;
  description: string;
  event_date: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
};

function mapRow(row: Row): PointEvent {
  return {
    id: row.id,
    title: row.title,
    pointsValue: Number(row.points_value),
    description: row.description ?? "",
    eventDate: row.event_date,
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function sortEvents(rows: PointEvent[]): PointEvent[] {
  // Active first, then newest.
  return [...rows].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt)
  );
}

// --- Public API ------------------------------------------------------------

/** All events (reviewer view). Includes inactive ones. */
export async function listEvents(): Promise<PointEvent[]> {
  if (!isSupabaseConfigured) return sortEvents(readMock());
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("point_events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return sortEvents((data ?? []).map((r) => mapRow(r as Row)));
}

/** Only active events (what brothers can submit against). */
export async function listActiveEvents(): Promise<PointEvent[]> {
  return (await listEvents()).filter((e) => e.active);
}

export async function createEvent(
  input: NewPointEvent,
  actorEmail?: string | null
): Promise<PointEvent> {
  if (!isSupabaseConfigured) {
    const record: PointEvent = {
      id: newId(),
      title: input.title.trim(),
      pointsValue: Math.max(0, input.pointsValue),
      description: input.description.trim(),
      eventDate: input.eventDate,
      active: true,
      createdBy: actorEmail ?? "you",
      createdAt: new Date().toISOString(),
    };
    writeMock([record, ...readMock()]);
    return record;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { data, error } = await supabase
    .from("point_events")
    .insert({
      title: input.title.trim(),
      points_value: Math.max(0, input.pointsValue),
      description: input.description.trim(),
      event_date: input.eventDate,
      created_by: actorEmail ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateEvent(
  id: string,
  patch: Partial<NewPointEvent> & { active?: boolean }
): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((e) => e.id === id);
    if (row) {
      if (patch.title !== undefined) row.title = patch.title.trim();
      if (patch.pointsValue !== undefined) row.pointsValue = Math.max(0, patch.pointsValue);
      if (patch.description !== undefined) row.description = patch.description.trim();
      if (patch.eventDate !== undefined) row.eventDate = patch.eventDate;
      if (patch.active !== undefined) row.active = patch.active;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.pointsValue !== undefined) dbPatch.points_value = Math.max(0, patch.pointsValue);
  if (patch.description !== undefined) dbPatch.description = patch.description.trim();
  if (patch.eventDate !== undefined) dbPatch.event_date = patch.eventDate;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  const { error } = await supabase.from("point_events").update(dbPatch).eq("id", id);
  if (error) throw error;
}

/**
 * Hard-delete an event. In Supabase this fails (on delete restrict) if any
 * submission references it - deactivate instead. The caller surfaces that.
 */
export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeMock(readMock().filter((e) => e.id !== id));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.from("point_events").delete().eq("id", id);
  if (error) throw error;
}
