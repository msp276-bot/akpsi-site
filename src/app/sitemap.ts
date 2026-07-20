import type { MetadataRoute } from "next";
import { members } from "@/data/members";

const BASE_URL = "https://rutgersakpsi.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/members`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/rush`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const memberRoutes: MetadataRoute.Sitemap = members.map((m) => ({
    url: `${BASE_URL}/members/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...memberRoutes];
}
