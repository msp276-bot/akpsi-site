"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Rotating brother testimonials with a portrait on the side. Weighted toward the
 * social / brotherhood side of the chapter (community, belonging, service) with
 * one professional voice - membership is more than a résumé line.
 *
 * To use real photos, drop them in `public/testimonials/` and set `image` on the
 * matching entry (e.g. image: "/testimonials/zoe-martinez.jpg"). Entries without
 * an `image` fall back to a monogram portrait.
 */
interface Testimonial {
  quote: string;
  name: string;
  context: string;
  tag: string;
  image?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I joined for the professional side, but what kept me here were the late-night study sessions that turned into lifelong friendships. These are the people I'll be standing next to at weddings.",
    name: "Rayyan Ahmed",
    context: "Active Brother",
    tag: "Brotherhood",
  },
  {
    quote:
      "Bowling nights, chapter retreats, spontaneous diner runs at 2am - Omicron Tau gave me a home at Rutgers before I even realized I needed one.",
    name: "Justin Arnoldi",
    context: "Active Brother",
    tag: "Community",
  },
  {
    quote:
      "As a transfer student I thought I'd missed my chance to find my people. One rush event later, I had thirty new friends who actually showed up for me.",
    name: "John Baylock",
    context: "Active Brother",
    tag: "Belonging",
  },
  {
    quote:
      "Some of my favorite memories are from our service events - packing meals and fundraising for RUDM, laughing the whole way through. Giving back hits different when you do it with your brothers.",
    name: "Anika Batki",
    context: "Active Brother",
    tag: "Service",
  },
  {
    quote:
      "AKPsi completely changed how I approached recruiting. Instead of feeling overwhelmed by the process, it felt like having a mentor by my side 24/7.",
    name: "Ashna Narielwala",
    context: "VP of Alumni Relations · Class of ’28",
    tag: "Professional",
  },
];

const ROTATE_MS = 6500;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const fade: Variants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
};

function Portrait({ t }: { t: Testimonial }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line shadow-[0_20px_60px_-25px_rgba(2,6,23,0.4)]">
      {t.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={t.image}
          alt={t.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
          <span className="grid h-24 w-24 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-3xl text-gold">
            {initials(t.name)}
          </span>
        </div>
      )}
      {/* name plate */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 via-navy/40 to-transparent p-5 pt-10 text-left">
        <p className="font-cinematic text-xl italic text-white">{t.name}</p>
        <p className="mt-0.5 text-xs text-white/70">{t.context}</p>
      </div>
      {/* tag badge */}
      <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy backdrop-blur-sm">
        {t.tag}
      </span>
    </div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = TESTIMONIALS.length;

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const t = TESTIMONIALS[active];

  return (
    <section className="bg-white">
      <div
        className="mx-auto max-w-5xl px-6 py-24 sm:py-28"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue"
          >
            In Their Words
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 0.08 }}
            className="headline mt-4 text-3xl uppercase text-navy sm:text-4xl md:text-5xl"
          >
            More Than a <span className="text-gold">Résumé Line</span>
          </motion.h2>
        </div>

        {/* Carousel - portrait on the side, quote alongside */}
        <div className="mt-14 grid items-center gap-8 sm:gap-12 md:grid-cols-[minmax(0,300px)_1fr]">
          {/* Portrait */}
          <div className="mx-auto w-full max-w-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                variants={fade}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Portrait t={t} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quote */}
          <div className="relative min-h-[280px] md:min-h-[300px]">
            <Quote
              size={40}
              strokeWidth={1.5}
              className="text-gold/40"
              aria-hidden
            />
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active}
                variants={fade}
                initial="enter"
                animate="center"
                exit="exit"
                className="mt-4"
              >
                <p className="font-cinematic text-2xl italic leading-relaxed text-navy sm:text-[27px] sm:leading-[1.5]">
                  “{t.quote}”
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-scarlet text-sm font-semibold text-white">
                    {initials(t.name)}
                  </span>
                  <span>
                    <span className="block font-cinematic text-lg italic text-navy">
                      {t.name}
                    </span>
                    <span className="block text-xs text-muted">{t.context}</span>
                  </span>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border border-navy/15 text-navy/60 transition-colors hover:border-navy/40 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            className="flex items-center gap-2.5"
            role="tablist"
            aria-label="Testimonials"
          >
            {TESTIMONIALS.map((item, i) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show testimonial from ${item.name}`}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-navy" : "w-2 bg-navy/20 hover:bg-navy/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border border-navy/15 text-navy/60 transition-colors hover:border-navy/40 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
