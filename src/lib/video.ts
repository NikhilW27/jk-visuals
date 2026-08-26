export type EmbedKind = "instagram" | "youtube" | "unknown";

export type Embed = {
  kind: EmbedKind;
  /** null when the URL is not recognised — the lightbox then offers the link. */
  src: string | null;
  /** Portrait for reels, landscape for YouTube. */
  orientation: "portrait" | "landscape";
  /** Always the original URL, for the "open on Instagram" fallback. */
  href: string;
};

const INSTAGRAM = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i;
const YOUTUBE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

/**
 * Turns a work item's URL into something an iframe can load. Called only when
 * the lightbox opens — no embed is ever fetched for the grid itself.
 */
export function toEmbed(url: string): Embed {
  const instagram = url.match(INSTAGRAM);
  if (instagram) {
    return {
      kind: "instagram",
      src: `https://www.instagram.com/reel/${instagram[1]}/embed/`,
      orientation: "portrait",
      href: url,
    };
  }

  const youtube = url.match(YOUTUBE);
  if (youtube) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0&autoplay=1&modestbranding=1`,
      orientation: "landscape",
      href: url,
    };
  }

  return { kind: "unknown", src: null, orientation: "landscape", href: url };
}

/** Shortcode or video id, used as a stable work-item id. */
export function videoId(url: string): string | null {
  return url.match(INSTAGRAM)?.[1] ?? url.match(YOUTUBE)?.[1] ?? null;
}
