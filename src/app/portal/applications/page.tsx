"use client";

import { useMemo, useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { applications, type ApplicationStatus } from "@/data/applications";
import { hasPermission } from "@/lib/access";

const STATUS_META: Record<ApplicationStatus, string> = {
  pending: "bg-gold/15 text-[#9a7228]",
  interview: "bg-blue/10 text-blue",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-scarlet/10 text-scarlet",
  waitlist: "bg-slate-100 text-muted",
};

export default function ApplicationsPage() {
  return (
    <PortalShell>
      <ApplicationsBoard />
    </PortalShell>
  );
}

function ApplicationsBoard() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const allowed = hasPermission(user?.role ?? "active", "read:applications");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) =>
      [app.fullName, app.email, app.major, app.status].some((value) =>
        value.toLowerCase().includes(q)
      )
    );
  }, [query]);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-scarlet/20 bg-white p-8 text-center">
        <ShieldAlert className="mx-auto text-scarlet" size={34} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Applications are E-Board only</h1>
        <p className="mt-2 text-sm text-muted">
          Rush applications, interview notes, and pipeline actions are hidden
          unless your account has E-Board or admin access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Application pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            Static mock of the future E-Board review queue: pending,
            interviews, decisions, and reviewer ownership.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants..."
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {filtered.map((app) => (
          <article key={app.id} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{app.fullName}</h2>
                <p className="mt-1 text-xs text-muted">{app.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_META[app.status]}`}>
                {app.status}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Major</dt>
                <dd className="mt-0.5 font-medium text-ink">{app.major}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Class</dt>
                <dd className="mt-0.5 font-medium text-ink">{app.gradYear}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">GPA</dt>
                <dd className="mt-0.5 font-medium text-ink">{app.gpa}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Source</dt>
                <dd className="mt-0.5 font-medium text-ink">{app.referralSource}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-muted">
              Reviewer: <span className="font-medium text-ink">{app.reviewer ?? "Unassigned"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
