"use client";

import { LinkedinIcon } from "@/components/BrandIcons";
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
      className="group/photo relative block shrink-0 rounded-full"
    >
      {children}
      <span className="absolute bottom-0.5 right-0.5 grid h-7 w-7 place-items-center rounded-full bg-[#0A66C2] text-white ring-[3px] ring-white transition-transform group-hover/photo:scale-110">
        <LinkedinIcon size={13} />
      </span>
    </a>
  );
}
