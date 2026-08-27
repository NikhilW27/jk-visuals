"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import type { WorkItem } from "@/lib/content/types";

/** How many pixels of page scroll move the strip one pixel sideways. */
const SCROLL_FACTOR = 0.32;
/** Idle drift, so the wall is alive before the visitor scrolls. */
const DRIFT_PX_PER_SECOND = 14;
/** Copies of each row, so wrapping never exposes an edge. */
const COPIES = 3;

/** Positive modulo — the strip wraps rather than running off. */
function wrap(value: number, span: number): number {
  if (span <= 0) return 0;
  return ((value % span) + span) % span;
}

type RowProps = {
  items: WorkItem[];
  offsetOf: (index: number) => number;
  direction: 1 | -1;
  tilt: number;
  onOpen: (index: number) => void;
  reduced: boolean;
};

function Row({ items, offsetOf, direction, tilt, onOpen, reduced }: RowProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const setRef = useRef<HTMLDivElement | null>(null);
  /** Drift stops while the pointer is over the row, or a card inside has
   *  focus. Without this you would be chasing a moving target to click a
   *  reel, and the hover tilt would never settle. */
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const set = setRef.current;
    if (!track || !set || reduced) return;

    let raf = 0;
    let running = false;
    let drift = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Accumulate rather than deriving from elapsed time, so resuming after
      // a pause continues from where it stopped instead of jumping.
      const delta = now - last;
      last = now;
      if (!paused.current) drift += (delta / 1000) * DRIFT_PX_PER_SECOND;

      const span = set.offsetWidth;
      if (span > 0) {
        const travel = window.scrollY * SCROLL_FACTOR + drift;
        // Both rows move the same distance; direction flips the sign so they
        // counter-scroll past one another.
        const x = -wrap(travel * direction * -1 + span, span);
        track.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only animate while the wall is on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(track);

    return () => {
      io.disconnect();
      stop();
    };
  }, [direction, reduced]);

  /** Cursor-follow tilt. Written straight to style — never a render. */
  const onMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduced) return;
      const card = event.currentTarget;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${px * 18}deg) rotateX(${-py * 18}deg) translateZ(40px) scale(1.07)`;
    },
    [reduced],
  );

  const onLeave = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "";
  }, []);

  return (
    <div
      className="reel-row overflow-hidden"
      style={{ transform: `rotateX(5deg) rotateZ(${tilt}deg)` }}
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
      onPointerDown={() => {
        // Touch never fires mouseenter, so contact is the pause signal there.
        paused.current = true;
      }}
      onPointerUp={() => {
        paused.current = false;
      }}
      onPointerCancel={() => {
        paused.current = false;
      }}
      onFocusCapture={() => {
        paused.current = true;
      }}
      onBlurCapture={() => {
        paused.current = false;
      }}
    >
      <div ref={trackRef} className="flex w-max gap-4 md:gap-5">
        {Array.from({ length: COPIES }, (_, copy) => (
          <div
            key={copy}
            ref={copy === 0 ? setRef : undefined}
            className="flex gap-4 md:gap-5"
            // Copies exist only to hide the seam. Keeping them out of the
            // accessibility tree means Tab visits each film exactly once.
            aria-hidden={copy > 0 ? true : undefined}
          >
            {items.map((item, index) => (
              <button
                key={`${copy}-${item.id}`}
                type="button"
                tabIndex={copy > 0 ? -1 : undefined}
                onClick={() => onOpen(offsetOf(index))}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                className="reel-card group relative block shrink-0 cursor-pointer overflow-hidden bg-ink-lift focus-visible:outline-signal"
                style={{
                  width: "clamp(104px, 11vw, 168px)",
                  aspectRatio: "9 / 16",
                }}
              >
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={`Frame from ${item.title}`}
                    fill
                    sizes="(min-width: 768px) 15vw, 40vw"
                    className="object-cover"
                  />
                ) : null}

                {/* Title rides in from the foot on hover. */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full p-3 text-left transition-transform duration-500 ease-editorial group-hover:translate-y-0 group-focus-visible:translate-y-0">
                  <span className="block font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
                    {item.category}
                  </span>
                  <span className="font-display mt-0.5 block text-sm leading-tight text-bone">
                    {item.title}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The reel wall: two counter-scrolling rows of poster frames on a 3D stage.
 * Page scroll drives the strips sideways; a slow drift keeps them moving when
 * the page is still. Cards tilt toward the cursor and lift out of the plane.
 */
export default function ReelMarquee({
  items,
  onOpen,
  reduced,
}: {
  items: WorkItem[];
  onOpen: (index: number) => void;
  reduced: boolean;
}) {
  if (items.length === 0) return null;

  // Alternate into two rows so neighbouring films are never directly stacked.
  const top = items.filter((_, index) => index % 2 === 0);
  const bottom = items.filter((_, index) => index % 2 === 1);

  if (reduced) {
    // No motion: a plain, fully scrollable grid of the same cards.
    return (
      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(index)}
              className="group relative block w-full cursor-pointer overflow-hidden bg-ink-lift"
              style={{ aspectRatio: "9 / 16" }}
            >
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={`Frame from ${item.title}`}
                  fill
                  sizes="(min-width: 1024px) 19vw, 45vw"
                  className="object-cover"
                />
              ) : null}
            </button>
            <p className="mt-3 font-display text-sm text-bone">{item.title}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="scene-3d mt-14 -mx-6 flex flex-col gap-4 md:-mx-10 md:mt-20 md:gap-5">
      <Row
        items={top}
        offsetOf={(index) => index * 2}
        direction={1}
        tilt={-1.2}
        onOpen={onOpen}
        reduced={reduced}
      />
      <Row
        items={bottom}
        offsetOf={(index) => index * 2 + 1}
        direction={-1}
        tilt={1.2}
        onOpen={onOpen}
        reduced={reduced}
      />
    </div>
  );
}
