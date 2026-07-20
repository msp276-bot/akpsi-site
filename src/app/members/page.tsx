import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import MembersDirectory from "@/components/members/MembersDirectory";

export const metadata: Metadata = {
  title: "Our Members",
  description:
    "Meet the brothers of the Omicron Tau chapter — board, directors, and active members across 10+ majors and industries.",
};

export default function MembersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Our Members" subtitle="consultants" />
            <div className="mt-12">
              <MembersDirectory />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
