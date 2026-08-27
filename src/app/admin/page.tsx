import type { Metadata } from "next";
import { adminConfigured, isAuthenticated } from "@/lib/auth";
import { readContent, storeMode } from "@/lib/content/store";
import AdminPanel from "./AdminPanel";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Never prerender this route.
 *
 * isAuthenticated() returns early when ADMIN_PASSWORD is unset, without ever
 * touching cookies() — so on a build where the variable is missing, Next sees
 * no dynamic API, statically prerenders the page, and bakes in "signed out".
 * Signing in would then appear to do nothing. The rendering mode of an auth
 * gate must not depend on whether an environment variable happens to be set.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    return <LoginForm configured={adminConfigured()} />;
  }

  const content = await readContent();
  return <AdminPanel initial={content} mode={storeMode()} />;
}
