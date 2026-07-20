"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const FAQS = [
  {
    q: "Do I need to be a business major?",
    a: "Not at all. AKPsi is open to students of all majors — we pride ourselves on diversity. Many of our members study computer science, the humanities, engineering, and the sciences alongside business.",
  },
  {
    q: "What is the time commitment?",
    a: "During the pledging process you can expect a few events per week. As an active member, the commitment is flexible and centers on our weekly chapter meeting plus events you choose to attend.",
  },
  {
    q: "Is there a fee to join?",
    a: "Yes — there are national and chapter dues that fund events, professional programming, and chapter operations. We offer payment plans and never want cost to be a barrier, so reach out if you have concerns.",
  },
  {
    q: "What if I can't attend every event?",
    a: "We understand students are busy. While recruitment events help us get to know you, we work with prospective members' schedules. Just communicate with the membership team and we'll accommodate where we can.",
  },
];

export default function RushFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader title="Frequently Asked" subtitle="questions" />

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-line bg-white"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-navy">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
