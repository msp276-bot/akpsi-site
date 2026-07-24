"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import MemberCard from "@/components/members/MemberCard";
import {
  members,
  GROUP_LABELS,
  type MemberGroup,
} from "@/data/members";
import { staggerContainer } from "@/lib/motion";

const TABS: MemberGroup[] = ["board", "actives", "alumni"];

export default function MembersSection() {
  const [active, setActive] = useState<MemberGroup>("board");

  const visible = useMemo(
    () => members.filter((m) => m.group === active),
    [active]
  );

  return (
    <section id="members" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader title="Our Members" subtitle="consultants" />

        {/* Filter tabs with sliding active pill */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full bg-slate-100 p-1.5">
            {TABS.map((tab) => {
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={`relative rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-colors sm:px-7 ${
                    isActive ? "text-white" : "text-muted hover:text-navy"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="member-tab-pill"
                      className="absolute inset-0 rounded-full bg-navy"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{GROUP_LABELS[tab]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid - crossfades between tabs, cards stagger in */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            variants={staggerContainer(0.07)}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {visible.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                href={`/members/${member.slug}`}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 text-center">
          <Link
            href="/members"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline"
          >
            View the full directory
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
