"use client";

import { useEffect, useRef, useState } from "react";
import Magnetic from "./Magnetic";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

/** Scroll past this before hiding, so small jitters never move the bar. */
const HIDE_AFTER = 140;
const DELTA = 6;

/**
 * Fixed navigation. Lives outside the hero so it serves every section, and
 * retreats on the way down so it never covers the subject.
 */
export default function SiteNav({ instagram }: { instagram: string }) {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const y = window.scrollY;
      const previous = lastY.current;

      if (Math.abs(y - previous) > DELTA) {
        setHidden(y > previous && y > HIDE_AFTER);
        lastY.current = y;
      }
      setSolid(y > HIDE_AFTER);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-editorial ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`transition-colors duration-500 ${
          solid
            ? "border-b border-bone/10 bg-ink/70 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="shell flex items-center justify-between gap-6 py-4 md:py-5">
          <a
            href="#top"
            className="font-mono text-[10px] tracking-[0.22em] text-bone/50 uppercase transition-colors duration-300 hover:text-bone"
          >
            <span className="sm:hidden">JK</span>
            <span className="hidden whitespace-nowrap sm:inline">
              Jayesh Kute
              <span className="ml-3 text-bone/25">Khamgaon, IN</span>
            </span>
          </a>

          <nav aria-label="Sections">
            <ul className="flex items-center gap-x-5 sm:gap-x-8">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Magnetic strength={0.2}>
                    <a
                      href={link.href}
                      className="group relative block py-1 font-mono text-[9px] tracking-[0.16em] text-bone/55 uppercase transition-colors duration-300 hover:text-bone sm:text-[10px] sm:tracking-[0.22em]"
                    >
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 ease-editorial group-hover:scale-x-100" />
                    </a>
                  </Magnetic>
                </li>
              ))}
              <li className="hidden md:block">
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-1 font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase transition-colors duration-300 hover:text-signal"
                >
                  @{instagram}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
