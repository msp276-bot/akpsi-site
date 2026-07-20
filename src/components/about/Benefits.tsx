"use client";

import { motion } from "framer-motion";
import { Users, Compass, Globe2, TrendingUp, type LucideIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Pillar {
  title: string;
  body: string;
  imageSide: "left" | "right";
  Icon: LucideIcon;
}

const PILLARS: Pillar[] = [
  {
    title: "Community",
    imageSide: "left",
    Icon: Users,
    body: "The people you meet will go on to be your closest friends, roommates, study buddies, and everything in between. The lifelong friendships you make will be the most valuable assets you take away from AKPsi.",
  },
  {
    title: "Leadership",
    imageSide: "right",
    Icon: Compass,
    body: "From pledging to brotherhood, the opportunities to lead and grow as a leader are endless. From running events to leading committees, there is always a way to get involved and make a difference.",
  },
  {
    title: "Network",
    imageSide: "left",
    Icon: Globe2,
    body: "The Alpha Kappa Psi network is one of the largest and most diverse networks in the world. We have access to a large alumni network spanning top companies and career paths across the globe.",
  },
  {
    title: "Development",
    imageSide: "right",
    Icon: TrendingUp,
    body: "From professional development to personal growth, the opportunities to grow are endless. The brotherhood will always be here to help you grow as a student, professional, and person.",
  },
];

function PlaceholderImage({ title, Icon }: { title: string; Icon: LucideIcon }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-2 to-navy-3 shadow-lg saturate-[0.9] transition-all duration-500 group-hover:saturate-100">
      {/* soft gold glow */}
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90">
        <Icon size={40} className="text-gold" />
        <span className="headline text-3xl uppercase tracking-tight">{title}</span>
      </div>
      <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-widest text-white/30">
        Chapter photo
      </span>
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
      <PlaceholderImage title={pillar.title} Icon={pillar.Icon} />
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
    <section className="bg-white py-24 sm:py-28">
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
