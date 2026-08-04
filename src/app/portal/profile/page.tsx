"use client";

import { useEffect, useState } from "react";
import { Upload, X, CheckCircle2, Clock, UserRound } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getMyProfile,
  submitProfileEdit,
  listPendingProfiles,
  approveProfile,
  rejectProfile,
  type MemberProfile,
} from "@/lib/profile";

export default function ProfilePage() {
  return (
    <PortalShell>
      <ProfileBody />
    </PortalShell>
  );
}

function ProfileBody() {
  const { user } = useAuth();
  const canApprove = user ? hasPermission(user.role, "manage:roles") : false;

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [pending, setPending] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState({ major: "", company: "", linkedin: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    (async () => {
      try {
        const [mine, queue] = await Promise.all([
          getMyProfile(user.email),
          canApprove ? listPendingProfiles() : Promise.resolve([]),
        ]);
        if (!active) return;
        setProfile(mine);
        setPending(queue);
        // Pre-fill with the latest intent: pending values if awaiting review,
        // otherwise the approved (live) values.
        setForm({
          major: (mine?.hasPending ? mine.pendingMajor : mine?.major) ?? "",
          company: (mine?.hasPending ? mine.pendingCompany : mine?.company) ?? "",
          linkedin: (mine?.hasPending ? mine.pendingLinkedin : mine?.linkedin) ?? "",
        });
      } catch {
        /* leave empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, canApprove, reloadKey]);

  if (!user) return null;

  const currentPhotoUrl = profile?.hasPending
    ? profile.pendingPhotoUrl
    : profile?.photoUrl ?? null;
  const currentPhotoPath = profile?.hasPending
    ? profile.pendingPhotoPath
    : profile?.photoPath ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await submitProfileEdit(user.email, {
        major: form.major,
        company: form.company,
        linkedin: form.linkedin,
        photoFile,
        currentPhotoPath,
      });
      setPhotoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function decide(email: string, approve: boolean) {
    try {
      if (approve) await approveProfile(email);
      else await rejectProfile(email);
      setReloadKey((k) => k + 1);
    } catch {
      /* ignore */
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy";
  const previewSrc = photoFile ? URL.createObjectURL(photoFile) : currentPhotoUrl;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Update your major, company, LinkedIn, and photo. Changes go live once a
          president approves them.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Edits are saved only in this browser.
        </div>
      )}

      {profile?.hasPending && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Clock size={15} /> Your latest changes are awaiting president approval.
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={15} /> Saved. Sent to the president for approval.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
          {error && (
            <div className="mb-5 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">
              {error}
            </div>
          )}

          {/* Photo */}
          <div className="flex items-center gap-4">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Your photo"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-navy ring-offset-2"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-400 ring-2 ring-navy ring-offset-2">
                <UserRound size={28} />
              </div>
            )}
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy hover:border-navy">
                <Upload size={15} /> {previewSrc ? "Change photo" : "Add photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {photoFile && (
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="ml-2 inline-flex items-center gap-1 text-sm text-muted hover:text-scarlet"
                >
                  <X size={14} /> Undo
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Major</span>
              <input
                className={inputClass}
                value={form.major}
                onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
                placeholder="Finance"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Company / internship</span>
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Goldman Sachs"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-ink">LinkedIn URL</span>
              <input
                className={inputClass}
                value={form.linkedin}
                onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/your-handle"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit for approval"}
          </button>
        </form>
      )}

      {/* President / admin approval queue */}
      {canApprove && (
        <div>
          <h2 className="text-lg font-bold text-navy">
            Pending profile edits{" "}
            <span className="text-sm font-medium text-muted">({pending.length})</span>
          </h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing waiting for review.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.map((p) => (
                <li key={p.email} className="rounded-2xl border border-line bg-white p-4">
                  <div className="flex items-start gap-4">
                    {p.pendingPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.pendingPhotoUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <UserRound size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold text-navy">{p.email}</p>
                      <p className="mt-1 text-muted">
                        {[p.pendingMajor, p.pendingCompany].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {p.pendingLinkedin && (
                        <p className="truncate text-xs text-blue">{p.pendingLinkedin}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => decide(p.email, true)}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(p.email, false)}
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:border-scarlet hover:text-scarlet"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
