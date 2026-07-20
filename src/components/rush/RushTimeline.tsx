"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import { slideIn } from "@/lib/motion";

const STEPS = [
  {
    n: 1,
    when: "Week 1",
    title: "Info Sessions",
    desc: "Learn about AKPsi, meet brothers, and ask all of your questions.",
  },
  {
    n: 2,
    when: "Week 2",
    title: "Meet & Greets",
    desc: "Casual social events to connect with the chapter one-on-one.",
  },
  {
    n: 3,
    when: "Week 2",
    title: "Professional Night",
    desc: "Network with brothers and hear about their career paths across industries.",
  },
  {
    n: 4,
    when: "Week 3",
    title: "Interviews",
    desc: "Formal interviews with board members to get to know you better.",
  },
  {
    n: 5,
    when: "Week 4",
    title: "Bid Night",
    desc: "Receive your bid and officially join the brotherhood.",
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
    <section id="process" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader title="Our Rush Process" subtitle="how to join" />

        <div ref={ref} className="relative mt-16">
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
                    <p className="mt-1 text-sm text-muted">{step.desc}</p>
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
