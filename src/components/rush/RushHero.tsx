"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import GoldParticles from "@/components/backgrounds/GoldParticles";
import Button from "@/components/ui/Button";
import { staggerContainer, fadeUp } from "@/lib/motion";

export default function RushHero() {
  return (
    <section className="relative flex h-svh min-h-[620px] items-center justify-center overflow-hidden bg-navy">
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]" />
      <GoldParticles density={70} />

      <motion.div
        variants={staggerContainer(0.15, 0.1)}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
      >
        <motion.p
          variants={fadeUp}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-gold"
        >
          Rush AKΨ · Spring &rsquo;27
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="headline uppercase text-4xl text-white sm:text-6xl md:text-7xl"
        >
          Join the Omicron Tau Chapter
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-xl text-base text-white/75 sm:text-lg"
        >
          Rutgers University&rsquo;s premier co-ed professional business
          fraternity. Build your career, your network, and your brotherhood.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button href="#apply" variant="gold" size="lg">
            Apply Now
          </Button>
          <Button href="#process" variant="outlineWhite" size="lg">
            Learn More
          </Button>
        </motion.div>
      </motion.div>

      <a
        href="#process"
        aria-label="Scroll to rush process"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/70 hover:text-white"
      >
        <ChevronDown className="animate-chevron" size={28} />
      </a>
    </section>
  );
}
