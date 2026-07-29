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
  focusY = 0,
}: {
  src: string;
  className?: string;
  /**
   * background-position, e.g. "center", "center 32%". Note: only affects the
   * axis that actually overflows - a wide hero over a wider-than-tall image
   * crops horizontally, so use `focusY` (not this) to move it vertically there.
   */
  position?: string;
  /**
   * Drift as a fraction of the image layer's own height, each direction.
   * 0.12 = a moderate, tasteful parallax. Clamped to 0.16 so the oversize below
   * always covers the travel.
   */
  strength?: number;
  /**
   * Resting vertical bias, in percent of the layer's own height. Positive lifts
   * the framing down so the subjects sit lower; 0 (default) keeps the original
   * centered framing. When non-zero the layer is oversized further so the bias
   * plus the parallax travel never exposes an edge.
   */
  focusY?: number;
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

  // Default layer is 120% of the section tall, centered (top -10%). Keeping the
  // oversize small means `position` (background-position) is what actually
  // frames the photo - a bigger oversize would shove the visible window down the
  // image and fight the crop. When a vertical bias is requested we oversize to
  // 200% (top -50%) for the extra travel room the bias needs. As the hero
  // scrolls the layer drifts from y = -pct to y = +pct, i.e. gently DOWNWARD - a
  // background lag that trails the page rather than racing it. Travel is clamped
  // under the oversize margin so no edge is ever exposed (10% each side default).
  const biased = focusY !== 0;
  const pct = Math.max(0, Math.min(strength, biased ? 0.16 : 0.1));
  const travel = pct * 100;
  const layerTop = biased ? "-50%" : "-10%";
  const layerHeight = biased ? "200%" : "120%";
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${focusY - travel}%`, `${focusY + travel}%`]
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <motion.div
        style={{ y, top: layerTop, height: layerHeight }}
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
