"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellRing, CalendarDays, Megaphone, X } from "lucide-react";
import type { PortalRole } from "@/lib/access";
import { relativeTime } from "@/lib/date";
import {
  loadNotifications,
  getLastSeen,
  markAllSeen,
  unreadCount,
  isUnread,
  type NotificationItem,
} from "@/lib/notifications";
import {
  isPushConfigured,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from "@/lib/push";

/** Re-check for new announcements/events on this cadence ("timed pings"). */
const POLL_MS = 3 * 60_000;

type Perm = NotificationPermission | "unsupported";

function initialPerm(): Perm {
  return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
}

export default function NotificationBell({
  role,
  email,
}: {
  role: PortalRole;
  email: string;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<Perm>(initialPerm);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ids we've already fired a local notification for, so a poll doesn't re-ping
  // the same item. Seeded on the first load so the existing backlog is silent.
  const pinged = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  const count = unreadCount(items, lastSeen);

  const maybePing = useCallback((next: NotificationItem[], seen: number) => {
    if (!seeded.current) {
      next.forEach((i) => pinged.current.add(i.id));
      seeded.current = true;
      return;
    }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const fresh = next.filter((i) => isUnread(i, seen) && !pinged.current.has(i.id));
    for (const i of fresh.slice(0, 3)) {
      pinged.current.add(i.id);
      try {
        new Notification(
          i.kind === "event" ? `Upcoming: ${i.title}` : i.title,
          { body: i.meta, icon: "/icon-192.png", tag: i.id }
        );
      } catch {
        /* Notification construction can throw on some platforms */
      }
    }
  }, []);

  // Load (and reload on each timed tick). Inline async + setState-after-await so
  // we never setState synchronously in the effect body.
  useEffect(() => {
    let active = true;
    (async () => {
      const seen = getLastSeen();
      const next = await loadNotifications(role);
      if (!active) return;
      setItems(next);
      setLastSeen(seen);
      maybePing(next, seen);
    })();
    return () => {
      active = false;
    };
  }, [reloadKey, role, maybePing]);

  // Timed pings: bump the reload key on an interval so the effect above re-runs.
  useEffect(() => {
    const id = window.setInterval(() => setReloadKey((k) => k + 1), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Reflect an existing push subscription in the toggle.
  useEffect(() => {
    let alive = true;
    (async () => {
      const sub = await getExistingSubscription();
      if (alive) setPushOn(Boolean(sub));
    })();
    return () => {
      alive = false;
    };
  }, []);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        markAllSeen();
        setLastSeen(Date.now());
        setMsg(null);
      }
      return next;
    });
  }

  async function enableAlerts() {
    if (typeof Notification === "undefined") return;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      setMsg(
        result === "granted"
          ? "Alerts on. You'll get a ping when something new is posted while the portal is open."
          : "Alerts are blocked. Enable notifications for this site in your browser settings."
      );
    } finally {
      setBusy(false);
    }
  }

  async function togglePush() {
    setBusy(true);
    setMsg(null);
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        setPushOn(false);
        setMsg("Device push turned off for this browser.");
      } else {
        await subscribeToPush(email);
        setPushOn(true);
        setPerm(initialPerm());
        setMsg("Device push on. You'll be notified even when the portal is closed.");
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not update push settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        aria-expanded={open}
      >
        {count > 0 ? <BellRing size={16} /> : <Bell size={16} />}
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-scarlet px-1 text-[9px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100"
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">
                    You&rsquo;re all caught up.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((item) => {
                      const unread = isUnread(item, lastSeen);
                      const Icon = item.kind === "event" ? CalendarDays : Megaphone;
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                          >
                            <span
                              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                                item.kind === "event"
                                  ? "bg-blue/10 text-blue"
                                  : "bg-gold/15 text-[#a97f2f]"
                              }`}
                            >
                              <Icon size={15} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-ink">
                                  {item.title}
                                </span>
                                {unread && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-scarlet" />
                                )}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {item.meta}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-muted/80">
                                {relativeTime(item.createdAt)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-2 border-t border-line bg-slate-50 px-4 py-3">
                {perm !== "granted" && perm !== "unsupported" && (
                  <button
                    onClick={enableAlerts}
                    disabled={busy}
                    className="w-full rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
                  >
                    Turn on alerts
                  </button>
                )}
                {isPushSupported() && isPushConfigured && (
                  <button
                    onClick={togglePush}
                    disabled={busy}
                    className="w-full rounded-full border border-navy/20 bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy hover:text-white disabled:opacity-60"
                  >
                    {pushOn ? "Turn off device push" : "Enable device push"}
                  </button>
                )}
                {isPushSupported() && !isPushConfigured && (
                  <p className="text-center text-[11px] leading-relaxed text-muted">
                    Device push (alerts when the app is closed) isn&rsquo;t set up yet.
                  </p>
                )}
                {msg && <p className="text-center text-[11px] leading-relaxed text-muted">{msg}</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
