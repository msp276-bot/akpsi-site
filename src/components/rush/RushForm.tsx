"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Upload, FileText, X } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { fireConfetti } from "@/lib/confetti";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  gradYear: string;
  major: string;
  minor: string;
  gpa: string;
  why: string;
  linkedin: string;
  heardFrom: string;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  gradYear: "",
  major: "",
  minor: "",
  gpa: "",
  why: "",
  linkedin: "",
  heardFrom: "",
};

const GRAD_YEARS = ["2027", "2028", "2029", "2030"];
const HEARD_OPTIONS = ["Friend", "Social Media", "Event", "Other"];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const WHY_MAX = 500;

type Errors = Partial<Record<keyof FormState | "resume", string>>;

export default function RushForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.fullName.trim()) e.fullName = "Please enter your full name.";
    if (!/^[^@\s]+@rutgers\.edu$/i.test(form.email.trim()))
      e.email = "A valid @rutgers.edu email is required.";
    if (!/^[\d\s()+-]{7,}$/.test(form.phone.trim()))
      e.phone = "Please enter a valid phone number.";
    if (!form.gradYear) e.gradYear = "Select your graduation year.";
    if (!form.major.trim()) e.major = "Please enter your major.";
    const gpa = Number(form.gpa);
    if (!form.gpa.trim() || Number.isNaN(gpa) || gpa < 0 || gpa > 4)
      e.gpa = "GPA must be between 0.0 and 4.0.";
    if (!form.why.trim()) e.why = "Tell us why you're interested.";
    else if (form.why.length > WHY_MAX) e.why = `Keep it under ${WHY_MAX} characters.`;
    if (!form.heardFrom) e.heardFrom = "Let us know how you heard about us.";
    if (form.linkedin && !/^https?:\/\/.+/i.test(form.linkedin.trim()))
      e.linkedin = "Enter a full URL (https://…).";
    if (!resume) e.resume = "Please attach your resume (PDF).";
    return e;
  }

  function onFile(file: File | null) {
    setErrors((e) => ({ ...e, resume: undefined }));
    if (!file) {
      setResume(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setErrors((e) => ({ ...e, resume: "Resume must be a PDF." }));
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setErrors((e) => ({ ...e, resume: "Resume must be under 5MB." }));
      return;
    }
    setResume(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      // Focus the first invalid field's section by scrolling to top of form.
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      // Static S3/CloudFront hosting cannot run a Next.js API route. This keeps
      // the public recruitment experience polished as a front-end demo until a
      // real intake backend is connected (for example, API Gateway + Lambda,
      // Formspree, or a Google Form).
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDone(true);
      fireConfetti();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section id="apply" className="bg-white px-5 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-10 text-center shadow-sm"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="headline mt-6 text-3xl uppercase text-navy">
            Application received!
          </h2>
          <p className="mt-3 text-muted">
            Thanks for applying to AKΨ Omicron Tau. Check your{" "}
            <span className="font-medium text-ink">@rutgers.edu</span> email for
            next steps - we&rsquo;ll be in touch about info sessions and
            interviews.
          </p>
          <button
            onClick={() => {
              setForm(EMPTY);
              setResume(null);
              setDone(false);
            }}
            className="mt-6 text-sm font-medium text-blue hover:underline"
          >
            Submit another application
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="apply" className="bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <SectionHeader title="Apply Now" subtitle="spring '27 application" />

        <form onSubmit={onSubmit} noValidate className="mt-12 space-y-5">
          {serverError && (
            <div className="rounded-lg border border-scarlet/25 bg-scarlet/5 p-3 text-sm text-scarlet">
              {serverError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName} required>
              <input
                className={inputCls(errors.fullName)}
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label="Rutgers email" error={errors.email} required>
              <input
                type="email"
                className={inputCls(errors.email)}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@rutgers.edu"
                autoComplete="email"
              />
            </Field>
            <Field label="Phone number" error={errors.phone} required>
              <input
                type="tel"
                className={inputCls(errors.phone)}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
              />
            </Field>
            <Field label="Graduation year" error={errors.gradYear} required>
              <select
                className={inputCls(errors.gradYear)}
                value={form.gradYear}
                onChange={(e) => update("gradYear", e.target.value)}
              >
                <option value="">Select…</option>
                {GRAD_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Major" error={errors.major} required>
              <input
                className={inputCls(errors.major)}
                value={form.major}
                onChange={(e) => update("major", e.target.value)}
              />
            </Field>
            <Field label="Minor" error={errors.minor}>
              <input
                className={inputCls(errors.minor)}
                value={form.minor}
                onChange={(e) => update("minor", e.target.value)}
              />
            </Field>
            <Field label="GPA" error={errors.gpa} required>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                className={inputCls(errors.gpa)}
                value={form.gpa}
                onChange={(e) => update("gpa", e.target.value)}
                placeholder="3.50"
              />
            </Field>
            <Field label="How did you hear about us?" error={errors.heardFrom} required>
              <select
                className={inputCls(errors.heardFrom)}
                value={form.heardFrom}
                onChange={(e) => update("heardFrom", e.target.value)}
              >
                <option value="">Select…</option>
                {HEARD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Why AKPsi?" error={errors.why} required>
            <textarea
              rows={4}
              maxLength={WHY_MAX}
              className={inputCls(errors.why)}
              value={form.why}
              onChange={(e) => update("why", e.target.value)}
              placeholder="Tell us what draws you to the chapter…"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {form.why.length}/{WHY_MAX}
            </p>
          </Field>

          <Field label="LinkedIn profile" error={errors.linkedin}>
            <input
              type="url"
              className={inputCls(errors.linkedin)}
              value={form.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>

          {/* Resume upload */}
          <Field label="Resume (PDF, max 5MB)" error={errors.resume} required>
            {resume ? (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-slate-50 p-3">
                <FileText size={18} className="text-blue" />
                <span className="flex-1 truncate text-sm text-ink">
                  {resume.name}
                </span>
                <span className="text-xs text-muted">
                  {(resume.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResume(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded p-1 text-muted hover:bg-white"
                  aria-label="Remove resume"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm font-medium transition-colors ${
                  errors.resume
                    ? "border-scarlet/50 text-scarlet"
                    : "border-navy/30 text-navy hover:bg-navy/5"
                }`}
              >
                <Upload size={16} /> Click to upload your resume
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#141d34] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 sm:w-auto"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </section>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-1 ${
    error
      ? "border-scarlet focus:border-scarlet focus:ring-scarlet"
      : "border-line focus:border-blue focus:ring-blue"
  }`;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-scarlet"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-scarlet">{error}</span>}
    </label>
  );
}
