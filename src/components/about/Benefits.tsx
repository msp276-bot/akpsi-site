"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Compass, Globe2, TrendingUp, type LucideIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Pillar {
  title: string;
  body: string;
  imageSide: "left" | "right";
  Icon: LucideIcon;
  /** Real chapter photo. Alt text describes the scene, not the pillar. */
  photo: string;
  alt: string;
}

const PILLARS: Pillar[] = [
  {
    title: "Community",
    imageSide: "left",
    Icon: Users,
    photo: "/chapter/hoodies.jpg",
    alt: "Omicron Tau members in chapter hoodies at a chapter event",
    body: "The people you meet will go on to be your closest friends, roommates, study buddies, and everything in between. The lifelong friendships you make will be the most valuable assets you take away from AKPsi.",
  },
  {
    title: "Leadership",
    imageSide: "right",
    Icon: Compass,
    photo: "/chapter/suits-seated.jpg",
    alt: "Omicron Tau members in business attire at a chapter meeting",
    body: "From pledging to brotherhood, the opportunities to lead and grow as a leader are endless. From running events to leading committees, there is always a way to get involved and make a difference.",
  },
  {
    title: "Network",
    imageSide: "left",
    Icon: Globe2,
    photo: "/chapter/stairs-formal.jpg",
    alt: "The Omicron Tau chapter gathered on the staircase in business attire",
    body: "The Alpha Kappa Psi network is one of the largest and most diverse networks in the world. We have access to a large alumni network spanning top companies and career paths across the globe.",
  },
  {
    title: "Development",
    imageSide: "right",
    Icon: TrendingUp,
    photo: "/chapter/auditorium.jpg",
    alt: "Omicron Tau members at a chapter session in a Rutgers lecture hall",
    body: "From professional development to personal growth, the opportunities to grow are endless. The brotherhood will always be here to help you grow as a student, professional, and person.",
  },
];

/** Real chapter photo with the pillar title plated over the bottom edge. */
function PillarImage({ pillar }: { pillar: Pillar }) {
  const { title, Icon, photo, alt } = pillar;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-navy shadow-lg">
      <Image
        src={photo}
        alt={alt}
        fill
        sizes="(min-width: 768px) 45vw, 100vw"
        className="object-cover saturate-[0.92] transition-all duration-500 group-hover:scale-[1.03] group-hover:saturate-100"
      />
      {/* Bottom scrim carries the label; without it the title sits on whatever
          happens to be in frame. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/90 via-navy/45 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5 text-white">
        <Icon size={22} className="shrink-0 text-gold" aria-hidden />
        <span className="headline text-2xl uppercase tracking-tight">
          {title}
        </span>
      </div>
    </div>
  );
}

function Row({ pillar }: { pillar: Pillar }) {
  const imageLeft = pillar.imageSide === "left";

  const image = (
    <motion.div
      className="group"
      initial={{ opacity: 0, x: imageLeft ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
    >
      <PillarImage pillar={pillar} />
    </motion.div>
  );

  const text = (
    <motion.div
      className="flex flex-col justify-center"
      initial={{ opacity: 0, x: imageLeft ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.15 }}
    >
      <h3 className="text-2xl font-bold text-navy">{pillar.title}</h3>
      <span className="mt-2 block h-1 w-12 rounded-full bg-gold" />
      <p className="mt-5 max-w-md leading-relaxed text-muted">{pillar.body}</p>
    </motion.div>
  );

  return (
    <div className="group grid items-center gap-8 md:grid-cols-2 md:gap-16">
      {/* On mobile: image first, then text. On desktop: honor imageSide. */}
      <div className={imageLeft ? "md:order-1" : "md:order-2"}>{image}</div>
      <div className={imageLeft ? "md:order-2" : "md:order-1"}>{text}</div>
    </div>
  );
}

export default function Benefits() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader title="Benefits" subtitle="why it matters" />
        <div className="mt-16 space-y-12 md:space-y-20">
          {PILLARS.map((p) => (
            <Row key={p.title} pillar={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
