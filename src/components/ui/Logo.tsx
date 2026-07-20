import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  /** "light" for dark backgrounds (white wordmark), "dark" for light backgrounds (navy wordmark). */
  tone?: "light" | "dark";
  withWordmark?: boolean;
  className?: string;
}

/**
 * Chapter lockup matching the brand reference: the Rutgers block "R"
 * (official mark, /public/rutgers-r.svg), the "ALPHA KAPPA PSI" wordmark in
 * the display serif, and a gold "OMICRON TAU | RUTGERS UNIVERSITY" subtitle.
 */
export default function Logo({
  tone = "light",
  withWordmark = true,
  className = "",
}: LogoProps) {
  const wordmark = tone === "light" ? "text-white" : "text-navy";

  return (
    <Link
      href="/"
      aria-label="Alpha Kappa Psi — Omicron Tau, home"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <Image
        src="/rutgers-r.svg"
        alt=""
        aria-hidden
        width={40}
        height={35}
        priority
        className="h-9 w-auto shrink-0"
      />

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={`whitespace-nowrap font-display text-xl font-extrabold uppercase tracking-tight ${wordmark}`}
          >
            Alpha Kappa Psi
          </span>
          <span className="mt-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            Omicron Tau <span className="font-normal text-gold/60">|</span>{" "}
            Rutgers University
          </span>
        </span>
      )}
    </Link>
  );
}
