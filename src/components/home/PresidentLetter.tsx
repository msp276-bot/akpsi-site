"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import Reveal from "@/components/anim/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * "From the President" — Olivia Occhipinti's welcome letter. Verbatim chapter
 * copy (see §9 of the project handoff), broken into paragraphs for readability.
 * The greeting + opening paragraph are always shown; the remainder expands.
 */
const GREETING = "Dear Prospective Business Leaders,";

const OPENING =
  "The Omicron Tau Chapter is an organization which is shaped by passionate collegiate members whose dedication brings our pillars of Service, Unity, Knowledge, Integrity and Brotherhood to life each day. It is also defined by its resilience and unwavering endurance. Founded in 1998 at Rutgers University – New Brunswick, Alpha Kappa Psi Omicron Tau entered a new chapter of growth in Fall 2024 as it began the process of re-establishment. This is where my journey with Omicron Tau began: as a transfer student looking for like-minded students to aid me in my pursuits, I knew immediately I had found my place amongst a group of determined leaders, passionate about bringing something new to RU.";

const REST = [
  "Omicron Tau has 50+ active members and an expansive 300+ alumni network, with 250,000+ AKPsi brothers worldwide as the oldest and largest business fraternity. Our current brothers are a microcosm of the success that Alpha Kappa Psi as a whole has achieved, securing internship and full-time roles at Wells Fargo, TD Bank, Capital One, J&J, Accenture, UBS, and many others. As a new organization, we prioritize mentorship and brothers who are willing to help one another succeed, making it so that our members have exclusive access to career advancement opportunities through 1-1's with older brothers and alumni, networking events, and professional development workshops.",
  "I understand the pillar of Knowledge as the exchange of ideas and what I call “intellectual diversity,” which has been at the core of all of the developments I have aimed to make as President. As a Political Science major, I understand the importance of fostering a business fraternity that is not exclusively shaped by the perspectives of few. Since our re-establishment, we have focused on building our brand around acceptance of all majors, creating a collaborative environment of individuals who are unified in their aim to be principled business leaders.",
  "As early as our open rush events, the pillar of Service has been deeply integrated in our priorities for this organization. Our very first open rush process on the process to re-establishment included at least one service event, and we have made it a commitment ever since, donating to a variety of shelters and organizations semesterly. We have brothers working hard to raise funds for Rutgers University Dance Marathon, Rutgers' yearly philanthropic effort to raise money for the Embrace Kids Foundation. These initiatives come with being a brother in AKPsi, as we understand that giving back to our local community gives our fraternity meaning beyond membership.",
  "My decision to run for President was almost entirely based on the members of our first cohort, the alpha founding class, that I grew so close to and learned so much from. My passion to give back to this organization only grew with the welcoming of our second cohort of founders, the beta founding class, which was the glue to refine and solidify our brotherhood. My brothers are some of the most genuine, hard-working, intelligent, helpful and hilarious people I have ever known. These people are my backbone, unafraid to correct me when I make mistakes and always willing to pick me up when I'm discouraged. I have gained so much enrichment throughout my time, and I hope that every future collegiate member has a member experience as impactful as I have.",
  "I unassumingly joined AKPsi and underestimated how incredible the pillar of Brotherhood, as my goal to create a community at Rutgers was fulfilled by this organization in the blink of an eye. Whether you are a Pledge, Brother, Alumni, or Guest it is my privilege to welcome you and my hope that you will use our page to understand more about us, our goals, and what drives us as an organization. If our mission resonates with you, I encourage you to learn more about Omicron Tau and consider taking the first step in connecting with us. As the second founding President of Alpha Kappa Psi Omicron Tau, I would be honored to get to know you.",
];

/**
 * Portrait placeholder. Drop the real photo at `public/team/olivia-occhipinti.jpg`
 * and replace this block with a next/image (config has images.unoptimized).
 */
function PortraitPlaceholder() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-4xl text-gold">
            OO
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Photo coming soon
          </span>
        </div>
      </div>
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
      {/* Atmosphere — matches AboutSection / CTASection */}
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16 lg:px-8">
        {/* Portrait */}
        <Reveal className="lg:sticky lg:top-28">
          <PortraitPlaceholder />
          <div className="mt-6 text-center lg:text-left">
            <p className="font-display text-2xl text-white">
              Olivia Occhipinti
            </p>
            <p className="mt-1 text-sm text-white/55">
              President &middot; Second Founding President
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
                      Olivia Occhipinti
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
