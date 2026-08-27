"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to be a business major?",
    a: "Not at all. AKPsi is open to students of all majors - we pride ourselves on diversity. Many of our members study computer science, the humanities, engineering, and the sciences alongside business.",
  },
  {
    q: "What is the time commitment?",
    a: "During the pledging process you can expect a few events per week. As an active member, the commitment is flexible and centers on our weekly chapter meeting plus events you choose to attend.",
  },
  {
    q: "Is there a fee to join?",
    a: "Yes - there are national and chapter dues that fund events, professional programming, and chapter operations. We offer payment plans and never want cost to be a barrier, so reach out if you have concerns.",
  },
  {
    q: "What if I can't attend every event?",
    a: "We understand students are busy. While recruitment events help us get to know you, we work with prospective members' schedules. Just communicate with the membership team and we'll accommodate where we can.",
  },
];

export default function RushFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="headline text-center text-4xl uppercase text-navy sm:text-5xl">
          FAQ
        </h2>

        <div className="mt-12 space-y-4">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-5 px-7 py-6 text-left sm:px-9"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-semibold text-navy sm:text-xl">
                    {item.q}
                  </span>
                  <Plus
                    size={24}
                    className={`shrink-0 text-blue transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
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
                      <p className="px-7 pb-6 text-base leading-relaxed text-muted sm:px-9">
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
