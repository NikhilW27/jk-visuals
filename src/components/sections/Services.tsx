import SectionHeader from "@/components/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const SERVICES = [
  {
    index: "01",
    title: "Event Films",
    copy: "Functions, ceremonies and celebrations covered end to end. Multiple angles on the day, cut down to a film worth rewatching.",
  },
  {
    index: "02",
    title: "Wedding Films",
    copy: "From haldi to vidaai. A quiet presence through the day, and a film that holds the whole thing together afterwards.",
  },
  {
    index: "03",
    title: "Brand Content",
    copy: "Product, showroom and launch films for local businesses. Built for the feed first — vertical, fast, and made to stop a thumb.",
  },
  {
    index: "04",
    title: "Video Editing",
    copy: "Freelance edit and grade on footage you already have. Colour, sound, pacing and titles, delivered ready to post.",
  },
];

export default function Services() {
  return (
    <section id="services" className="shell scroll-mt-8 py-28 md:py-40">
      <SectionHeader index="03" label="Services" aside="Four ways in" />

      <Reveal className="mt-14 md:mt-20">
        <h2 className="font-display tracking-display max-w-[16ch] text-[11vw] leading-[0.94] text-balance text-bone md:text-[5.5vw]">
          One person, start to finish.
        </h2>
      </Reveal>

      <RevealGroup className="mt-16 grid gap-px border-t border-bone/12 md:mt-24 md:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((service) => (
          <RevealItem key={service.index} className="group">
            {/* Rules and type only — no icons, no cards, no shadows. */}
            <div className="ease-editorial relative h-full border-t border-transparent pt-6 transition-colors duration-500 md:pt-8 lg:pr-8">
              <span
                aria-hidden="true"
                className="ease-editorial absolute -top-px left-0 h-px w-0 bg-signal transition-[width] duration-700 group-hover:w-full"
              />
              <p className="font-mono text-[10px] tracking-[0.22em] text-bone/30 uppercase tabular-nums">
                {service.index}
              </p>
              <h3 className="font-display mt-5 text-2xl leading-tight text-bone md:text-[1.75rem]">
                {service.title}
              </h3>
              <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-bone/50">
                {service.copy}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
