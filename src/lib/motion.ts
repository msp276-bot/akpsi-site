import type { Variants } from "framer-motion";

/** Signature easing from the design brief: cubic-bezier(0.16, 1, 0.3, 1). */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Fade + rise, used for hero text and section content. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

/** Stagger container that reveals children one after another. */
export function staggerContainer(stagger = 0.12, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Card entrance: fade up + subtle scale. */
export const cardIn: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Directional slide for alternating timeline cards. */
export function slideIn(from: "left" | "right"): Variants {
  return {
    hidden: { opacity: 0, x: from === "left" ? -48 : 48 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: EASE_OUT_EXPO },
    },
  };
}
