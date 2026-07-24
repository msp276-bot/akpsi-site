import type { MetadataRoute } from "next";

// Required for `output: "export"` — emit a static /manifest.webmanifest.
export const dynamic = "force-static";

/**
 * PWA manifest so brothers can install the site to their home screen and get a
 * standalone, app-like experience. Colors match the chapter tokens (navy/gold).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alpha Kappa Psi - Omicron Tau",
    short_name: "AKΨ Omicron Tau",
    description:
      "The members app for Alpha Kappa Psi, Omicron Tau at Rutgers University - events, directory, documents, and announcements.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a2744",
    theme_color: "#1a2744",
    categories: ["education", "social", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
