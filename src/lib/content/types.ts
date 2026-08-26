export const WORK_CATEGORIES = [
  "Event",
  "Wedding",
  "Brand",
  "Editing",
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export type WorkItem = {
  id: string;
  title: string;
  category: WorkCategory;
  /** Instagram reel or YouTube URL. Loaded only when the lightbox opens. */
  videoUrl: string;
  /** Public path or blob URL. */
  thumbnail: string;
  /** Ascending. Drag-and-drop in the admin rewrites these. */
  order: number;
};

export type AboutContent = {
  heading: string;
  body: string;
  yearsExperience: number;
  approach: string;
};

export type ContactContent = {
  phone: string;
  /** Digits with country code, no punctuation — used to build the wa.me link. */
  whatsapp: string;
  email: string;
  location: string;
  instagram: string;
};

export type SiteContent = {
  /** Bumped when the shape changes, so `normalize` can migrate old blobs. */
  version: number;
  updatedAt: string;
  about: AboutContent;
  contact: ContactContent;
  work: WorkItem[];
};

export const CONTENT_VERSION = 1;
