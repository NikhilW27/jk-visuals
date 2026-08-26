import Magnetic from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";

/**
 * A designed link, not an embedded feed. Feed widgets are slow, carry
 * third-party script, and look like everyone else's.
 */
export default function InstagramBlock({ handle }: { handle: string }) {
  return (
    <section id="instagram" className="shell scroll-mt-8 py-20 md:py-28">
      <Reveal>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="group block border-y border-bone/12 py-14 md:py-20"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase">
                Latest work lands here first
              </p>
              <p className="font-display tracking-display mt-5 text-[13vw] leading-[0.9] text-bone md:mt-6 md:text-[7vw]">
                <span className="text-bone/30">@</span>
                <span className="ease-editorial [box-shadow:inset_0_-2px_0_0_transparent] transition-[box-shadow] duration-700 group-hover:[box-shadow:inset_0_-2px_0_0_var(--color-signal)]">
                  {handle}
                </span>
              </p>
            </div>

            <Magnetic>
              <span className="inline-flex shrink-0 items-center gap-3 font-mono text-[10px] tracking-[0.22em] text-bone/60 uppercase transition-colors duration-500 group-hover:text-bone">
                Follow on Instagram
                <span
                  aria-hidden="true"
                  className="ease-editorial transition-transform duration-500 group-hover:translate-x-1"
                >
                  &#8599;
                </span>
              </span>
            </Magnetic>
          </div>
        </a>
      </Reveal>
    </section>
  );
}
