"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

/**
 * Click-to-reveal email to deter scrapers. The address is assembled from parts
 * on the client only after interaction, so it never appears in the initial HTML.
 */
export default function RevealEmail({
  user,
  domain = "rutgers.edu",
}: {
  user: string;
  domain?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const address = `${user}@${domain}`;

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy"
      >
        <Mail size={15} /> Reveal email
      </button>
    );
  }

  return (
    <a
      href={`mailto:${address}`}
      className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy"
    >
      <Mail size={15} /> {address}
    </a>
  );
}
