"use client";

import { useEffect, useState } from "react";
import { Upload, X, Award, Clock, CheckCircle2, XCircle, HeartHandshake } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import Achievements from "@/components/portal/Achievements";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { pointsRequiredFor, serviceHoursRequiredFor } from "@/lib/points";
import { listActiveEvents, type PointEvent } from "@/lib/events";
import {
  createSubmission,
  listMySubmissions,
  approvedPoints,
  approvedServiceHours,
  type Submission,
  type SubmissionStatus,
  type SubmissionType,
} from "@/lib/submissions";

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800", Icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  denied: { label: "Denied", className: "bg-rose-100 text-rose-800", Icon: XCircle },
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      <meta.Icon size={13} /> {meta.label}
    </span>
  );
}

function SummaryCard({
  label,
  earned,
  required,
  unit,
  accent,
}: {
  label: string;
  earned: number;
  required: number;
  unit: string;
  accent: "gold" | "navy";
}) {
  const outstanding = Math.max(0, required - earned);
  const pct = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <p className="text-3xl font-bold text-navy">
          {earned}
          <span className="text-base font-medium text-muted"> / {required}</span>
        </p>
        <p className="text-sm text-muted">{pct}%</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${accent === "gold" ? "bg-gold" : "bg-navy"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        {outstanding > 0 ? `${outstanding} ${unit} to go` : `Requirement met 🎉`}
      </p>
    </div>
  );
}

function PointsBody() {
  const { user } = useAuth();

  const [mine, setMine] = useState<Submission[]>([]);
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<SubmissionType>("points");
  const [eventId, setEventId] = useState<string>("");
  const [note, setNote] = useState("");
  const [hours, setHours] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedEvent = events.find((e) => e.id === eventId) ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      try {
        const [rows, evts] = await Promise.all([
          listMySubmissions(user.email),
          listActiveEvents(),
        ]);
        if (!active) return;
        setMine(rows);
        setEvents(evts);
        setEventId((id) => id || evts[0]?.id || "");
      } catch {
        /* leave as-is */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (type === "points" && !selectedEvent) {
      setError("Pick an event from the list.");
      return;
    }
    if (type === "service_hours") {
      if (!note.trim()) {
        setError("Say where you volunteered and what you did.");
        return;
      }
      if (!hours || Number(hours) <= 0) {
        setError("Enter how many hours you completed.");
        return;
      }
    }
    if (!proofFile) {
      setError("Attach a photo as proof.");
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission({
        submitterEmail: user.email,
        submitterName: user.name,
        type,
        eventId: type === "points" ? selectedEvent!.id : null,
        eventTitle: type === "points" ? selectedEvent!.title : null,
        pointsValue: type === "points" ? selectedEvent!.pointsValue : 0,
        eventDescription: note,
        hours: type === "service_hours" ? Number(hours) : null,
        proofFile,
      });
      setNote("");
      setHours("");
      setProofFile(null);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3500);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  const earnedPoints = approvedPoints(mine);
  const earnedHours = approvedServiceHours(mine);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">My Points &amp; Hours</h1>
        <p className="mt-1 text-sm text-muted">
          Submit chapter-event points and service hours, and track approvals.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Submissions are saved only in this browser
          until the chapter&rsquo;s backend is connected, so a reviewer on another
          device won&rsquo;t see them yet.
        </div>
      )}

      {/* Two separate tallies */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Points"
          earned={earnedPoints}
          required={pointsRequiredFor(user.role)}
          unit="pts"
          accent="gold"
        />
        <SummaryCard
          label="Service hours"
          earned={earnedHours}
          required={serviceHoursRequiredFor(user.role)}
          unit="hrs"
          accent="navy"
        />
      </div>

      {/* Gamified achievement badges - computed from approved submissions. */}
      <Achievements
        points={earnedPoints}
        hours={earnedHours}
        pointsRequired={pointsRequiredFor(user.role)}
        hoursRequired={serviceHoursRequiredFor(user.role)}
        approvedCount={mine.filter((s) => s.status === "approved").length}
      />

      {/* Submit form */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Submit</h2>

        {/* Type toggle */}
        <div className="mt-4 inline-flex gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setType("points")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === "points" ? "bg-navy text-white" : "text-ink hover:bg-white"
            }`}
          >
            <Award size={15} /> Event points
          </button>
          <button
            type="button"
            onClick={() => setType("service_hours")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === "service_hours" ? "bg-navy text-white" : "text-ink hover:bg-white"
            }`}
          >
            <HeartHandshake size={15} /> Service hours
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">
            {error}
          </div>
        )}
        {justSubmitted && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Submitted for review. You&rsquo;ll see it below as Pending.
          </div>
        )}

        {type === "points" ? (
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-ink">Event</span>
              {events.length === 0 ? (
                <p className="mt-1 rounded-lg border border-line bg-slate-50 px-3 py-2.5 text-sm text-muted">
                  No events available yet. Ask VP Ops to add one.
                </p>
              ) : (
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {ev.pointsValue} pt{ev.pointsValue === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              )}
              {selectedEvent?.description && (
                <span className="mt-1 block text-xs text-muted">{selectedEvent.description}</span>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Note <span className="text-muted">(optional)</span></span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
                placeholder="Anything the reviewer should know"
              />
            </label>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-ink">Where &amp; what</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
                placeholder="e.g. Food bank at St. Peter's — sorted donations"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
                placeholder="e.g. 3"
              />
            </label>
          </div>
        )}

        {/* Proof upload */}
        <div className="mt-5">
          <span className="text-sm font-medium text-ink">Photo proof</span>
          {proofFile ? (
            <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-slate-50 px-3 py-2.5">
              <span className="truncate text-sm text-ink">{proofFile.name}</span>
              <button type="button" onClick={() => setProofFile(null)} aria-label="Remove photo" className="text-muted hover:text-scarlet">
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-slate-50 px-3 py-4 text-sm text-muted hover:border-navy">
              <Upload size={16} /> Click to upload a photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted">
            {type === "points"
              ? selectedEvent
                ? <>Worth <strong className="text-navy">{selectedEvent.pointsValue}</strong> point{selectedEvent.pointsValue === 1 ? "" : "s"} if approved</>
                : "Pick an event"
              : hours
                ? <>Logs <strong className="text-navy">{Number(hours) || 0}</strong> service hour{Number(hours) === 1 ? "" : "s"} if approved</>
                : "Enter your hours"}
          </span>
          <button
            type="submit"
            disabled={submitting || (type === "points" && events.length === 0)}
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>

      {/* My submissions */}
      <div>
        <h2 className="text-lg font-bold text-navy">My submissions</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : mine.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing submitted yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mine.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy">
                      {s.type === "points" ? s.eventTitle ?? "Event" : "Service hours"}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  {s.eventDescription && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.eventDescription}</p>
                  )}
                </div>
                {s.proof && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.proof} alt="Proof" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                )}
                <span className="shrink-0 text-sm font-semibold text-navy">
                  {s.type === "points"
                    ? `${s.points} pt${s.points === 1 ? "" : "s"}`
                    : `${s.hours ?? 0} hr${s.hours === 1 ? "" : "s"}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PointsPage() {
  return (
    <PortalShell>
      <PointsBody />
    </PortalShell>
  );
}
