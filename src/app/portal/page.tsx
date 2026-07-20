"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, GraduationCap, Loader2, UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleIcon from "@/components/GoogleIcon";
import Logo from "@/components/ui/Logo";
import { EASE_OUT } from "@/lib/motion";

export default function PortalSignInPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [audience, setAudience] = useState<"pledge" | "active">("active");

  // Already signed in → go straight to the dashboard.
  useEffect(() => {
    if (!loading && user) router.replace("/portal/dashboard");
  }, [loading, user, router]);

  async function handleSignIn(email?: string) {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle(email, audience);
      router.replace("/portal/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
      setSubmitting(false);
    }
  }

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

        {/* Demo helper — lets you exercise the @rutgers.edu validation without
            wiring a real OAuth client. Remove when real auth is connected. */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowDemo((v) => !v)}
            className="text-xs text-muted underline underline-offset-2 hover:text-navy"
          >
            {showDemo ? "Hide demo sign-in" : "Use a specific email (demo)"}
          </button>
        </div>

        {showDemo && (
          <div className="mt-3 flex gap-2">
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
        )}

        <p className="mt-6 border-t border-line pt-5 text-center text-xs leading-relaxed text-muted">
          Please note that if you do not have a @rutgers.edu email address, you
          will not be able to access the member portal. Reach out to the tech
          committee if you run into any issues.
        </p>
      </motion.div>

      <p className="relative mt-8 text-xs text-muted">
        Omicron Tau Chapter ·{" "}
        <span className="text-scarlet">Rutgers University</span>–New Brunswick
      </p>
    </main>
  );
}
