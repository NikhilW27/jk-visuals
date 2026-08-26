"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";

type ScrollLock = {
  lock: () => void;
  unlock: () => void;
};

const ScrollLockContext = createContext<ScrollLock>({
  lock: () => {},
  unlock: () => {},
});

/**
 * Freezes page scrolling while an overlay is open. Handles both cases: with
 * Lenis running it stops the loop, and without it (reduced motion) it falls
 * back to overflow on the root element.
 */
export function useScrollLock(): ScrollLock {
  return useContext(ScrollLockContext);
}

/**
 * Lenis smooth scroll. Disabled entirely under prefers-reduced-motion so the
 * browser's native scrolling (and any assistive tech that depends on it) is
 * left alone.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const depth = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      // Without this Lenis ignores same-page anchor clicks, so the CTAs hard
      // jump instead of easing to their section.
      anchors: { offset: 0, duration: 1.3 },
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const lock = useCallback(() => {
    depth.current += 1;
    if (depth.current > 1) return;
    lenisRef.current?.stop();
    document.documentElement.classList.add("scroll-locked");
  }, []);

  const unlock = useCallback(() => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current > 0) return;
    lenisRef.current?.start();
    document.documentElement.classList.remove("scroll-locked");
  }, []);

  const value = useMemo(() => ({ lock, unlock }), [lock, unlock]);

  return (
    <ScrollLockContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ScrollLockContext.Provider>
  );
}
