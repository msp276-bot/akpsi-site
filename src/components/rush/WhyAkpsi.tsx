import { Briefcase, Network, Users } from "lucide-react";
import Reveal from "@/components/anim/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { cardIn } from "@/lib/motion";

const VALUES = [
  {
    Icon: Briefcase,
    title: "Professional Development",
    desc: "Resume reviews, mock interviews, and mentorship that prepare you for recruiting and beyond.",
  },
  {
    Icon: Network,
    title: "Alumni Network",
    desc: "200+ alumni across 10+ industries, from consulting and finance to tech and marketing.",
  },
  {
    Icon: Users,
    title: "Lifelong Brotherhood",
    desc: "Social events, retreats, and genuine connections that last far beyond graduation.",
  },
];

export default function WhyAkpsi() {
  return (
    <section className="bg-navy py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          title="What Sets Us Apart"
          subtitle="why akpsi"
          tone="light"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} variants={cardIn} delay={i * 0.1}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:border-gold/50 hover:bg-white/[0.06] hover:shadow-[0_0_40px_-10px_rgba(212,168,83,0.3)]">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold transition-colors group-hover:bg-gold group-hover:text-navy">
                  <v.Icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {v.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
