/**
 * "Trusted by" single-row wordmark marquee (GroundAI-style band, AKPsi vibe).
 * Wordmarks are styled text pending official brand assets; the row loops via
 * .animate-marquee (35s) with soft edge fades.
 */

const BRANDS = [
  "Goldman Sachs",
  "McKinsey & Co.",
  "JPMorgan Chase",
  "Deloitte",
  "Google",
  "Blackstone",
  "Amazon",
  "Bain & Co.",
  "Morgan Stanley",
  "PwC",
];

export default function TrustedBy() {
  return (
    <section className="bg-white px-[40px] pb-14 pt-16">
      <h2 className="mb-12 text-center text-3xl font-medium text-neutral-900 md:text-4xl">
        Our brothers land at the{" "}
        <em className="font-cinematic italic">leading firms</em>
      </h2>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="animate-marquee flex w-max gap-16">
          {[...BRANDS, ...BRANDS].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex shrink-0 items-center gap-3 opacity-40"
            >
              <span className="whitespace-nowrap font-display text-3xl font-bold text-black">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
