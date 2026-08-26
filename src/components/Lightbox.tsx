"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toEmbed } from "@/lib/video";
import type { WorkItem } from "@/lib/content/types";
import { useScrollLock } from "./SmoothScroll";

const EASE = [0.16, 1, 0.3, 1] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export default function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: WorkItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const { lock, unlock } = useScrollLock();

  const open = index !== null;
  const item = open ? items[index] : null;
  const many = items.length > 1;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  // Freeze the page and remember where focus came from.
  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    lock();
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      unlock();
      restoreTo.current?.focus?.();
    };
  }, [open, lock, unlock]);

  // Escape closes, arrows move, Tab is trapped inside the dialog.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (many && event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (many && event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, many, onClose, goPrev, goNext]);

  const embed = item ? toEmbed(item.videoUrl) : null;

  return (
    <AnimatePresence>
      {open && item && embed ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 px-4 py-16 md:px-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${item.title} — ${item.category}`}
            className="relative flex max-h-full w-full max-w-[26rem] flex-col"
          >
            {/* Rail: title, category, close */}
            <div className="mb-4 flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.22em] text-signal uppercase">
                  {item.category}
                </p>
                <h2 className="font-display mt-1 truncate text-2xl text-bone">
                  {item.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="shrink-0 font-mono text-[10px] tracking-[0.22em] text-bone/50 uppercase transition-colors duration-300 hover:text-signal"
              >
                Close
              </button>
            </div>

            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="relative w-full overflow-hidden bg-ink-lift"
              style={{ aspectRatio: embed.orientation === "portrait" ? "9 / 14" : "16 / 9" }}
            >
              {embed.src ? (
                <iframe
                  key={embed.src}
                  src={embed.src}
                  title={item.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  scrolling="no"
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-bone/50">
                  This video cannot be embedded.
                </div>
              )}
            </motion.div>

            {/* Rail: paging and the escape hatch if the embed is blocked */}
            <div className="mt-4 flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase">
              {many ? (
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="text-bone/50 transition-colors duration-300 hover:text-bone"
                  >
                    &#8592; Prev
                  </button>
                  <span className="text-bone/25 tabular-nums">
                    {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    className="text-bone/50 transition-colors duration-300 hover:text-bone"
                  >
                    Next &#8594;
                  </button>
                </div>
              ) : (
                <span />
              )}
              <a
                href={embed.href}
                target="_blank"
                rel="noreferrer"
                className="text-bone/50 transition-colors duration-300 hover:text-signal"
              >
                Open original &#8599;
              </a>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
