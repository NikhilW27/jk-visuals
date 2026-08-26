"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { logout, saveContent, uploadThumbnail } from "./actions";
import { initialSaveState, type SaveState } from "./state";
import { WORK_CATEGORIES, type SiteContent, type WorkItem } from "@/lib/content/types";
import { videoId } from "@/lib/video";

const label =
  "block font-mono text-[10px] tracking-[0.22em] text-bone/40 uppercase";
const input =
  "mt-2 w-full border-b border-bone/15 bg-transparent pb-2 text-[14px] text-bone outline-none transition-colors duration-300 placeholder:text-bone/20 focus:border-signal";
const ghostButton =
  "cursor-pointer font-mono text-[10px] tracking-[0.22em] uppercase transition-colors duration-300";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="cursor-pointer border border-bone/20 px-5 py-2.5 font-mono text-[10px] tracking-[0.22em] text-bone uppercase transition-colors duration-300 hover:border-signal hover:text-signal disabled:cursor-default disabled:border-bone/10 disabled:text-bone/25"
    >
      {pending ? "Saving" : dirty ? "Save changes" : "Saved"}
    </button>
  );
}

export default function AdminPanel({
  initial,
  mode,
}: {
  initial: SiteContent;
  mode: "blob" | "disk";
}) {
  const [draft, setDraft] = useState<SiteContent>(initial);
  const [state, action] = useActionState<SaveState, FormData>(
    saveContent,
    initialSaveState,
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  // State, not a ref: this is read during render to decide the Save button.
  const [baseline] = useState(() => JSON.stringify(initial));
  const payload = useMemo(() => JSON.stringify(draft), [draft]);
  const dirty = payload !== baseline && state.status !== "ok";

  const setWork = (next: WorkItem[]) =>
    setDraft((prev) => ({
      ...prev,
      work: next.map((item, index) => ({ ...item, order: index })),
    }));

  const patchItem = (id: string, patch: Partial<WorkItem>) =>
    setWork(draft.work.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.work.length || from === to) return;
    const next = [...draft.work];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setWork(next);
  };

  const addItem = () => {
    setWork([
      {
        id: `new-${Date.now()}`,
        title: "",
        category: "Event",
        videoUrl: "",
        thumbnail: "",
        order: 0,
      },
      ...draft.work,
    ]);
  };

  const onPickFile = async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(id);
    const body = new FormData();
    body.append("file", file);
    const result = await uploadThumbnail(body);
    setUploading(null);
    if (result.error) setUploadError(result.error);
    else if (result.url) patchItem(id, { thumbnail: result.url });
  };

  return (
    <main className="shell py-12 md:py-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-bone/12 pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase">
            JK Visuals &mdash; storing to {mode === "blob" ? "Vercel Blob" : "local disk"}
          </p>
          <h1 className="font-display tracking-display mt-2 text-3xl text-bone">
            Admin
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={`${ghostButton} text-bone/45 hover:text-bone`}
          >
            View site &#8599;
          </a>
          <form action={logout}>
            <button type="submit" className={`${ghostButton} text-bone/45 hover:text-signal`}>
              Sign out
            </button>
          </form>
          <form action={action} className="flex items-center gap-5">
            <input type="hidden" name="payload" value={payload} />
            {state.message ? (
              <span
                role="status"
                aria-live="polite"
                className={`font-mono text-[10px] tracking-[0.22em] uppercase ${
                  state.status === "ok" ? "text-cyan" : "text-signal"
                }`}
              >
                {state.message}
              </span>
            ) : null}
            <SaveButton dirty={dirty} />
          </form>
        </div>
      </div>

      {/* Work */}
      <section className="pt-12">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-bone/50 uppercase">
            Work &mdash; {draft.work.length} items
          </h2>
          <button
            type="button"
            onClick={addItem}
            className={`${ghostButton} text-bone/60 hover:text-signal`}
          >
            + Add item
          </button>
        </div>

        <p className="mt-3 text-xs text-bone/30">
          Drag a row to reorder, or use the arrow buttons. Order here is the
          order on the site.
        </p>
        {uploadError ? (
          <p role="alert" className="mt-3 text-xs text-signal">
            {uploadError}
          </p>
        ) : null}

        <ul className="mt-8 space-y-px">
          {draft.work.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={(event) => {
                dragFrom.current = index;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                const from = dragFrom.current;
                if (from === null || from === index) return;
                move(from, index);
                dragFrom.current = index;
              }}
              onDragEnd={() => {
                dragFrom.current = null;
              }}
              className="grid cursor-grab grid-cols-[auto_4rem_1fr] items-start gap-5 border-t border-bone/10 py-6 active:cursor-grabbing"
            >
              {/* Order controls: drag is not keyboard accessible, so these are
                  the real control and the drag handle is the shortcut. */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] text-bone/25 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move ${item.title || "item"} up`}
                  className="cursor-pointer px-1 text-bone/40 transition-colors hover:text-signal disabled:text-bone/10"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === draft.work.length - 1}
                  aria-label={`Move ${item.title || "item"} down`}
                  className="cursor-pointer px-1 text-bone/40 transition-colors hover:text-signal disabled:text-bone/10"
                >
                  &#9660;
                </button>
              </div>

              <div className="aspect-[3/4] w-16 overflow-hidden bg-ink-lift">
                {item.thumbnail ? (
                  // Arbitrary URLs from uploads; next/image would need each
                  // host allowlisted, and this is an internal preview.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={label} htmlFor={`title-${item.id}`}>
                    Title
                  </label>
                  <input
                    id={`title-${item.id}`}
                    value={item.title}
                    onChange={(event) =>
                      patchItem(item.id, { title: event.target.value })
                    }
                    placeholder="Untitled"
                    className={input}
                  />
                </div>

                <div>
                  <label className={label} htmlFor={`category-${item.id}`}>
                    Category
                  </label>
                  <select
                    id={`category-${item.id}`}
                    value={item.category}
                    onChange={(event) =>
                      patchItem(item.id, {
                        category: event.target.value as WorkItem["category"],
                      })
                    }
                    className={`${input} cursor-pointer`}
                  >
                    {WORK_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="bg-ink">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={label} htmlFor={`url-${item.id}`}>
                    Video URL
                    {item.videoUrl && !videoId(item.videoUrl) ? (
                      <span className="ml-3 text-signal normal-case">
                        not a recognised Instagram or YouTube link
                      </span>
                    ) : null}
                  </label>
                  <input
                    id={`url-${item.id}`}
                    value={item.videoUrl}
                    onChange={(event) =>
                      patchItem(item.id, { videoUrl: event.target.value })
                    }
                    placeholder="https://www.instagram.com/reel/..."
                    className={input}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label} htmlFor={`thumb-${item.id}`}>
                    Thumbnail
                  </label>
                  <input
                    id={`thumb-${item.id}`}
                    value={item.thumbnail}
                    onChange={(event) =>
                      patchItem(item.id, { thumbnail: event.target.value })
                    }
                    placeholder="/work/example.webp or an uploaded URL"
                    className={input}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-6">
                    <label
                      className={`${ghostButton} text-bone/50 hover:text-bone`}
                    >
                      {uploading === item.id ? "Uploading..." : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          onPickFile(item.id, event.target.files?.[0])
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setWork(draft.work.filter((w) => w.id !== item.id))
                      }
                      className={`${ghostButton} text-bone/30 hover:text-signal`}
                    >
                      Delete item
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* About */}
      <section className="mt-16 border-t border-bone/12 pt-12">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-bone/50 uppercase">
          About
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={label} htmlFor="about-heading">
              Heading
            </label>
            <input
              id="about-heading"
              value={draft.about.heading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  about: { ...draft.about, heading: event.target.value },
                })
              }
              className={input}
            />
          </div>
          <div className="md:col-span-2">
            <label className={label} htmlFor="about-body">
              Body
            </label>
            <textarea
              id="about-body"
              rows={4}
              value={draft.about.body}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  about: { ...draft.about, body: event.target.value },
                })
              }
              className={`${input} resize-none`}
            />
          </div>
          <div className="md:col-span-2">
            <label className={label} htmlFor="about-approach">
              Approach
            </label>
            <textarea
              id="about-approach"
              rows={2}
              value={draft.about.approach}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  about: { ...draft.about, approach: event.target.value },
                })
              }
              className={`${input} resize-none`}
            />
          </div>
          <div>
            <label className={label} htmlFor="about-years">
              Years of experience
            </label>
            <input
              id="about-years"
              type="number"
              min={0}
              max={70}
              value={draft.about.yearsExperience}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  about: {
                    ...draft.about,
                    yearsExperience: Number(event.target.value) || 0,
                  },
                })
              }
              className={input}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mt-16 border-t border-bone/12 pt-12">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-bone/50 uppercase">
          Contact
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {(
            [
              ["phone", "Phone (displayed)"],
              ["whatsapp", "WhatsApp (country code, digits only)"],
              ["email", "Email"],
              ["location", "Location"],
              ["instagram", "Instagram handle (no @)"],
            ] as const
          ).map(([key, text]) => (
            <div key={key}>
              <label className={label} htmlFor={`contact-${key}`}>
                {text}
              </label>
              <input
                id={`contact-${key}`}
                value={draft.contact[key]}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    contact: { ...draft.contact, [key]: event.target.value },
                  })
                }
                className={input}
              />
            </div>
          ))}
        </div>
      </section>

      <p className="mt-16 border-t border-bone/12 pt-6 font-mono text-[10px] tracking-[0.22em] text-bone/25 uppercase">
        Last saved {new Date(draft.updatedAt).toLocaleString()}
      </p>
    </main>
  );
}
