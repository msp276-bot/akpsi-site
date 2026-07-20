"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import MemberCard from "@/components/members/MemberCard";
import {
  members,
  GROUP_LABELS,
  type MemberGroup,
} from "@/data/members";
import { staggerContainer } from "@/lib/motion";

type Tab = "all" | MemberGroup;
type Sort = "az" | "year";

const TABS: Tab[] = ["all", "board", "directors", "actives"];
const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  ...GROUP_LABELS,
};

export default function MembersDirectory() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("az");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = members.filter((m) => {
      const matchesTab = tab === "all" || m.group === tab;
      const matchesQuery =
        !q ||
        [m.name, m.major, m.minor, m.position, m.industry]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      return matchesTab && matchesQuery;
    });
    return list.sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name)
        : a.classYear.localeCompare(b.classYear) || a.name.localeCompare(b.name)
    );
  }, [tab, query, sort]);

  return (
    <div>
      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-slate-100 p-1.5">
          {TABS.map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive ? "text-white" : "text-muted hover:text-navy"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="dir-tab-pill"
                    className="absolute inset-0 rounded-full bg-navy"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{TAB_LABELS[t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + sort */}
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, major, or position…"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-blue"
        >
          <option value="az">Sort: A–Z</option>
          <option value="year">Sort: Class year</option>
        </select>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {visible.length} member{visible.length === 1 ? "" : "s"}
      </p>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab + sort}
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((m) => (
            <MemberCard key={m.id} member={m} href={`/members/${m.slug}`} />
          ))}
        </motion.div>
      </AnimatePresence>

      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">
          No members match your search.
        </p>
      )}
    </div>
  );
}
