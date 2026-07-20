import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import AboutSection from "@/components/sections/AboutSection";
import TrustedBy from "@/components/home/TrustedBy";
import CraftExperiences from "@/components/home/CraftExperiences";
import PresidentLetter from "@/components/home/PresidentLetter";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/sections/CTASection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AboutSection />
        <PresidentLetter />
        <TrustedBy />
        <CraftExperiences />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
