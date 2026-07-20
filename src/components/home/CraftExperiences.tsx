"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * GroundAI-style three-card feature band, recolored to the AKPsi system:
 *  1. Rotating "track" pill carousel over a navy backdrop
 *  2. Dark chat card — a brother asking for interview help
 *  3. Gold "completely personal" card with a rising benefits list
 */

/* ------------------------------ Card 1 ---------------------------------- */

const ITEMS = [
  "Investment Banking",
  "Management Consulting",
  "Marketing & Brand",
  "Tech & Product",
  "Public Accounting",
  "Supply Chain",
  "Entrepreneurship",
];

const PILL_ROW_HEIGHT = 56;
const PILL_GAP = 18;
const ACTIVE_HEIGHT = 80;
const ACTIVE_GAP = 22;

function Pill({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={
        isActive
          ? "mx-[30px] flex h-[80px] w-[calc(100%_-_60px)] items-center gap-[8.5px] rounded-full border border-white/10 bg-white/25 p-[8.5px] shadow-xl backdrop-blur-xl"
          : "flex h-[56px] w-[261px] items-center gap-[8.5px] rounded-full border border-white/10 bg-white/15 px-3 backdrop-blur-md"
      }
    >
      <motion.div
        layoutId={`icon-${label}`}
        className={
          isActive
            ? "grid h-[63px] w-[63px] shrink-0 place-items-center rounded-full bg-white/30"
            : "h-[44px] w-[44px] shrink-0 rounded-full bg-white/30 p-1.5"
        }
      >
        {isActive ? (
          <span className="headline text-2xl text-gold">Ψ</span>
        ) : (
          <div className="h-full w-full rounded-full bg-white/10" />
        )}
      </motion.div>

      <div className="relative ml-1 h-[44px] flex-1 text-left">
        <motion.div
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col justify-center"
        >
          <span className="text-lg font-medium leading-tight text-white">
            {label}
          </span>
          <span className="text-[11px] tracking-[0.15em] text-white/70">
            AKPSI TRACK
          </span>
        </motion.div>
        <motion.div
          animate={{ opacity: isActive ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col justify-center gap-1.5"
        >
          <div className="h-2 w-[140px] rounded-full bg-white/50" />
          <div className="h-2 w-[70px] rounded-full bg-white/35" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function TrackCarouselCard() {
  const [active, setActive] = useState(2);

  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1) % ITEMS.length),
      2800
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[585px] flex-1 overflow-hidden rounded-3xl bg-navy">
      {/* Navy backdrop with gold glows (stands in for the photo background) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,#2d3e5f_0%,#1a2744_55%,#131d33_100%)]" />
      <div
        className="absolute -right-16 top-10 h-72 w-72 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,83,0.5) 0%, rgba(212,168,83,0) 70%)",
        }}
      />
      <div
        className="absolute -left-14 bottom-14 h-64 w-64 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(91,142,198,0.5) 0%, rgba(91,142,198,0) 70%)",
        }}
      />
      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full" style={{ height: ACTIVE_HEIGHT }}>
          {ITEMS.map((label, i) => {
            const len = ITEMS.length;
            const half = Math.floor(len / 2);
            const diff = ((i - active + len + half) % len) - half;
            const isActive = diff === 0;
            const visible = Math.abs(diff) <= 2;
            const y =
              diff === 0
                ? 0
                : diff < 0
                  ? diff * (PILL_ROW_HEIGHT + PILL_GAP) - ACTIVE_GAP
                  : diff * (PILL_ROW_HEIGHT + PILL_GAP) + ACTIVE_GAP;
            const opacity = !visible ? 0 : Math.abs(diff) === 2 ? 0.55 : 1;
            return (
              <motion.div
                key={label}
                animate={{ y, opacity }}
                transition={{
                  y: { type: "spring", stiffness: 260, damping: 28 },
                  opacity: { duration: 0.4, ease: "easeInOut" },
                }}
                className="pointer-events-none absolute left-0 right-0 flex justify-center"
              >
                <Pill label={label} isActive={isActive} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legibility gradients top/bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

/* ------------------------------ Card 2 ---------------------------------- */

const CARD2_BG = "#141a2b";

function SkeletonBubbleContent() {
  return (
    <>
      <div className="h-10 w-10 rounded-xl bg-[#FFFFFF54]" />
      <div className="ml-[12px] flex flex-1 flex-col gap-[9px] pr-[22px]">
        <div className="mt-[17px] h-[6px] w-[31px] rounded-full bg-[#FFFFFF3D]" />
        <div className="h-[6px] w-[85%] rounded-full bg-[#FFFFFF3D]" />
        <div className="h-[6px] w-[55%] rounded-full bg-[#FFFFFF3D]" />
      </div>
    </>
  );
}

function MorphBubble() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFilled(true), 1100);
    return () => clearTimeout(id);
  }, []);

  return (
    <motion.div
      layout
      animate={{ backgroundColor: filled ? "#d4a853" : "#FAFAFA14" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative mx-[45px] h-[135px] overflow-hidden rounded-3xl p-[22px]"
    >
      <AnimatePresence mode="wait">
        {filled ? (
          <motion.div
            key="filled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex h-[44px] items-center gap-[12px]">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-sm font-semibold text-white">
                M
              </span>
              <span className="text-base leading-none text-navy">Me</span>
            </div>
            <p className="ml-[56px] mt-[-9px] text-[15px] leading-snug text-navy">
              Superday at Goldman on Friday — can a brother run a mock
              interview with me tonight?
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start"
          >
            <SkeletonBubbleContent />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChatCard() {
  const words = "Brothers show up for brothers".split(" ");
  return (
    <div
      className="relative flex h-[585px] flex-1 flex-col justify-between overflow-hidden rounded-3xl pb-10 pt-10"
      style={{ backgroundColor: CARD2_BG }}
    >
      <div className="mb-6 flex flex-1 flex-col justify-center gap-[10px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mx-[58px] flex h-[108px] items-start rounded-2xl bg-[#FAFAFA14] pl-[22px] pt-[22px]"
        >
          <SkeletonBubbleContent />
        </motion.div>
        <MorphBubble />
      </div>

      <div className="flex items-end justify-between pl-[32px] pr-[32px]">
        <div className="w-64 text-4xl leading-10 text-white">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="mr-[0.25em] inline-block"
            >
              {w}
            </motion.span>
          ))}
        </div>
        <div className="flex items-center">
          <div
            className="z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-gold text-xl text-navy"
            style={{ borderColor: CARD2_BG }}
          >
            01
          </div>
          <div
            className="z-20 -ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/10 text-xl text-white/40"
            style={{ borderColor: CARD2_BG }}
          >
            2
          </div>
          <div
            className="z-10 -ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/10 text-xl text-white/40"
            style={{ borderColor: CARD2_BG }}
          >
            3
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Card 3 ---------------------------------- */

const LIST_ITEMS: { label: string; color: string }[] = [
  { label: "Resume & LinkedIn reviews", color: "#1a2744" },
  { label: "Mock interview prep", color: "#8a97ad" },
  { label: "Alumni referrals", color: "#8a97ad" },
];

function AdaptableCard() {
  const words =
    "Tailor your AKPsi journey — professional development, social events, service, and leadership that fit your goals.".split(
      " "
    );
  return (
    <div
      className="relative flex h-[585px] flex-1 flex-col overflow-hidden rounded-3xl px-[33px] pb-10 pt-[44px]"
      style={{ backgroundColor: "#d4a853" }}
    >
      <div className="flex flex-col gap-[26px]">
        <h3 className="text-5xl font-normal leading-[1.05] text-white">
          It&rsquo;s completely
          <br />
          personal.
        </h3>
        <p className="max-w-[340px] text-lg leading-snug text-white/70">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.6 + i * 0.04, duration: 0.4, ease: "easeOut" }}
              className="mr-[5px] inline-block"
            >
              {w}
            </motion.span>
          ))}
        </p>
      </div>

      <div className="z-10 mt-auto">
        <div className="flex flex-col gap-[12px]">
          {LIST_ITEMS.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: 1.1 + idx * 0.18,
                duration: 0.55,
                ease: "easeOut",
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-[27px] py-[15px]"
            >
              <span className="text-lg" style={{ color: item.color }}>
                {item.label}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px] text-neutral-400"
              >
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom fade out of the list */}
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-10 z-20 -mx-4 h-[140px]"
        style={{
          background:
            "linear-gradient(to top, rgba(212,168,83,1) 0%, rgba(212,168,83,1) 35%, rgba(212,168,83,0.7) 65%, rgba(212,168,83,0) 80%)",
        }}
      />
    </div>
  );
}

/* ------------------------------ Section --------------------------------- */

export default function CraftExperiences() {
  const cards = [TrackCarouselCard, ChatCard, AdaptableCard];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1360px] px-6 pb-20 pt-16 md:px-12">
        <h2 className="mb-12 text-center text-5xl font-normal leading-[1.1] text-neutral-900 md:text-6xl">
          <em className="font-cinematic italic">Craft an experience</em>{" "}
          you&rsquo;ll
          <br />
          carry for life
        </h2>

        <div className="flex flex-col items-stretch justify-between gap-6 lg:flex-row">
          {cards.map((Card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.35, duration: 1.1, ease: "easeOut" }}
              className="flex flex-1"
            >
              <Card />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
