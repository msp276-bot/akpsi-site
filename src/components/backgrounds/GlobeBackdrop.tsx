/**
 * Low-opacity dotted globe drawn as an SVG grid of latitude/longitude dots.
 * Sits behind the stats grid in the About section.
 */
export default function GlobeBackdrop({ className = "" }: { className?: string }) {
  const R = 200;
  const cx = 250;
  const cy = 250;
  const dots: { x: number; y: number; o: number }[] = [];

  // Build a dotted sphere: rings of latitude, each sampled at longitudes.
  for (let lat = -80; lat <= 80; lat += 10) {
    const latRad = (lat * Math.PI) / 180;
    const y = cy - R * Math.sin(latRad);
    const ringR = R * Math.cos(latRad);
    const steps = Math.max(6, Math.round(ringR / 10));
    for (let i = 0; i < steps; i++) {
      const lon = (i / steps) * Math.PI * 2;
      // Only render the front hemisphere for a subtle depth cue.
      const x = cx + ringR * Math.sin(lon);
      const depth = Math.cos(lon); // 1 = front, -1 = back
      const o = 0.15 + 0.35 * ((depth + 1) / 2);
      dots.push({ x, y, o });
    }
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx={cx} cy={cy} r={R} stroke="#d4a853" strokeOpacity="0.12" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.4} fill="#d4a853" opacity={d.o} />
      ))}
    </svg>
  );
}
