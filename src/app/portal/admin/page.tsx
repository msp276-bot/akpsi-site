"use client";

import { BarChart3, Database, FileClock, LockKeyhole, Settings, UsersRound } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/access";

const ADMIN_MODULES = [
  {
    title: "Member management",
    desc: "Full member CRUD, role changes, deactivation, invite links, and profile approval.",
    Icon: UsersRound,
  },
  {
    title: "Application pipeline",
    desc: "Kanban review flow from pending to interview, accepted, rejected, or waitlist.",
    Icon: Database,
  },
  {
    title: "Analytics",
    desc: "Member growth, event attendance, application funnel, and most-active member views.",
    Icon: BarChart3,
  },
  {
    title: "Audit logs",
    desc: "Sensitive action history for profile edits, exports, role changes, and deletions.",
    Icon: FileClock,
  },
  {
    title: "Site settings",
    desc: "Rush dates, application window, announcement categories, and public copy toggles.",
    Icon: Settings,
  },
];

export default function AdminPage() {
  return (
    <PortalShell>
      <AdminDashboard />
    </PortalShell>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const allowed = hasPermission(user?.role ?? "active", "admin:*");

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-scarlet/20 bg-white p-8 text-center">
        <LockKeyhole className="mx-auto text-scarlet" size={34} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Admin only</h1>
        <p className="mt-2 text-sm text-muted">
          This area is reserved for site administrators and tech committee
          owners.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Admin command center</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Backend-ready module map for the future live chapter system. These
        cards mirror the database, RBAC, audit, and notification architecture in
        the backend spec.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ADMIN_MODULES.map(({ title, desc, Icon }) => (
          <article key={title} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-navy/5 text-navy">
              <Icon size={20} />
            </div>
            <h2 className="mt-4 font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
