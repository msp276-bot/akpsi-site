import type { MetadataRoute } from "next";

const BASE_URL = "https://akpsi-rutgers.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The member portal is private; keep it out of the index.
      disallow: ["/portal", "/portal/", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
