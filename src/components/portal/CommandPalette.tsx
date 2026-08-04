"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  Users,
  FolderOpen,
  CalendarDays,
  Megaphone,
  LayoutDashboard,
  Award,
  ClipboardCheck,
  CalendarPlus,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  UserRound,
  FileText,
  FileSpreadsheet,
  Link2,
  CornerDownLeft,
  X,
} from "lucide-react";
import { members as ALL_MEMBERS, getInitials } from "@/data/members";
import { listDocuments, type DocItem } from "@/lib/documents";
import { listChapterEvents, type ChapterEventRecord } from "@/lib/chapterEvents";
import { listAnnouncements, type Announcement } from "@/lib/announcements";
import {
  canAccessVisibility,
  hasPermission,
  type PortalRole,
  type Permission,
} from "@/lib/access";

/**
 * ⌘K command palette: one bar that searches across People, Pages, Documents,
 * Events, and Announcements. People come from the static roster; the other
 * three groups are fetched (once) from the same libs the portal pages use, so
 * results respect the caller's role visibility (RLS on live, mock seeds in the
 * static preview). Everything is filtered client-side by a lowercased haystack.
 */

type ResultKind = "person" | "page" | "document" | "event" | "announcement";

interface SearchItem {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  keywords: string; // lowercased haystack the query matches against
  href?: string; // internal route (router.push)
  externalUrl?: string | null; // open in a new tab (documents/links)
  memberSlug?: string; // people: opens their directory card
  Icon?: LucideIcon;
  initials?: string; // people
  photo?: string; // people
}

interface PageDef {
  title: string;
  href: string;
  Icon: LucideIcon;
  keywords: string;
  permission?: Permission;
}

const PAGES: PageDef[] = [
  { title: "Dashboard", href: "/portal/dashboard", Icon: LayoutDashboard, keywords: "home overview" },
  { title: "Events", href: "/portal/events", Icon: CalendarDays, keywords: "calendar rsvp schedule" },
  { title: "Directory", href: "/portal/directory", Icon: Users, keywords: "members people contacts brothers" },
  { title: "My Profile", href: "/portal/profile", Icon: UserRound, keywords: "edit profile major company linkedin photo" },
  { title: "Documents", href: "/portal/documents", Icon: FolderOpen, keywords: "files bylaws minutes resources" },
  { title: "Announcements", href: "/portal/announcements", Icon: Megaphone, keywords: "posts news updates" },
  { title: "Points", href: "/portal/points", Icon: Award, keywords: "submissions service hours achievements badges", permission: "submissions:submit" },
  { title: "Leaderboard", href: "/portal/standings", Icon: BarChart3, keywords: "standings rank ranking totals", permission: "submissions:submit" },
  { title: "Review Submissions", href: "/portal/review", Icon: ClipboardCheck, keywords: "approve deny pending", permission: "submissions:review" },
  { title: "Point Events", href: "/portal/point-events", Icon: CalendarPlus, keywords: "create point event catalog", permission: "submissions:review" },
  { title: "Applications", href: "/portal/applications", Icon: ClipboardList, keywords: "rush recruits applicants deck", permission: "read:applications" },
  { title: "Admin", href: "/portal/admin", Icon: ShieldCheck, keywords: "roles manage settings", permission: "manage:roles" },
];

// Pledges don't get the Directory in nav, so the palette hides people + the
// directory page from them too (mirrors PortalShell's PLEDGE_NAV).
const PLEDGE_PAGE_HREFS = new Set([
  "/portal/dashboard",
  "/portal/events",
  "/portal/profile",
  "/portal/documents",
  "/portal/announcements",
  "/portal/points",
  "/portal/standings",
]);

const GROUP_ORDER: ResultKind[] = ["page", "person", "document", "event", "announcement"];
const GROUP_LABEL: Record<ResultKind, string> = {
  page: "Jump to",
  person: "People",
  document: "Documents",
  event: "Events",
  announcement: "Announcements",
};

function docIcon(kind: DocItem["kind"]): LucideIcon {
  if (kind === "sheet") return FileSpreadsheet;
  if (kind === "link") return Link2;
  return FileText;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CommandPalette({ role }: { role: PortalRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // Fetched groups, loaded lazily the first time the palette opens.
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [events, setEvents] = useState<ChapterEventRecord[]>([]);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const loadedRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const canSeeDirectory = role !== "pledge";

  const openPalette = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  // Global ⌘K / Ctrl+K toggle. Resetting the query here (an event handler, not
  // an effect body) keeps each fresh open clean without a setState-in-effect.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setActive(0);
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load the dynamic groups once, on first open.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    listDocuments().then(setDocs).catch(() => {});
    listChapterEvents().then(setEvents).catch(() => {});
    listAnnouncements().then(setAnns).catch(() => {});
  }, [open]);

  // Focus the input once the palette is open (after paint so the mount doesn't
  // swallow it). No setState here, so no cascading-render lint.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Build the full, role-filtered index. People are static; the rest come from
  // the fetched state and are gated by visibility.
  const index = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];

    const allowedPages = PAGES.filter(
      (p) =>
        (!p.permission || hasPermission(role, p.permission)) &&
        (role !== "pledge" || PLEDGE_PAGE_HREFS.has(p.href))
    );
    for (const p of allowedPages) {
      items.push({
        id: `page:${p.href}`,
        kind: "page",
        title: p.title,
        keywords: `${p.title} ${p.keywords}`.toLowerCase(),
        href: p.href,
        Icon: p.Icon,
      });
    }

    if (canSeeDirectory) {
      for (const m of ALL_MEMBERS) {
        const bits = [m.name, m.position, m.major, m.cohort, m.classYear, m.industry]
          .filter(Boolean)
          .join(" ");
        items.push({
          id: `person:${m.slug}`,
          kind: "person",
          title: m.name,
          subtitle: [m.position, m.classYear ? `Class of ${m.classYear}` : null]
            .filter(Boolean)
            .join(" · "),
          keywords: bits.toLowerCase(),
          memberSlug: m.slug,
          initials: getInitials(m.name),
          photo: m.photo,
        });
      }
    }

    for (const d of docs) {
      if (!canAccessVisibility(d.visibility, role)) continue;
      items.push({
        id: `document:${d.id}`,
        kind: "document",
        title: d.name,
        subtitle: d.folder,
        keywords: `${d.name} ${d.folder} ${d.uploadedByName}`.toLowerCase(),
        externalUrl: d.url,
        href: d.url ? undefined : "/portal/documents",
        Icon: docIcon(d.kind),
      });
    }

    for (const e of events) {
      if (!canAccessVisibility(e.visibility, role)) continue;
      items.push({
        id: `event:${e.id}`,
        kind: "event",
        title: e.title,
        subtitle: [shortDate(e.start), e.location].filter(Boolean).join(" · "),
        keywords: `${e.title} ${e.location} ${e.description} ${e.type}`.toLowerCase(),
        href: "/portal/events",
        Icon: CalendarDays,
      });
    }

    for (const a of anns) {
      if (!canAccessVisibility(a.visibility, role)) continue;
      items.push({
        id: `announcement:${a.id}`,
        kind: "announcement",
        title: a.title,
        subtitle: [a.authorName, shortDate(a.createdAt)].filter(Boolean).join(" · "),
        keywords: `${a.title} ${a.body} ${a.authorName}`.toLowerCase(),
        href: "/portal/announcements",
        Icon: Megaphone,
      });
    }

    return items;
  }, [role, canSeeDirectory, docs, events, anns]);

  // Filter + rank. Empty query shows only the Pages group (a "jump to" menu).
  const results = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.filter((i) => i.kind === "page");
    const terms = q.split(/\s+/);
    const scored: { item: SearchItem; score: number }[] = [];
    for (const item of index) {
      let score = 0;
      let matchedAll = true;
      for (const t of terms) {
        const at = item.keywords.indexOf(t);
        if (at === -1) {
          matchedAll = false;
          break;
        }
        // Earlier matches (and title-start matches) rank higher.
        score += item.title.toLowerCase().startsWith(t) ? 100 : Math.max(0, 40 - at);
      }
      if (matchedAll) scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 40).map((s) => s.item);
  }, [query, index]);

  // Group the flat result list, preserving GROUP_ORDER, and expose a flattened
  // order so arrow-key selection can walk across groups.
  const { groups, flat } = useMemo(() => {
    const byKind = new Map<ResultKind, SearchItem[]>();
    for (const item of results) {
      const arr = byKind.get(item.kind) ?? [];
      arr.push(item);
      byKind.set(item.kind, arr);
    }
    const grouped: { kind: ResultKind; items: SearchItem[] }[] = [];
    const flatList: SearchItem[] = [];
    for (const kind of GROUP_ORDER) {
      const arr = byKind.get(kind);
      if (arr && arr.length) {
        grouped.push({ kind, items: arr });
        flatList.push(...arr);
      }
    }
    return { groups: grouped, flat: flatList };
  }, [results]);

  // Clamp for reads instead of correcting `active` in an effect: the result set
  // can shrink under a stale index between renders.
  const activeIdx = flat.length ? Math.min(active, flat.length - 1) : 0;

  const close = useCallback(() => setOpen(false), []);

  const activate = useCallback(
    (item: SearchItem | undefined) => {
      if (!item) return;
      setOpen(false);
      // People open their directory card. A URL hash won't do it: App Router
      // fires no navigation for a same-page hash change, so the card never
      // opens when you're already on the directory. Instead hand the slug off
      // via a CustomEvent (same page) plus sessionStorage (picked up on mount
      // after a cross-page push).
      if (item.kind === "person" && item.memberSlug) {
        try {
          window.sessionStorage.setItem("akpsi.openMember", item.memberSlug);
        } catch {
          /* storage may be unavailable */
        }
        window.dispatchEvent(
          new CustomEvent("akpsi:open-member", { detail: item.memberSlug })
        );
        router.push("/portal/directory/");
        return;
      }
      if (item.externalUrl) {
        window.open(item.externalUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (item.href) router.push(item.href);
    },
    [router]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(flat[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  // Scroll the active row into view as the selection moves.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <>
      {/* Header trigger */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search the portal"
        title="Search (⌘K)"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search</span>
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Portal search"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          <div className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search people, documents, events, announcements…"
                className="h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={close}
                aria-label="Close search"
                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2">
              {flat.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">
                  {query.trim()
                    ? `No results for “${query.trim()}”`
                    : "Type to search the portal."}
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.kind} className="mb-1">
                    <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {GROUP_LABEL[group.kind]}
                    </p>
                    {group.items.map((item) => {
                      const idx = flat.indexOf(item);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onClick={() => activate(item)}
                          onMouseMove={() => setActive(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? "bg-navy/5" : "hover:bg-slate-50"
                          }`}
                        >
                          {item.kind === "person" ? (
                            item.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.photo}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-bold text-navy">
                                {item.initials}
                              </span>
                            )
                          ) : (
                            <span
                              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                                isActive ? "bg-navy text-white" : "bg-slate-100 text-muted"
                              }`}
                            >
                              {item.Icon ? <item.Icon size={16} /> : null}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">
                              {item.title}
                            </span>
                            {item.subtitle ? (
                              <span className="block truncate text-xs text-muted">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                          {isActive ? (
                            <CornerDownLeft size={14} className="shrink-0 text-muted" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-sans">↑</kbd>
                <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-sans">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-sans">↵</kbd>
                to open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-sans">esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
