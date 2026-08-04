import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

// The chapter's own application form, backed by Supabase (see /rush/apply and
// db/rush-applications.sql). Recruits not ready to apply can reach out by email.
const APPLICATION_URL = "/rush/apply";
const INTEREST_EMAIL = "rutgersakpsi2024@gmail.com";

export default function RushApply() {
  return (
    <section id="apply" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeader title="Apply Now" subtitle="fall '26 recruitment" />

        <p className="mx-auto mt-6 max-w-xl text-muted">
          Ready to get involved? Start your application below. Not ready to apply
          yet? Reach out and we&rsquo;ll keep you posted on rush events.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={APPLICATION_URL}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-9 py-4 text-base font-semibold text-navy transition-all duration-200 hover:scale-[1.03] hover:bg-gold-soft active:scale-[0.98]"
          >
            Start your application
            <ArrowUpRight size={18} />
          </Link>
          <a
            href={`mailto:${INTEREST_EMAIL}?subject=AKPsi%20Rush%20Interest`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/20 px-9 py-4 text-base font-medium text-navy transition-all duration-200 hover:scale-[1.03] hover:border-navy/40 active:scale-[0.98]"
          >
            <Mail size={18} />
            Ask a question
          </a>
        </div>
      </div>
    </section>
  );
}
