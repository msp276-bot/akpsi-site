"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  GraduationCap,
  Loader2,
  MailCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleIcon from "@/components/GoogleIcon";
import Logo from "@/components/ui/Logo";
import { EASE_OUT } from "@/lib/motion";

export default function PortalSignInPage() {
  const { user, loading, mode } = useAuth();
  const router = useRouter();

  // Already signed in → go straight to the dashboard.
  useEffect(() => {
    if (!loading && user) router.replace("/portal/dashboard");
  }, [loading, user, router]);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-slate-50 px-5 py-16">
      {/* subtle brand band up top */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy/5 to-transparent" />

      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to site
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative w-full max-w-[420px] rounded-2xl border border-line bg-white p-8 shadow-xl"
      >
        <div className="flex justify-center">
          <Logo tone="dark" />
        </div>

        {mode === "supabase" ? <RealSignIn /> : <MockSignIn />}

        <p className="mt-6 border-t border-line pt-5 text-center text-xs leading-relaxed text-muted">
          Access is limited to chapter members added to the roster. If your
          @rutgers.edu email isn&apos;t recognized, reach out to the chapter
          president or tech committee.
        </p>
      </motion.div>

      <p className="relative mt-8 text-xs text-muted">
        Omicron Tau Chapter ·{" "}
        <span className="text-scarlet">Rutgers University</span>–New Brunswick
      </p>
    </main>
  );
}

/* ------------------------------------------------------------------ REAL */
// Shown when Supabase is configured. Login is Google OAuth or a magic-link
// email; only emails on the roster (allowlist) can complete sign-in.
function RealSignIn() {
  const { signInWithGoogle, requestMagicLink } = useAuth();
  const [busy, setBusy] = useState<"google" | "link" | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function google() {
    setBusy("google");
    setError(null);
    try {
      await signInWithGoogle(); // redirects away
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
      setBusy(null);
    }
  }

  async function magicLink() {
    setBusy("link");
    setError(null);
    try {
      const res = await requestMagicLink(email);
      if (res.sent) setSentTo(email.trim().toLowerCase());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the link.");
    } finally {
      setBusy(null);
    }
  }

  if (sentTo) {
    return (
      <div className="mt-6 text-center">
        <MailCheck className="mx-auto text-blue" size={34} />
        <h1 className="mt-4 text-xl font-bold text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a one-time login link to{" "}
          <span className="font-medium text-ink">{sentTo}</span>. Open it on this
          device to finish signing in.
        </p>
        <button
          onClick={() => setSentTo(null)}
          className="mt-4 text-xs text-muted underline underline-offset-2 hover:text-navy"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="mt-6 text-center text-2xl font-bold text-blue">
        Member sign-in
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted">
        Sign in with your{" "}
        <span className="font-medium text-ink">@rutgers.edu</span> account to
        reach chapter events, documents, the directory, and announcements.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={google}
        disabled={busy !== null}
        className="group mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-blue hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:opacity-70"
      >
        {busy === "google" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <span className="transition-transform duration-200 group-hover:-translate-y-px">
            <GoogleIcon />
          </span>
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <label className="text-xs font-medium text-muted">Email me a login link</label>
      <div className="mt-1.5 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email && magicLink()}
          placeholder="you@rutgers.edu"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
        />
        <button
          onClick={magicLink}
          disabled={busy !== null || !email}
          className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy === "link" ? <Loader2 size={16} className="animate-spin" /> : "Send"}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ MOCK */
// Local-preview demo accounts. Because sign-in is mock (no backend), these fixed
// @rutgers.edu addresses make each role reachable in one click. Roles resolve in
// AuthContext; this whole panel is inert once Supabase is configured.
const DEMO_ACCOUNTS: {
  email: string;
  label: string;
  membership: "active" | "pledge";
}[] = [
  { email: "president@rutgers.edu", label: "President", membership: "active" },
  { email: "admin@rutgers.edu", label: "Admin", membership: "active" },
  { email: "tech@rutgers.edu", label: "Admin · Tech", membership: "active" },
  { email: "member@rutgers.edu", label: "Active brother", membership: "active" },
  { email: "pledge@rutgers.edu", label: "Pledge", membership: "pledge" },
];

function MockSignIn() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [audience, setAudience] = useState<"pledge" | "active">("active");

  async function handleSignIn(
    email?: string,
    membership: "active" | "pledge" = audience
  ) {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle(email, membership);
      router.replace("/portal/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mt-6 text-center text-2xl font-bold text-blue">
        Choose your portal
      </h1>

      <p className="mt-3 text-center text-sm leading-relaxed text-muted">
        Select the experience that matches where you are in your Omicron Tau
        journey, then sign in with your{" "}
        <span className="font-medium text-ink">@rutgers.edu</span> email to
        access internal resources, event calendars, and chapter documents.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAudience("pledge")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            audience === "pledge"
              ? "border-gold bg-gold/10 shadow-sm"
              : "border-line hover:border-gold/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <GraduationCap size={20} className="text-gold" />
            {audience === "pledge" && <Check size={17} className="text-navy" />}
          </div>
          <p className="mt-4 font-semibold text-ink">Pledge portal</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Your pledge calendar, resources, and cohort updates.</p>
        </button>
        <button
          type="button"
          onClick={() => setAudience("active")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            audience === "active"
              ? "border-navy bg-navy text-white shadow-sm"
              : "border-line hover:border-navy/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <UsersRound size={20} className={audience === "active" ? "text-gold" : "text-navy"} />
            {audience === "active" && <Check size={17} className="text-gold" />}
          </div>
          <p className="mt-4 font-semibold">Active brother portal</p>
          <p className={`mt-1 text-xs leading-relaxed ${audience === "active" ? "text-white/60" : "text-muted"}`}>Chapter events, documents, directory, and announcements.</p>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={() => handleSignIn()}
        disabled={submitting}
        className="group mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-blue hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:opacity-70"
      >
        {submitting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <span className="transition-transform duration-200 group-hover:-translate-y-px">
            <GoogleIcon />
          </span>
        )}
        {submitting ? "Signing in…" : `Continue as ${audience === "pledge" ? "a pledge" : "an active brother"}`}
      </button>

      <div className="mt-4 text-center">
        <button
          onClick={() => setShowDemo((v) => !v)}
          className="text-xs text-muted underline underline-offset-2 hover:text-navy"
        >
          {showDemo ? "Hide demo accounts" : "Sign in as a demo account"}
        </button>
      </div>

      {showDemo && (
        <div className="mt-3 rounded-xl border border-line bg-slate-50/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <ShieldCheck size={13} className="text-navy" />
            Local preview accounts — one click to sign in
          </p>
          <div className="mt-2.5 grid gap-1.5">
            {DEMO_ACCOUNTS.map((acct) => {
              const isPrivileged = acct.label.startsWith("Admin") || acct.label === "President";
              return (
                <button
                  key={acct.email}
                  onClick={() => handleSignIn(acct.email, acct.membership)}
                  disabled={submitting}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-left transition-colors hover:border-navy/50 disabled:opacity-60"
                >
                  <span className="truncate text-xs text-ink">{acct.email}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isPrivileged
                        ? "bg-navy text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {acct.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-line pt-3">
            <label className="text-[11px] text-muted">Or use a specific email</label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="email"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                placeholder="you@rutgers.edu"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue"
              />
              <button
                onClick={() => handleSignIn(demoEmail)}
                disabled={submitting || !demoEmail}
                className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
