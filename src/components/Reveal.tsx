"use client";

import { motion, type Variants } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Scroll reveal. Children ease up and in, staggered. MotionConfig in
 * SmoothScroll is set to reducedMotion="user", so under that preference
 * framer-motion drops the transforms and only the opacity settles.
 */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.05 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** A single element that rises into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "p" | "li" | "span" | "h2" | "h3";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/** A group whose direct <RevealItem> children stagger in together. */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={rise}>
      {children}
    </motion.div>
  );
}
