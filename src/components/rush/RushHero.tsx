"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import GoldParticles from "@/components/backgrounds/GoldParticles";
import Button from "@/components/ui/Button";
import { staggerContainer, fadeUp } from "@/lib/motion";

export default function RushHero() {
  return (
    <section className="relative flex h-svh min-h-[620px] items-center justify-center overflow-hidden bg-navy">
      {/* Chapter photo backdrop behind a navy scrim - the headline and both
          buttons sit on top, so the wash has to stay heavy enough for white
          type to hold up over the brightest part of the staircase. */}
      <Image
        src="/chapter/stairs-candid.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none scale-[1.15] object-cover object-center translate-x-[4%] translate-y-[3.5%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-navy/50"
      />
      {/* Vignette keeps the edges dark for the navbar and scroll cue while
          leaving the centre light enough to read as a photograph. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_35%,rgba(45,62,95,0.30)_0%,rgba(26,39,68,0.62)_55%,rgba(19,29,51,0.88)_100%)]" />
      <GoldParticles density={70} />

      {/* text-shadow keeps the eyebrow and headline readable over the brightest
          part of the staircase behind them. */}
      <motion.div
        variants={staggerContainer(0.15, 0.1)}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-3xl px-6 text-center [text-shadow:0_2px_12px_rgba(10,16,30,0.55)]"
      >
        <motion.p
          variants={fadeUp}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-gold"
        >
          Rush AKPsi · Fall &rsquo;26
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
