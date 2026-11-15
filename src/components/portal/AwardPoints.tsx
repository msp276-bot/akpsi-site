"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Search, CheckCircle2, ChevronDown } from "lucide-react";
import { listMembers, roleName, type MemberRecord } from "@/lib/roles";
import { listEvents, type PointEvent } from "@/lib/events";
import { awardPoints } from "@/lib/submissions";

const CUSTOM = "__custom__";

/**
 * E-board panel on the Review page: credit points to members directly, without
 * them submitting a photo. Pick an event (its point value is used) or enter a
 * custom amount with a note, tick the members, and add. Entries land as
 * approved submissions marked "Added by", so they can still be denied/reopened.
 */
export default function AwardPoints({
  reviewerEmail,
  onAwarded,
}: {
  reviewerEmail: string;
  onAwarded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [customPoints, setCustomPoints] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([listMembers(), listEvents()])
      .then(([m, e]) => {
        if (!active) return;
        setMembers(m.filter((r) => r.role !== "admin"));
        setEvents(e);
      })
      .catch(() => {
        if (active) setError("Couldn't load the roster or events.");
      });
    return () => {
      active = false;
    };
  }, [open]);

  const isCustom = eventId === CUSTOM;
  const event = events.find((e) => e.id === eventId) ?? null;
  const pointsEach = isCustom ? Number(customPoints) || 0 : event?.pointsValue ?? 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const m of visible) next.add(m.email);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!eventId) return setError("Pick an event, or choose a custom amount.");
    if (isCustom && !(pointsEach > 0)) return setError("Enter a positive number of points.");
    if (isCustom && !note.trim()) return setError("Add a short note saying what the points are for.");
    if (selected.size === 0) return setError("Select at least one member.");

    setSaving(true);
    try {
      const chosen = members
        .filter((m) => selected.has(m.email))
        .map((m) => ({ email: m.email, name: m.fullName }));
      const n = await awardPoints(
        {
          emails: chosen,
          eventId: isCustom ? null : eventId,
          eventTitle: isCustom ? null : event?.title ?? null,
          points: pointsEach,
          note,
        },
        reviewerEmail
      );
      const skipped = chosen.length - n;
      setResult(
        `Added ${pointsEach} pt${pointsEach === 1 ? "" : "s"} to ${n} member${n === 1 ? "" : "s"}.` +
          (skipped > 0
            ? ` Skipped ${skipped} who already ${skipped === 1 ? "has" : "have"} a submission for this event.`
            : "")
      );
      setSelected(new Set());
      setNote("");
      onAwarded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add points. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy";

  return (
    <div className="rounded-2xl border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <PlusCircle size={18} className="text-gold" />
          <span>
            <span className="block font-semibold text-navy">Add points for members</span>
            <span className="block text-xs text-muted">
              Credit points directly. No photo or submission needed from them.
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <form onSubmit={submit} className="space-y-5 border-t border-line px-5 pb-5 pt-4">
          {error && (
            <div className="rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">
              {error}
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 size={15} /> {result}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-ink">Event</span>
              <select
                className={inputClass}
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">Choose an event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.pointsValue} pt{ev.pointsValue === 1 ? "" : "s"})
                    {ev.active ? "" : " - inactive"}
                  </option>
                ))}
                <option value={CUSTOM}>Custom amount (not a listed event)</option>
              </select>
            </label>
            {isCustom && (
              <label className="block">
                <span className="text-sm font-medium text-ink">Points each</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className={inputClass}
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  placeholder="2"
                />
              </label>
            )}
            <label className={`block ${isCustom ? "" : "sm:col-span-2"}`}>
              <span className="text-sm font-medium text-ink">
                Note {isCustom ? "" : <span className="font-normal text-muted">(optional)</span>}
              </span>
              <input
                className={inputClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isCustom ? "e.g. Helped run tabling 11/12" : "e.g. Signed in at the door"}
              />
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">
                Members <span className="font-normal text-muted">({selected.size} selected)</span>
              </span>
              <div className="flex gap-3 text-xs font-medium">
                <button type="button" onClick={selectAllVisible} className="text-navy hover:underline">
                  Select all shown
                </button>
                <button type="button" onClick={() => setSelected(new Set())} className="text-muted hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="relative mt-2">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
              />
            </div>
            <ul
              data-lenis-prevent
              className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line"
            >
              {visible.length === 0 ? (
                <li className="p-3 text-sm text-muted">No members match.</li>
              ) : (
                visible.map((m) => (
                  <li key={m.email}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.has(m.email)}
                        onChange={() => toggle(m.email)}
                        className="h-4 w-4 accent-navy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {m.fullName || m.email}
                        </span>
                        <span className="block truncate text-xs text-muted">{m.email}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{roleName(m.role)}</span>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {saving
              ? "Adding…"
              : selected.size > 0 && pointsEach > 0
                ? `Add ${pointsEach} pt${pointsEach === 1 ? "" : "s"} to ${selected.size} member${selected.size === 1 ? "" : "s"}`
                : "Add points"}
          </button>
        </form>
      )}
    </div>
  );
}
