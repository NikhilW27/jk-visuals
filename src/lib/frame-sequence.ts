export type SequenceSet = {
  /** Public-root-relative directory, e.g. "/sequence" */
  dir: string;
  /** Number of frames in the set */
  count: number;
  width: number;
  height: number;
  /** File extension without the dot */
  ext: string;
};

export type SequenceManifest = {
  /** "rotation.mp4" for the real thing, "placeholder" for the procedural stand-in */
  source: string;
  generatedAt: string;
  desktop: SequenceSet;
  mobile: SequenceSet;
};

/**
 * How far the subject turns across the hero.
 *
 * The source clip is a full 360 degree orbit, but only this much of it is
 * used: the rotation runs 0 -> HERO_SWEEP_DEGREES and stops there rather than
 * continuing round. Frames beyond the sweep are never drawn, so they are never
 * fetched either.
 */
export const HERO_SWEEP_DEGREES = 130;

/** How many frames of a set the sweep actually covers. */
export function sweepFrameCount(set: SequenceSet): number {
  if (set.count === 0) return 0;
  // +1 so the last degree of the sweep lands on a real frame.
  return Math.min(
    set.count,
    Math.ceil((HERO_SWEEP_DEGREES / 360) * set.count) + 1,
  );
}

/** /sequence/frame-007.webp */
export function framePath(set: SequenceSet, index: number): string {
  return `${set.dir}/frame-${String(index + 1).padStart(3, "0")}.${set.ext}`;
}

/**
 * Positive modulo. The sequence loops seamlessly (first and last frame both
 * face camera) so the index wraps rather than clamping — scrolling past the
 * end keeps the subject turning instead of sticking on the last frame.
 */
export function wrapIndex(n: number, len: number): number {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}
