"use client";

import { Fragment, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Magnetic from "@/components/Magnetic";

const EASE = [0.16, 1, 0.3, 1] as const;
const NAME = ["Jayesh", "Kute"];

/**
 * A single front-facing frame from the orbit. The scroll-driven sequence is
 * gone, so the hero costs one image rather than preloading a set of them.
 * The extraction pipeline still produces the full sequence — see
 * `npm run frames` — nothing here depends on it any more.
 */
const PORTRAIT = "/sequence/frame-001.webp";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const letters = {
  hidden: {},
  show: { transition: { staggerChildren: 0.028, delayChildren: 0.22 } },
};

const letter = {
  hidden: { opacity: 0, y: "38%" },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Fade and scale the subject away rather than hard-cutting at the section
  // boundary. The sticky frame unpins at roughly a third of this range.
  const plateOpacity = useTransform(scrollYProgress, [0.1, 0.32], [1, 0]);
  const plateScale = useTransform(scrollYProgress, [0, 0.32], [1, 0.9]);
  const contentOpacity = useTransform(scrollYProgress, [0.03, 0.2], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.2], [0, -40]);

  // Pointer position, -0.5..0.5 from the centre of the viewport.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 90, damping: 22, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  // Depth layers: the plate reacts most, the type least, so the hero has
  // parallax rather than everything sliding as one sheet.
  const plateX = useTransform(sx, (v) => v * -34);
  const plateY = useTransform(sy, (v) => v * -22);
  const plateRotateY = useTransform(sx, (v) => v * 9);
  const plateRotateX = useTransform(sy, (v) => v * -6);
  const typeX = useTransform(sx, (v) => v * 12);
  const typeY = useTransform(sy, (v) => v * 8);

  useEffect(() => {
    if (prefersReduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      px.set(event.clientX / window.innerWidth - 0.5);
      py.set(event.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [prefersReduced, px, py]);

  const scrollPlateStyle = prefersReduced
    ? undefined
    : { opacity: plateOpacity, scale: plateScale };
  const contentStyle = prefersReduced
    ? undefined
    : { opacity: contentOpacity, y: contentY };
  const plateStyle = prefersReduced
    ? undefined
    : { x: plateX, y: plateY, rotateY: plateRotateY, rotateX: plateRotateX };
  const typeStyle = prefersReduced ? undefined : { x: typeX, y: typeY };

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative h-[150svh]"
      aria-label="Introduction"
      data-hero-ready="true"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-[1760px]">
          {/* Subject: behind everything, used exactly as shot. */}
          <motion.div
            style={scrollPlateStyle}
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[74svh] origin-center [perspective:1400px] lg:inset-0 lg:h-full"
          >
            <motion.div
              style={plateStyle}
              className="hero-plate relative h-full w-full lg:absolute lg:top-1/2 lg:left-1/2 lg:h-[112vh] lg:w-[112vh] lg:-translate-x-1/2 lg:-translate-y-1/2"
            >
              <Image
                src={PORTRAIT}
                alt="Jayesh Kute, lit by red and cyan rim light"
                fill
                priority
                sizes="(min-width: 1024px) 112vh, 100vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>

          <motion.div
            style={contentStyle}
            className="relative z-10 flex h-full flex-col px-6 pt-24 pb-6 md:px-10 md:pt-28 md:pb-9"
          >
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex h-full flex-col"
            >
              <div className="flex-1" />

              <motion.div style={typeStyle}>
                <motion.div
                  variants={rise}
                  className="flex items-center gap-6 font-mono text-[10px] tracking-[0.22em] text-bone/55 uppercase"
                >
                  <span className="h-px w-10 bg-signal" aria-hidden="true" />
                  Videographer &amp; Editor
                </motion.div>

                <motion.h1
                  variants={letters}
                  aria-label="Jayesh Kute"
                  className="font-display tracking-display mt-4 text-[23vw] leading-[0.86] md:mt-5 lg:text-[min(25.5vw,29rem)]"
                >
                  {NAME.map((word, index) => (
                    <Fragment key={word}>
                      {index > 0 ? " " : null}
                      <span
                        aria-hidden="true"
                        className="inline-block whitespace-nowrap"
                      >
                        {[...word].map((character, position) => (
                          <span
                            key={`${word}-${position}`}
                            className="inline-block overflow-hidden align-bottom"
                          >
                            <motion.span
                              variants={letter}
                              className="display-gradient inline-block"
                            >
                              {character}
                            </motion.span>
                          </span>
                        ))}
                      </span>
                    </Fragment>
                  ))}
                </motion.h1>
              </motion.div>

              {/* Foot rail: what he does, and the two ways in. */}
              <motion.div
                variants={rise}
                className="mt-8 flex flex-col gap-7 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-10"
              >
                <p className="max-w-[30ch] text-[15px] leading-relaxed text-pretty text-bone/60 md:max-w-[34ch] md:text-base">
                  One videographer for all your needs. Functions, weddings,
                  events and brand films, shot and cut end to end.
                </p>

                <div className="flex shrink-0 flex-wrap items-center gap-x-9 gap-y-4">
                  <Magnetic>
                    <a
                      href="#work"
                      className="group inline-flex items-center gap-3 py-1 text-sm tracking-wide text-bone"
                    >
                      <span className="relative">
                        View Work
                        <span className="absolute -bottom-1 left-0 h-px w-full bg-bone/35 transition-colors duration-500 group-hover:bg-signal" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="ease-editorial translate-y-px transition-transform duration-500 group-hover:translate-x-1"
                      >
                        &#8594;
                      </span>
                    </a>
                  </Magnetic>

                  <Magnetic>
                    <a
                      href="#contact"
                      className="py-1 text-sm tracking-wide text-bone/50 transition-colors duration-500 hover:text-bone"
                    >
                      Get in Touch
                    </a>
                  </Magnetic>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
