"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Lightbox from "@/components/Lightbox";
import SectionHeader from "@/components/SectionHeader";
import ReelCoverflow from "@/components/sections/ReelCoverflow";
import { Reveal } from "@/components/Reveal";
import { WORK_CATEGORIES, type WorkItem } from "@/lib/content/types";

const EASE = [0.16, 1, 0.3, 1] as const;

type Filter = "All" | (typeof WORK_CATEGORIES)[number];

export default function Work({ items }: { items: WorkItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;

  const used = useMemo(() => {
    const present = new Set(items.map((item) => item.category));
    return WORK_CATEGORIES.filter((category) => present.has(category));
  }, [items]);

  const shown = useMemo(
    () =>
      filter === "All"
        ? items
        : items.filter((item) => item.category === filter),
    [items, filter],
  );

  const changeFilter = (next: Filter) => {
    setOpenIndex(null);
    setFilter(next);
  };

  if (items.length === 0) return null;

  return (
    <section id="work" className="scroll-mt-8 overflow-hidden py-28 md:py-40">
      <div className="shell">
        <SectionHeader
          index="02"
          label="Selected Work"
          aside={`${String(items.length).padStart(2, "0")} Films`}
        />

        <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="font-display tracking-display display-gradient max-w-[15ch] text-[11vw] leading-[0.94] text-balance md:text-[5.5vw]">
              Weddings, functions and brand films.
            </h2>
          </Reveal>

          <Reveal
            className="lg:col-span-4 lg:col-start-9 lg:self-end"
            delay={0.1}
          >
            <p className="max-w-[38ch] text-[15px] leading-relaxed text-bone/55">
              Shot on location across Khamgaon and Vidarbha, then cut and graded
              in the same hands. Drag through them, tap the front one to watch it.
            </p>
          </Reveal>
        </div>

        {used.length > 1 ? (
          <Reveal className="mt-16 md:mt-20">
            <div
              className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[10px] tracking-[0.22em] uppercase"
              role="group"
              aria-label="Filter work by category"
            >
              {(["All", ...used] as Filter[]).map((category) => {
                const active = filter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => changeFilter(category)}
                    aria-pressed={active}
                    className={`relative cursor-pointer py-1 transition-colors duration-300 ${
                      active ? "text-bone" : "text-bone/35 hover:text-bone/70"
                    }`}
                  >
                    {category}
                    {active ? (
                      <motion.span
                        layoutId="work-filter-underline"
                        className="absolute -bottom-0.5 left-0 h-px w-full bg-signal"
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Reveal>
        ) : null}
      </div>

      <ReelCoverflow items={shown} onOpen={setOpenIndex} reduced={reduced} />

      <Lightbox
        items={shown}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
