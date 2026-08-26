import { Reveal } from "./Reveal";

/**
 * The rail that opens every section: a hairline, a numeral, a label, and an
 * optional count on the right. Establishes the page's baseline rhythm.
 */
export default function SectionHeader({
  index,
  label,
  aside,
}: {
  index: string;
  label: string;
  aside?: string;
}) {
  return (
    <Reveal>
      <div className="rule flex items-baseline justify-between gap-6 pt-5 font-mono text-[10px] tracking-[0.22em] text-bone/40 uppercase">
        <span className="flex items-baseline gap-4">
          <span className="text-signal">{index}</span>
          <span>{label}</span>
        </span>
        {aside ? <span className="text-bone/25">{aside}</span> : null}
      </div>
    </Reveal>
  );
}
