"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Search, ShieldAlert, GraduationCap, FileText, Mail, Phone,
  X, Check, ChevronLeft, ChevronRight, Lock, Maximize2, ExternalLink,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { type RushApplication, type ApplicationStatus } from "@/data/applications";
import { getInitials } from "@/data/members";
import { hasPermission, portalRole } from "@/lib/access";
import { listApplications, setApplicationDecision } from "@/lib/applications";

// Applications are collected in the chapter's Google Form. Reviewers open the
// responses in Google (the linked responses Sheet, or the Form's edit page →
// Responses tab). Paste that URL here to enable the button below. The public
// `viewform` link only COLLECTS responses, so it can't be used to read them.
const GOOGLE_RESPONSES_URL =
  "https://docs.google.com/spreadsheets/d/1gCQIu8ztSzLdWbVB9L-2Z8e2qCjKyek_g3gNaqx08Ik/edit?usp=sharing";

const STATUS_META: Record<ApplicationStatus, string> = {
  pending: "bg-gold/15 text-[#9a7228]",
  interview: "bg-blue/10 text-blue",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-scarlet/10 text-scarlet",
  waitlist: "bg-slate-100 text-muted",
};

type Decision = "keep" | "pass";

export default function ApplicationsPage() {
  return (
    <PortalShell>
      <ApplicationsBoard />
    </PortalShell>
  );
}

function ApplicationsBoard() {
  const { user } = useAuth();
  const role = portalRole(user);
  const allowed = hasPermission(role, "read:applications");
  // Only the president decides; everyone else with access is view-only.
  const canSwipe = role === "president";

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [expanded, setExpanded] = useState(false);
  const [appsData, setAppsData] = useState<RushApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Non-allowed users never reach the loading guard (the auth block returns
    // first), so we only fetch - and only toggle loading - when allowed.
    if (!allowed) return;
    let active = true;
    listApplications()
      .then((rows) => {
        if (!active) return;
        setAppsData(rows);
        // Seed the keep/pass state from decisions already persisted.
        setDecisions(
          Object.fromEntries(
            rows
              .filter((r) => r.decision)
              .map((r) => [r.id, r.decision as Decision])
          )
        );
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed]);

  const deck = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appsData;
    return appsData.filter((app) =>
      [app.fullName, app.email, app.major, app.status].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, appsData]);

  // Clamp so a shrinking filter result never points past the end.
  const safeIndex = deck.length ? Math.min(index, deck.length - 1) : 0;
  const current = deck[safeIndex];

  function setDecision(id: string, dir: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: dir }));
  }
  function decide(dir: Decision) {
    if (!canSwipe || !current) return;
    const id = current.id;
    setDecision(id, dir);
    // Persist the decision (fire-and-forget; the optimistic UI already updated).
    setApplicationDecision(id, dir, user?.email ?? "").catch(() => {});
    // Advance to the next card, but never past the end - the applicant stays
    // in the deck and the list, just now marked.
    setIndex((i) => Math.min(i + 1, deck.length - 1));
  }
  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(deck.length - 1, i + delta)));
  }
  function jumpTo(id: string) {
    const i = deck.findIndex((a) => a.id === id);
    if (i >= 0) setIndex(i);
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-scarlet/20 bg-white p-8 text-center">
        <ShieldAlert className="mx-auto text-scarlet" size={34} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Applications are E-Board only</h1>
        <p className="mt-2 text-sm text-muted">
          Rush applications and reviewer actions are hidden unless your account
          has E-Board or admin access.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="mt-10 text-center text-sm text-muted">
          Loading applications…
        </p>
      </div>
    );
  }

  const keepCount = Object.values(decisions).filter((d) => d === "keep").length;
  const passCount = Object.values(decisions).filter((d) => d === "pass").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Rush applications</h1>
          <p className="mt-1 text-sm text-muted">
            {canSwipe
              ? "Swipe or use the buttons - right to keep, left to pass. Nothing is removed; decisions are saved on each card."
              : "View only - the president makes keep/pass decisions."}
          </p>
        </div>
        <span className="inline-flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-green-600" /> {keepCount} kept</span>
          <span className="inline-flex items-center gap-1.5"><X size={13} className="text-scarlet" /> {passCount} passed</span>
          <span>{deck.length} total</span>
        </span>
      </div>

      {/* Applications are collected via the chapter's Google Form; reviewers open
          the responses in Google from here. */}
      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy/5 text-navy">
          <FileText size={18} />
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <p className="font-semibold text-ink">Applications come in through Google Forms</p>
          <p className="mt-0.5 text-sm text-muted">
            New submissions land in the chapter&rsquo;s Google Form responses. Open
            them in Google to review.
          </p>
        </div>
        {GOOGLE_RESPONSES_URL ? (
          <a
            href={GOOGLE_RESPONSES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
          >
            View responses <ExternalLink size={15} />
          </a>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-muted">
            Responses link not set
          </span>
        )}
      </div>

      <div className="relative mt-6 w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
          placeholder="Filter applicants..."
          className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue"
        />
      </div>

      {deck.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No applicants match your search.</p>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* Deck */}
          <div>
            <div className="relative h-[30rem]">
              <SwipeCard
                key={current.id}
                app={current}
                decision={decisions[current.id]}
                canSwipe={canSwipe}
                onDecide={decide}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-4">
              <p className="text-xs text-muted">
                {safeIndex + 1} of {deck.length}
              </p>
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-navy shadow-sm transition-colors hover:bg-slate-50"
              >
                <Maximize2 size={13} /> Full screen
              </button>
            </div>

            {/* Navigation + decisions in one roomy row - no cramped overlay arrows. */}
            <div className="mt-3 flex items-center justify-center gap-5">
              <button
                onClick={() => go(-1)}
                disabled={safeIndex === 0}
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-muted shadow-sm transition-colors hover:text-navy disabled:opacity-40"
                aria-label="Previous applicant"
              >
                <ChevronLeft size={20} />
              </button>

              {canSwipe && (
                <>
                  <button
                    onClick={() => decide("pass")}
                    className="grid h-14 w-14 place-items-center rounded-full border-2 border-scarlet/30 bg-white text-scarlet shadow-sm transition-colors hover:bg-scarlet hover:text-white"
                    aria-label="Pass"
                  >
                    <X size={24} />
                  </button>
                  <button
                    onClick={() => decide("keep")}
                    className="grid h-14 w-14 place-items-center rounded-full border-2 border-green-500/30 bg-white text-green-600 shadow-sm transition-colors hover:bg-green-600 hover:text-white"
                    aria-label="Keep"
                  >
                    <Check size={24} />
                  </button>
                </>
              )}

              <button
                onClick={() => go(1)}
                disabled={safeIndex >= deck.length - 1}
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-muted shadow-sm transition-colors hover:text-navy disabled:opacity-40"
                aria-label="Next applicant"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {!canSwipe && (
              <p className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs text-muted">
                <Lock size={13} /> Only the president can keep or pass applicants.
              </p>
            )}
          </div>

          {/* Full list - every applicant is always visible with its decision. */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">All applicants</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
              {deck.map((a, i) => {
                const d = decisions[a.id];
                const isCurrent = i === safeIndex;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => jumpTo(a.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isCurrent ? "bg-slate-50" : ""}`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                        {getInitials(a.fullName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{a.fullName}</span>
                        <span className="block truncate text-xs text-muted">
                          Class of &rsquo;{String(a.gradYear).slice(2)} · {a.major}
                        </span>
                      </span>
                      {d === "keep" && <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">Kept</span>}
                      {d === "pass" && <span className="shrink-0 rounded-full bg-scarlet/10 px-2.5 py-1 text-[11px] font-semibold text-scarlet">Passed</span>}
                      {!d && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-muted">New</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {expanded && current && (
        <FullScreenReview
          app={current}
          index={safeIndex}
          total={deck.length}
          decision={decisions[current.id]}
          canSwipe={canSwipe}
          onDecide={decide}
          onNav={go}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
}

function FullScreenReview({
  app,
  index,
  total,
  decision,
  canSwipe,
  onDecide,
  onNav,
  onClose,
}: {
  app: RushApplication;
  index: number;
  total: number;
  decision?: Decision;
  canSwipe: boolean;
  onDecide: (dir: Decision) => void;
  onNav: (delta: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNav(-1);
      else if (e.key === "ArrowRight") onNav(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  return (
    <div
      className="fixed inset-0 z-50 flex bg-navy/50 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Application review for ${app.fullName}`}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-slate-50 shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">{app.fullName}</h2>
            <p className="text-xs text-muted">{index + 1} of {total}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNav(-1)}
              disabled={index === 0}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-muted transition-colors hover:text-navy disabled:opacity-40"
              aria-label="Previous applicant"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onNav(1)}
              disabled={index >= total - 1}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-muted transition-colors hover:text-navy disabled:opacity-40"
              aria-label="Next applicant"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={onClose}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-slate-50"
              aria-label="Close full screen"
            >
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* Body: headshot + stats on the left, resume on the right */}
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
          {/* Left column */}
          <div className="flex min-h-0 flex-col border-b border-line p-5 lg:border-b-0 lg:border-r">
            <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
              {app.headshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.headshot} alt={app.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <span className="grid h-28 w-28 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-4xl text-gold">
                    {getInitials(app.fullName)}
                  </span>
                </div>
              )}
              {decision && (
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    decision === "keep" ? "bg-green-600 text-white" : "bg-scarlet text-white"
                  }`}
                >
                  {decision === "keep" ? "Kept" : "Passed"}
                </span>
              )}
            </div>

            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#9a7228]">
              <GraduationCap size={15} /> Class of &rsquo;{String(app.gradYear).slice(2)} · {app.major}
            </p>

            {app.pitch && (
              <p className="mt-3 text-sm italic leading-relaxed text-ink/80">&ldquo;{app.pitch}&rdquo;</p>
            )}

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["GPA", app.gpa],
                ["Class", `'${String(app.gradYear).slice(2)}`],
                ["Source", app.referralSource],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white py-2 shadow-sm">
                  <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="mt-0.5 truncate px-1 text-sm font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 space-y-2 text-xs text-muted">
              <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 hover:text-navy">
                <Mail size={13} /> {app.email}
              </a>
              {app.phone && (
                <span className="flex items-center gap-1.5"><Phone size={13} /> {app.phone}</span>
              )}
            </div>

            {canSwipe && (
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => onDecide("pass")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-scarlet/30 bg-white px-4 py-2.5 text-sm font-semibold text-scarlet transition-colors hover:bg-scarlet hover:text-white"
                >
                  <X size={18} /> Pass
                </button>
                <button
                  onClick={() => onDecide("keep")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-green-500/30 bg-white px-4 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-600 hover:text-white"
                >
                  <Check size={18} /> Keep
                </button>
              </div>
            )}
          </div>

          {/* Right column: resume */}
          <div className="flex min-h-0 flex-col bg-slate-100">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
                <FileText size={14} /> Résumé
              </span>
              {app.resumeUrl && (
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:underline"
                >
                  Open <ExternalLink size={12} />
                </a>
              )}
            </div>
            {app.resumeUrl ? (
              <iframe
                src={app.resumeUrl}
                title={`${app.fullName} résumé`}
                className="min-h-0 flex-1 border-0 bg-white"
              />
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <FileText className="mx-auto text-muted/50" size={40} />
                  <p className="mt-3 text-sm font-medium text-muted">Résumé pending</p>
                  <p className="mt-1 text-xs text-muted/80">
                    This applicant has not attached a résumé yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SwipeCard({
  app,
  decision,
  canSwipe,
  onDecide,
}: {
  app: RushApplication;
  decision?: Decision;
  canSwipe: boolean;
  onDecide: (dir: Decision) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const keepOpacity = useTransform(x, [30, 130], [0, 1]);
  const passOpacity = useTransform(x, [-130, -30], [1, 0]);

  return (
    <motion.article
      className={`absolute inset-0 overflow-hidden rounded-3xl border border-line bg-white shadow-xl ${canSwipe ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={canSwipe ? { x, rotate } : undefined}
      drag={canSwipe ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={
        canSwipe
          ? (_, info) => {
              if (info.offset.x > 120) onDecide("keep");
              else if (info.offset.x < -120) onDecide("pass");
            }
          : undefined
      }
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Headshot / monogram */}
      <div className="relative h-64 w-full bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
        {app.headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.headshot} alt={app.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="grid h-24 w-24 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-3xl text-gold">
              {getInitials(app.fullName)}
            </span>
          </div>
        )}

        {/* Saved decision badge (persists as you browse) */}
        {decision && (
          <span
            className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              decision === "keep" ? "bg-green-600 text-white" : "bg-scarlet text-white"
            }`}
          >
            {decision === "keep" ? "Kept" : "Passed"}
          </span>
        )}

        {/* Live drag overlays (president only) */}
        {canSwipe && (
          <>
            <motion.div
              style={{ opacity: keepOpacity }}
              className="pointer-events-none absolute right-4 top-4 rounded-lg border-2 border-green-400 px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-green-400 [transform:rotate(12deg)]"
            >
              Keep
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute right-4 bottom-24 rounded-lg border-2 border-scarlet px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-scarlet [transform:rotate(-12deg)]"
            >
              Pass
            </motion.div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/70 to-transparent p-4 pt-12">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight text-white">{app.fullName}</h2>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_META[app.status]}`}>
              {app.status}
            </span>
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
            <GraduationCap size={14} /> Class of &rsquo;{String(app.gradYear).slice(2)} · {app.major}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 p-5">
        {app.pitch && <p className="text-sm italic leading-relaxed text-ink/80">&ldquo;{app.pitch}&rdquo;</p>}

        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["GPA", app.gpa],
            ["Class", `'${String(app.gradYear).slice(2)}`],
            ["Source", app.referralSource],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 py-2">
              <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-0.5 truncate px-1 text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 hover:text-navy">
            <Mail size={13} /> {app.email}
          </a>
          {app.phone && (
            <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {app.phone}</span>
          )}
        </div>

        {app.resumeUrl ? (
          <a
            href={app.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <FileText size={15} /> View résumé
          </a>
        ) : (
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 py-2.5 text-sm font-medium text-muted">
            <FileText size={15} /> Résumé pending
          </span>
        )}
      </div>
    </motion.article>
  );
}
