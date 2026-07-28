/**
 * Full-bleed STILL photo backdrop. Deliberately has NO motion and NO zoom, so it
 * is the stable counterpart to `ParallaxImage`, which uses
 * `background-attachment: fixed` (sized to the VIEWPORT, so its crop visibly jumps
 * as the window resizes). This one is element-sized `bg-cover` at a fixed position,
 * scale 1, no transform: it stays put on scroll and only recrops gently/centered
 * on resize (standard hero behaviour).
 *
 * Use this when a hero backdrop should look identical regardless of window size
 * and never move. Decorative: aria-hidden, no alt text.
 */
export default function CoverImage({
  src,
  className = "",
  position = "center",
}: {
  src: string;
  className?: string;
  /** background-position, e.g. "center", "center 32%". */
  position?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 select-none bg-cover bg-no-repeat ${className}`}
      style={{ backgroundImage: `url('${src}')`, backgroundPosition: position }}
    />
  );
}
