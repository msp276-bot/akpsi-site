import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/anim/Reveal";
import CountUp from "@/components/anim/CountUp";
import Button from "@/components/ui/Button";
import LogoMarquee from "@/components/about/LogoMarquee";
import Benefits from "@/components/about/Benefits";
import { cardIn } from "@/lib/motion";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story of the Omicron Tau chapter of Alpha Kappa Psi at Rutgers University - our history, the companies we feed into, and the benefits of membership.",
};

const STATS = [
  { value: 60, suffix: "+", label: "Members" },
  { value: 200, suffix: "+", label: "Alumni" },
  { value: 10, suffix: "+", label: "Industries" },
  { value: 10, suffix: "+", label: "Majors" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-navy px-5 pb-20 pt-32 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                Omicron Tau • Rutgers University
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="headline mt-4 text-4xl uppercase text-white sm:text-5xl">
                About Our Chapter
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
                Alpha Kappa Psi is the oldest and largest professional business
                fraternity in the world. The Omicron Tau chapter brings that
                legacy to Rutgers University–New Brunswick, developing principled
                business leaders one class at a time.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Chapter story */}
        <section className="bg-white px-5 py-24 sm:px-8">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <Reveal>
              <div>
                <h2 className="headline text-2xl uppercase text-navy">
                  Our Story
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                  <p>
                    Founded on the belief that business is best learned by doing,
                    the Omicron Tau chapter was established to give Rutgers
                    students a community where professional ambition and genuine
                    friendship reinforce one another.
                  </p>
                  <p>
                    Each semester, our members recruit and develop a new pledge
                    class through workshops, mentorship, and hands-on projects -
                    building the skills that translate directly into internships
                    and full-time roles across industries.
                  </p>
                  <p>
                    Today the chapter counts 60+ active members and a growing
                    alumni network of 200+ spanning consulting, finance,
                    technology, marketing, and beyond.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-line bg-slate-50 p-8">
                <h3 className="headline text-xl uppercase text-navy">
                  National AKΨ
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Alpha Kappa Psi was founded in 1904 and has since initiated
                  hundreds of thousands of members through chapters across the
                  United States and abroad. As a co-ed professional fraternity,
                  AKPsi is dedicated to developing principled business leaders.
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    ["1904", "Founded"],
                    ["300K+", "Members initiated"],
                    ["Co-ed", "Membership"],
                    ["Global", "Alumni network"],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <dt className="headline text-2xl text-gold">{v}</dt>
                      <dd className="text-xs uppercase tracking-wide text-muted">
                        {l}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-navy py-14">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} variants={cardIn} delay={i * 0.08}>
                <div className="text-center">
                  <div className="headline text-4xl text-gold sm:text-5xl">
                    <CountUp to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Our Network marquee */}
        <LogoMarquee />

        {/* Benefits zigzag */}
        <Benefits />

        {/* CTA */}
        <section className="bg-slate-50 px-5 py-24 text-center sm:px-8">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <h2 className="headline text-3xl uppercase text-blue sm:text-4xl">
                Ready to join?
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-4 max-w-lg text-muted">
                Recruitment for the Spring &rsquo;27 class is open. Come meet the
                chapter and see if AKPsi is right for you.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex justify-center gap-3">
                <Button href="/rush" variant="navy" size="lg">
                  Explore Rush
                </Button>
                <Button href="/members" variant="outlineNavy" size="lg">
                  Meet the Members
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
