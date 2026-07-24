import { ArrowUpRight, BriefcaseBusiness, Sparkles, UsersRound } from "lucide-react";
import Reveal from "@/components/anim/Reveal";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-navy py-24 sm:py-32">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
        <div>
          <Reveal>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles size={14} /> Your next chapter starts here
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="headline max-w-3xl text-5xl uppercase leading-[0.92] text-white sm:text-6xl lg:text-7xl">
              Ready to <span className="text-gold">dive in?</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Meet the people who will challenge your thinking, champion your
              goals, and make Rutgers feel a little more like home.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
              <Button href="/rush" variant="gold" size="lg">
                Spring &rsquo;27 Application <ArrowUpRight size={18} />
              </Button>
              <Button href="/portal" variant="outlineWhite" size="lg">
                Access Portal
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.18} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            [UsersRound, "Find your people", "A community that knows your name."],
            [BriefcaseBusiness, "Build your future", "Practical growth beyond the classroom."],
            [Sparkles, "Leave your mark", "Lead, create, and shape the chapter."],
          ].map(([Icon, title, copy]) => {
            const CardIcon = Icon as typeof Sparkles;
            return (
              <div key={String(title)} className="group rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.1]">
                <CardIcon size={20} className="text-gold" />
                <h3 className="mt-6 text-base font-semibold text-white">{title as string}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{copy as string}</p>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
