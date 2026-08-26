"use server";

import { readContent } from "@/lib/content/store";
import type { ContactState, ContactValues } from "./contact-state";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function sendEnquiry(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot. Bots fill every field; humans never see this one.
  if (clean(formData.get("company"), 100)) {
    return { status: "ok", message: "Thanks - I will get back to you shortly." };
  }

  const name = clean(formData.get("name"), 120);
  const email = clean(formData.get("email"), 200);
  const eventType = clean(formData.get("eventType"), 60);
  const date = clean(formData.get("date"), 30);
  const message = clean(formData.get("message"), 4000);

  const values: ContactValues = { name, email, eventType, date, message };
  const stamp = Date.now();

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please add your name.";
  if (!email) fieldErrors.email = "Please add an email.";
  else if (!EMAIL.test(email)) fieldErrors.email = "That email does not look right.";
  if (!message) fieldErrors.message = "Please add a few details.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, values, stamp };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const content = await readContent();

  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY is not set — enquiry not delivered.");
    return {
      status: "error",
      message:
        "The form is not connected yet. Please reach out on WhatsApp or email instead.",
      values,
      stamp,
    };
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    eventType ? `Type: ${eventType}` : null,
    date ? `Date: ${date}` : null,
    "",
    message,
  ].filter(Boolean);

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      // Verify a domain in Resend to send from your own address. Until then
      // onboarding@resend.dev only delivers to the account's own email.
      from: process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: [content.contact.email],
      replyTo: email,
      subject: `New enquiry - ${name}${eventType ? ` (${eventType})` : ""}`,
      text: lines.join("\n"),
    });

    if (error) {
      console.error("[contact] resend rejected the send:", error);
      return {
        status: "error",
        message:
          "Something went wrong sending that. Please try WhatsApp or email.",
        values,
        stamp,
      };
    }
  } catch (error) {
    console.error("[contact] send failed:", error);
    return {
      status: "error",
      message: "Something went wrong sending that. Please try WhatsApp or email.",
      values,
      stamp,
    };
  }

  // No values echoed back on success, so the re-keyed inputs come up empty.
  return {
    status: "ok",
    message: "Thanks - your enquiry is in. I will get back to you shortly.",
    stamp,
  };
}
