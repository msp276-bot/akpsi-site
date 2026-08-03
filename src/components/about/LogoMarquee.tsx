/**
 * "Our Network" - an infinite two-row marquee of companies where AKPsi members
 * and alumni have landed. Each company shows its real logo on a white chip so
 * the marks stay legible over the brand-blue band.
 *
 * Rows scroll in opposite directions, pause on hover, and collapse to a static
 * centered grid under prefers-reduced-motion (handled in globals.css). The two
 * rows hold DISJOINT company sets - no name repeats across rows.
 *
 * Logos live in /public/logos and were sourced from each company's Wikipedia
 * infobox (Wikimedia Commons / fair-use brand files). To add a firm, drop its
 * logo in /public/logos and add a `{ name, logo }` entry below. The `logo`
 * field is optional - a company with no logo renders its name as text - but we
 * only list firms whose logo we actually have so the wall stays clean.
 */

interface Company {
  name: string;
  logo?: string; // path under /public; omit to render the name as text
}

const ROW_ONE: Company[] = [
  { name: "Sanofi", logo: "/logos/sanofi.svg" },
  { name: "Accenture", logo: "/logos/accenture.svg" },
  { name: "Bristol Myers Squibb", logo: "/logos/bristol-myers-squibb.svg" },
  { name: "Oracle", logo: "/logos/oracle.svg" },
  { name: "bp", logo: "/logos/bp.svg" },
  { name: "Johnson & Johnson", logo: "/logos/johnson-and-johnson.svg" },
  { name: "BlackRock", logo: "/logos/blackrock.svg" },
  { name: "Solar Turbines", logo: "/logos/solar-turbines.svg" },
  { name: "Berkshire Hathaway", logo: "/logos/berkshire-hathaway.svg" },
  { name: "Bank of America Merrill Lynch", logo: "/logos/bank-of-america.svg" },
  { name: "Standard Chartered", logo: "/logos/standard-chartered.svg" },
  { name: "GEICO", logo: "/logos/geico.svg" },
  { name: "Coinbase", logo: "/logos/coinbase.svg" },
  { name: "UBS", logo: "/logos/ubs.svg" },
];

// The chapter's requested middle row.
const ROW_TWO: Company[] = [
  { name: "Crowe", logo: "/logos/crowe.png" },
  { name: "Kirkland & Ellis", logo: "/logos/kirkland-ellis.svg" },
  { name: "State Street", logo: "/logos/state-street.svg" },
  { name: "Strategy&", logo: "/logos/strategy-and.svg" },
  { name: "Cursor", logo: "/logos/cursor.svg" },
  { name: "Pfizer", logo: "/logos/pfizer.svg" },
  { name: "Meta", logo: "/logos/meta.svg" },
  { name: "Blackstone", logo: "/logos/blackstone.svg" },
  { name: "Bloomberg", logo: "/logos/bloomberg.svg" },
  { name: "Google", logo: "/logos/google.svg" },
  { name: "Uber", logo: "/logos/uber.svg" },
  { name: "Stripe", logo: "/logos/stripe.svg" },
  { name: "Waymo", logo: "/logos/waymo.svg" },
  { name: "Spotify", logo: "/logos/spotify.svg" },
  { name: "Amazon", logo: "/logos/amazon.svg" },
];

const ROW_THREE: Company[] = [
  // No brand logo file on hand, so this renders as a text chip (BCG's mark is a
  // "BCG" wordmark, so it reads correctly). Drop /public/logos/bcg.svg + a
  // `logo` field here to upgrade it to the real mark.
  { name: "BCG" },
  { name: "Scotiabank", logo: "/logos/scotiabank.svg" },
  { name: "Newmark", logo: "/logos/newmark.svg" },
  { name: "Kenvue", logo: "/logos/kenvue.svg" },
  { name: "Capital One", logo: "/logos/capital-one.svg" },
  { name: "Rutgers Cancer Institute", logo: "/logos/rutgers-cancer-institute.svg" },
  { name: "U.S. Bank", logo: "/logos/us-bank.svg" },
  { name: "Cartier", logo: "/logos/cartier.svg" },
  { name: "JPMorgan Chase", logo: "/logos/jpmorgan.svg" },
  { name: "OpenAI", logo: "/logos/openai.svg" },
  { name: "Evercore", logo: "/logos/evercore.svg" },
  { name: "Citibank", logo: "/logos/citi.svg" },
  { name: "Mizuho", logo: "/logos/mizuho.svg" },
  { name: "Wells Fargo", logo: "/logos/wells-fargo.svg" },
];

function Chip({ company }: { company: Company }) {
  return (
    <span className="flex h-14 shrink-0 items-center justify-center rounded-2xl bg-white px-6 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:scale-105 sm:h-16 sm:px-7">
      {company.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.logo}
          alt={company.name}
          loading="lazy"
          decoding="async"
          className="h-8 w-auto max-w-[160px] object-contain sm:max-w-[185px]"
        />
      ) : (
        <span className="whitespace-nowrap font-display text-sm font-bold text-navy sm:text-base">
          {company.name}
        </span>
      )}
    </span>
  );
}

function Row({
  items,
  track,
}: {
  items: Company[];
  track: "marquee-track-1" | "marquee-track-2" | "marquee-track-3";
}) {
  return (
    <div className="marquee-band overflow-hidden py-2">
      <div className={`marquee-track ${track} flex w-max items-center gap-5 sm:gap-6`}>
        {[...items, ...items].map((company, i) => (
          <Chip key={`${company.name}-${i}`} company={company} />
        ))}
      </div>
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section className="bg-blue pb-12 pt-8 sm:pb-14 sm:pt-9">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="headline text-center text-2xl uppercase text-white sm:text-3xl">
          Our Network
        </h2>
      </div>

      <div
        className="mt-6 space-y-3"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <Row items={ROW_ONE} track="marquee-track-1" />
        <Row items={ROW_TWO} track="marquee-track-2" />
        <Row items={ROW_THREE} track="marquee-track-3" />
      </div>

      <p className="mx-auto mt-6 max-w-xl px-5 text-center text-xs leading-relaxed text-white">
        Representative of where Omicron Tau members and alumni have interned and
        worked.
      </p>
    </section>
  );
}
