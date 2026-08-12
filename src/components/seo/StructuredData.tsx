import { SOCIAL } from "@/data/social";

/**
 * Organization + WebSite JSON-LD, rendered into every page's static HTML.
 *
 * This is what lets Google understand the site as a single real-world entity
 * (the chapter) rather than a loose set of pages: the name/logo/description,
 * the verified social profiles (sameAs), the parent org, and the campus it
 * belongs to. It supports - but does not create - a Knowledge Panel; the panel
 * with a map/address comes from a Google Business Profile you claim separately.
 */

const BASE_URL = "https://www.rutgersakpsi.org";

const DESCRIPTION =
  "The Omicron Tau chapter of Alpha Kappa Psi at Rutgers University - a co-ed professional business fraternity balancing professional development and lifelong brotherhood.";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Alpha Kappa Psi - Omicron Tau Chapter",
      alternateName: [
        "AKPsi Omicron Tau",
        "Rutgers AKPsi",
        "Alpha Kappa Psi Rutgers",
      ],
      url: BASE_URL,
      logo: `${BASE_URL}/icon-512.png`,
      image: `${BASE_URL}/icon-512.png`,
      description: DESCRIPTION,
      email: "rutgersakpsi2024@gmail.com",
      sameAs: [SOCIAL.instagram, SOCIAL.linkedin],
      parentOrganization: {
        "@type": "Organization",
        name: "Alpha Kappa Psi",
        url: "https://akpsi.org",
      },
      memberOf: {
        "@type": "CollegeOrUniversity",
        name: "Rutgers University-New Brunswick",
        url: "https://www.rutgers.edu",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "100 Rockafeller Rd",
        addressLocality: "Piscataway",
        addressRegion: "NJ",
        postalCode: "08854",
        addressCountry: "US",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "AKPsi Omicron Tau",
      alternateName: "Alpha Kappa Psi - Omicron Tau Chapter",
      url: BASE_URL,
      publisher: { "@id": `${BASE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; there is no user input here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
