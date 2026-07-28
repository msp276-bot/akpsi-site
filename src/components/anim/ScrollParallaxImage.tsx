"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Full-bleed photo backdrop with a REAL scroll-driven parallax: the image drifts
 * vertically as its section passes through the viewport, so it moves at a
 * different rate than the page. Unlike `ParallaxImage` (background-attachment:
 * fixed) this works on iOS too, and unlike a `bg-fixed` layer it is sized to the
 * ELEMENT, so the framing does not visibly re-crop when the window resizes.
 *
 * How the resize-stability works: the image layer is oversized vertically and
 * translated by a PERCENTAGE of its own height (never pixels), so the whole
 * effect scales proportionally with the section. The oversize (`top`/`height`
 * below) always exceeds the travel, so no edge is ever exposed.
 *
 * SSR note: only the transform (`y`) lives on the animated element; the
 * background lives on a plain inner div. Mixing the background shorthand with a
 * framer-animated transform on one element produces a hydration mismatch (framer
 * serializes background-position into longhands), so they are kept separate.
 *
 * Decorative, so it renders aria-hidden with no alt text. Drop scrims/vignettes
 * over it as usual.
 */
export default function ScrollParallaxImage({
  src,
  className = "",
  position = "center",
  strength = 0.12,
}: {
  src: string;
  className?: string;
  /** background-position, e.g. "center", "center 32%". */
  position?: string;
  /**
   * Drift as a fraction of the image layer's own height, each direction.
   * 0.12 = a moderate, tasteful parallax. Clamped to 0.16 so the oversize below
   * always covers the travel.
   */
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // These heroes sit at the very top of the page, so map the parallax to the
  // section's on-screen scroll window ("start start" = pinned at the top,
  // "end start" = fully scrolled past). That spends the full drift while the
  // hero is actually visible, instead of before it enters.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Layer is 150% of the section tall, centered (top -25%), so there is 25% of
  // headroom above and below. Travel of `pct` of the layer's own height stays
  // inside that headroom as long as pct * 1.5 <= 0.25 -> pct <= 0.166.
  const pct = Math.max(0, Math.min(strength, 0.16));
  const y = useTransform(scrollYProgress, [0, 1], [`-${pct * 100}%`, `${pct * 100}%`]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <motion.div
        style={{ y, top: "-25%", height: "150%" }}
        className="absolute inset-x-0 will-change-transform"
      >
        <div
          className={`h-full w-full bg-cover bg-no-repeat ${className}`}
          style={{ backgroundImage: `url('${src}')`, backgroundPosition: position }}
        />
      </motion.div>
    </div>
  );
}
