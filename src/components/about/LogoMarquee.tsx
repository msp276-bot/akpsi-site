import SectionHeader from "@/components/ui/SectionHeader";

/**
 * "Our Network" — an infinite two-row marquee of companies where AKPsi members
 * and alumni have landed. Rendered as styled wordmark placeholders (grayscale →
 * color on hover); drop real SVG/PNG brand assets into /public/logos and swap
 * the chip for an <img> when placement data is collected.
 *
 * Rows scroll in opposite directions, pause on hover, and collapse to a static
 * centered grid under prefers-reduced-motion (handled in globals.css).
 */

const ROW_ONE = [
  "JPMorgan Chase",
  "Goldman Sachs",
  "Morgan Stanley",
  "Deloitte",
  "McKinsey & Co.",
  "BCG",
  "Bain & Co.",
  "KKR",
  "Blackstone",
  "Lazard",
  "Evercore",
  "Centerview",
];

const ROW_TWO = [
  "Amazon",
  "Google",
  "Microsoft",
  "Apple",
  "Meta",
  "Tesla",
  "Netflix",
  "Spotify",
  "Uber",
  "Airbnb",
  "PwC",
  "EY",
  "KPMG",
  "Accenture",
  "Salesforce",
];

function Chip({ name }: { name: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-slate-400 transition-all duration-300 hover:scale-110 hover:text-navy">
      {name}
    </span>
  );
}

function Row({
  items,
  track,
}: {
  items: string[];
  track: "marquee-track-1" | "marquee-track-2";
}) {
  return (
    <div className="marquee-band overflow-hidden py-4">
      <div className={`marquee-track ${track} flex w-max items-center gap-16`}>
        {[...items, ...items].map((name, i) => (
          <Chip key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section className="bg-slate-50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader title="Our Network" subtitle="where we land" />
      </div>

      <div
        className="mt-14 space-y-2"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <Row items={ROW_ONE} track="marquee-track-1" />
        <Row items={ROW_TWO} track="marquee-track-2" />
      </div>

      <p className="mx-auto mt-10 max-w-xl px-5 text-center text-xs text-muted">
        Representative of where Omicron Tau members and alumni have interned and
        worked. Placeholder wordmarks shown pending official brand assets.
      </p>
    </section>
  );
}
