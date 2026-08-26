"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Minimal load state: a hairline that fills across the foot of the viewport
 * and a mono readout. No spinner.
 */
export default function SequenceLoader({
  progress,
  done,
}: {
  progress: number;
  done: boolean;
}) {
  const pct = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[70] bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-x-6 bottom-8 md:inset-x-10 md:bottom-10">
            <div className="mb-4 flex items-baseline justify-between font-mono text-[10px] tracking-[0.2em] text-bone/40 uppercase">
              <span>Jayesh Kute</span>
              <span aria-live="polite">
                {String(pct).padStart(3, "0")}
              </span>
            </div>
            <div className="h-px w-full bg-bone/12">
              <motion.div
                className="h-px origin-left bg-signal"
                style={{ scaleX: progress }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
