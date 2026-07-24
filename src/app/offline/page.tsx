import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/** Shown by the service worker when a page is requested with no connection. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy px-6 text-center text-white">
      <Image
        src="/akpsi-logo.png"
        alt="Alpha Kappa Psi"
        width={96}
        height={96}
        className="h-24 w-24"
        priority
      />
      <div>
        <h1 className="font-display text-3xl">You&rsquo;re offline</h1>
        <p className="mt-3 max-w-sm text-sm text-white/60">
          We couldn&rsquo;t reach the network. Pages you&rsquo;ve already opened
          are still available - reconnect to load anything new.
        </p>
      </div>
      <a
        href="/"
        className="rounded-full border border-gold/50 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/10"
      >
        Try again
      </a>
    </main>
  );
}
