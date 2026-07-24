import {
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  Sparkle,
  type LucideIcon,
} from "lucide-react";
import CountUp from "@/components/anim/CountUp";
import Reveal from "@/components/anim/Reveal";
import GoldParticles from "@/components/backgrounds/GoldParticles";
import { cardIn } from "@/lib/motion";

const STATS: {
  value: number;
  suffix: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: 60, suffix: "+", label: "Members", Icon: Users },
  { value: 10, suffix: "+", label: "Industries", Icon: Building2 },
  { value: 200, suffix: "+", label: "Alumni", Icon: GraduationCap },
  { value: 10, suffix: "+", label: "Majors", Icon: BookOpen },
];

const VALUES = ["Brotherhood", "Knowledge", "Integrity", "Service", "Unity"];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Starlight - the gold particle field from the rush hero, tuned to read
          on white. */}
      <GoldParticles
        density={150}
        color="196,150,58"
        intensity={2.4}
        className="opacity-100"
      />
      {/* Soft warm + cool glows for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,83,0.22) 0%, rgba(212,168,83,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(91,142,198,0.16) 0%, rgba(91,142,198,0) 70%)",
        }}
      />
      {/* Hairlines top/bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <span className="inline-block rounded-full border border-gold/60 bg-gold/10 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a97e2b]">
            Who We Are
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="headline mt-6 uppercase text-3xl sm:text-4xl md:text-5xl text-navy">
            We Are A Lifelong <span className="text-gold">Family</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg leading-relaxed text-ink/70">
            Alpha Kappa Psi is a co-ed professional business fraternity with
            access to a large alumni network spanning top companies and career
            paths across the globe. We pride ourselves on diversity and
            uniqueness - balancing professional development with genuine social
            bonding. The benefits of AKPsi don&rsquo;t stop after pledging or
            even graduation.{" "}
            <em className="font-cinematic text-gold not-italic sm:italic">
              It is truly a lifelong organization.
            </em>
          </p>
        </Reveal>

        {/* Stat cards */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} variants={cardIn} delay={i * 0.1}>
              <div className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 text-left shadow-[0_1px_3px_rgba(2,6,23,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_18px_50px_-20px_rgba(212,168,83,0.6)] sm:p-7">
                {/* corner glow on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(212,168,83,0.25) 0%, rgba(212,168,83,0) 70%)",
                  }}
                />
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy/[0.06] text-navy transition-colors duration-300 group-hover:bg-navy group-hover:text-white">
                  <stat.Icon size={19} />
                </div>
                <div className="headline mt-5 text-4xl text-navy sm:text-5xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Core values strip */}
        <Reveal delay={0.2}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6">
            {VALUES.map((v, i) => (
              <span key={v} className="flex items-center gap-4 sm:gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-navy/50 transition-colors hover:text-gold">
                  {v}
                </span>
                {i < VALUES.length - 1 && (
                  <Sparkle
                    size={9}
                    className="text-gold/60"
                    fill="currentColor"
                    aria-hidden
                  />
                )}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
