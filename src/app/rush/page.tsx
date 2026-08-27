import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RushHero from "@/components/rush/RushHero";
import RushTimeline from "@/components/rush/RushTimeline";
import WhyAkpsi from "@/components/rush/WhyAkpsi";
import RushFAQ from "@/components/rush/RushFAQ";
import RushApply from "@/components/rush/RushApply";
import ScrollParallaxImage from "@/components/anim/ScrollParallaxImage";

export const metadata: Metadata = {
  title: "Rush",
  description:
    "Join the Omicron Tau chapter of Alpha Kappa Psi at Rutgers. Learn about our rush process, what sets us apart, and apply for Fall '26.",
};

export default function RushPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <RushHero />
        {/* One continuous jungle backdrop behind both the schedule and the
            "What Sets Us Apart" section (parallax drifts across both). */}
        <div className="relative overflow-hidden bg-[#081a10]">
          <ScrollParallaxImage
            src="/rush-jungle.jpg"
            strength={0.16}
            position="center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/35"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-[#06110b]/75"
          />
          <div className="relative">
            <RushTimeline />
            <WhyAkpsi />
          </div>
        </div>
        <RushFAQ />
        <RushApply />
      </main>
      <Footer />
    </>
  );
}
