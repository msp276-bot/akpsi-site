import type { Metadata } from "next";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { InstagramIcon } from "@/components/BrandIcons";
import InstagramEmbed from "@/components/media/InstagramEmbed";
import { SOCIAL, hasSocialUrl } from "@/data/social";

export const metadata: Metadata = {
  title: "Media",
  description:
    "Highlights from the Omicron Tau chapter of Alpha Kappa Psi — the rush video, event recaps, and featured Instagram posts.",
};

/* ==========================================================================
   EDIT ME — curated media. No backend / live Instagram feed (static export),
   so this is a hand-maintained list. Update the constants below; the page
   handles empty/placeholder states on its own.
   ========================================================================== */

// Featured Instagram posts — permalinks, embedded in order. Add or remove URLs.
const INSTAGRAM_POSTS: string[] = [
  "https://www.instagram.com/p/DY-mUFRmlPX/",
  "https://www.instagram.com/p/DYLeAhOEf-M/",
  "https://www.instagram.com/p/DYASyfjEZnV/",
  "https://www.instagram.com/p/DXpoYVTkRT8/",
];

// The featured rush video. Set ONE of these:
//   mp4:      a self-hosted .mp4 URL (rendered with native controls), or
//   iframeSrc: a YouTube/Vimeo *embed* URL (e.g. https://www.youtube.com/embed/XXXX)
// Leave both "" to show a "coming soon" placeholder.
const RUSH_VIDEO: { title: string; caption: string; mp4: string; iframeSrc: string } = {
  title: "Spring '27 Rush",
  caption: "Meet the chapter and see what a semester in Omicron Tau looks like.",
  mp4: "",
  iframeSrc: "",
};

export default function MediaPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        {/* Hero */}
        <section className="bg-navy px-5 pb-16 pt-32 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Omicron Tau • Highlights
            </p>
            <h1 className="headline mt-4 text-4xl uppercase text-white sm:text-5xl">
              Media &amp; Highlights
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Our rush video, event recaps, and favorite moments from around the
              chapter. Follow along on social for the latest.
            </p>
            {hasSocialUrl(SOCIAL.instagram) && (
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-soft"
              >
                <InstagramIcon size={16} /> Follow on Instagram
              </a>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          {/* Instagram posts */}
          <section>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              Latest from Instagram
            </h2>
            <p className="mt-1 text-sm text-muted">
              Straight from{" "}
              <span className="font-medium text-ink">@rutgers.akpsi</span>.
            </p>

            {INSTAGRAM_POSTS.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {INSTAGRAM_POSTS.map((url) => (
                  <InstagramEmbed
                    key={url}
                    url={url}
                    title="Omicron Tau Instagram post"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
                <InstagramIcon className="mx-auto text-muted" size={28} />
                <p className="mt-3 text-sm font-medium text-ink">
                  Featured posts are on the way.
                </p>
              </div>
            )}

            {hasSocialUrl(SOCIAL.instagram) && (
              <div className="mt-8 text-center">
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline"
                >
                  See more on Instagram <ArrowUpRight size={15} />
                </a>
              </div>
            )}
          </section>

          {/* Featured rush video */}
          <section className="mt-16">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              {RUSH_VIDEO.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{RUSH_VIDEO.caption}</p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-black shadow-sm">
              <div className="relative aspect-video w-full">
                {RUSH_VIDEO.mp4 ? (
                  <video
                    src={RUSH_VIDEO.mp4}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : RUSH_VIDEO.iframeSrc ? (
                  <iframe
                    src={RUSH_VIDEO.iframeSrc}
                    title={RUSH_VIDEO.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-navy to-navy-2 text-center">
                    <div className="px-6">
                      <PlayCircle className="mx-auto text-gold" size={44} />
                      <p className="mt-3 text-sm font-medium text-white">
                        Rush video coming soon
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Add a video URL in <code>src/app/media/page.tsx</code>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
