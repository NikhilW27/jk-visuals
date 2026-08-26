import {
  CONTENT_VERSION,
  type SiteContent,
  type WorkItem,
} from "./types";

/**
 * Seed content. This is what the site serves before anything has been saved
 * through /admin, and what a malformed or missing store falls back to.
 *
 * Work items were seeded from the nine reels via `npm run thumbs`. Titles and
 * categories were inferred from the extracted poster frames — correct them in
 * the admin panel rather than here.
 */
const work: WorkItem[] = [
  {
    id: "DcJUXJ5hodz",
    title: "Ceremony Under the Pandal",
    category: "Event",
    videoUrl: "https://www.instagram.com/reel/DcJUXJ5hodz/",
    thumbnail: "/work/DcJUXJ5hodz.webp",
    order: 0,
  },
  {
    id: "DbissTgB-uU",
    title: "Marigold and Rangoli",
    category: "Wedding",
    videoUrl: "https://www.instagram.com/reel/DbissTgB-uU/",
    thumbnail: "/work/DbissTgB-uU.webp",
    order: 1,
  },
  {
    id: "Da-QZrBBarl",
    title: "Interior Detail",
    category: "Brand",
    videoUrl: "https://www.instagram.com/reel/Da-QZrBBarl/",
    thumbnail: "/work/Da-QZrBBarl.webp",
    order: 2,
  },
  {
    id: "DaDKwJkI1tm",
    title: "Haldi Morning",
    category: "Wedding",
    videoUrl: "https://www.instagram.com/reel/DaDKwJkI1tm/",
    thumbnail: "/work/DaDKwJkI1tm.webp",
    order: 3,
  },
  {
    id: "DZ7OoJBoE8s",
    title: "Ganpati Sthapana",
    category: "Event",
    videoUrl: "https://www.instagram.com/reel/DZ7OoJBoE8s/",
    thumbnail: "/work/DZ7OoJBoE8s.webp",
    order: 4,
  },
  {
    id: "DZk_t-PhVwU",
    title: "Attitude — Cut and Graded",
    category: "Editing",
    videoUrl: "https://www.instagram.com/reel/DZk_t-PhVwU/",
    thumbnail: "/work/DZk_t-PhVwU.webp",
    order: 5,
  },
  {
    id: "DYzSViHIiVi",
    title: "Royal Enfield Reveal",
    category: "Brand",
    videoUrl: "https://www.instagram.com/reel/DYzSViHIiVi/",
    thumbnail: "/work/DYzSViHIiVi.webp",
    order: 6,
  },
  {
    id: "DVlMDrKCPji",
    title: "Shiv Jayanti",
    category: "Event",
    videoUrl: "https://www.instagram.com/reel/DVlMDrKCPji/",
    thumbnail: "/work/DVlMDrKCPji.webp",
    order: 7,
  },
  {
    id: "DO6xn5QE0Bv",
    title: "Procession",
    category: "Event",
    videoUrl: "https://www.instagram.com/reel/DO6xn5QE0Bv/",
    thumbnail: "/work/DO6xn5QE0Bv.webp",
    order: 8,
  },
];

export const defaultContent: SiteContent = {
  version: CONTENT_VERSION,
  updatedAt: "2026-08-26T00:00:00.000Z",
  about: {
    heading: "Behind the camera, and in the edit.",
    body: "I shoot and cut everything myself — functions, weddings, events and brand films across Khamgaon and Vidarbha. One person from the first setup to the final export, which means nothing gets lost in a handover.",
    yearsExperience: 5,
    approach:
      "Available light where it works, shaped light where it does not. Cut for pace, graded for mood.",
  },
  contact: {
    phone: "7972505022",
    whatsapp: "917972505022",
    email: "dadukute94@gmail.com",
    location: "Khamgaon, Maharashtra",
    instagram: "jk.visuals_03",
  },
  work,
};
