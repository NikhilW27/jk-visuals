import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent } from "./defaults";
import {
  CONTENT_VERSION,
  WORK_CATEGORIES,
  type SiteContent,
  type WorkCategory,
  type WorkItem,
} from "./types";

/**
 * Content store.
 *
 * Production runs on Vercel Blob: a single `content.json` plus uploaded
 * thumbnails, both served from the CDN. Vercel's filesystem is read-only and
 * ephemeral, so a JSON file in the repo could never be written to from /admin
 * — the blob is what makes the panel work without a redeploy.
 *
 * Local development, and any environment without BLOB_READ_WRITE_TOKEN, falls
 * back to `content/content.json` on disk so the site runs with no setup.
 */

const BLOB_KEY = "content.json";
const LOCAL_FILE = path.join(process.cwd(), "content", "content.json");
const LOCAL_UPLOADS = path.join(process.cwd(), "public", "work");

/** Cache tag; the admin revalidates this after a write so edits show at once. */
export const CONTENT_TAG = "site-content";

/**
 * Vercel lets you pick the env-var prefix when connecting a Blob store, so the
 * token is not always called BLOB_READ_WRITE_TOKEN — pick a prefix of
 * "AdminPower" and you get AdminPower_READ_WRITE_TOKEN instead. Rather than
 * hardcode one name and fail silently into the on-disk fallback, find whatever
 * the connection actually created.
 */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_READ_WRITE_TOKEN") && value) return value;
  }
  return undefined;
}

/** Connected projects can also authenticate over OIDC, with no token at all. */
function hasBlobStore(): boolean {
  return Object.keys(process.env).some((key) => key.endsWith("_STORE_ID"));
}

function usingBlob(): boolean {
  return Boolean(blobToken()) || hasBlobStore();
}

function isCategory(value: unknown): value is WorkCategory {
  return WORK_CATEGORIES.includes(value as WorkCategory);
}

/**
 * Merges whatever came out of the store onto the defaults, so a partial,
 * hand-edited, or older payload can never take the public page down.
 */
export function normalize(raw: unknown): SiteContent {
  const input = (raw ?? {}) as Partial<SiteContent>;

  const work: WorkItem[] = Array.isArray(input.work)
    ? input.work
        .filter(
          (item): item is WorkItem =>
            Boolean(item) &&
            typeof item.id === "string" &&
            typeof item.videoUrl === "string",
        )
        .map((item, index) => ({
          id: item.id,
          title: typeof item.title === "string" ? item.title : "Untitled",
          category: isCategory(item.category) ? item.category : "Event",
          videoUrl: item.videoUrl,
          thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : "",
          order: Number.isFinite(item.order) ? Number(item.order) : index,
        }))
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index }))
    : defaultContent.work;

  return {
    version: CONTENT_VERSION,
    updatedAt:
      typeof input.updatedAt === "string"
        ? input.updatedAt
        : defaultContent.updatedAt,
    about: { ...defaultContent.about, ...(input.about ?? {}) },
    contact: { ...defaultContent.contact, ...(input.contact ?? {}) },
    work,
  };
}

async function readFromBlob(): Promise<SiteContent> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 1, token: blobToken() });
  const blob = blobs.find((b) => b.pathname === BLOB_KEY);
  if (!blob) return defaultContent;

  const res = await fetch(blob.url, {
    next: { revalidate: 60, tags: [CONTENT_TAG] },
  });
  if (!res.ok) throw new Error(`blob fetch failed: ${res.status}`);
  return normalize(await res.json());
}

async function readFromDisk(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf8");
    return normalize(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // First run: materialise the seed so it is editable straight away.
      await writeToDisk(defaultContent);
      return defaultContent;
    }
    throw error;
  }
}

/** Never throws. A broken store falls back to the seed rather than 500ing. */
export async function readContent(): Promise<SiteContent> {
  try {
    return usingBlob() ? await readFromBlob() : await readFromDisk();
  } catch (error) {
    console.error("[content] read failed, serving defaults:", error);
    return defaultContent;
  }
}

async function writeToDisk(content: SiteContent): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

export async function writeContent(next: SiteContent): Promise<SiteContent> {
  const content = normalize({ ...next, updatedAt: new Date().toISOString() });

  if (usingBlob()) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_KEY, `${JSON.stringify(content, null, 2)}\n`, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      token: blobToken(),
    });
  } else {
    await writeToDisk(content);
  }

  return content;
}

const SAFE_NAME = /[^a-zA-Z0-9._-]/g;

/**
 * Stores an uploaded thumbnail and returns the URL to reference it by.
 * On blob that is an absolute CDN URL; locally it is a /work path.
 */
export async function saveThumbnail(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").replace(SAFE_NAME, "");
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(SAFE_NAME, "-")
    .slice(0, 60);
  const name = `${base || "thumb"}-${Date.now()}.${ext || "jpg"}`;

  if (usingBlob()) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`work/${name}`, file, {
      access: "public",
      contentType: file.type || undefined,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: blobToken(),
    });
    return url;
  }

  await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(LOCAL_UPLOADS, name), bytes);
  return `/work/${name}`;
}

/** True when writes land in Vercel Blob rather than the local filesystem. */
export function storeMode(): "blob" | "disk" {
  return usingBlob() ? "blob" : "disk";
}
