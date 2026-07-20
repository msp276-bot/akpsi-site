"use client";

import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}

/**
 * Section title with a clip-reveal-from-bottom animation on scroll-in,
 * plus an optional lowercase accent-blue subtitle (e.g. "consultants").
 */
export default function SectionHeader({
  title,
  subtitle,
  tone = "dark",
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const titleColor = tone === "light" ? "text-white" : "text-navy";
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      <div className="overflow-hidden">
        <motion.h2
          initial={{ y: "110%" }}
          whileInView={{ y: "0%" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className={`headline uppercase text-3xl sm:text-4xl md:text-5xl ${titleColor}`}
        >
          {title}
        </motion.h2>
      </div>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-2 text-lg lowercase tracking-wide text-blue font-medium"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
