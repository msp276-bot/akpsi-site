"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, X, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { submitApplication } from "@/lib/applications";

const CURRENT_YEAR = 2026;
const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i);

export default function ApplyPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gradYear: "",
    major: "",
    gpa: "",
    referralSource: "",
    pitch: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim() || !form.email.trim() || !form.major.trim()) {
      setError("Please fill in your name, email, and major.");
      return;
    }
    if (resume && resume.size > 10 * 1024 * 1024) {
      setError("Résumé must be under 10 MB.");
      return;
    }
    setSubmitting(true);
    try {
      await submitApplication({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        gradYear: form.gradYear ? Number(form.gradYear) : undefined,
        major: form.major,
        gpa: form.gpa,
        referralSource: form.referralSource,
        pitch: form.pitch,
        resumeFile: resume,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy";

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <section className="relative overflow-hidden bg-navy px-5 pb-14 pt-32 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(45,62,95,0.55)_0%,rgba(26,39,68,0.9)_60%,rgba(19,29,51,1)_100%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Omicron Tau · Fall &rsquo;26 Recruitment
            </p>
            <h1 className="headline mt-4 text-4xl uppercase text-white sm:text-5xl">
              Apply to AKPsi
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Tell us a little about yourself and we&rsquo;ll be in touch about
              next steps. It takes about five minutes.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          {done ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="mx-auto text-emerald-500" size={44} />
              <h2 className="mt-4 text-xl font-bold text-ink">
                Application received
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Thanks for applying to the Omicron Tau chapter. We&rsquo;ll review
                it and reach out about rush events and interviews. Keep an eye on
                your email.
              </p>
              <Link
                href="/rush"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#141d34]"
              >
                Back to Rush
              </Link>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
            >
              {error && (
                <div className="mb-5 rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    Full name <span className="text-scarlet">*</span>
                  </span>
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">
                    Email <span className="text-scarlet">*</span>
                  </span>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@scarletmail.rutgers.edu"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">
                    Phone <span className="text-muted">(optional)</span>
                  </span>
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(732) 555-0123"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">
                    Expected graduation
                  </span>
                  <select
                    className={inputClass}
                    value={form.gradYear}
                    onChange={(e) => update("gradYear", e.target.value)}
                  >
                    <option value="">Select a year</option>
                    {GRAD_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">
                    GPA <span className="text-muted">(optional)</span>
                  </span>
                  <input
                    className={inputClass}
                    value={form.gpa}
                    onChange={(e) => update("gpa", e.target.value)}
                    placeholder="3.7"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    Major <span className="text-scarlet">*</span>
                  </span>
                  <input
                    className={inputClass}
                    value={form.major}
                    onChange={(e) => update("major", e.target.value)}
                    placeholder="Finance"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    How did you hear about us?
                  </span>
                  <input
                    className={inputClass}
                    value={form.referralSource}
                    onChange={(e) => update("referralSource", e.target.value)}
                    placeholder="Info session, a friend, tabling, Instagram…"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-ink">
                    Why AKPsi? <span className="text-muted">(a sentence or two)</span>
                  </span>
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={form.pitch}
                    onChange={(e) => update("pitch", e.target.value)}
                    placeholder="What draws you to the chapter and what you're hoping to get out of it."
                  />
                </label>
              </div>

              {/* Résumé upload */}
              <div className="mt-5">
                <span className="text-sm font-medium text-ink">
                  Résumé <span className="text-muted">(PDF, optional)</span>
                </span>
                {resume ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-slate-50 px-3 py-2.5">
                    <span className="truncate text-sm text-ink">{resume.name}</span>
                    <button
                      type="button"
                      onClick={() => setResume(null)}
                      aria-label="Remove résumé"
                      className="text-muted hover:text-scarlet"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-slate-50 px-3 py-4 text-sm text-muted hover:border-navy">
                    <Upload size={16} /> Click to attach your résumé
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft disabled:opacity-60 sm:w-auto sm:px-10"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
