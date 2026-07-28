"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Search, ShieldAlert, GraduationCap, FileText, Mail, Phone,
  X, Check, RotateCcw, Users2,
} from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import { useAuth } from "@/context/AuthContext";
import { applications, type RushApplication, type ApplicationStatus } from "@/data/applications";
import { getInitials } from "@/data/members";
import { hasPermission } from "@/lib/access";

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
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [exitDir, setExitDir] = useState<Decision>("keep");
  const allowed = hasPermission(user?.role ?? "active", "read:applications");

  const deck = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) =>
      [app.fullName, app.email, app.major, app.status].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const current = deck[index];
  const next = deck[index + 1];

  function decide(dir: Decision) {
    if (!current) return;
    setExitDir(dir);
    setDecisions((prev) => ({ ...prev, [current.id]: dir }));
    setIndex((i) => i + 1);
  }

  function reset() {
    setIndex(0);
    setDecisions({});
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-scarlet/20 bg-white p-8 text-center">
        <ShieldAlert className="mx-auto text-scarlet" size={34} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Applications are E-Board only</h1>
        <p className="mt-2 text-sm text-muted">
          Rush applications, headshots, and pipeline actions are hidden unless
          your account has E-Board or admin access.
        </p>
      </div>
    );
  }

  const keepCount = Object.values(decisions).filter((d) => d === "keep").length;
  const passCount = Object.values(decisions).filter((d) => d === "pass").length;
  const done = index >= deck.length;

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink">Rush applications</h1>
        <p className="mt-1 text-sm text-muted">
          Swipe through applicants. Right to keep, left to pass.
        </p>
      </div>

      <div className="relative mx-auto mt-5 w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
          placeholder="Filter applicants..."
          className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue"
        />
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-green-600" /> {keepCount} kept</span>
        <span className="inline-flex items-center gap-1.5"><X size={13} className="text-scarlet" /> {passCount} passed</span>
        <span>{Math.min(index + (done ? 0 : 1), deck.length)} / {deck.length}</span>
      </div>

      {/* Deck */}
      <div className="relative mx-auto mt-6 h-[30rem] w-full max-w-sm">
        {done ? (
          <DeckDone deck={deck} decisions={decisions} onReset={reset} />
        ) : (
          <>
            {/* Peek of the next card for depth */}
            {next && (
              <div className="absolute inset-x-4 top-3 bottom-0 -z-0 scale-[0.97] rounded-3xl border border-line bg-white opacity-60 shadow-sm" />
            )}
            <AnimatePresence custom={exitDir} initial={false}>
              <SwipeCard key={current.id} app={current} exitDir={exitDir} onDecide={decide} />
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Action buttons */}
      {!done && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => decide("pass")}
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-scarlet/30 bg-white text-scarlet shadow-sm transition-colors hover:bg-scarlet hover:text-white"
            aria-label="Pass"
          >
            <X size={24} />
          </button>
          <button
            onClick={reset}
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-muted shadow-sm transition-colors hover:text-navy"
            aria-label="Reset deck"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={() => decide("keep")}
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-green-500/30 bg-white text-green-600 shadow-sm transition-colors hover:bg-green-600 hover:text-white"
            aria-label="Keep"
          >
            <Check size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  app,
  exitDir,
  onDecide,
}: {
  app: RushApplication;
  exitDir: Decision;
  onDecide: (dir: Decision) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const keepOpacity = useTransform(x, [30, 130], [0, 1]);
  const passOpacity = useTransform(x, [-130, -30], [1, 0]);

  return (
    <motion.article
      className="absolute inset-0 cursor-grab overflow-hidden rounded-3xl border border-line bg-white shadow-xl active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      custom={exitDir}
      variants={{
        exit: (dir: Decision) => ({
          x: dir === "keep" ? 520 : -520,
          opacity: 0,
          transition: { duration: 0.28 },
        }),
      }}
      exit="exit"
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onDecide("keep");
        else if (info.offset.x < -120) onDecide("pass");
      }}
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

        {/* Swipe overlays */}
        <motion.div
          style={{ opacity: keepOpacity }}
          className="pointer-events-none absolute left-4 top-4 rounded-lg border-2 border-green-400 px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-green-400 [transform:rotate(-12deg)]"
        >
          Keep
        </motion.div>
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute right-4 top-4 rounded-lg border-2 border-scarlet px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-scarlet [transform:rotate(12deg)]"
        >
          Pass
        </motion.div>

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

function DeckDone({
  deck,
  decisions,
  onReset,
}: {
  deck: RushApplication[];
  decisions: Record<string, Decision>;
  onReset: () => void;
}) {
  const kept = deck.filter((a) => decisions[a.id] === "keep");
  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="text-center">
        <Users2 className="mx-auto text-navy" size={30} />
        <h2 className="mt-3 text-lg font-bold text-ink">Deck complete</h2>
        <p className="mt-1 text-sm text-muted">
          {kept.length} kept of {deck.length} applicants.
        </p>
      </div>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {kept.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No one kept yet.</p>
        ) : (
          kept.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                {getInitials(a.fullName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{a.fullName}</p>
                <p className="truncate text-xs text-muted">Class of &rsquo;{String(a.gradYear).slice(2)} · {a.major}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        onClick={onReset}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
      >
        <RotateCcw size={15} /> Start over
      </button>
    </div>
  );
}
