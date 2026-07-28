"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import Reveal from "@/components/anim/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * "From the President" - Abhinav Gunda's welcome letter. Verbatim chapter
 * copy (see §9 of the project handoff), broken into paragraphs for readability.
 * The greeting + opening paragraph are always shown; the remainder expands.
 */
const GREETING = "Dear Prospective Business Leaders,";

const OPENING =
  "The Omicron Tau Chapter is shaped by passionate collegiate members who bring our pillars of Service, Unity, Knowledge, Integrity and Brotherhood to life each day, and by a resilience that defines who we are. Founded in 1998 at Rutgers University–New Brunswick, Alpha Kappa Psi Omicron Tau entered a new chapter of growth in Fall 2024 as it began the process of re-establishment. That is where my journey with Omicron Tau began: as a transfer student looking for like-minded students to aid me in my pursuits, I knew immediately I had found my place among a group of determined leaders passionate about bringing something new to RU. Today, Omicron Tau has 60+ active members and an expansive 700+ alumni network, part of a 250,000+ brother AKPsi worldwide, the oldest and largest business fraternity. Our current brothers are a microcosm of that success, securing internship and full-time roles at Sanofi, Accenture, Bristol Myers Squibb, Oracle, bp, Johnson & Johnson, BlackRock, and many others, supported by exclusive access to career advancement through 1-1's with older brothers and alumni, networking events, and professional development workshops.";

const REST = [
  "I understand the pillar of Knowledge as the exchange of ideas, an “intellectual diversity” that has been at the core of everything I have aimed to build as President. As a Supply Chain major, I understand the importance of a business fraternity not exclusively shaped by the perspectives of a few, which is why we have built our brand around acceptance of all majors and a collaborative environment of individuals unified in their aim to be principled business leaders. That same values-driven approach shows up in Service: as early as our open rush events, our first process toward re-establishment included at least one service event, a commitment we have kept every semester since through donations to shelters and organizations, and through brothers raising funds for Rutgers University Dance Marathon in support of the Embrace Kids Foundation. Giving back to our local community is what gives our fraternity meaning beyond membership.",
  "My decision to run for President was rooted almost entirely in the alpha founding class I grew so close to and learned so much from, and my passion for this organization only grew with the arrival of our beta founding class, the glue that solidified our brotherhood. My brothers are some of the most genuine, hard-working, intelligent, helpful, and hilarious people I have ever known, my backbone, unafraid to correct me when I make mistakes and always willing to pick me up when I'm discouraged. I unassumingly joined AKPsi and underestimated how quickly the pillar of Brotherhood would fulfill my goal of building a community at Rutgers. Whether you are a Pledge, Brother, Alumni, or Guest, it is my privilege to welcome you, and I hope you'll use our page to understand more about us, our goals, and what drives us. If our mission resonates with you, I encourage you to take the first step in connecting with us. As President of Alpha Kappa Psi Omicron Tau, I would be honored to get to know you.",
];

/** President portrait, framed to match the section's navy/gold treatment. */
function Portrait() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-navy">
      <Image
        src="/members/abhinav-gunda.jpg"
        alt="Abhinav Gunda, President"
        fill
        sizes="(min-width: 1024px) 34vw, 100vw"
        className="object-cover object-top"
        priority
      />
      {/* gold corner accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,83,0.35) 0%, rgba(212,168,83,0) 70%)",
        }}
      />
    </div>
  );
}

export default function PresidentLetter() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="president"
      className="relative overflow-hidden bg-navy py-24 sm:py-32"
    >
      {/* Atmosphere - matches AboutSection / CTASection */}
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16 lg:px-8">
        {/* Portrait */}
        <Reveal className="lg:sticky lg:top-28">
          <Portrait />
          <div className="mt-6 text-center lg:text-left">
            <p className="font-display text-2xl text-white">
              Abhinav Gunda
            </p>
            <p className="mt-1 text-sm text-white/55">
              President
            </p>
          </div>
        </Reveal>

        {/* Letter */}
        <div>
          <Reveal>
            <span className="inline-block rounded-full border border-gold/50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
              From the President
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <Quote
              size={40}
              className="mt-8 text-gold/40"
              strokeWidth={1.5}
              aria-hidden
            />
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-4 font-cinematic text-2xl italic leading-snug text-white sm:text-3xl">
              {GREETING}
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 text-base leading-relaxed text-white/70">
              {OPENING}
            </p>
          </Reveal>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="rest"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-5">
                  {REST.map((para, i) => (
                    <p
                      key={i}
                      className="text-base leading-relaxed text-white/70"
                    >
                      {para}
                    </p>
                  ))}

                  {/* Signature */}
                  <div className="pt-4">
                    <p className="text-base italic text-white/70">
                      In U&hellip;and I&hellip;,
                    </p>
                    <p className="mt-2 font-cinematic text-2xl italic text-gold">
                      Abhinav Gunda
                    </p>
                    <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/45">
                      President, Omicron Tau
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* fade hint when collapsed */}
          {!open && (
            <div
              aria-hidden
              className="pointer-events-none -mt-8 h-8 bg-gradient-to-b from-transparent to-navy"
            />
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            {open ? "Show less" : "Read the full letter"}
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
