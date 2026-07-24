import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import AboutSection from "@/components/sections/AboutSection";
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
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
