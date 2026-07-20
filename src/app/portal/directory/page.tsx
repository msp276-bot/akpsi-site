"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, X, Mail, GraduationCap } from "lucide-react";
import { LinkedinIcon } from "@/components/BrandIcons";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { members, getInitials, type Member } from "@/data/members";
import { hasPermission } from "@/lib/access";

export default function DirectoryPage() {
  return (
    <PortalShell>
      <Directory />
    </PortalShell>
  );
}

function Directory() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<string>("all");
  const [selected, setSelected] = useState<Member | null>(null);
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [showAdd, setShowAdd] = useState(false);
  const canAddMembers = hasPermission(user?.role ?? "active", "edit:member");

  const years = useMemo(
    () => ["all", ...Array.from(new Set(localMembers.map((m) => m.classYear))).sort()],
    [localMembers]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localMembers.filter((m) => {
      const matchesYear = year === "all" || m.classYear === year;
      const matchesQuery =
        !q ||
        [m.name, m.major, m.minor, m.position, m.industry]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      return matchesYear && matchesQuery;
    });
  }, [localMembers, query, year]);

  function addMember(member: Member) {
    setLocalMembers((current) => [member, ...current]);
    setShowAdd(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Member Directory</h1>
          <p className="mt-1 text-sm text-muted">
            {results.length} of {localMembers.length} members
          </p>
        </div>
        {canAddMembers && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <Plus size={15} /> Add member
          </button>
        )}
      </div>

      {showAdd && (
        <AddMemberForm onClose={() => setShowAdd(false)} onCreate={addMember} />
      )}

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, major, industry…"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
          />
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === "all" ? "All class years" : `Class of ${y}`}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-scarlet text-sm font-bold text-white">
              {getInitials(m.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink">{m.name}</h3>
              <p className="truncate text-xs text-blue">{m.position}</p>
              <p className="truncate text-xs text-muted">
                {m.major} · &rsquo;{m.classYear.slice(2)}
              </p>
            </div>
          </button>
        ))}
        {results.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted">
            No members match your search.
          </p>
        )}
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              >
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-lg p-1 text-muted hover:bg-slate-100"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="-mt-4 flex flex-col items-center text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-scarlet text-xl font-bold text-white ring-2 ring-navy ring-offset-2">
                    {getInitials(selected.name)}
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-ink">
                    {selected.name}
                  </h2>
                  <p className="text-sm font-medium text-blue">
                    {selected.position}
                  </p>

                  <div className="mt-4 w-full space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
                    <div className="flex items-center gap-2 text-ink">
                      <GraduationCap size={15} className="text-muted" />
                      {selected.major}
                    </div>
                    {selected.minor && (
                      <p className="pl-6 text-xs text-muted">
                        Minor · {selected.minor}
                      </p>
                    )}
                    <p className="pl-6 text-xs text-muted">
                      Class of {selected.classYear}
                      {selected.industry ? ` · ${selected.industry}` : ""}
                    </p>
                  </div>

                  <div className="mt-4 flex w-full gap-2">
                    <a
                      href={selected.linkedin ?? "#"}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#141d34]"
                    >
                      <LinkedinIcon size={15} /> LinkedIn
                    </a>
                    <a
                      href={`mailto:${selected.name
                        .toLowerCase()
                        .replace(/ /g, ".")}@rutgers.edu`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy"
                    >
                      <Mail size={15} /> Contact
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddMemberForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (member: Member) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "Active Member",
    major: "",
    minor: "",
    classYear: "2028",
    group: "actives" as Member["group"],
    industry: "",
    linkedin: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.major.trim()) return;
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    onCreate({
      id: `local-${Date.now()}`,
      slug,
      name: form.name.trim(),
      position: form.position.trim() || "Active Member",
      major: form.major.trim(),
      minor: form.minor.trim() || undefined,
      group: form.group,
      classYear: form.classYear,
      industry: form.industry.trim() || undefined,
      linkedin: form.linkedin.trim() || "#",
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-gold/30 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Add member</h2>
          <p className="text-xs text-muted">
            Mock create flow — ready for POST /api/members and invite emails.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Close add member form"
        >
          <X size={17} />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Rutgers email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Position" value={form.position} onChange={(e) => update("position", e.target.value)} />
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Major" value={form.major} onChange={(e) => update("major", e.target.value)} />
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Minor" value={form.minor} onChange={(e) => update("minor", e.target.value)} />
        <select className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue" value={form.classYear} onChange={(e) => update("classYear", e.target.value)}>
          {["2026", "2027", "2028", "2029", "2030"].map((year) => (
            <option key={year} value={year}>Class of {year}</option>
          ))}
        </select>
        <select className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue" value={form.group} onChange={(e) => update("group", e.target.value as Member["group"])}>
          <option value="board">Board</option>
          <option value="directors">Director</option>
          <option value="actives">Active</option>
        </select>
        <input className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-blue" placeholder="Industry / track" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
      </div>
      <button className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
        Add to directory
      </button>
    </form>
  );
}
