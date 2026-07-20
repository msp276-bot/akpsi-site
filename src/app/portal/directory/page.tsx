"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Mail, GraduationCap } from "lucide-react";
import { LinkedinIcon } from "@/components/BrandIcons";
import PortalShell from "@/components/portal/PortalShell";
import { members, getInitials, type Member } from "@/data/members";

export default function DirectoryPage() {
  return (
    <PortalShell>
      <Directory />
    </PortalShell>
  );
}

function Directory() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<string>("all");
  const [selected, setSelected] = useState<Member | null>(null);

  const years = useMemo(
    () => ["all", ...Array.from(new Set(members.map((m) => m.classYear))).sort()],
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchesYear = year === "all" || m.classYear === year;
      const matchesQuery =
        !q ||
        [m.name, m.major, m.minor, m.position, m.industry]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      return matchesYear && matchesQuery;
    });
  }, [query, year]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Member Directory</h1>
      <p className="mt-1 text-sm text-muted">
        {results.length} of {members.length} members
      </p>

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
