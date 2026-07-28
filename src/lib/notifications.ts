import { listAnnouncements } from "@/lib/announcements";
import { listChapterEvents } from "@/lib/chapterEvents";
import { canAccessVisibility, type PortalRole } from "@/lib/access";

/**
 * In-app notification feed for the portal bell. It aggregates the two things a
 * member would want a heads-up about - new announcements and upcoming events -
 * filtered to what their role may see, newest first.
 *
 * "Unread" is tracked purely client-side via a last-seen timestamp in
 * localStorage: anything created after the member last opened the bell is
 * unread. The NotificationBell polls this on a timer ("timed pings") and, when
 * new items appear and the member has granted permission, fires a local browser
 * notification. Real device push (even when the app is closed) is a separate,
 * server-driven path in lib/push.ts.
 *
 * Reads are wrapped in try/catch so the bell degrades to empty if the
 * announcements/chapter_events tables are not provisioned yet.
 */

export interface NotificationItem {
  id: string;
  kind: "announcement" | "event";
  title: string;
  /** Short supporting line (announcement preview, or event date + location). */
  meta: string;
  /** ISO timestamp the item was created; drives unread + ordering. */
  createdAt: string;
  href: string;
}

const SEEN_KEY = "akpsi.ot.notifications.lastSeen";
/** Only surface events starting within this window. */
const UPCOMING_WINDOW_DAYS = 14;

export function getLastSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SEEN_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function markAllSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    /* storage may be unavailable */
  }
}

export function isUnread(item: NotificationItem, lastSeen: number): boolean {
  return new Date(item.createdAt).getTime() > lastSeen;
}

export function unreadCount(items: NotificationItem[], lastSeen: number): number {
  return items.reduce((n, item) => n + (isUnread(item, lastSeen) ? 1 : 0), 0);
}

function eventMeta(startIso: string, location: string): string {
  const when = new Date(startIso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return location ? `${when} · ${location}` : when;
}

/** Load and merge the member's visible announcements + upcoming events. */
export async function loadNotifications(role: PortalRole): Promise<NotificationItem[]> {
  const items: NotificationItem[] = [];

  try {
    const announcements = await listAnnouncements();
    for (const a of announcements) {
      if (!canAccessVisibility(a.visibility, role)) continue;
      items.push({
        id: `ann_${a.id}`,
        kind: "announcement",
        title: a.title,
        meta: a.body.length > 90 ? `${a.body.slice(0, 90).trimEnd()}…` : a.body,
        createdAt: a.createdAt,
        href: "/portal/announcements/",
      });
    }
  } catch {
    /* announcements table may not exist yet */
  }

  try {
    const events = await listChapterEvents();
    const now = Date.now();
    const horizon = now + UPCOMING_WINDOW_DAYS * 86_400_000;
    for (const e of events) {
      if (!canAccessVisibility(e.visibility, role)) continue;
      const start = new Date(e.start).getTime();
      if (start < now || start > horizon) continue;
      items.push({
        id: `evt_${e.id}`,
        kind: "event",
        title: e.title,
        meta: eventMeta(e.start, e.location),
        // Use the event's creation time for unread, so a freshly-added event
        // pings, but an old event that is merely approaching does not.
        createdAt: e.createdAt,
        href: "/portal/events/",
      });
    }
  } catch {
    /* chapter_events table may not exist yet */
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
