import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Visibility } from "@/lib/access";
import type { EventType } from "@/data/events";

/**
 * Chapter calendar events + their RSVPs. E-board (board/president/admin) creates,
 * edits, and deletes events, and can add or remove ANY member from an event's
 * attendee list. A member sets their own RSVP status. The "going" count shown on
 * the calendar is DERIVED from the RSVP rows, never stored on the event. Who can
 * write is enforced by Row-Level Security (db/portal-content.sql), NOT here.
 *
 * Dual implementation, mirroring lib/events.ts:
 *  - Supabase mode: `chapter_events` + `event_rsvps` tables.
 *  - Mock mode: localStorage, so the flow is demoable in the static preview.
 */

export type RsvpStatus = "going" | "maybe" | "declined" | "waitlist";

export interface ChapterEventRecord {
  id: string;
  title: string;
  /** ISO datetime. */
  start: string;
  end: string | null;
  location: string;
  type: EventType;
  description: string;
  mapUrl: string | null;
  maxAttendees: number | null;
  requiresRsvp: boolean;
  visibility: Visibility;
  createdBy: string | null;
  createdAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  memberEmail: string;
  memberName: string;
  status: RsvpStatus;
}

export interface NewChapterEvent {
  title: string;
  start: string;
  end?: string | null;
  location: string;
  type: EventType;
  description: string;
  mapUrl?: string | null;
  maxAttendees?: number | null;
  requiresRsvp: boolean;
  visibility: Visibility;
}

const EVENTS_KEY = "akpsi.ot.chapter_events";
const RSVPS_KEY = "akpsi.ot.event_rsvps";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoInDays(days: number, hour = 18): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const MOCK_EVENTS_SEED: ChapterEventRecord[] = [
  {
    id: "cev_seed_rush",
    title: "Fall Rush Info Session",
    start: isoInDays(3),
    end: isoInDays(3, 19),
    location: "Business School, Room 1140",
    type: "recruitment",
    description: "Kick off the recruitment cycle. Meet the brothers and learn what AKPsi is about.",
    mapUrl: "https://maps.google.com/?q=Rutgers+Business+School",
    maxAttendees: null,
    requiresRsvp: true,
    visibility: "public",
    createdBy: "seed",
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "cev_seed_resume",
    title: "Resume Workshop with Alumni",
    start: isoInDays(6, 19),
    end: isoInDays(6, 20),
    location: "Livingston Student Center",
    type: "professional",
    description: "Bring your resume for one-on-one reviews with alumni in consulting, finance, and tech.",
    mapUrl: null,
    maxAttendees: 30,
    requiresRsvp: true,
    visibility: "members",
    createdBy: "seed",
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "cev_seed_meeting",
    title: "Weekly Chapter Meeting",
    start: isoInDays(9, 19),
    end: isoInDays(9, 20),
    location: "Business School, Room 1050",
    type: "general",
    description: "Standing weekly meeting: committee updates, announcements, and planning.",
    mapUrl: null,
    maxAttendees: null,
    requiresRsvp: true,
    visibility: "active",
    createdBy: "seed",
    createdAt: new Date(0).toISOString(),
  },
];

const MOCK_RSVPS_SEED: EventRsvp[] = [
  { id: "rsvp_s1", eventId: "cev_seed_rush", memberEmail: "member@rutgers.edu", memberName: "Active Brother", status: "going" },
  { id: "rsvp_s2", eventId: "cev_seed_rush", memberEmail: "ops@rutgersakpsi.org", memberName: "Prakruti Ankem", status: "going" },
  { id: "rsvp_s3", eventId: "cev_seed_resume", memberEmail: "member@rutgers.edu", memberName: "Active Brother", status: "going" },
];

function readEventsMock(): ChapterEventRecord[] {
  if (typeof window === "undefined") return [...MOCK_EVENTS_SEED];
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      window.localStorage.setItem(EVENTS_KEY, JSON.stringify(MOCK_EVENTS_SEED));
      return [...MOCK_EVENTS_SEED];
    }
    return JSON.parse(raw) as ChapterEventRecord[];
  } catch {
    return [...MOCK_EVENTS_SEED];
  }
}

function writeEventsMock(rows: ChapterEventRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
}

function readRsvpsMock(): EventRsvp[] {
  if (typeof window === "undefined") return [...MOCK_RSVPS_SEED];
  try {
    const raw = window.localStorage.getItem(RSVPS_KEY);
    if (!raw) {
      window.localStorage.setItem(RSVPS_KEY, JSON.stringify(MOCK_RSVPS_SEED));
      return [...MOCK_RSVPS_SEED];
    }
    return JSON.parse(raw) as EventRsvp[];
  } catch {
    return [...MOCK_RSVPS_SEED];
  }
}

function writeRsvpsMock(rows: EventRsvp[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RSVPS_KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
}

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  type: EventType;
  description: string;
  map_url: string | null;
  max_attendees: number | null;
  requires_rsvp: boolean;
  visibility: Visibility;
  created_by: string | null;
  created_at: string;
};

type RsvpRow = {
  id: string;
  event_id: string;
  member_email: string;
  member_name: string;
  status: RsvpStatus;
};

function mapEvent(row: EventRow): ChapterEventRecord {
  return {
    id: row.id,
    title: row.title,
    start: row.starts_at,
    end: row.ends_at,
    location: row.location ?? "",
    type: row.type,
    description: row.description ?? "",
    mapUrl: row.map_url,
    maxAttendees: row.max_attendees,
    requiresRsvp: row.requires_rsvp,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapRsvp(row: RsvpRow): EventRsvp {
  return {
    id: row.id,
    eventId: row.event_id,
    memberEmail: row.member_email,
    memberName: row.member_name ?? "",
    status: row.status,
  };
}

function eventPatchToDb(patch: Partial<NewChapterEvent>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (patch.title !== undefined) db.title = patch.title.trim();
  if (patch.start !== undefined) db.starts_at = patch.start;
  if (patch.end !== undefined) db.ends_at = patch.end;
  if (patch.location !== undefined) db.location = patch.location.trim();
  if (patch.type !== undefined) db.type = patch.type;
  if (patch.description !== undefined) db.description = patch.description.trim();
  if (patch.mapUrl !== undefined) db.map_url = patch.mapUrl;
  if (patch.maxAttendees !== undefined) db.max_attendees = patch.maxAttendees;
  if (patch.requiresRsvp !== undefined) db.requires_rsvp = patch.requiresRsvp;
  if (patch.visibility !== undefined) db.visibility = patch.visibility;
  return db;
}

// --- Events ----------------------------------------------------------------

export async function listChapterEvents(): Promise<ChapterEventRecord[]> {
  if (!isSupabaseConfigured) return readEventsMock();
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chapter_events")
    .select("*")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapEvent(r as EventRow));
}

export async function createChapterEvent(input: NewChapterEvent): Promise<ChapterEventRecord> {
  if (!isSupabaseConfigured) {
    const record: ChapterEventRecord = {
      id: newId("cev"),
      title: input.title.trim(),
      start: input.start,
      end: input.end ?? null,
      location: input.location.trim() || "Location TBA",
      type: input.type,
      description: input.description.trim(),
      mapUrl: input.mapUrl ?? null,
      maxAttendees: input.maxAttendees ?? null,
      requiresRsvp: input.requiresRsvp,
      visibility: input.visibility,
      createdBy: "you",
      createdAt: new Date().toISOString(),
    };
    writeEventsMock([...readEventsMock(), record]);
    return record;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { data, error } = await supabase
    .from("chapter_events")
    .insert({
      title: input.title.trim(),
      starts_at: input.start,
      ends_at: input.end ?? null,
      location: input.location.trim() || "Location TBA",
      type: input.type,
      description: input.description.trim(),
      map_url: input.mapUrl ?? null,
      max_attendees: input.maxAttendees ?? null,
      requires_rsvp: input.requiresRsvp,
      visibility: input.visibility,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function updateChapterEvent(id: string, patch: Partial<NewChapterEvent>): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readEventsMock();
    const row = rows.find((e) => e.id === id);
    if (row) {
      if (patch.title !== undefined) row.title = patch.title.trim();
      if (patch.start !== undefined) row.start = patch.start;
      if (patch.end !== undefined) row.end = patch.end ?? null;
      if (patch.location !== undefined) row.location = patch.location.trim();
      if (patch.type !== undefined) row.type = patch.type;
      if (patch.description !== undefined) row.description = patch.description.trim();
      if (patch.mapUrl !== undefined) row.mapUrl = patch.mapUrl ?? null;
      if (patch.maxAttendees !== undefined) row.maxAttendees = patch.maxAttendees ?? null;
      if (patch.requiresRsvp !== undefined) row.requiresRsvp = patch.requiresRsvp;
      if (patch.visibility !== undefined) row.visibility = patch.visibility;
      writeEventsMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.from("chapter_events").update(eventPatchToDb(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteChapterEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeEventsMock(readEventsMock().filter((e) => e.id !== id));
    writeRsvpsMock(readRsvpsMock().filter((r) => r.eventId !== id));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  // RSVPs cascade-delete with the event (on delete cascade).
  const { error } = await supabase.from("chapter_events").delete().eq("id", id);
  if (error) throw error;
}

// --- RSVPs -----------------------------------------------------------------

export async function listRsvps(): Promise<EventRsvp[]> {
  if (!isSupabaseConfigured) return readRsvpsMock();
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("event_rsvps").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => mapRsvp(r as RsvpRow));
}

/** Upsert an RSVP for a given member (self, or e-board acting for someone). */
export async function setRsvp(
  eventId: string,
  memberEmail: string,
  status: RsvpStatus,
  memberName?: string
): Promise<void> {
  const email = memberEmail.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const rows = readRsvpsMock();
    const existing = rows.find((r) => r.eventId === eventId && r.memberEmail === email);
    if (existing) {
      existing.status = status;
      if (memberName) existing.memberName = memberName;
    } else {
      rows.push({
        id: newId("rsvp"),
        eventId,
        memberEmail: email,
        memberName: memberName ?? email,
        status,
      });
    }
    writeRsvpsMock(rows);
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, member_email: email, status, member_name: memberName ?? "" },
      { onConflict: "event_id,member_email" }
    );
  if (error) throw error;
}

/** Remove a member from an event's RSVP list (self, or e-board for anyone). */
export async function removeRsvp(eventId: string, memberEmail: string): Promise<void> {
  const email = memberEmail.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    writeRsvpsMock(readRsvpsMock().filter((r) => !(r.eventId === eventId && r.memberEmail === email)));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("member_email", email);
  if (error) throw error;
}

// --- Helpers ---------------------------------------------------------------

/** Count of members marked "going" for an event. */
export function goingCount(rsvps: EventRsvp[], eventId: string): number {
  return rsvps.filter((r) => r.eventId === eventId && r.status === "going").length;
}

export function rsvpsForEvent(rsvps: EventRsvp[], eventId: string): EventRsvp[] {
  return rsvps.filter((r) => r.eventId === eventId);
}
