"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Check, X, RotateCcw } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listAllSubmissions,
  reviewSubmission,
  reopenSubmission,
  pendingCount,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";

type Filter = "pending" | "all";

function ReviewBody() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canReview = user ? hasPermission(user.role, "submissions:review") : false;

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !canReview) return;
      try {
        const all = await listAllSubmissions();
        if (active) setRows(all);
      } catch {
        /* leave as-is */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, canReview, reloadKey]);

  async function decide(id: string, status: Exclude<SubmissionStatus, "pending">) {
    if (!user) return;
    setBusyId(id);
    try {
      await reviewSubmission(id, status, user.email);
      setReloadKey((k) => k + 1);
    } catch {
      /* ignore; the row simply keeps its status */
    } finally {
      setBusyId(null);
    }
  }

  async function reopen(id: string) {
    setBusyId(id);
    try {
      await reopenSubmission(id);
      setReloadKey((k) => k + 1);
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  if (!canReview) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="headline text-2xl uppercase text-navy">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">
          Reviewing submissions is limited to the e-board (VP Ops).
        </p>
      </div>
    );
  }

  const visible = rows.filter((r) => (filter === "pending" ? r.status === "pending" : true));
  const pending = pendingCount(rows);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline text-3xl uppercase text-navy">Review Submissions</h1>
          <p className="mt-1 text-sm text-muted">
            {pending} pending · {rows.length} total
          </p>
        </div>
        <div className="flex gap-1.5 rounded-full bg-slate-100 p-1">
          {(["pending", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-navy text-white" : "text-ink hover:bg-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> You&rsquo;re only seeing submissions made in
          this browser. Once the backend is connected, every brother&rsquo;s
          submissions will appear here.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          <ClipboardCheck size={28} className="mx-auto mb-2 text-slate-300" />
          {filter === "pending" ? "Nothing waiting for review." : "No submissions yet."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => {
            const isService = s.type === "service_hours";
            const busy = busyId === s.id;
            return (
              <li key={s.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-line bg-white p-4">
                {s.proof ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.proof} alt="Proof" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-muted">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-semibold text-navy">{s.submitterName}</p>
                  <p className="text-xs text-muted">{s.submitterEmail}</p>
                  <p className="mt-1 text-sm text-ink">
                    <span className="font-medium">
                      {isService ? "Service hours" : s.eventTitle ?? "Event"}
                    </span>
                    {isService
                      ? <> · {s.hours ?? 0} hr{s.hours === 1 ? "" : "s"}</>
                      : <> · {s.points} pt{s.points === 1 ? "" : "s"}</>}
                  </p>
                  {s.eventDescription && <p className="mt-1 text-sm text-muted">{s.eventDescription}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {s.status !== "pending" && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        s.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {s.status === "approved" ? <Check size={13} /> : <X size={13} />}
                      {s.status === "approved" ? "Approved" : "Denied"}
                    </span>
                  )}
                  {s.status !== "approved" && (
                    <button
                      onClick={() => decide(s.id, "approved")}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check size={15} /> Approve
                    </button>
                  )}
                  {s.status !== "denied" && (
                    <button
                      onClick={() => decide(s.id, "denied")}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-semibold text-scarlet transition-colors hover:bg-rose-50 disabled:opacity-60"
                    >
                      <X size={15} /> Deny
                    </button>
                  )}
                  {s.status !== "pending" && (
                    <button
                      onClick={() => reopen(s.id)}
                      disabled={busy}
                      title="Send back to pending"
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                      <RotateCcw size={15} /> Reopen
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <PortalShell>
      <ReviewBody />
    </PortalShell>
  );
}
