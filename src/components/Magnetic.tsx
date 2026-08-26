"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

/**
 * Subtle magnetic hover — the child drifts a few pixels toward the cursor.
 * Skipped entirely for reduced motion and on devices without a fine pointer.
 */
export default function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 190, damping: 22, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 190, damping: 22, mass: 0.35 });

  const onMove = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-block ${className ?? ""}`}
    >
      <motion.span
        className="inline-block"
        style={reduced ? undefined : { x: sx, y: sy }}
      >
        {children}
      </motion.span>
    </span>
  );
}
