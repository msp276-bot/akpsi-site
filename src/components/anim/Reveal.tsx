"use client";

import { motion, type Variants } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  /** Fraction of the element visible before triggering (0–1). */
  amount?: number;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}

/** Scroll-into-view wrapper. Reveals once, at a 20% threshold by default. */
export default function Reveal({
  children,
  variants = fadeUp,
  className,
  amount = 0.2,
  delay = 0,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}
