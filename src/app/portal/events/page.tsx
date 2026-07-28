"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink,
  LayoutGrid, List, MapPin, Pencil, Plus, Trash2, UserPlus, UsersRound, X,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/data/members";
import { EVENT_TYPE_META, type EventType } from "@/data/events";
import { canAccessVisibility, isEboardOrAdmin, portalRole, visibilityLabel, type Visibility } from "@/lib/access";
import { countdownLabel, formatEventTime } from "@/lib/date";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { listMembers, type MemberRecord } from "@/lib/roles";
import {
  listChapterEvents, listRsvps, createChapterEvent, updateChapterEvent, deleteChapterEvent,
  setRsvp, removeRsvp, goingCount, displayedGoing, rsvpsForEvent,
  type ChapterEventRecord, type EventRsvp, type NewChapterEvent, type RsvpStatus,
} from "@/lib/chapterEvents";
import { GOOGLE_CALENDAR_ID, googleCalendarEmbedSrc, addToGoogleCalendarUrl } from "@/data/calendar";

const TYPES = Object.keys(EVENT_TYPE_META) as EventType[];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type CalendarView = "month" | "week" | "list" | "google";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
/** ISO -> "YYYY-MM-DDTHH:mm" in local time for a datetime-local input. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** datetime-local value -> ISO (UTC) for storage. */
function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString();
}

export default function EventsPage() {
  return <PortalShell><EventsCalendar /></PortalShell>;
}

function EventsCalendar() {
  const { user } = useAuth();
  const role = portalRole(user);
  const isBoard = isEboardOrAdmin(role);

  const [events, setEvents] = useState<ChapterEventRecord[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [roster, setRoster] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [active, setActive] = useState<Set<EventType>>(new Set(TYPES));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ChapterEventRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ev, rs, ros] = await Promise.all([
          listChapterEvents(),
          listRsvps(),
          isBoard ? listMembers() : Promise.resolve<MemberRecord[]>([]),
        ]);
        if (!alive) return;
        setEvents(ev);
        setRsvps(rs);
        setRoster(ros);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not load the calendar.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isBoard, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const filtered = useMemo(
    () => events.filter((event) => canAccessVisibility(event.visibility, role) && active.has(event.type)),
    [events, active, role]
  );
  const chronological = useMemo(
    () => [...filtered].sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [filtered]
  );
  const byDay = useMemo(() => {
    const map = new Map<string, ChapterEventRecord[]>();
    filtered.forEach((event) => {
      const date = new Date(event.start);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [filtered]);

  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;
  const myEmail = user?.email?.toLowerCase() ?? "";
  const myStatusFor = (id: string): RsvpStatus | undefined =>
    rsvps.find((r) => r.eventId === id && r.memberEmail === myEmail)?.status;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1),
  ];
  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - cursor.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const toggleType = (type: EventType) =>
    setActive((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  async function handleCreate(input: NewChapterEvent) {
    setError(null);
    try {
      await createChapterEvent(input);
      setShowCreate(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the event.");
    }
  }

  async function handleUpdate(id: string, input: NewChapterEvent) {
    setError(null);
    try {
      await updateChapterEvent(id, input);
      setEditing(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.");
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteChapterEvent(id);
      setConfirmDeleteId(null);
      setSelectedId(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the event.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetOverride(id: string, value: number | null) {
    setBusy(true);
    setError(null);
    try {
      await updateChapterEvent(id, { goingOverride: value });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the count.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelfRsvp(id: string, status: RsvpStatus) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await setRsvp(id, user.email, status, user.name);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your RSVP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddAttendee(eventId: string, member: MemberRecord) {
    setBusy(true);
    setError(null);
    try {
      await setRsvp(eventId, member.email, "going", member.fullName);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the attendee.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveAttendee(eventId: string, email: string) {
    setBusy(true);
    setError(null);
    try {
      await removeRsvp(eventId, email);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the attendee.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Chapter calendar</h1>
          <p className="mt-1 text-sm text-muted">
            {isBoard ? "All events, attendance, and scheduling controls." : "Your events, details, and RSVP status in one place."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isBoard && (
            <button onClick={() => { setEditing(null); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90">
              <Plus size={16} /> Create event
            </button>
          )}
          <div className="inline-flex rounded-lg border border-line bg-white p-1">
            {[["month", LayoutGrid, "Month"], ["week", CalendarPlus, "Week"], ["list", List, "List"], ["google", CalendarDays, "Google"]].map(([key, Icon, label]) => (
              <button key={key as string} onClick={() => setView(key as CalendarView)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === key ? "bg-navy text-white" : "text-muted"}`}>
                <Icon size={15} /> {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-scarlet/30 bg-scarlet/5 px-4 py-3 text-sm text-scarlet">{error}</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[210px_1fr]">
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Filter by type</h2>
          <div className="mt-3 space-y-1.5">
            {TYPES.map((type) => {
              const meta = EVENT_TYPE_META[type];
              const on = active.has(type);
              return (
                <button key={type} onClick={() => toggleType(type)} className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${on ? "border-line bg-white text-ink" : "border-transparent text-muted opacity-60"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />{meta.label}
                </button>
              );
            })}
          </div>
          <div className="mt-7 rounded-xl border border-gold/25 bg-gold/10 p-4 text-xs leading-relaxed text-navy">
            <span className="font-semibold">Timezone</span><br />America/New_York
            <span className="mt-2 block text-muted">Event details are visible based on your chapter access.</span>
          </div>
        </aside>
        <section>
          {view === "google" ? (
            <GoogleCalendarPanel />
          ) : loading ? (
            <p className="text-sm text-muted">Loading calendar...</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  {view === "week"
                    ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : monthLabel}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setCursor(new Date(year, view === "week" ? month : month - 1, view === "week" ? cursor.getDate() - 7 : 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-muted hover:text-navy" aria-label="Previous"><ChevronLeft size={16} /></button>
                  <button onClick={() => setCursor(new Date(year, view === "week" ? month : month + 1, view === "week" ? cursor.getDate() + 7 : 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-muted hover:text-navy" aria-label="Next"><ChevronRight size={16} /></button>
                </div>
              </div>
              {view === "month" && <MonthGrid cells={cells} year={year} month={month} byDay={byDay} onSelect={(e) => setSelectedId(e.id)} />}
              {view === "week" && <WeekGrid days={weekDays} byDay={byDay} onSelect={(e) => setSelectedId(e.id)} />}
              {view === "list" && (
                <div className="space-y-3">
                  {chronological.length === 0 ? (
                    <p className="text-sm text-muted">No events to show.</p>
                  ) : (
                    chronological.map((event) => (
                      <EventRow key={event.id} event={event} onSelect={(e) => setSelectedId(e.id)} status={myStatusFor(event.id)} going={displayedGoing(event, rsvps)} showVisibility={isBoard} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedId(null)} className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: EASE_OUT_EXPO }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
              <EventDetail
                event={selected}
                rsvps={rsvpsForEvent(rsvps, selected.id)}
                going={displayedGoing(selected, rsvps)}
                derivedGoing={goingCount(rsvps, selected.id)}
                myStatus={myStatusFor(selected.id)}
                isBoard={isBoard}
                roster={roster}
                busy={busy}
                confirmDelete={confirmDeleteId === selected.id}
                onRsvp={(status) => handleSelfRsvp(selected.id, status)}
                onAddAttendee={(m) => handleAddAttendee(selected.id, m)}
                onRemoveAttendee={(email) => handleRemoveAttendee(selected.id, email)}
                onSetOverride={(value) => handleSetOverride(selected.id, value)}
                onEdit={() => { setEditing(selected); setSelectedId(null); }}
                onAskDelete={() => setConfirmDeleteId(selected.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onDelete={() => handleDelete(selected.id)}
                onClose={() => setSelectedId(null)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showCreate || editing) && (
          <EventForm
            initial={editing ?? undefined}
            onClose={() => { setShowCreate(false); setEditing(null); }}
            onSubmit={(input) => (editing ? handleUpdate(editing.id, input) : handleCreate(input))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthGrid({ cells, year, month, byDay, onSelect }: { cells: (number | null)[]; year: number; month: number; byDay: Map<string, ChapterEventRecord[]>; onSelect: (event: ChapterEventRecord) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="grid grid-cols-7 border-b border-line bg-slate-50">
        {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const key = day ? `${year}-${month}-${day}` : `empty-${i}`;
          const items = day ? byDay.get(key) ?? [] : [];
          return (
            <div key={key} className={`min-h-[92px] border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${day ? "" : "bg-slate-50/50"}`}>
              {day && (
                <>
                  <div className="mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-medium text-muted">{day}</div>
                  <div className="space-y-1">
                    {items.map((event) => {
                      const meta = EVENT_TYPE_META[event.type];
                      return (
                        <button key={event.id} onClick={() => onSelect(event)} className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium hover:scale-[1.03] ${meta.bg} ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} /><span className="truncate">{event.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ days, byDay, onSelect }: { days: Date[]; byDay: Map<string, ChapterEventRecord[]>; onSelect: (e: ChapterEventRecord) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <div className="grid min-w-[720px] grid-cols-7">
        {days.map((day) => {
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const items = byDay.get(key) ?? [];
          return (
            <div key={key} className="min-h-[480px] border-r border-line last:border-r-0">
              <div className="border-b border-line bg-slate-50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{WEEKDAYS[day.getDay()]}</p>
                <p className="mt-1 text-lg font-bold text-navy">{day.getDate()}</p>
              </div>
              <div className="space-y-2 p-2">
                {items.map((event) => {
                  const meta = EVENT_TYPE_META[event.type];
                  return (
                    <button key={event.id} onClick={() => onSelect(event)} className={`w-full rounded-lg p-2 text-left text-xs ${meta.bg} ${meta.text}`}>
                      <span className="block font-semibold">{event.title}</span>
                      <span className="mt-1 block opacity-70">{new Date(event.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({ event, onSelect, status, going, showVisibility = false }: { event: ChapterEventRecord; onSelect: (e: ChapterEventRecord) => void; status?: RsvpStatus; going: number; showVisibility?: boolean }) {
  const meta = EVENT_TYPE_META[event.type];
  return (
    <button onClick={() => onSelect(event)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-4 text-left hover:shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-ink">{event.title}</h3>
        <p className="text-xs text-muted">{formatEventTime(event.start)} · {event.location} · {going} going</p>
      </div>
      {showVisibility && <span className="hidden rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-navy sm:inline-flex">{visibilityLabel(event.visibility)}</span>}
      {status && <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-navy">{status}</span>}
      <span className="shrink-0 text-xs font-medium text-blue">{countdownLabel(event.start)}</span>
    </button>
  );
}

function EventDetail({
  event, rsvps, going, derivedGoing, myStatus, isBoard, roster, busy, confirmDelete,
  onRsvp, onAddAttendee, onRemoveAttendee, onSetOverride, onEdit, onAskDelete, onCancelDelete, onDelete, onClose,
}: {
  event: ChapterEventRecord;
  rsvps: EventRsvp[];
  going: number;
  derivedGoing: number;
  myStatus?: RsvpStatus;
  isBoard: boolean;
  roster: MemberRecord[];
  busy: boolean;
  confirmDelete: boolean;
  onRsvp: (s: RsvpStatus) => void;
  onAddAttendee: (m: MemberRecord) => void;
  onRemoveAttendee: (email: string) => void;
  onSetOverride: (value: number | null) => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const meta = EVENT_TYPE_META[event.type];
  const goingList = rsvps.filter((r) => r.status === "going");
  const atCap = !!event.maxAttendees && going >= event.maxAttendees;
  const attendedEmails = new Set(rsvps.map((r) => r.memberEmail));
  const addable = roster.filter((m) => !attendedEmails.has(m.email.toLowerCase()));
  const [addEmail, setAddEmail] = useState("");
  const [countDraft, setCountDraft] = useState("");
  const hasOverride = event.goingOverride !== null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-line p-6">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.bg} ${meta.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
          </span>
          <h2 className="mt-3 text-xl font-bold text-ink">{event.title}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="flex items-center gap-2 text-sm text-ink"><Clock size={16} className="text-muted" />{formatEventTime(event.start)}</div>
        <div className="flex items-start gap-2 text-sm text-ink">
          <MapPin size={16} className="mt-0.5 text-muted" />
          <span>{event.location}{event.mapUrl && <a className="ml-2 inline-flex items-center gap-1 text-blue hover:underline" href={event.mapUrl} target="_blank" rel="noreferrer">Map <ExternalLink size={12} /></a>}</span>
        </div>
        {event.description && <p className="text-sm leading-relaxed text-muted">{event.description}</p>}

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm text-ink">
              <UsersRound size={16} className="text-muted" /><strong>{going}</strong> going
              {hasOverride && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a97f2f]">Manual</span>}
            </span>
            {event.maxAttendees && <span className="text-xs text-muted">{event.maxAttendees} capacity</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {goingList.length === 0 && <span className="text-xs text-muted">No RSVPs yet.</span>}
            {goingList.slice(0, 8).map((r) => (
              <span key={r.id} className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[9px] font-bold text-white" title={r.memberName}>{getInitials(r.memberName)}</span>
            ))}
            {going > 8 && <span className="grid h-7 min-w-7 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-navy">+{going - 8}</span>}
          </div>
        </div>

        {isBoard && (
          <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
            <p className="font-semibold text-navy">E-Board controls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white">
                <Pencil size={13} /> Edit event
              </button>
              {confirmDelete ? (
                <span className="inline-flex items-center gap-2">
                  <button onClick={onDelete} disabled={busy} className="rounded-full bg-scarlet px-3 py-1.5 text-xs font-semibold text-white hover:bg-scarlet/90 disabled:opacity-60">{busy ? "Deleting..." : "Confirm delete"}</button>
                  <button onClick={onCancelDelete} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:text-navy">Cancel</button>
                </span>
              ) : (
                <button onClick={onAskDelete} className="inline-flex items-center gap-1.5 rounded-full border border-scarlet/30 bg-white px-3 py-1.5 text-xs font-semibold text-scarlet hover:bg-scarlet hover:text-white">
                  <Trash2 size={13} /> Delete event
                </button>
              )}
            </div>

            {/* Manual "going" count override: set an arbitrary number (e.g. an
                offline headcount) or clear it to fall back to the RSVP total. */}
            <div className="mt-4 rounded-lg bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy/70">Displayed going count</p>
              <p className="mt-1 text-xs text-muted">
                {hasOverride ? (
                  <>Showing a manual count of <strong className="text-ink">{event.goingOverride}</strong>. RSVPs total {derivedGoing}.</>
                ) : (
                  <>Deriving <strong className="text-ink">{derivedGoing}</strong> from RSVPs. Set a number to override it.</>
                )}
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={countDraft}
                  onChange={(e) => setCountDraft(e.target.value)}
                  placeholder={String(hasOverride ? event.goingOverride : derivedGoing)}
                  className="w-24 rounded-lg border border-line px-2.5 py-2 text-xs outline-none focus:border-navy"
                />
                <button
                  onClick={() => {
                    const n = Number(countDraft);
                    if (countDraft.trim() !== "" && Number.isFinite(n) && n >= 0) {
                      onSetOverride(Math.floor(n));
                      setCountDraft("");
                    }
                  }}
                  disabled={busy || countDraft.trim() === ""}
                  className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
                >
                  Set count
                </button>
                {hasOverride && (
                  <button
                    onClick={() => { onSetOverride(null); setCountDraft(""); }}
                    disabled={busy}
                    className="rounded-lg border border-scarlet/30 bg-white px-3 py-2 text-xs font-semibold text-scarlet hover:bg-scarlet hover:text-white disabled:opacity-60"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Attendee list management */}
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy/70">Attendees</p>
            <div className="mt-2 space-y-1.5">
              {rsvps.length === 0 && <p className="text-xs text-muted">No one on the list yet.</p>}
              {rsvps.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5">
                  <span className="flex min-w-0 items-center gap-2 text-xs text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-[9px] font-bold text-white">{getInitials(r.memberName)}</span>
                    <span className="truncate">{r.memberName || r.memberEmail}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-muted">{r.status}</span>
                  </span>
                  <button onClick={() => onRemoveAttendee(r.memberEmail)} disabled={busy} className="shrink-0 rounded p-1 text-muted hover:bg-scarlet/10 hover:text-scarlet disabled:opacity-60" aria-label={`Remove ${r.memberName}`}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <select value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 py-2 text-xs outline-none focus:border-navy">
                <option value="">Add a member...</option>
                {addable.map((m) => <option key={m.email} value={m.email}>{m.fullName || m.email}</option>)}
              </select>
              <button
                onClick={() => { const m = roster.find((x) => x.email === addEmail); if (m) { onAddAttendee(m); setAddEmail(""); } }}
                disabled={busy || !addEmail}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
              >
                <UserPlus size={13} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line p-6">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {(["going", "maybe", "declined"] as RsvpStatus[]).map((option) => (
            <button key={option} onClick={() => onRsvp(option)} disabled={busy} className={`rounded-full px-3 py-2 text-xs font-semibold capitalize disabled:opacity-60 ${myStatus === option ? "bg-navy text-white" : "border border-line text-muted hover:border-navy hover:text-navy"}`}>
              {option === "declined" ? "Can’t make it" : option}
            </button>
          ))}
        </div>
        {atCap && myStatus !== "going" ? (
          <button onClick={() => onRsvp("waitlist")} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy disabled:opacity-60">Join waitlist</button>
        ) : (
          <button onClick={() => onRsvp(myStatus === "going" ? "declined" : "going")} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {myStatus === "going" ? <><Check size={16} /> You’re going</> : "RSVP going"}
          </button>
        )}
        <a href={addToGoogleCalendarUrl({ title: event.title, start: event.start, end: event.end ?? undefined, location: event.location, description: event.description })} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-navy hover:bg-slate-50">
          <CalendarPlus size={16} /> Add to Google Calendar
        </a>
      </div>
    </div>
  );
}

function GoogleCalendarPanel() {
  const calendarId = GOOGLE_CALENDAR_ID.trim();
  if (!calendarId) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
        <CalendarDays className="mx-auto text-muted" size={30} />
        <p className="mt-3 text-sm font-semibold text-ink">Google Calendar not connected yet</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">Paste the chapter&rsquo;s <span className="font-medium text-ink">public</span> Google Calendar ID into <code className="rounded bg-slate-100 px-1.5 py-0.5">src/data/calendar.ts</code>. The calendar must be shared publicly, or the embed shows nothing.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative h-[70vh] min-h-[520px] w-full">
        <iframe title="Chapter Google Calendar" src={googleCalendarEmbedSrc(calendarId)} className="absolute inset-0 h-full w-full border-0" loading="lazy" />
      </div>
    </div>
  );
}

function defaultStart(): string {
  const d = new Date(Date.now() + 3 * 86_400_000);
  d.setHours(18, 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

function EventForm({ initial, onClose, onSubmit }: { initial?: ChapterEventRecord; onClose: () => void; onSubmit: (event: NewChapterEvent) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [start, setStart] = useState(initial ? toLocalInputValue(initial.start) : defaultStart());
  const [end, setEnd] = useState(initial?.end ? toLocalInputValue(initial.end) : "");
  const [type, setType] = useState<EventType>(initial?.type ?? "general");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl ?? "");
  const [maxAttendees, setMaxAttendees] = useState(initial?.maxAttendees ? String(initial.maxAttendees) : "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "members");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      start: fromLocalInputValue(start),
      end: end ? fromLocalInputValue(end) : null,
      location,
      type,
      description: description.trim(),
      mapUrl: mapUrl.trim() || null,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
      requiresRsvp: initial?.requiresRsvp ?? true,
      visibility,
    });
    setSubmitting(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-center bg-navy/50 p-5">
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">{isEdit ? "Edit event" : "Create event"}</h2>
            <p className="text-sm text-muted">America/New_York timezone</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-ink">Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="Event title" />
          </label>
          <label className="text-sm font-medium text-ink">Start
            <input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" />
          </label>
          <label className="text-sm font-medium text-ink">End (optional)
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" />
          </label>
          <label className="text-sm font-medium text-ink">Event type
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal outline-none focus:border-navy">
              {TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_META[t].label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-ink">Capacity (optional)
            <input type="number" min={0} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="No limit" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-ink">Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="Location or virtual link" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-ink">Map URL (optional)
            <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="https://maps.google.com/..." />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-ink">Description
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:border-navy" placeholder="What to expect, what to bring..." />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-ink">Visibility
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal outline-none focus:border-navy">
              <option value="public">Public</option>
              <option value="members">All members</option>
              <option value="active">Active only</option>
              <option value="pledge">Pledge only</option>
              <option value="eboard">E-Board only</option>
            </select>
          </label>
        </div>
        <button disabled={submitting} className="mt-6 w-full rounded-full bg-navy py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60">
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create event"}
        </button>
      </motion.form>
    </motion.div>
  );
}
