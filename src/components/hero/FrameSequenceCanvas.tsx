"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  HERO_SWEEP_DEGREES,
  sweepFrameCount,
  wrapIndex,
  type SequenceSet,
} from "@/lib/frame-sequence";

type Props = {
  frames: (HTMLImageElement | null)[];
  set: SequenceSet | null;
  /** Reduced motion: paint one frame and never bind to scroll. */
  frozen?: boolean;
  className?: string;
};

/** Playback rate of the ambient sway. The source is 7.2fps, so staying near
 *  it keeps the motion reading as footage rather than as stepping frames. */
const IDLE_FPS = 6;
/** How many frames the sway travels through, at either end of its swing. */
const IDLE_SPAN = 8;

/**
 * Scroll distance over which the whole sweep plays out. Viewport-relative so
 * the rotation feels the same on a phone as on a 27 inch display, and sized so
 * the turn finishes about as the subject fades out of the hero.
 */
function sweepDistance(): number {
  if (typeof window === "undefined") return 900;
  return Math.min(1400, Math.max(620, window.innerHeight * 1.0));
}

export default function FrameSequenceCanvas({
  frames,
  set,
  frozen = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  /** Index actually drawn to the canvas. Stays -1 until a frame lands, so a
   *  paint attempted before the images decode is retried rather than lost. */
  const paintedIndex = useRef<number>(-1);

  // Latest-value refs, so the rAF loop never has to be torn down and rebuilt
  // just because a prop identity changed. Declared before the effects that
  // read them, so they are always current by the time those run.
  const framesRef = useRef(frames);
  useEffect(() => {
    framesRef.current = frames;
  });

  /** Nearest frame at or before `index` that actually decoded. */
  const pickFrame = useCallback((index: number): HTMLImageElement | null => {
    const list = framesRef.current;
    if (list.length === 0) return null;
    for (let step = 0; step < list.length; step += 1) {
      const img = list[wrapIndex(index - step, list.length)];
      if (img) return img;
    }
    return null;
  }, []);

  /** Returns true only if a frame was actually drawn. */
  const paint = useCallback(
    (index: number): boolean => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return false;
      const img = pickFrame(index);
      if (!img) return false;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) return false;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (iw === 0 || ih === 0) return false;

      // Cover fit, centred. The frames are used exactly as shot: no mask,
      // no cutout, no vignette.
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return true;
    },
    [pickFrame],
  );

  // Size the backing store to the element box at device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    ctxRef.current = ctx;
    if (ctx) ctx.imageSmoothingQuality = "high";

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      if (ctxRef.current) ctxRef.current.imageSmoothingQuality = "high";
      paint(paintedIndex.current < 0 ? 0 : paintedIndex.current);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  // Repaint when a new set finishes loading.
  useEffect(() => {
    const index = paintedIndex.current < 0 ? 0 : paintedIndex.current;
    if (!paint(index)) return;
    paintedIndex.current = index;
    const canvas = canvasRef.current;
    if (canvas && canvas.dataset.degrees === undefined) {
      canvas.dataset.degrees = "0";
    }
  }, [frames, set, paint]);

  // Scroll to frame index, driven by a single rAF loop. The scroll event is
  // never read directly; window.scrollY is sampled once per animation frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !set || set.count === 0) return;

    if (frozen) {
      if (paint(0)) {
        paintedIndex.current = 0;
        canvas.dataset.degrees = "0";
      }
      return;
    }

    let raf = 0;
    let running = false;
    const lastIndex = sweepFrameCount(set) - 1;
    // Scroll drives the base; the sway rides on top of it. Reserving the
    // sway's span keeps the total inside the loaded frames, and means the
    // face is never parked on a single frame however you are scrolled.
    const span = Math.min(IDLE_SPAN, Math.max(0, lastIndex - 1));
    const base = Math.max(0, lastIndex - span);

    let distance = sweepDistance();
    let sway = 0;
    let swayDir = 1;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - last, 100) / 1000;
      last = now;

      // Ping-pong rather than wrap: reversing the orbit reads as natural
      // camera movement, where looping back to frame zero would snap.
      sway += swayDir * IDLE_FPS * delta;
      if (sway >= span) {
        sway = span;
        swayDir = -1;
      } else if (sway <= 0) {
        sway = 0;
        swayDir = 1;
      }

      // Clamped, not wrapped: the subject turns through the sweep and holds
      // there rather than continuing round.
      const progress = Math.min(1, Math.max(0, window.scrollY / distance));
      const index = Math.round(progress * base + sway);

      if (index !== paintedIndex.current && paint(index)) {
        paintedIndex.current = index;
        // Exposed for tests and debugging; nothing renders from it.
        canvas.dataset.degrees = String(
          Math.round((index / lastIndex) * HERO_SWEEP_DEGREES),
        );
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const onResize = () => {
      distance = sweepDistance();
    };

    // Only burn frames while the canvas is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, [frozen, set, paint]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
