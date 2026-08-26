"use client";

import { useCallback, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Magnetic from "@/components/Magnetic";
import FrameSequenceCanvas from "./FrameSequenceCanvas";
import SequenceLoader from "./SequenceLoader";
import { useFrameSequence } from "./useFrameSequence";

const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const degRef = useRef<HTMLSpanElement | null>(null);
  const { frames, set, progress, ready, reducedMotion } = useFrameSequence();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Fade and scale the subject away rather than hard-cutting at the section
  // boundary. The sticky frame unpins at roughly 0.48 of this range.
  const canvasOpacity = useTransform(scrollYProgress, [0.16, 0.46], [1, 0]);
  const canvasScale = useTransform(scrollYProgress, [0, 0.46], [1, 0.88]);
  const contentOpacity = useTransform(scrollYProgress, [0.04, 0.28], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.28], [0, -48]);

  // Written straight to the DOM: a rotation readout must not cost a render.
  const handleFrame = useCallback((degrees: number) => {
    if (!degRef.current) return;
    degRef.current.textContent = String(Math.round(degrees)).padStart(3, "0");
  }, []);

  const canvasStyle = reducedMotion
    ? undefined
    : { opacity: canvasOpacity, scale: canvasScale };
  const contentStyle = reducedMotion
    ? undefined
    : { opacity: contentOpacity, y: contentY };

  return (
    <>
      <SequenceLoader progress={progress} done={ready} />

      <section
        ref={sectionRef}
        className="relative h-[210svh]"
        aria-label="Introduction"
        data-hero-ready={ready ? "true" : "false"}
      >
        <div className="sticky top-0 h-svh overflow-hidden">
          <div className="relative mx-auto h-full w-full max-w-[1760px]">
          {/* Subject: behind everything, used exactly as shot. */}
          <motion.div
            style={canvasStyle}
            className="hero-plate pointer-events-none absolute inset-x-0 top-0 z-0 h-[74svh] origin-center lg:inset-auto lg:top-1/2 lg:right-[-7vh] lg:h-[104vh] lg:w-[104vh] lg:-translate-y-1/2"
          >
            <FrameSequenceCanvas
              frames={frames}
              set={set}
              frozen={reducedMotion}
              onFrame={handleFrame}
              className="h-full w-full"
            />
          </motion.div>

          <motion.div
            style={contentStyle}
            className="relative z-10 flex h-full flex-col px-6 py-6 md:px-10 md:py-9"
          >
            <motion.div
              variants={container}
              initial="hidden"
              animate={ready ? "show" : "hidden"}
              className="flex h-full flex-col"
            >
              <motion.header
                variants={rise}
                className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.22em] text-bone/45 uppercase"
              >
                <span>Khamgaon, IN</span>
                <a
                  href="https://instagram.com/jk.visuals_03"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-300 hover:text-signal"
                >
                  @jk.visuals_03
                </a>
              </motion.header>

              <div className="flex flex-1 flex-col justify-end lg:justify-center">
                <div className="max-w-[62rem] pb-14 lg:pb-0">
                  <motion.p
                    variants={rise}
                    className="mb-6 flex items-center gap-4 font-mono text-[10px] tracking-[0.22em] text-bone/55 uppercase md:mb-8"
                  >
                    <span className="h-px w-10 bg-signal" aria-hidden="true" />
                    Videographer &amp; Editor
                  </motion.p>

                  <h1 className="font-display tracking-display text-[19vw] leading-[0.84] text-bone md:text-[13vw] lg:text-[min(11vw,13rem)]">
                    <motion.span variants={rise} className="block">
                      Jayesh
                    </motion.span>
                    <motion.span
                      variants={rise}
                      className="block pl-[0.1em] text-bone/90"
                    >
                      Kute
                    </motion.span>
                  </h1>

                  <motion.p
                    variants={rise}
                    className="mt-7 max-w-[30ch] text-[15px] leading-relaxed text-pretty text-bone/60 md:mt-9 md:ml-[0.14em] md:max-w-[34ch] md:text-base"
                  >
                    One videographer for all your needs. Functions, weddings,
                    events and brand films, shot and cut end to end.
                  </motion.p>

                  <motion.div
                    variants={rise}
                    className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-4 md:mt-11"
                  >
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
                  </motion.div>
                </div>
              </div>

              <motion.footer
                variants={rise}
                className="flex items-end justify-between font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="hidden h-px w-8 bg-bone/25 md:block"
                  />
                  {reducedMotion ? "Reduced motion" : "Scroll to rotate"}
                </span>
                <span aria-hidden="true" className="tabular-nums">
                  <span ref={degRef}>000</span>
                  <span className="text-bone/20">&#176;</span>
                </span>
              </motion.footer>
            </motion.div>
          </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
