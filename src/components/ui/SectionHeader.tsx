"use client";

import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface SectionHeaderProps {
  title: string;
  /** Small uppercase kicker shown above the title (gold). */
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}

/**
 * Section header: a gold kicker line, the serif title, and a short gold accent
 * rule beneath it - three stacked elements so the title never floats alone in
 * empty space. Everything fades up on scroll-in (the heading is observed with
 * only a small offset, not the old clip-reveal from y:110% that pushed the
 * observed element out of its own clip so the reveal never fired).
 */
export default function SectionHeader({
  title,
  subtitle,
  tone = "dark",
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const titleColor = tone === "light" ? "text-white" : "text-navy";
  const kickerColor = tone === "light" ? "text-gold" : "text-blue";
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  const barOrigin = align === "center" ? "origin-center" : "origin-left";

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {subtitle && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className={`mb-3 text-xs font-semibold uppercase tracking-[0.28em] ${kickerColor}`}
        >
          {subtitle}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        className={`headline uppercase text-3xl sm:text-4xl md:text-5xl ${titleColor}`}
      >
        {title}
      </motion.h2>
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
        className={`mt-5 block h-[3px] w-14 rounded-full bg-gold ${barOrigin}`}
      />
    </div>
  );
}
