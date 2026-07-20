import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RushHero from "@/components/rush/RushHero";
import RushTimeline from "@/components/rush/RushTimeline";
import WhyAkpsi from "@/components/rush/WhyAkpsi";
import RushFAQ from "@/components/rush/RushFAQ";
import RushForm from "@/components/rush/RushForm";

export const metadata: Metadata = {
  title: "Rush",
  description:
    "Join the Omicron Tau chapter of Alpha Kappa Psi at Rutgers. Learn about our rush process, what sets us apart, and apply for Spring '27.",
};

export default function RushPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <RushHero />
        <RushTimeline />
        <WhyAkpsi />
        <RushFAQ />
        <RushForm />
      </main>
      <Footer />
    </>
  );
}
