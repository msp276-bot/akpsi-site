"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LinkedinIcon } from "@/components/BrandIcons";
import { getInitials, type Member } from "@/data/members";
import { cardIn } from "@/lib/motion";

/**
 * Member card. When `href` is provided the whole card becomes a link to the
 * member's profile (and the inner LinkedIn anchor is dropped to avoid nesting
 * interactive elements).
 */
export default function MemberCard({
  member,
  href,
}: {
  member: Member;
  href?: string;
}) {
  const inner = (
    <>
      {/* Avatar with navy → gold ring on hover */}
      <div className="relative">
        <div className="rounded-full p-[3px] ring-2 ring-navy transition-colors duration-500 group-hover:ring-gold">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-scarlet text-white">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt={member.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="headline text-2xl">
                {getInitials(member.name)}
              </span>
            )}
          </div>
        </div>
      </div>

      <h3 className="mt-4 text-base font-bold text-ink">{member.name}</h3>
      <p className="mt-0.5 text-sm font-medium text-blue">{member.position}</p>
      <p className="mt-2 text-sm text-ink">{member.major}</p>
      {member.minor && (
        <p className="text-xs text-muted">Minor · {member.minor}</p>
      )}
    </>
  );

  const cardClass =
    "group relative flex flex-col items-center rounded-2xl border border-line bg-white p-6 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg";

  if (href) {
    return (
      <motion.div variants={cardIn}>
        <Link href={href} className={`${cardClass} h-full`}>
          {inner}
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100">
            View profile
            <ArrowRight size={13} />
          </span>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article variants={cardIn} className={cardClass}>
      {inner}
      {member.linkedin && (
        <a
          href={member.linkedin}
          aria-label={`${member.name} on LinkedIn`}
          className="mt-3 inline-grid h-8 w-8 place-items-center rounded-full text-muted opacity-0 transition-all duration-200 hover:bg-navy hover:text-white group-hover:opacity-100"
        >
          <LinkedinIcon size={15} />
        </a>
      )}
    </motion.article>
  );
}
