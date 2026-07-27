"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Pencil, Trash2, Eye, EyeOff, Check, X } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type PointEvent,
} from "@/lib/events";

interface DraftFields {
  title: string;
  pointsValue: string;
  description: string;
  eventDate: string;
}

function EventsBody() {
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.role, "submissions:review") : false;

  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New-event form
  const [draft, setDraft] = useState<DraftFields>({ title: "", pointsValue: "1", description: "", eventDate: "" });
  const [creating, setCreating] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftFields>({ title: "", pointsValue: "", description: "", eventDate: "" });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !canManage) return;
      try {
        const rows = await listEvents();
        if (active) setEvents(rows);
      } catch {
        /* leave as-is */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, canManage, reloadKey]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.title.trim()) {
      setError("Give the event a title.");
      return;
    }
    setCreating(true);
    try {
      await createEvent(
        {
          title: draft.title,
          pointsValue: Number(draft.pointsValue) || 0,
          description: draft.description,
          eventDate: draft.eventDate || null,
        },
        user?.email
      );
      setDraft({ title: "", pointsValue: "1", description: "", eventDate: "" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the event.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(ev: PointEvent) {
    setEditId(ev.id);
    setEditDraft({
      title: ev.title,
      pointsValue: String(ev.pointsValue),
      description: ev.description,
      eventDate: ev.eventDate ?? "",
    });
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await updateEvent(id, {
        title: editDraft.title,
        pointsValue: Number(editDraft.pointsValue) || 0,
        description: editDraft.description,
        eventDate: editDraft.eventDate || null,
      });
      setEditId(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(ev: PointEvent) {
    setBusyId(ev.id);
    setError(null);
    try {
      await updateEvent(ev.id, { active: !ev.active });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(ev: PointEvent) {
    setBusyId(ev.id);
    setError(null);
    try {
      await deleteEvent(ev.id);
      setReloadKey((k) => k + 1);
    } catch {
      setError(
        `"${ev.title}" has submissions attached, so it can't be deleted. Deactivate it instead to hide it from the submit form.`
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="headline text-2xl uppercase text-navy">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">Managing point events is limited to the e-board (VP Ops).</p>
      </div>
    );
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">Point Events</h1>
        <p className="mt-1 text-sm text-muted">
          Create the events brothers can submit for points. Each carries a fixed point value.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Events are saved only in this browser until the backend is connected.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">{error}</div>
      )}

      {/* Create */}
      <form onSubmit={onCreate} className="rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <CalendarPlus size={18} className="text-gold" /> New event
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink">Title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputCls}
              placeholder="e.g. Fall Networking Night"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Points</span>
            <input
              type="number"
              min="0"
              step="1"
              value={draft.pointsValue}
              onChange={(e) => setDraft({ ...draft, pointsValue: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Date <span className="text-muted">(optional)</span></span>
            <input
              type="date"
              value={draft.eventDate}
              onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink">Description <span className="text-muted">(optional)</span></span>
            <input
              type="text"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className={inputCls}
              placeholder="Shown to brothers when they pick this event"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {creating ? "Adding…" : "Add event"}
          </button>
        </div>
      </form>

      {/* List */}
      <div>
        <h2 className="text-lg font-bold text-navy">All events</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No events yet. Add one above.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {events.map((ev) => {
              const busy = busyId === ev.id;
              const editing = editId === ev.id;
              return (
                <li
                  key={ev.id}
                  className={`rounded-2xl border p-4 ${ev.active ? "border-line bg-white" : "border-line bg-slate-50"}`}
                >
                  {editing ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="text-sm font-medium text-ink">Title</span>
                        <input
                          type="text"
                          value={editDraft.title}
                          onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-ink">Points</span>
                        <input
                          type="number"
                          min="0"
                          value={editDraft.pointsValue}
                          onChange={(e) => setEditDraft({ ...editDraft, pointsValue: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-ink">Date</span>
                        <input
                          type="date"
                          value={editDraft.eventDate}
                          onChange={(e) => setEditDraft({ ...editDraft, eventDate: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-sm font-medium text-ink">Description</span>
                        <input
                          type="text"
                          value={editDraft.description}
                          onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <div className="flex gap-2 sm:col-span-2">
                        <button
                          onClick={() => saveEdit(ev.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
                        >
                          <Check size={15} /> Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                        >
                          <X size={15} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-navy">{ev.title}</span>
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-navy">
                            {ev.pointsValue} pt{ev.pointsValue === 1 ? "" : "s"}
                          </span>
                          {!ev.active && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        {ev.description && <p className="mt-1 text-sm text-muted">{ev.description}</p>}
                        {ev.eventDate && <p className="mt-0.5 text-xs text-muted">{ev.eventDate}</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleActive(ev)}
                          disabled={busy}
                          title={ev.active ? "Hide from submit form" : "Make available"}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-60"
                        >
                          {ev.active ? <EyeOff size={15} /> : <Eye size={15} />}
                          {ev.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => startEdit(ev)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          onClick={() => remove(ev)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-medium text-scarlet transition-colors hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PointEventsPage() {
  return (
    <PortalShell>
      <EventsBody />
    </PortalShell>
  );
}
