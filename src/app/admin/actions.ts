"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminConfigured,
  createSession,
  destroySession,
  isAuthenticated,
  verifyPassword,
} from "@/lib/auth";
import { CONTENT_TAG, saveThumbnail, writeContent } from "@/lib/content/store";
import type { SiteContent } from "@/lib/content/types";
import type { LoginState, SaveState } from "./state";

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: "ADMIN_PASSWORD is not set on the server." };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    // Small fixed delay, to make blind guessing tedious.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "Incorrect password." };
  }

  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin");
}

export async function saveContent(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await isAuthenticated())) {
    return { status: "error", message: "Session expired. Reload and sign in again." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "Could not read the edits." };
  }

  try {
    const saved = await writeContent(parsed as SiteContent);
    // updateTag rather than revalidateTag: this is a Server Action, and the
    // admin must read its own write back immediately. The path revalidation
    // drops the rendered public page.
    updateTag(CONTENT_TAG);
    revalidatePath("/");
    return {
      status: "ok",
      message: `Saved. ${saved.work.length} work items live.`,
    };
  } catch (error) {
    console.error("[admin] save failed:", error);
    return { status: "error", message: "Save failed. Check the server logs." };
  }
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadThumbnail(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  if (!(await isAuthenticated())) return { error: "Not authorised." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file chosen." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Images only." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "That image is over 5MB." };
  }

  try {
    return { url: await saveThumbnail(file) };
  } catch (error) {
    console.error("[admin] upload failed:", error);
    return { error: "Upload failed. Check the server logs." };
  }
}
