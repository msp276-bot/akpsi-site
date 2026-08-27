"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { slideIn } from "@/lib/motion";

const STEPS = [
  {
    n: 1,
    when: "Tuesday, Sept 1",
    title: "Meet The Bros",
    tag: null as string | null,
    time: "9:00 - 11:00 PM",
    location: "Location TBD",
    dress: "Casual",
  },
  {
    n: 2,
    when: "Wednesday, Sept 2",
    title: "Corporate Castaway",
    tag: "Professional Night",
    time: "9:00 - 11:00 PM",
    location: "Location TBD",
    dress: "Business Professional",
  },
  {
    n: 3,
    when: "Friday, Sept 4",
    title: "Tribe Ties",
    tag: "Service Night",
    time: "6:00 - 8:00 PM",
    location: "Buccleuch Park",
    dress: "Casual",
  },
];

export default function RushTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <section id="process" className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader title="Rush Week Schedule" subtitle="fall '26 events" />

        <div ref={ref} className="relative mt-10">
          {/* Center line (static track + animated draw) */}
          <div className="absolute left-6 top-0 h-full w-px bg-line md:left-1/2 md:-translate-x-1/2" />
          <motion.div
            style={{ scaleY }}
            className="absolute left-6 top-0 h-full w-px origin-top bg-gold md:left-1/2 md:-translate-x-1/2"
          />

          <div className="space-y-10">
            {STEPS.map((step, i) => {
              const side = i % 2 === 0 ? "left" : "right";
              return (
                <div
                  key={step.n}
                  className={`relative flex items-center ${
                    side === "left" ? "md:justify-start" : "md:justify-end"
                  }`}
                >
                  {/* Numbered node */}
                  <div className="absolute left-6 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-gold text-sm font-bold text-navy shadow-md ring-4 ring-white md:left-1/2">
                    {step.n}
                  </div>

                  <motion.div
                    variants={slideIn(side)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    className={`ml-16 w-full rounded-2xl border border-line bg-white p-5 shadow-sm md:ml-0 md:w-[44%] ${
                      side === "left" ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue">
                      {step.when}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-navy">
                      {step.title}
                    </h3>
                    {step.tag && (
                      <p className="text-sm font-medium text-gold">{step.tag}</p>
                    )}
                    <div className="mt-2 space-y-1 text-sm text-muted">
                      <p className="flex items-center gap-1.5">
                        <Clock size={14} className="shrink-0" /> {step.time}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin size={14} className="shrink-0" /> {step.location}
                      </p>
                    </div>
                    <span className="mt-3 inline-block rounded-full bg-navy/5 px-2.5 py-1 text-xs font-semibold text-navy">
                      {step.dress}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
