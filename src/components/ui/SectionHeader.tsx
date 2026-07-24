"use client";

import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface SectionHeaderProps {
  title: string;
  /** @deprecated No longer rendered - the lowercase blue accent was removed. */
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}

/**
 * Section title with a clip-reveal-from-bottom animation on scroll-in.
 */
export default function SectionHeader({
  title,
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
    </div>
  );
}
