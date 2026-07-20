/**
 * Abstract flowing navy "silk" backdrop with gold light-leaks.
 *
 * Deliberately cheap to paint: it relies on soft-stop radial/conic gradients
 * (which are inherently blurry) instead of CSS `blur()` filters on huge
 * surfaces, and animates only small, GPU-friendly translate movements. This
 * keeps the hero smooth even on constrained GPUs.
 */
export default function SilkBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden bg-navy ${className}`}
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#2d3e5f_0%,#1a2744_55%,#131d33_100%)]" />

      {/* Soft drifting folds — no blur filter, just gentle translate */}
      <div
        className="absolute -inset-[20%] animate-silk opacity-70"
        style={{
          background:
            "radial-gradient(45% 55% at 38% 42%, rgba(91,142,198,0.28) 0%, rgba(26,39,68,0) 60%)",
        }}
      />
      <div
        className="absolute -inset-[20%] animate-silk-2 opacity-60"
        style={{
          background:
            "radial-gradient(50% 50% at 66% 58%, rgba(45,62,95,0.55) 0%, rgba(26,39,68,0) 65%)",
        }}
      />

      {/* Gold light leaks (soft gradient stops, no blur) */}
      <div
        className="absolute right-[6%] top-[10%] h-80 w-80 animate-silk opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,83,0.5) 0%, rgba(212,168,83,0) 68%)",
        }}
      />
      <div
        className="absolute left-[4%] bottom-[12%] h-72 w-72 animate-silk-2 opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(229,197,131,0.45) 0%, rgba(212,168,83,0) 68%)",
        }}
      />

      {/* Vignette to keep foreground text legible */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(19,29,51,0)_40%,rgba(19,29,51,0.55)_100%)]" />
    </div>
  );
}
