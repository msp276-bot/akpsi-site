"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Database,
  FileClock,
  FileSpreadsheet,
  FileText,
  Loader2,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { applications } from "@/data/applications";
import { members } from "@/data/members";
import { hasPermission, type Permission } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listMembers,
  removeMember,
  upsertMember,
  roleName,
  MEMBER_ROLES,
  ROLE_META,
  type MemberRecord,
  type MemberRole,
} from "@/lib/roles";

const MODULES = [
  { id: "roles", label: "Roles & access", Icon: UserCog, permission: "manage:roles" },
  { id: "members", label: "Member management", Icon: UsersRound, permission: "admin:*" },
  { id: "applications", label: "Application pipeline", Icon: Database, permission: "admin:*" },
  { id: "analytics", label: "Analytics", Icon: BarChart3, permission: "admin:*" },
  { id: "audit", label: "Audit log", Icon: FileClock, permission: "admin:*" },
  { id: "archive", label: "File archive", Icon: Archive, permission: "admin:*" },
  { id: "settings", label: "Site settings", Icon: Settings, permission: "admin:*" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  Icon: typeof UserCog;
  permission: Permission;
}>;

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

const ARCHIVED_FILES = [
  {
    id: "archive-001",
    name: "Fall 2025 Chapter Meeting Minutes.zip",
    kind: "doc",
    folder: "Meeting Minutes",
    owner: "Priya Nair",
    archivedBy: "Tech Admin",
    archivedAt: "Jul 2, 2026",
    originalDate: "Dec 18, 2025",
    size: "18.4 MB",
    status: "Retained",
  },
  {
    id: "archive-002",
    name: "Spring 2026 Rush Applications.csv",
    kind: "sheet",
    folder: "Recruitment Materials",
    owner: "Sofia Romano",
    archivedBy: "Tech Admin",
    archivedAt: "Jun 30, 2026",
    originalDate: "Apr 22, 2026",
    size: "2.1 MB",
    status: "Restricted",
  },
  {
    id: "archive-003",
    name: "FY25 Reimbursement Receipts.zip",
    kind: "sheet",
    folder: "Financials",
    owner: "Ethan Cohen",
    archivedBy: "Ethan Cohen",
    archivedAt: "Jun 15, 2026",
    originalDate: "May 8, 2025",
    size: "42.7 MB",
    status: "Retention lock",
  },
  {
    id: "archive-004",
    name: "Old Interview Rubrics 2024-2025.pdf",
    kind: "doc",
    folder: "Recruitment Materials",
    owner: "Marcus Lee",
    archivedBy: "Tech Admin",
    archivedAt: "May 20, 2026",
    originalDate: "Jan 12, 2025",
    size: "4.8 MB",
    status: "Retained",
  },
] as const;

export default function AdminPage() {
  return (
    <PortalShell>
      <AdminDashboard />
    </PortalShell>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "active";
  // The president reaches this page to manage roles even without full admin
  // rights; each module below is gated by its own permission.
  const visibleModules = useMemo(
    () => MODULES.filter((m) => hasPermission(role, m.permission)),
    [role]
  );
  const allowed = visibleModules.length > 0;
  const [active, setActive] = useState<ModuleId>("roles");
  const [rushOpen, setRushOpen] = useState(true);
  const [autoInvites, setAutoInvites] = useState(true);

  // Derive the effective tab so a role that can't see `active` (e.g. a
  // president who only has the roles module) always lands on a valid one,
  // without an extra render pass.
  const activeTab: ModuleId = visibleModules.some((m) => m.id === active)
    ? active
    : visibleModules[0]?.id ?? "roles";

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

      <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {visibleModules.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              activeTab === id
                ? "border-navy bg-navy text-white shadow-sm"
                : "border-line bg-white text-ink hover:border-navy/40"
            }`}
          >
            <Icon size={20} className={activeTab === id ? "text-gold" : "text-navy"} />
            <span className="mt-3 block text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        {activeTab === "roles" && <RolesPanel actorEmail={user?.email ?? null} />}
        {activeTab === "members" && <MemberManagement roleCounts={roleCounts} />}
        {activeTab === "applications" && <ApplicationPipeline />}
        {activeTab === "analytics" && <AnalyticsPanel roleCounts={roleCounts} />}
        {activeTab === "audit" && <AuditLogPanel />}
        {activeTab === "archive" && <ArchivePanel />}
        {activeTab === "settings" && (
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

function ArchivePanel() {
  const [query, setQuery] = useState("");
  const filteredFiles = ARCHIVED_FILES.filter((file) => {
    const haystack = `${file.name} ${file.folder} ${file.owner} ${file.status}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const restrictedCount = ARCHIVED_FILES.filter((file) => file.status !== "Retained").length;

  return (
    <section>
      <PanelHeader
        title="File archive backend"
        desc="Admin-only holding area for older chapter files, expired uploads, historical records, and sensitive files that should not appear in the member document library."
        endpoint="GET /api/documents/archive · POST /api/documents/[id]/archive · POST /api/documents/[id]/restore"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Archived files" value={ARCHIVED_FILES.length} />
        <Metric label="Restricted items" value={restrictedCount} />
        <Metric label="Stored history" value="3 years" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search archived files"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-navy"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white">
          <Archive size={15} /> Archive old file
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Folder</th>
              <th className="px-4 py-3">Archived</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {filteredFiles.map((file) => (
              <tr key={file.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {file.kind === "sheet" ? (
                      <FileSpreadsheet size={17} className="text-green-600" />
                    ) : (
                      <FileText size={17} className="text-blue" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{file.name}</p>
                      <p className="text-xs text-muted">
                        {file.size} · original date {file.originalDate}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{file.folder}</td>
                <td className="px-4 py-3 text-muted">
                  {file.archivedAt}
                  <span className="block text-xs">by {file.archivedBy}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      file.status === "Retained"
                        ? "bg-green-100 text-green-700"
                        : file.status === "Restricted"
                          ? "bg-scarlet/10 text-scarlet"
                          : "bg-gold/20 text-navy"
                    }`}
                  >
                    {file.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted">
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-navy hover:text-white"
                      aria-label={`Restore ${file.name}`}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-scarlet hover:text-white"
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFiles.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-muted" colSpan={5}>
                  No archived files match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

function RolesPanel({ actorEmail }: { actorEmail: string | null }) {
  const [rows, setRows] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>("active");

  // Used for reloads after a mutation (event handlers), so a synchronous
  // loading flip here is fine.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listMembers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the roster.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch — state is only touched after the await, so we don't flip
  // state synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMembers();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Couldn't load the roster.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That change didn't save.");
    } finally {
      setSaving(false);
    }
  }

  function addMember() {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !name.trim()) {
      setError("Enter both a name and a @rutgers.edu email.");
      return;
    }
    void run(async () => {
      await upsertMember({ email: nextEmail, fullName: name, role, actorEmail });
      setEmail("");
      setName("");
      setRole("active");
    });
  }

  return (
    <section>
      <PanelHeader
        title="Roles & access"
        desc="Add a member's @rutgers.edu email to grant them a login and set their role. Only emails on this roster can sign in — anyone else is turned away. Only the president (and tech admin) can make changes here."
        endpoint="GET /members · POST /members (upsert) · DELETE /members/[email]"
      />

      <div
        className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
          isSupabaseConfigured
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-gold/40 bg-gold/10 text-ink"
        }`}
      >
        <ShieldCheckSmall />
        <span>
          {isSupabaseConfigured ? (
            <>
              <strong>Live.</strong>{" "}
              Changes are saved to the shared backend and apply to everyone
              immediately.
            </>
          ) : (
            <>
              <strong>Preview mode.</strong>{" "}
              Supabase isn&apos;t connected yet, so changes are saved only in
              this browser. Connect it (see the setup guide) to make roles
              shared and enforce president-only edits.
            </>
          )}
        </span>
      </div>

      {/* Add member */}
      <div className="mt-5 rounded-xl border border-line bg-slate-50/60 p-4">
        <h3 className="text-sm font-semibold text-ink">Add or update a member</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@rutgers.edu"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleName(r)}
              </option>
            ))}
          </select>
          <button
            onClick={addMember}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Save
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{ROLE_META[role].blurb}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet"
        >
          {error}
        </div>
      )}

      {/* Roster */}
      <div className="mt-5 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 hidden sm:table-cell">Added by</th>
              <th className="px-4 py-3 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  <Loader2 size={18} className="mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No members yet. Add the first one above.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((m) => {
                const isSelf = actorEmail != null && m.email === actorEmail;
                return (
                  <tr key={m.email}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{m.fullName || "—"}</p>
                      <p className="text-xs text-muted">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        disabled={saving || isSelf}
                        onChange={(e) =>
                          run(() =>
                            upsertMember({
                              email: m.email,
                              fullName: m.fullName,
                              role: e.target.value as MemberRole,
                              actorEmail,
                            })
                          )
                        }
                        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue focus:ring-1 focus:ring-blue disabled:cursor-not-allowed disabled:opacity-60"
                        title={isSelf ? "You can't change your own access." : undefined}
                      >
                        {MEMBER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleName(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden text-xs text-muted sm:table-cell">
                      {m.addedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${m.email}? They will lose portal access.`
                            )
                          ) {
                            void run(() => removeMember(m.email));
                          }
                        }}
                        disabled={saving || isSelf}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-scarlet transition-colors hover:bg-scarlet/10 disabled:cursor-not-allowed disabled:opacity-40"
                        title={isSelf ? "You can't remove yourself." : "Remove member"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ShieldCheckSmall() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
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
