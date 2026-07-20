"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Database,
  FileClock,
  LockKeyhole,
  Settings,
  UsersRound,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { applications } from "@/data/applications";
import { members } from "@/data/members";
import { hasPermission } from "@/lib/access";

const MODULES = [
  { id: "members", label: "Member management", Icon: UsersRound },
  { id: "applications", label: "Application pipeline", Icon: Database },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "audit", label: "Audit log", Icon: FileClock },
  { id: "settings", label: "Site settings", Icon: Settings },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const AUDIT_LOGS = [
  {
    actor: "Tech Admin",
    action: "role_change",
    target: "members:b1",
    detail: "Promoted Ava Thompson to e-board",
    time: "2 minutes ago",
  },
  {
    actor: "Sofia Romano",
    action: "application_update",
    target: "applications:app-002",
    detail: "Moved Daniel Kim to Interview",
    time: "18 minutes ago",
  },
  {
    actor: "Ethan Cohen",
    action: "document_upload",
    target: "documents:budget-fy26",
    detail: "Uploaded Budget FY26.xlsx to Financials",
    time: "Yesterday",
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
  const [active, setActive] = useState<ModuleId>("members");
  const [rushOpen, setRushOpen] = useState(true);
  const [autoInvites, setAutoInvites] = useState(true);

  const roleCounts = useMemo(
    () => ({
      board: members.filter((m) => m.group === "board").length,
      directors: members.filter((m) => m.group === "directors").length,
      actives: members.filter((m) => m.group === "actives").length,
      applicants: applications.length,
    }),
    []
  );

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
        Backend-ready control plane for members, applications, audit trails,
        analytics, and chapter settings. These are mocked locally now, but each
        panel maps to a future API/database workflow.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {MODULES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              active === id
                ? "border-navy bg-navy text-white shadow-sm"
                : "border-line bg-white text-ink hover:border-navy/40"
            }`}
          >
            <Icon size={20} className={active === id ? "text-gold" : "text-navy"} />
            <span className="mt-3 block text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        {active === "members" && <MemberManagement roleCounts={roleCounts} />}
        {active === "applications" && <ApplicationPipeline />}
        {active === "analytics" && <AnalyticsPanel roleCounts={roleCounts} />}
        {active === "audit" && <AuditLogPanel />}
        {active === "settings" && (
          <SettingsPanel
            rushOpen={rushOpen}
            setRushOpen={setRushOpen}
            autoInvites={autoInvites}
            setAutoInvites={setAutoInvites}
          />
        )}
      </div>
    </div>
  );
}

function MemberManagement({
  roleCounts,
}: {
  roleCounts: { board: number; directors: number; actives: number; applicants: number };
}) {
  return (
    <section>
      <PanelHeader
        title="Member management backend"
        desc="Maps to members/users tables, role updates, invite links, profile approval, and bulk CSV import."
        endpoint="POST /api/members · PUT /api/members/[id] · POST /api/auth/invite"
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Metric label="Board" value={roleCounts.board} />
        <Metric label="Directors" value={roleCounts.directors} />
        <Metric label="Actives" value={roleCounts.actives} />
        <Metric label="Pending invites" value={4} />
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.slice(0, 5).map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-ink">{member.name}</td>
                <td className="px-4 py-3 text-muted">{member.position}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-blue">
                  Edit role · Send invite
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApplicationPipeline() {
  const stages = ["pending", "interview", "accepted", "rejected", "waitlist"];
  return (
    <section>
      <PanelHeader
        title="Application pipeline backend"
        desc="Maps to applications table, status changes, reviewer assignment, interview notes, and applicant emails."
        endpoint="GET /api/applications · PUT /api/applications/[id]"
      />
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {stages.map((stage) => {
          const apps = applications.filter((app) => app.status === stage);
          return (
            <div key={stage} className="rounded-xl border border-line bg-slate-50 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                {stage} · {apps.length}
              </h3>
              <div className="mt-3 space-y-2">
                {apps.map((app) => (
                  <div key={app.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
                    <p className="font-semibold text-ink">{app.fullName}</p>
                    <p className="text-xs text-muted">{app.major} · {app.gradYear}</p>
                  </div>
                ))}
                {apps.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line p-3 text-xs text-muted">
                    Drop applicants here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AnalyticsPanel({
  roleCounts,
}: {
  roleCounts: { board: number; directors: number; actives: number; applicants: number };
}) {
  return (
    <section>
      <PanelHeader
        title="Analytics backend"
        desc="Maps to attendance, application funnel, active member engagement, and growth metrics."
        endpoint="GET /api/analytics/overview"
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Chapter members" value={roleCounts.board + roleCounts.directors + roleCounts.actives} />
        <Metric label="Rush applicants" value={roleCounts.applicants} />
        <Metric label="Event attendance" value="78%" />
        <Metric label="RSVP rate" value="64%" />
      </div>
      <div className="mt-5 rounded-xl bg-navy p-5 text-white">
        <p className="text-sm font-semibold text-gold">Funnel snapshot</p>
        <div className="mt-4 grid gap-2">
          {[
            ["Applications", "100%"],
            ["Interviews", "42%"],
            ["Accepted", "18%"],
          ].map(([label, width]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>{label}</span>
                <span>{width}</span>
              </div>
              <div className="h-2 rounded-full bg-white/15">
                <div className="h-2 rounded-full bg-gold" style={{ width }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditLogPanel() {
  return (
    <section>
      <PanelHeader
        title="Audit log backend"
        desc="Tracks sensitive actions: role changes, profile edits, application exports, document uploads, and deletes."
        endpoint="GET /api/audit-logs"
      />
      <div className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {AUDIT_LOGS.map((log) => (
          <div key={`${log.action}-${log.target}`} className="grid gap-2 bg-white p-4 text-sm md:grid-cols-[150px_160px_1fr_110px]">
            <span className="font-medium text-ink">{log.actor}</span>
            <span className="font-mono text-xs text-blue">{log.action}</span>
            <span className="text-muted">{log.detail}</span>
            <span className="text-xs text-muted">{log.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({
  rushOpen,
  setRushOpen,
  autoInvites,
  setAutoInvites,
}: {
  rushOpen: boolean;
  setRushOpen: (value: boolean) => void;
  autoInvites: boolean;
  setAutoInvites: (value: boolean) => void;
}) {
  return (
    <section>
      <PanelHeader
        title="Site settings backend"
        desc="Maps to settings table: rush window, public copy, notification defaults, and feature flags."
        endpoint="GET /api/settings · PUT /api/settings"
      />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ToggleCard
          title="Rush applications open"
          desc="Controls whether the public rush form accepts submissions."
          value={rushOpen}
          onChange={setRushOpen}
        />
        <ToggleCard
          title="Auto-send member invites"
          desc="Sends setup invite emails after CSV import or manual member creation."
          value={autoInvites}
          onChange={setAutoInvites}
        />
      </div>
    </section>
  );
}

function PanelHeader({
  title,
  desc,
  endpoint,
}: {
  title: string;
  desc: string;
  endpoint: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted">{desc}</p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-blue">
        {endpoint}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="headline text-3xl text-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function ToggleCard({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`h-7 w-12 rounded-full p-1 transition-colors ${
            value ? "bg-navy" : "bg-slate-300"
          }`}
          aria-pressed={value}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              value ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
