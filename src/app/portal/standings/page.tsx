"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMembers, roleName, type MemberRecord } from "@/lib/roles";
import { pointsRequiredFor, serviceHoursRequiredFor } from "@/lib/points";
import {
  listAllSubmissions,
  approvedPoints,
  approvedServiceHours,
  pendingCount,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";

interface Standing {
  member: MemberRecord;
  points: number;
  hours: number;
  pending: number;
  subs: Submission[];
}

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800", Icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  denied: { label: "Denied", className: "bg-rose-100 text-rose-800", Icon: XCircle },
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.className}`}>
      <m.Icon size={11} /> {m.label}
    </span>
  );
}

function Meter({ earned, required, accent }: { earned: number; required: number; accent: "gold" | "navy" }) {
  const met = required > 0 && earned >= required;
  return (
    <div className="w-24">
      <p className="text-sm font-semibold text-navy">
        {earned}
        <span className="text-xs font-medium text-muted"> / {required}</span>
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${met ? "bg-emerald-500" : accent === "gold" ? "bg-gold" : "bg-navy"}`}
          style={{ width: `${required > 0 ? Math.min(100, (earned / required) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

function StandingsBody() {
  const { user } = useAuth();
  const canReview = user ? hasPermission(user.role, "submissions:review") : false;

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !canReview) return;
      try {
        const [m, s] = await Promise.all([listMembers(), listAllSubmissions()]);
        if (!active) return;
        setMembers(m);
        setSubs(s);
      } catch {
        /* leave as-is */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, canReview]);

  const standings = useMemo<Standing[]>(() => {
    const byEmail = new Map<string, Submission[]>();
    for (const s of subs) {
      const arr = byEmail.get(s.submitterEmail) ?? [];
      arr.push(s);
      byEmail.set(s.submitterEmail, arr);
    }
    return members.map((member) => {
      const mine = byEmail.get(member.email) ?? [];
      return {
        member,
        points: approvedPoints(mine),
        hours: approvedServiceHours(mine),
        pending: pendingCount(mine),
        subs: mine,
      };
    });
  }, [members, subs]);

  if (!user) return null;

  if (!canReview) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="headline text-2xl uppercase text-navy">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">
          Member standings are limited to the e-board (VP Ops).
        </p>
      </div>
    );
  }

  // Rank the whole chapter by approved points (then hours), so a member's rank
  // is their true standing - then filter for display without changing the rank.
  const q = query.trim().toLowerCase();
  const ranked = standings
    .slice()
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.hours - a.hours ||
        (a.member.fullName || a.member.email).localeCompare(
          b.member.fullName || b.member.email
        )
    )
    .map((s, i) => ({ ...s, rank: i + 1 }));
  const filtered = ranked.filter(
    ({ member }) =>
      !q ||
      member.fullName.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q)
  );
  const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-3xl uppercase text-navy">Standings</h1>
        <p className="mt-1 text-sm text-muted">
          Every member&rsquo;s approved points and service hours. Click a name to see their submissions.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview mode.</strong> Totals only reflect submissions made in this browser.
        </div>
      )}

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink focus:border-navy focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          <BarChart3 size={28} className="mx-auto mb-2 text-slate-300" />
          No members found.
        </div>
      ) : (
        <>
          {/* Column header (desktop) */}
          <div className="hidden px-4 text-[11px] font-semibold uppercase tracking-wide text-muted sm:flex sm:items-center sm:gap-4">
            <span className="w-8 shrink-0 text-center">#</span>
            <span className="flex-1">Member</span>
            <span className="w-24">Points</span>
            <span className="w-24">Service hrs</span>
            <span className="w-6" />
          </div>
          <ul className="space-y-2">
            {filtered.map(({ member, points, hours, pending, subs: mine, rank }) => {
              const open = openEmail === member.email;
              const pointsReq = pointsRequiredFor(member.role);
              const hoursReq = serviceHoursRequiredFor(member.role);
              return (
                <li key={member.email} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <button
                    onClick={() => setOpenEmail(open ? null : member.email)}
                    className="flex w-full flex-wrap items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`grid w-8 shrink-0 place-items-center text-lg font-bold ${
                        rank <= 3 ? "" : "text-sm text-muted"
                      }`}
                      aria-label={`Rank ${rank}`}
                    >
                      {MEDALS[rank] ?? `#${rank}`}
                    </span>
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-navy">
                          {member.fullName || member.email}
                        </span>
                        {pending > 0 && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {pending} pending
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {member.email} · {roleName(member.role)}
                      </p>
                    </div>
                    <Meter earned={points} required={pointsReq} accent="gold" />
                    <Meter earned={hours} required={hoursReq} accent="navy" />
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>

                  {open && (
                    <div className="border-t border-line bg-slate-50/60 px-4 py-3">
                      {mine.length === 0 ? (
                        <p className="text-sm text-muted">No submissions yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {mine
                            .slice()
                            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                            .map((s) => (
                              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-3 py-2">
                                <div className="min-w-0 flex-1 basis-56">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium text-ink">
                                      {s.type === "points" ? s.eventTitle ?? "Event" : "Service hours"}
                                    </span>
                                    <StatusBadge status={s.status} />
                                  </div>
                                  {s.eventDescription && (
                                    <p className="truncate text-xs text-muted">{s.eventDescription}</p>
                                  )}
                                </div>
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
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function StandingsPage() {
  return (
    <PortalShell>
      <StandingsBody />
    </PortalShell>
  );
}
