"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LinkedinIcon } from "@/components/BrandIcons";
import { getInitials, type Member } from "@/data/members";
import { cardIn } from "@/lib/motion";

/**
 * Large vertical member card — a tall portrait tile with an overlaid name plate.
 * Drop a headshot on `member.photo` (portrait / 3:4 works best) and it fills the
 * tile via object-cover; without one it falls back to a monogram.
 */
function CardInner({ member }: { member: Member }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[radial-gradient(120%_120%_at_30%_0%,#2d3e5f_0%,#1a2744_60%,#131d33_100%)]">
      {member.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo}
          alt={member.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-24 w-24 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-3xl text-gold">
            {getInitials(member.name)}
          </span>
        </div>
      )}

      {/* Name plate */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/75 to-transparent p-5 pt-16 text-left">
        <h3 className="text-lg font-bold leading-tight text-white">
          {member.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-gold">
          {member.position}
        </p>
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-white/60">
          {member.cohort ? `${member.cohort} · ` : ""}Class of &rsquo;
          {member.classYear.slice(2)}
        </p>
      </div>
    </div>
  );
}

const cardClass =
  "group relative block overflow-hidden rounded-2xl border border-line shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl";

export default function MemberCard({
  member,
  href,
}: {
  member: Member;
  href?: string;
}) {
  if (href) {
    return (
      <motion.div variants={cardIn}>
        <Link href={href} className={cardClass}>
          <CardInner member={member} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article variants={cardIn} className={cardClass}>
      <CardInner member={member} />
      {member.linkedin && (
        <a
          href={member.linkedin}
          aria-label={`${member.name} on LinkedIn`}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy backdrop-blur-sm transition-colors hover:bg-white"
        >
          <LinkedinIcon size={15} />
        </a>
      )}
    </motion.article>
  );
}
