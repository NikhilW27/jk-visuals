/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in Vercel to the real domain so
 * Open Graph tags, the canonical link and the JSON-LD all point at it.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Jayesh Kute";
export const SITE_TAGLINE = "One videographer for all your needs";
export const SITE_DESCRIPTION =
  "Videographer and video editor in Khamgaon. Weddings, functions, events and brand films, shot and cut end to end.";
