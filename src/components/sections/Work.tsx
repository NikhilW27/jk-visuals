"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Lightbox from "@/components/Lightbox";
import SectionHeader from "@/components/SectionHeader";
import { Reveal } from "@/components/Reveal";
import { WORK_CATEGORIES, type WorkItem } from "@/lib/content/types";

const EASE = [0.16, 1, 0.3, 1] as const;

type Filter = "All" | (typeof WORK_CATEGORIES)[number];

/** Column offsets and alternating heights, so the grid reads as masonry
 *  rather than a tidy stack of equal boxes. */
function shape(index: number) {
  const column = index % 3;
  const tall = column === 1;
  return {
    aspect: tall ? "aspect-[9/16]" : "aspect-[3/4]",
    offset: column === 1 ? "lg:mt-14" : column === 2 ? "lg:mt-6" : "",
  };
}

export default function Work({ items }: { items: WorkItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
    <section id="work" className="shell scroll-mt-8 py-28 md:py-40">
      <SectionHeader
        index="02"
        label="Selected Work"
        aside={`${String(items.length).padStart(2, "0")} Films`}
      />

      <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <h2 className="font-display tracking-display max-w-[15ch] text-[11vw] leading-[0.94] text-balance text-bone md:text-[5.5vw]">
            Weddings, functions and brand films.
          </h2>
        </Reveal>

        <Reveal className="lg:col-span-4 lg:col-start-9 lg:self-end" delay={0.1}>
          <p className="max-w-[38ch] text-[15px] leading-relaxed text-bone/55">
            Shot on location across Khamgaon and Vidarbha, then cut and graded
            in the same hands. Tap any frame to watch it.
          </p>
        </Reveal>
      </div>

      {/* Filter rail */}
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
                  className={`relative py-1 transition-colors duration-300 ${
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

      {/* Grid */}
      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-x-8">
        <AnimatePresence mode="popLayout">
          {shown.map((item, index) => {
            const { aspect, offset } = shape(index);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.5, ease: EASE }}
                className={offset}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group block w-full cursor-pointer text-left"
                >
                  <div className={`relative w-full overflow-hidden bg-ink-lift ${aspect}`}>
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={`Frame from ${item.title}`}
                        fill
                        sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className="ease-editorial object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-baseline gap-4">
                    <span
                      aria-hidden="true"
                      className="font-mono text-[10px] tracking-[0.2em] text-bone/25 tabular-nums"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display flex-1 text-lg leading-tight text-bone md:text-xl">
                      <span className="bg-signal/0 group-hover:bg-signal/0 [box-shadow:inset_0_-1px_0_0_transparent] transition-[box-shadow] duration-500 group-hover:[box-shadow:inset_0_-1px_0_0_var(--color-signal)]">
                        {item.title}
                      </span>
                    </h3>
                    <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-bone/35 uppercase">
                      {item.category}
                    </span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <Lightbox
        items={shown}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
