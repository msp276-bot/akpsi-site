"use client";

import { useMemberLinkedin } from "@/lib/publicLinkedin";

/** Member page headshot: opens the member's LinkedIn when one is on file. */
export default function LinkedInHeadshot({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: React.ReactNode;
}) {
  const linkedin = useMemberLinkedin(slug);
  if (!linkedin) return <>{children}</>;
  return (
    <a
      href={linkedin}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} on LinkedIn`}
      title={`${name} on LinkedIn`}
      className="block shrink-0 rounded-full"
    >
      {children}
    </a>
  );
}
