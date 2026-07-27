/**
 * Full-bleed photo backdrop with a fixed (parallax) attachment: the image is
 * pinned to the viewport while the section scrolls over it, so the picture
 * clearly moves at a different rate than the page - the Squarespace "Fixed"
 * behaviour. No extra zoom (unlike a transform-based drift, which has to
 * oversize the image and crops it more).
 *
 * Drop it in place of a `next/image` `fill` backdrop; put scrims/vignettes over
 * it as usual. It is decorative, so it renders aria-hidden with no alt text.
 *
 * Note: iOS Safari ignores `background-attachment: fixed` and falls back to a
 * normal (still-covered) scroll, so on iPhone the picture simply scrolls with
 * the section instead of parallaxing. It is not broken there, just static.
 */
export default function ParallaxImage({
  src,
  className = "",
  position = "center",
}: {
  src: string;
  className?: string;
  /** background-position, e.g. "center", "top". */
  position?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 select-none bg-cover bg-fixed ${className}`}
      style={{ backgroundImage: `url('${src}')`, backgroundPosition: position }}
    />
  );
}
