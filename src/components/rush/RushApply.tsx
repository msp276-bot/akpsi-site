import { ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

// External intake links. The static S3/CloudFront site cannot run a form
// backend, so both the full application and the lighter interest form live in
// external tools (e.g. Google Forms). Drop the real URLs in here.
// TODO: replace the placeholders with the chapter's real form links.
const APPLICATION_PORTAL_URL = "#";
const INTEREST_FORM_URL = "#";

export default function RushApply() {
  return (
    <section id="apply" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeader title="Apply Now" subtitle="fall '26 recruitment" />

        <p className="mx-auto mt-6 max-w-xl text-muted">
          Ready to get involved? Start your full application through the
          Application Portal, or share your info with our lighter Interest Form
          and we&rsquo;ll keep you posted on rush events.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={APPLICATION_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-9 py-4 text-base font-semibold text-navy transition-all duration-200 hover:scale-[1.03] hover:bg-gold-soft active:scale-[0.98]"
          >
            Application Portal
            <ArrowUpRight size={18} />
          </a>
          <a
            href={INTEREST_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/20 px-9 py-4 text-base font-medium text-navy transition-all duration-200 hover:scale-[1.03] hover:border-navy/40 active:scale-[0.98]"
          >
            Interest Form
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
