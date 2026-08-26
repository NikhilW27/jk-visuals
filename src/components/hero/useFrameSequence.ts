"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import manifest from "@/lib/sequence-manifest";
import {
  framePath,
  sweepFrameCount,
  type SequenceSet,
} from "@/lib/frame-sequence";

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** How many frames to fetch at once. Keeps progress feeling steady and lets
 *  the first frame land fast on slow connections. */
const POOL = 10;

/** img.decode() is not guaranteed to settle while the document is hidden, so
 *  it is always raced against this. onload alone is enough to draw. */
const DECODE_TIMEOUT_MS = 500;

/** Absolute ceiling on the load state. The loader must never trap the page. */
const PRELOAD_WATCHDOG_MS = 15000;

export type FrameSequenceState = {
  frames: (HTMLImageElement | null)[];
  set: SequenceSet | null;
  /** 0..1 across the whole set */
  progress: number;
  ready: boolean;
  reducedMotion: boolean;
};

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Decode up front so the first drawImage does not hitch — but never block on it. */
function decodeSoon(img: HTMLImageElement): Promise<void> {
  if (typeof img.decode !== "function" || document.hidden) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, DECODE_TIMEOUT_MS);
    img.decode().then(finish, finish);
  });
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => decodeSoon(img).then(() => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

type LoadState = {
  /** Which set this progress belongs to, so a stale load is ignored. */
  key: string;
  frames: (HTMLImageElement | null)[];
  progress: number;
  ready: boolean;
};

/**
 * Preloads a whole frame sequence into memory before the hero is revealed.
 * Picks the mobile set below 768px and re-picks if that boundary is crossed.
 * Under prefers-reduced-motion only a single frame is fetched.
 */
export function useFrameSequence(): FrameSequenceState {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_QUERY);

  const set = isMobile ? manifest.mobile : manifest.desktop;
  const key = `${set.dir}|${reducedMotion}`;

  const [load, setLoad] = useState<LoadState>({
    key: "",
    frames: [],
    progress: 0,
    ready: false,
  });

  useEffect(() => {
    const wanted = sweepFrameCount(set);
    if (wanted === 0) return;

    let cancelled = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const frames: (HTMLImageElement | null)[] = new Array(wanted).fill(null);

    const reveal = () => {
      if (cancelled) return;
      // Fresh array reference so the canvas repaint effect actually re-runs.
      setLoad({ key, frames: [...frames], progress: 1, ready: true });
    };

    const start = () => {
      if (cancelled) return;

      // Reduced motion: one static frame, nothing else.
      if (reducedMotion) {
        loadImage(framePath(set, 0)).then((img) => {
          if (cancelled) return;
          frames[0] = img;
          reveal();
        });
        return;
      }

      // Safety net: a stalled image must never leave the page behind a
      // loader. The canvas falls back to the nearest frame that did decode.
      watchdog = setTimeout(reveal, PRELOAD_WATCHDOG_MS);

      let loaded = 0;
      let next = 0;

      const pump = async (): Promise<void> => {
        while (!cancelled) {
          const i = next++;
          if (i >= wanted) return;
          frames[i] = await loadImage(framePath(set, i));
          if (cancelled) return;
          loaded += 1;
          setLoad({ key, frames, progress: loaded / wanted, ready: false });
        }
      };

      Promise.all(
        Array.from({ length: Math.min(POOL, wanted) }, () => pump()),
      ).then(() => {
        clearTimeout(watchdog);
        reveal();
      });
    };

    // On the very first client render the media-query snapshot is still the
    // server's (`false`). Starting here would fetch a pool of desktop frames
    // on a phone before the real value lands, so defer one tick and let the
    // superseded effect cancel itself.
    const kickoff = setTimeout(start, 0);

    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      clearTimeout(watchdog);
    };
  }, [key, set, reducedMotion]);

  // Derived during render, so a set swap resets cleanly without a cascade.
  const fresh = load.key === key;
  const empty = set.count === 0;

  return {
    frames: fresh ? load.frames : [],
    set,
    // No frames generated yet — fail open rather than hanging on a loader.
    progress: empty ? 1 : fresh ? load.progress : 0,
    ready: empty ? true : fresh && load.ready,
    reducedMotion,
  };
}
