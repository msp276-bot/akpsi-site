"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const QUOTE =
  "AKPsi completely changed how I approached recruiting. Instead of feeling overwhelmed by the process, it felt like having a mentor by my side 24/7.";

export default function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1360px] px-6 py-20 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ staggerChildren: 0.18 }}
          className="flex flex-col items-stretch justify-between gap-8 lg:flex-row lg:gap-[25px]"
        >
          {/* Left column */}
          <div className="flex flex-col items-stretch gap-[25px] lg:flex-row">
            {/* Block A */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-row items-center justify-between gap-4 lg:h-full lg:min-h-[447px] lg:flex-col lg:items-start lg:gap-8"
            >
              <div className="flex flex-1 flex-col gap-6 lg:flex-none">
                <h3 className="max-w-[260px] text-3xl leading-tight text-black">
                  <span className="font-medium">AKPsi</span>{" "}
                  <em className="font-cinematic italic">
                    changed my approach
                  </em>
                </h3>
                <div className="hidden items-center gap-2 lg:flex">
                  <div className="h-2 w-8 rounded-full bg-black" />
                  <div className="h-2 w-2 rounded-full bg-stone-300" />
                  <div className="h-2 w-2 rounded-full bg-stone-300" />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="self-start"
              >
                <Link
                  href="/rush"
                  className="inline-block whitespace-nowrap rounded-2xl bg-navy px-7 py-3 text-xl font-medium text-white transition-colors hover:bg-[#141d34]"
                >
                  Read More
                </Link>
              </motion.div>
            </motion.div>

            {/* Block B */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex w-full flex-col gap-3 lg:w-[282px]"
            >
              <div className="h-[280px] w-full overflow-hidden rounded-2xl lg:h-[351px]">
                <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
                  <span className="headline text-6xl text-gold">Ψ</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/40">
                    Chapter photo
                  </span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.4, duration: 0.55, ease: "easeOut" }}
                className="flex h-24 w-full items-center justify-center gap-3 rounded-2xl"
                style={{ backgroundColor: "#F1F0EF" }}
              >
                <span className="font-display text-3xl font-bold text-black">
                  Deloitte
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right column — the quote */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex max-w-[748px] flex-1 flex-col justify-between gap-10 rounded-2xl p-10"
            style={{ backgroundColor: "rgba(26, 39, 68, 0.08)" }}
          >
            <p className="text-3xl leading-10 text-black">
              {QUOTE.split(" ").map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: 0.4 + i * 0.04,
                    ease: "easeOut",
                  }}
                  className="mr-[0.25em] inline-block"
                >
                  {w}
                </motion.span>
              ))}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-1"
            >
              <span className="font-cinematic text-xl italic text-black">
                Hannah Kim,
              </span>
              <span className="text-xl text-black/50">
                Director of Alumni Relations · Class of &rsquo;27
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
