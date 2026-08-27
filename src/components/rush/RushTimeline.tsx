"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Leaf } from "lucide-react";
import ScrollParallaxImage from "@/components/anim/ScrollParallaxImage";

const EVENTS = [
  {
    day: "Tuesday",
    date: "Sept 1",
    title: "Meet The Bros",
    tag: null as string | null,
    time: "9:00 - 11:00 PM",
    location: "Location TBD",
    dress: "Casual",
  },
  {
    day: "Wednesday",
    date: "Sept 2",
    title: "Corporate Castaway",
    tag: "Professional Night",
    time: "9:00 - 11:00 PM",
    location: "Location TBD",
    dress: "Business Professional",
  },
  {
    day: "Friday",
    date: "Sept 4",
    title: "Tribe Ties",
    tag: "Service Night",
    time: "6:00 - 8:00 PM",
    location: "Buccleuch Park",
    dress: "Casual",
  },
];

export default function RushTimeline() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[#081a10] py-16 sm:py-20"
    >
      {/* Parallax jungle backdrop (drifts on scroll), then dark green overlays
          so the white text and glassy cards stay readable over the photo. */}
      <ScrollParallaxImage src="/rush-jungle.jpg" strength={0.18} position="center" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Mostly-neutral darkening (keeps the photo's real colors); a faint
            green only in the gradient for depth + text contrast. */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-[#06110b]/70" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#7fd6a0]">
            <Leaf size={13} /> fall &rsquo;26 recruitment
          </span>
          <h2 className="headline mt-3 text-3xl text-white sm:text-4xl">
            Rush Week Schedule
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
            Three nights to meet the chapter, see the professional side, and
            give back to the community.
          </p>
        </div>

        {/* Event cards */}
        <div className="mt-11 grid gap-5 md:grid-cols-3">
          {EVENTS.map((ev, i) => (
            <motion.article
              key={ev.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#d4a853]/40 hover:bg-white/[0.09]"
            >
              {/* corner glow */}
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#3fa66a]/20 blur-2xl transition-opacity duration-300 group-hover:bg-[#d4a853]/25"
              />

              <div className="relative">
                <span className="inline-flex items-center rounded-full bg-[#d4a853]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#e5c583]">
                  {ev.day} &middot; {ev.date}
                </span>

                <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-white">
                  {ev.title}
                </h3>
                {ev.tag && (
                  <p className="mt-1 text-sm font-semibold text-[#7fd6a0]">
                    {ev.tag}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <p className="flex items-center gap-2">
                    <Clock size={15} className="shrink-0 text-[#7fd6a0]" />
                    {ev.time}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={15} className="shrink-0 text-[#7fd6a0]" />
                    {ev.location}
                  </p>
                </div>

                <span className="mt-5 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                  {ev.dress}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
