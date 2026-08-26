import SectionHeader from "@/components/SectionHeader";
import { Reveal } from "@/components/Reveal";
import type { AboutContent } from "@/lib/content/types";

export default function About({ about }: { about: AboutContent }) {
  return (
    <section id="about" className="shell scroll-mt-8 py-28 md:py-40">
      <SectionHeader index="04" label="About" />

      <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-6">
          <h2 className="font-display tracking-display max-w-[14ch] text-[11vw] leading-[0.94] text-balance text-bone md:text-[5vw]">
            {about.heading}
          </h2>
        </Reveal>

        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal delay={0.08}>
            <p className="max-w-[46ch] text-[15px] leading-[1.75] text-bone/65 md:text-base">
              {about.body}
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-8 max-w-[46ch] border-l border-signal/40 pl-5 text-[15px] leading-[1.75] text-bone/45 italic">
              {about.approach}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <dl className="mt-12 flex gap-12 border-t border-bone/12 pt-6">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase">
                  Experience
                </dt>
                <dd className="font-display mt-2 text-3xl text-bone tabular-nums">
                  {about.yearsExperience}
                  <span className="ml-1 text-base text-bone/40">yrs</span>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase">
                  Based in
                </dt>
                <dd className="font-display mt-2 text-3xl text-bone">Khamgaon</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
