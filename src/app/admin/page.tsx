import type { Metadata } from "next";
import { adminConfigured, isAuthenticated } from "@/lib/auth";
import { readContent, storeMode } from "@/lib/content/store";
import AdminPanel from "./AdminPanel";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

/** Reads cookies, so it is always dynamic and never cached. */
export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    return <LoginForm configured={adminConfigured()} />;
  }

  const content = await readContent();
  return <AdminPanel initial={content} mode={storeMode()} />;
}
