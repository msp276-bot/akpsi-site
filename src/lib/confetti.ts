/**
 * Tiny dependency-free canvas confetti burst. Draws navy/gold/scarlet pieces
 * that fall and fade, then cleans itself up. Respects reduced-motion (no-op).
 */
export function fireConfetti(durationMs = 2200) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const colors = ["#1a2744", "#d4a853", "#e5c583", "#cc0033", "#5b8ec6"];
  const W = window.innerWidth;
  const count = Math.min(160, Math.round(W / 8));

  interface Piece {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rot: number;
    vrot: number;
    color: string;
  }
  const pieces: Piece[] = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.5,
    y: window.innerHeight * 0.35 + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -12 - 4,
    size: Math.random() * 7 + 4,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.3,
    color: colors[(Math.random() * colors.length) | 0],
  }));

  const gravity = 0.32;
  const start = performance.now();
  let raf = 0;

  const frame = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = Math.max(0, 1 - elapsed / durationMs);

    for (const p of pieces) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (elapsed < durationMs) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(frame);
}
