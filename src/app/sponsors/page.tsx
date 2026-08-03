import type { Metadata } from "next";
import { Download, ExternalLink, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sponsors",
  description:
    "Partner with the Omicron Tau chapter of Alpha Kappa Psi at Rutgers University. View our corporate sponsorship package, chapter overview, placements, and sponsorship tiers.",
};

// The sponsorship package lives in /public and is served as a static asset.
const PDF_URL = "/akpsi-sponsorship-package.pdf";
const CONTACT_EMAIL = "rutgersakpsi2024@gmail.com";

// Each PDF page is pre-rendered to an image so the package is scrollable inline
// on every browser (mobile Safari and others won't render an embedded PDF).
const PAGE_COUNT = 6;
const PAGES = Array.from(
  { length: PAGE_COUNT },
  (_, i) => `/sponsors/page-${i + 1}.png`,
);

export default function SponsorsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy px-5 pb-16 pt-32 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(45,62,95,0.55)_0%,rgba(26,39,68,0.9)_60%,rgba(19,29,51,1)_100%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Omicron Tau · Partnerships
            </p>
            <h1 className="headline mt-4 text-4xl uppercase text-white sm:text-5xl">
              Sponsor AKPsi
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Partner with the Omicron Tau chapter of Alpha Kappa Psi at Rutgers
              University. Our full corporate sponsorship package below covers who
              we are, our placements, and every sponsorship tier.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft"
              >
                <ExternalLink size={16} /> Open the package
              </a>
              <a
                href={PDF_URL}
                download
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Download size={16} /> Download PDF
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          {/* The package, page by page, as images so it scrolls inline on any
              browser (embedded PDFs render blank on iOS Safari and others). The
              hero buttons still link to the actual PDF for opening/downloading. */}
          <section>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              Corporate Sponsorship Package
            </h2>
            <p className="mt-1 text-sm text-muted">
              Scroll through the full package below, or open it in a new tab for a
              larger view.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:gap-6">
              {PAGES.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={`Sponsorship package page ${i + 1} of ${PAGE_COUNT}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full rounded-2xl border border-line bg-white shadow-sm"
                />
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="mt-14 rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              Ready to partner with us?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
              Custom packages are available. Reach out and we&rsquo;ll tailor a
              partnership to your company&rsquo;s goals.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=AKPsi%20Omicron%20Tau%20Sponsorship`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft"
            >
              <Mail size={16} /> Get in touch
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
