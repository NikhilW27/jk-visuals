import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session. One password from the environment, one signed httpOnly
 * cookie. There is no signup, no user table, and no login link anywhere on
 * the public site — /admin is reachable only by typing the URL.
 */

const COOKIE = "jk_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

/** True when ADMIN_PASSWORD is set. Without it, /admin refuses to sign anyone in. */
export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function sign(expiry: number, secret: string): string {
  return createHmac("sha256", secret).update(String(expiry)).digest("hex");
}

/** Constant-time, and length-independent because both sides are hashed first. */
export function verifyPassword(input: string): boolean {
  const password = adminPassword();
  if (!password) return false;
  return timingSafeEqual(digest(input), digest(password));
}

export async function createSession(): Promise<void> {
  const password = adminPassword();
  if (!password) return;

  const expiry = Date.now() + MAX_AGE_SECONDS * 1000;
  const jar = await cookies();
  jar.set(COOKIE, `${expiry}.${sign(expiry, password)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Verifies the session cookie. Because the password is the signing key,
 * changing ADMIN_PASSWORD invalidates every existing session.
 */
export async function isAuthenticated(): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;

  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [expiryRaw, signature] = raw.split(".");
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || !signature) return false;
  if (Date.now() > expiry) return false;

  const expected = sign(expiry, password);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Throws unless the caller holds a valid session. Guards every mutating action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Not authorised");
  }
}
