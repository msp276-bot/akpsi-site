import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Visibility } from "@/lib/access";

/**
 * Chapter announcements. E-board (board/president/admin) creates, edits, and
 * deletes posts; every member reads the ones their role is allowed to see. Who
 * can write is enforced by Row-Level Security (see db/portal-content.sql), NOT
 * here.
 *
 * Dual implementation, mirroring lib/events.ts:
 *  - Supabase mode: rows in the `announcements` table.
 *  - Mock mode: localStorage, so the flow is demoable in the static preview.
 */

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorEmail: string | null;
  authorName: string;
  pinned: boolean;
  visibility: Visibility;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface NewAnnouncement {
  title: string;
  body: string;
  visibility: Visibility;
  pinned: boolean;
}

const MOCK_KEY = "akpsi.ot.announcements";

function newId(): string {
  return `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

const MOCK_SEED: Announcement[] = [
  {
    id: "ann_seed_rush",
    title: "Fall '26 Recruitment Kicks Off Monday",
    body: "Our first info session is this Monday at 6PM in the Business School, Room 1140. Please share the flyer with anyone who might be interested and show up to represent the chapter. Let's make this our biggest rush class yet!",
    authorEmail: null,
    authorName: "Sofia Romano",
    pinned: true,
    visibility: "members",
    likes: 24,
    comments: 6,
    createdAt: iso(120),
  },
  {
    id: "ann_seed_resume",
    title: "Resume Workshop - Bring a Printed Copy",
    body: "Reminder that Wednesday's alumni resume workshop is hands-on. Bring a printed copy of your resume (or two) so our alumni mentors can mark it up with you directly.",
    authorEmail: null,
    authorName: "Marcus Lee",
    pinned: false,
    visibility: "members",
    likes: 18,
    comments: 3,
    createdAt: iso(60 * 26),
  },
  {
    id: "ann_seed_dues",
    title: "Dues Deadline Extended to July 31",
    body: "We've extended the semester dues deadline to July 31. If you're running into any issues, reach out to me directly and we'll sort it out. Thanks all.",
    authorEmail: null,
    authorName: "Ethan Cohen",
    pinned: false,
    visibility: "active",
    likes: 31,
    comments: 9,
    createdAt: iso(60 * 24 * 3),
  },
  {
    id: "ann_seed_pledge",
    title: "Pledge Cohort Checkpoint",
    body: "Pledges: your next checkpoint is posted in documents. Please review the interview prep guide before the values workshop.",
    authorEmail: null,
    authorName: "Sofia Romano",
    pinned: false,
    visibility: "pledge",
    likes: 12,
    comments: 2,
    createdAt: iso(60 * 5),
  },
  {
    id: "ann_seed_board",
    title: "Board Coverage for Rush Interviews",
    body: "E-board: update your availability before Friday so we can finalize interview rooms, attendance owners, and evaluator pairings.",
    authorEmail: null,
    authorName: "Ava Thompson",
    pinned: false,
    visibility: "eboard",
    likes: 7,
    comments: 4,
    createdAt: iso(65),
  },
];

function readMock(): Announcement[] {
  if (typeof window === "undefined") return [...MOCK_SEED];
  try {
    const raw = window.localStorage.getItem(MOCK_KEY);
    if (!raw) {
      window.localStorage.setItem(MOCK_KEY, JSON.stringify(MOCK_SEED));
      return [...MOCK_SEED];
    }
    return JSON.parse(raw) as Announcement[];
  } catch {
    return [...MOCK_SEED];
  }
}

function writeMock(rows: Announcement[]) {
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
  body: string;
  author_email: string | null;
  author_name: string;
  pinned: boolean;
  visibility: Visibility;
  likes: number;
  comments: number;
  created_at: string;
};

function mapRow(row: Row): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    authorEmail: row.author_email,
    authorName: row.author_name ?? "",
    pinned: row.pinned,
    visibility: row.visibility,
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    createdAt: row.created_at,
  };
}

function sortPosts(rows: Announcement[]): Announcement[] {
  return [...rows].sort(
    (a, b) =>
      Number(!!b.pinned) - Number(!!a.pinned) ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

// --- Public API ------------------------------------------------------------

/** All announcements the caller may read (RLS filters by visibility). */
export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured) return sortPosts(readMock());
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return sortPosts((data ?? []).map((r) => mapRow(r as Row)));
}

export async function createAnnouncement(
  input: NewAnnouncement,
  actorName?: string | null
): Promise<Announcement> {
  if (!isSupabaseConfigured) {
    const record: Announcement = {
      id: newId(),
      title: input.title.trim(),
      body: input.body.trim(),
      authorEmail: null,
      authorName: actorName ?? "Admin",
      pinned: input.pinned,
      visibility: input.visibility,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    writeMock([record, ...readMock()]);
    return record;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      pinned: input.pinned,
      visibility: input.visibility,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<NewAnnouncement>
): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = readMock();
    const row = rows.find((p) => p.id === id);
    if (row) {
      if (patch.title !== undefined) row.title = patch.title.trim();
      if (patch.body !== undefined) row.body = patch.body.trim();
      if (patch.visibility !== undefined) row.visibility = patch.visibility;
      if (patch.pinned !== undefined) row.pinned = patch.pinned;
      writeMock(rows);
    }
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.body !== undefined) dbPatch.body = patch.body.trim();
  if (patch.visibility !== undefined) dbPatch.visibility = patch.visibility;
  if (patch.pinned !== undefined) dbPatch.pinned = patch.pinned;
  const { error } = await supabase.from("announcements").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeMock(readMock().filter((p) => p.id !== id));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Backend unavailable.");
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
