"use client";

import { useEffect, useState } from "react";
import { Upload, X, Award, Clock, CheckCircle2, XCircle } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  POINT_CATEGORIES,
  getCategory,
  requirementFor,
  pointsForSubmission,
} from "@/lib/points";
import {
  createSubmission,
  listMySubmissions,
  approvedPoints,
  type Submission,
  type SubmissionStatus,
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

function PointsBody() {
  const { user } = useAuth();

  const [mine, setMine] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState(POINT_CATEGORIES[0].id);
  const [eventDescription, setEventDescription] = useState("");
  const [hours, setHours] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const category = getCategory(categoryId);
  const isService = category?.kind === "service_hours";

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      try {
        const rows = await listMySubmissions(user.email);
        if (active) setMine(rows);
      } catch {
        /* leave the list as-is */
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

    if (!eventDescription.trim()) {
      setError("Add a short description of the event.");
      return;
    }
    if (isService && (!hours || Number(hours) <= 0)) {
      setError("Enter how many hours you completed.");
      return;
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
        categoryId,
        eventDescription,
        hours: isService ? Number(hours) : null,
        proofFile,
      });
      setEventDescription("");
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

  const earned = approvedPoints(mine);
  const required = requirementFor(user.role);
  const outstanding = Math.max(0, required - earned);
  const pct = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  const previewPoints = pointsForSubmission(categoryId, isService ? Number(hours) || 0 : null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">My Points</h1>
        <p className="mt-1 text-sm text-muted">
          Submit service hours and brother points, and track approvals.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Submissions are saved only in this browser
          until the chapter&rsquo;s backend is connected, so a reviewer on another
          device won&rsquo;t see them yet.
        </div>
      )}

      {/* Points summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Approved</p>
          <p className="mt-1 text-3xl font-bold text-navy">{earned}</p>
          <p className="text-xs text-muted">points earned</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Outstanding</p>
          <p className="mt-1 text-3xl font-bold text-gold">{outstanding}</p>
          <p className="text-xs text-muted">to reach {required}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Progress</p>
          <p className="mt-1 text-3xl font-bold text-navy">{pct}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Submit form */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <Award size={18} className="text-gold" /> Submit for points
        </h2>

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

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            >
              {POINT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {category?.hint && <span className="mt-1 block text-xs text-muted">{category.hint}</span>}
          </label>

          {isService && (
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
          )}
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-ink">Event description</span>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            placeholder="What was the event? When and where?"
          />
        </label>

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
            Worth <strong className="text-navy">{previewPoints}</strong> point{previewPoints === 1 ? "" : "s"} if approved
          </span>
          <button
            type="submit"
            disabled={submitting}
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
                    <span className="font-medium text-navy">{getCategory(s.categoryId)?.label ?? s.categoryId}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.eventDescription}</p>
                </div>
                {s.proof && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.proof} alt="Proof" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                )}
                <span className="shrink-0 text-sm font-semibold text-navy">
                  {s.points} pt{s.points === 1 ? "" : "s"}
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
