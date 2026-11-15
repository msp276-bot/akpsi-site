"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, CheckCircle2 } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMembers, roleName, type MemberRecord } from "@/lib/roles";
import {
  loadRequirements,
  requiredFor,
  setDefaultRequirement,
  setMemberRequirements,
  clearMemberRequirement,
  FALLBACK_REQUIREMENTS,
  type DefaultKind,
  type Requirements,
} from "@/lib/pointRequirements";

type RoleFilter = "all" | "pledge" | "brother";

function RequirementsBody() {
  const { user } = useAuth();
  const canEdit = user ? hasPermission(user.role, "submissions:review") : false;

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [req, setReq] = useState<Requirements>(FALLBACK_REQUIREMENTS);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [defaults, setDefaults] = useState({ pledge: "", brother: "" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [bulkValue, setBulkValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !canEdit) return;
      try {
        const [m, r] = await Promise.all([listMembers(), loadRequirements()]);
        if (!active) return;
        setMembers(m.filter((x) => x.role !== "admin"));
        setReq(r);
        setDefaults({ pledge: String(r.defaults.pledge), brother: String(r.defaults.brother) });
        setDrafts({});
      } catch {
        if (active) setError("Couldn't load requirements. Try refreshing.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, canEdit, reloadKey]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter === "pledge" && m.role !== "pledge") return false;
      if (roleFilter === "brother" && m.role === "pledge") return false;
      return !q || m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, query, roleFilter]);

  if (!user) return null;
  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="headline text-2xl uppercase text-navy">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">
          Changing points requirements is limited to the e-board.
        </p>
      </div>
    );
  }

  async function run(key: string, fn: () => Promise<void>, done: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function parse(v: string): number | null {
    const n = Number(v);
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  }

  function saveDefault(kind: DefaultKind) {
    const n = parse(defaults[kind]);
    if (n === null) return setError("Enter a number of 0 or more.");
    void run(`default:${kind}`, () => setDefaultRequirement(kind, n),
      `Default for ${kind === "pledge" ? "pledges" : "brothers"} set to ${n}.`);
  }

  function saveMember(m: MemberRecord) {
    const n = parse(drafts[m.email] ?? "");
    if (n === null) return setError("Enter a number of 0 or more.");
    void run(m.email, () => setMemberRequirements([m.email], n),
      `${m.fullName || m.email} now needs ${n} points.`);
  }

  function resetMember(m: MemberRecord) {
    void run(m.email, () => clearMemberRequirement(m.email),
      `${m.fullName || m.email} now uses the default.`);
  }

  function applyBulk() {
    const n = parse(bulkValue);
    if (n === null) return setError("Enter a number of 0 or more.");
    if (visible.length === 0) return;
    if (!window.confirm(`Set ${visible.length} member${visible.length === 1 ? "" : "s"} to ${n} points?`)) return;
    void run("bulk", () => setMemberRequirements(visible.map((m) => m.email), n),
      `Set ${visible.length} member${visible.length === 1 ? "" : "s"} to ${n} points.`);
  }

  const inputClass =
    "w-20 rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">Point Requirements</h1>
        <p className="mt-1 text-sm text-muted">
          How many points each member needs this semester. Changes show up right
          away on My Points and the Leaderboard.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Changes are saved only in this browser.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-scarlet/25 bg-scarlet/5 px-4 py-3 text-sm text-scarlet">{error}</div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={15} /> {notice}
        </div>
      )}

      {/* Defaults */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold text-navy">Defaults</h2>
        <p className="mt-0.5 text-xs text-muted">
          Used for anyone who doesn&rsquo;t have their own number below.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          {(["pledge", "brother"] as DefaultKind[]).map((kind) => (
            <div key={kind} className="flex items-center gap-2">
              <span className="w-20 text-sm font-medium text-ink">
                {kind === "pledge" ? "Pledges" : "Brothers"}
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                className={inputClass}
                value={defaults[kind]}
                onChange={(e) => setDefaults((d) => ({ ...d, [kind]: e.target.value }))}
              />
              <button
                onClick={() => saveDefault(kind)}
                disabled={busy !== null || loading}
                className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Per-member */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-navy">Members</h2>
          <div className="flex gap-1.5 rounded-full bg-slate-100 p-1">
            {(["all", "pledge", "brother"] as RoleFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  roleFilter === f ? "bg-navy text-white" : "text-ink hover:bg-white"
                }`}
              >
                {f === "all" ? "All" : f === "pledge" ? "Pledges" : "Brothers"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
          <span className="text-ink">
            Set all {visible.length} shown to
          </span>
          <input
            type="number"
            min="0"
            step="0.5"
            className={inputClass}
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            placeholder="45"
          />
          <button
            onClick={applyBulk}
            disabled={busy !== null || visible.length === 0}
            className="rounded-full border border-navy px-4 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white disabled:opacity-60"
          >
            Apply
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {visible.map((m) => {
              const own = req.byEmail[m.email.toLowerCase()];
              const current = requiredFor(req, m.email, m.role);
              const draft = drafts[m.email] ?? "";
              const rowBusy = busy === m.email;
              return (
                <li key={m.email} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-ink">{m.fullName || m.email}</p>
                    <p className="truncate text-xs text-muted">
                      {roleName(m.role)} · {m.email}
                    </p>
                  </div>
                  <div className="w-28 text-sm">
                    <span className="font-semibold text-navy">{current} pts</span>
                    <span className="block text-[11px] text-muted">
                      {own !== undefined ? "Own number" : "Default"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    aria-label={`New requirement for ${m.fullName || m.email}`}
                    className={inputClass}
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m.email]: e.target.value }))}
                    placeholder={String(current)}
                  />
                  <button
                    onClick={() => saveMember(m)}
                    disabled={busy !== null || draft.trim() === ""}
                    className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40"
                  >
                    {rowBusy ? "Saving…" : "Save"}
                  </button>
                  {own !== undefined && (
                    <button
                      onClick={() => resetMember(m)}
                      disabled={busy !== null}
                      title="Remove their own number and use the default"
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-slate-50 disabled:opacity-60"
                    >
                      <RotateCcw size={13} /> Use default
                    </button>
                  )}
                </li>
              );
            })}
            {visible.length === 0 && <li className="py-3 text-sm text-muted">No members match.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PointRequirementsPage() {
  return (
    <PortalShell>
      <RequirementsBody />
    </PortalShell>
  );
}
