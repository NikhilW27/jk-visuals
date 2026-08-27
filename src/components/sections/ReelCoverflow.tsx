"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import type { WorkItem } from "@/lib/content/types";

/** Rotation of the cards either side of centre. Gentle on purpose: these are
 *  photographs, and past about 35 degrees a candid frame foreshortens into an
 *  unreadable sliver. The reference gets away with 65 because book covers are
 *  bold graphics and the shelf, not the book, is the subject. */
const ANGLE = 31;
/** Fraction of a card's width between neighbours. Above 0.75 each card stays
 *  mostly visible, which is the point — the film is the subject here. */
const SPACING = 0.78;
/** How far each step recedes, in pixels. */
const DEPTH = 88;
/** Easing applied per frame toward the focused card. */
const EASE = 0.14;

type Props = {
  items: WorkItem[];
  onOpen: (index: number) => void;
  reduced: boolean;
};

export default function ReelCoverflow({ items, onOpen, reduced }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement | null>(null);

  /** Start in the middle of the set, so the fan opens both ways instead of
   *  running off one side with dead space on the other. */
  const middle = Math.floor((items.length - 1) / 2);

  /** Where we are heading, and where we currently are. Fractional while the
   *  card is in flight, so the fan stays continuous rather than snapping. */
  const target = useRef(middle);
  const current = useRef(middle);
  const dragging = useRef(false);

  const clampFocus = useCallback(
    (value: number) => Math.max(0, Math.min(items.length - 1, value)),
    [items.length],
  );

  const goTo = useCallback(
    (index: number) => {
      target.current = clampFocus(index);
    },
    [clampFocus],
  );

  /** Nearest card to the camera right now. */
  const focused = useCallback(() => Math.round(current.current), []);

  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;

    let raf = 0;

    const apply = () => {
      const cards = cardRefs.current;
      const first = cards[0];
      if (!first) return;
      const step = first.offsetWidth * SPACING;

      for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        if (!card) continue;
        const offset = i - current.current;
        const away = Math.abs(offset);

        // Only the immediate neighbours keep turning; beyond that they hold
        // their angle and simply recede, which stops the far edges of the fan
        // collapsing to nothing.
        const turn = -Math.max(-1, Math.min(1, offset)) * ANGLE;

        card.style.transform =
          `translate3d(calc(-50% + ${offset * step}px), 0, ${-away * DEPTH}px) ` +
          `rotateY(${turn}deg)`;
        card.style.opacity = String(Math.max(0.18, 1 - away * 0.22));
        card.style.zIndex = String(100 - Math.round(away * 10));
        card.style.pointerEvents = away > 3.5 ? "none" : "auto";
        // The card no longer clips its own overflow (the 3D edges have to
        // render outside it), so captions are revealed rather than slid in.
        card.dataset.focused = away < 0.5 ? "true" : "false";
      }

      if (counterRef.current) {
        counterRef.current.textContent = String(focused() + 1).padStart(2, "0");
      }
    };

    const tick = () => {
      const delta = target.current - current.current;
      current.current += delta * EASE;
      if (Math.abs(delta) < 0.0005) current.current = target.current;
      apply();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(apply);
    ro.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced, focused, items.length]);

  // Recentre when the filter changes the set under us.
  useEffect(() => {
    target.current = middle;
    current.current = middle;
  }, [items, middle]);

  // Drag / swipe. Move and up are bound to the window rather than using
  // setPointerCapture: capture retargets the whole stream to the stage, which
  // swallowed both the pointermove sequence and the click on a card.
  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;

    let active = false;
    let startX = 0;
    let startFocus = 0;
    let moved = 0;

    const step = () => (cardRefs.current[0]?.offsetWidth ?? 200) * SPACING;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      active = true;
      dragging.current = true;
      moved = 0;
      startX = event.clientX;
      startFocus = current.current;
    };

    const onMove = (event: PointerEvent) => {
      if (!active) return;
      const dx = event.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved < 4) return;
      event.preventDefault();
      target.current = clampFocus(startFocus - dx / step());
      current.current = target.current;
    };

    const onUp = () => {
      if (!active) return;
      active = false;
      dragging.current = false;
      // Settle on a card rather than between two.
      target.current = clampFocus(Math.round(current.current));
      // A real drag must not also count as a click on whatever card it ended on.
      if (moved > 6) {
        const swallow = (click: MouseEvent) => {
          click.stopPropagation();
          click.preventDefault();
        };
        window.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(
          () => window.removeEventListener("click", swallow, { capture: true }),
          0,
        );
      }
    };

    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [reduced, clampFocus]);

  // Horizontal wheel only. Vertical wheel is left alone so the page never
  // feels trapped inside the carousel.
  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;

    let accumulated = 0;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      accumulated += event.deltaX;
      const stepPx = (cardRefs.current[0]?.offsetWidth ?? 200) * SPACING;
      if (Math.abs(accumulated) >= stepPx * 0.35) {
        target.current = clampFocus(
          Math.round(current.current) + Math.sign(accumulated),
        );
        accumulated = 0;
      }
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [reduced, clampFocus]);

  if (items.length === 0) return null;

  if (reduced) {
    return (
      <ul className="shell mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              data-reel
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
            <p className="font-display mt-3 text-sm text-bone">{item.title}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-14 md:mt-20">
      <div
        ref={stageRef}
        className="coverflow-stage relative touch-pan-y select-none"
        style={{ height: "clamp(300px, 40vw, 470px)" }}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            data-reel
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            type="button"
            aria-label={`${item.title} — ${item.category}`}
            onFocus={() => goTo(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goTo(index - 1);
                cardRefs.current[clampFocus(index - 1)]?.focus();
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                goTo(index + 1);
                cardRefs.current[clampFocus(index + 1)]?.focus();
              }
            }}
            onClick={() => {
              // First click brings a card forward; only the front card opens.
              if (focused() === index) onOpen(index);
              else goTo(index);
            }}
            className="coverflow-card group absolute top-1/2 left-1/2 -translate-y-1/2 cursor-pointer bg-ink-lift focus-visible:outline-signal"
            style={{
              width: "clamp(150px, 17vw, 258px)",
              aspectRatio: "9 / 16",
            }}
          >
            <span className="absolute inset-0 overflow-hidden">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt=""
                  fill
                  // Images drag natively; without this, grabbing a card starts
                  // an HTML5 ghost-drag and the carousel never sees the move.
                  draggable={false}
                  sizes="(min-width: 1024px) 17vw, 45vw"
                  className="object-cover"
                />
              ) : null}
            </span>

            {/* Side faces, so an angled card reads as an object. */}
            <span
              aria-hidden="true"
              className="card-edge right-0 origin-right"
              style={{ transform: "rotateY(90deg)" }}
            />
            <span
              aria-hidden="true"
              className="card-edge left-0 origin-left"
              style={{ transform: "rotateY(-90deg)" }}
            />

            <span className="ease-editorial pointer-events-none absolute inset-x-0 top-full pt-4 text-left opacity-0 transition-opacity duration-500 group-data-[focused=true]:opacity-100">
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

      {/* Paging rail */}
      <div className="shell mt-8 flex items-center justify-center gap-7 font-mono text-[10px] tracking-[0.22em] text-bone/45 uppercase">
        <button
          type="button"
          onClick={() => goTo(focused() - 1)}
          className="cursor-pointer py-1 transition-colors duration-300 hover:text-bone"
        >
          &#8592; Prev
        </button>
        <span className="text-bone/25 tabular-nums">
          <span ref={counterRef}>{String(middle + 1).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => goTo(focused() + 1)}
          className="cursor-pointer py-1 transition-colors duration-300 hover:text-bone"
        >
          Next &#8594;
        </button>
      </div>
    </div>
  );
}
