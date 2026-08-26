"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import SectionHeader from "@/components/SectionHeader";
import Magnetic from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";
import { sendEnquiry } from "@/lib/actions/contact";
import {
  initialContactState,
  type ContactState,
} from "@/lib/actions/contact-state";
import type { ContactContent } from "@/lib/content/types";

const EVENT_TYPES = [
  "Wedding",
  "Function or ceremony",
  "Event",
  "Brand shoot",
  "Editing only",
  "Something else",
];

const field =
  "w-full border-b border-bone/15 bg-transparent pb-3 text-[15px] text-bone outline-none transition-colors duration-300 placeholder:text-bone/25 focus:border-signal";
const labelStyle =
  "block font-mono text-[10px] tracking-[0.22em] text-bone/40 uppercase";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Magnetic>
      <button
        type="submit"
        disabled={pending}
        className="group inline-flex cursor-pointer items-center gap-3 py-1 text-sm tracking-wide text-bone disabled:cursor-wait disabled:text-bone/40"
      >
        <span className="relative">
          {pending ? "Sending" : "Send enquiry"}
          <span className="absolute -bottom-1 left-0 h-px w-full bg-bone/35 transition-colors duration-500 group-hover:bg-signal" />
        </span>
        <span
          aria-hidden="true"
          className="ease-editorial translate-y-px transition-transform duration-500 group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </button>
    </Magnetic>
  );
}

export default function Contact({ contact }: { contact: ContactContent }) {
  const [state, action] = useActionState<ContactState, FormData>(
    sendEnquiry,
    initialContactState,
  );
  const uid = useId();

  // React resets an uncontrolled form once the action resolves, so the inputs
  // are re-keyed on every submit and seeded from whatever came back. On
  // success no values come back, so they come up empty.
  const seed = state.values;
  const k = state.stamp ?? 0;

  const whatsapp = `https://wa.me/${contact.whatsapp}`;

  return (
    <section id="contact" className="shell scroll-mt-8 py-28 md:py-40">
      <SectionHeader index="06" label="Contact" aside={contact.location} />

      <div className="mt-14 grid gap-16 md:mt-20 lg:grid-cols-12 lg:gap-10">
        {/* Direct routes first — most people would rather just message. */}
        <div className="lg:col-span-4">
          <Reveal>
            <h2 className="font-display tracking-display max-w-[12ch] text-[11vw] leading-[0.94] text-balance text-bone md:text-[5vw] lg:text-[3.4vw]">
              Tell me about the day.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="mt-10 space-y-5">
              <li>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <span className={labelStyle}>WhatsApp</span>
                  <span className="mt-1.5 block text-[15px] text-bone/75 transition-colors duration-300 group-hover:text-signal">
                    {contact.phone}
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:+${contact.whatsapp}`} className="group block">
                  <span className={labelStyle}>Phone</span>
                  <span className="mt-1.5 block text-[15px] text-bone/75 transition-colors duration-300 group-hover:text-signal">
                    +{contact.whatsapp}
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="group block">
                  <span className={labelStyle}>Email</span>
                  <span className="mt-1.5 block break-all text-[15px] text-bone/75 transition-colors duration-300 group-hover:text-signal">
                    {contact.email}
                  </span>
                </a>
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.14}>
          <form action={action} className="grid gap-10 sm:grid-cols-2">
            {/* Honeypot: off-screen, not hidden, so bots still fill it. */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor={`${uid}-company`}>Company</label>
              <input
                id={`${uid}-company`}
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor={`${uid}-name`} className={labelStyle}>
                Name
              </label>
              <input
                key={`name-${k}`}
                id={`${uid}-name`}
                name="name"
                defaultValue={seed?.name ?? ""}
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={Boolean(state.fieldErrors?.name)}
                aria-describedby={
                  state.fieldErrors?.name ? `${uid}-name-error` : undefined
                }
                className={`${field} mt-3`}
              />
              {state.fieldErrors?.name ? (
                <p id={`${uid}-name-error`} className="mt-2 text-xs text-signal">
                  {state.fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-email`} className={labelStyle}>
                Email
              </label>
              <input
                key={`email-${k}`}
                id={`${uid}-email`}
                name="email"
                defaultValue={seed?.email ?? ""}
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={
                  state.fieldErrors?.email ? `${uid}-email-error` : undefined
                }
                className={`${field} mt-3`}
              />
              {state.fieldErrors?.email ? (
                <p id={`${uid}-email-error`} className="mt-2 text-xs text-signal">
                  {state.fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-type`} className={labelStyle}>
                Event type
              </label>
              <select
                key={`type-${k}`}
                id={`${uid}-type`}
                name="eventType"
                defaultValue={seed?.eventType ?? ""}
                className={`${field} mt-3 cursor-pointer`}
              >
                <option value="" className="bg-ink">
                  Select one
                </option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-ink">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${uid}-date`} className={labelStyle}>
                Date
              </label>
              <input
                key={`date-${k}`}
                id={`${uid}-date`}
                name="date"
                defaultValue={seed?.date ?? ""}
                type="date"
                className={`${field} mt-3 cursor-pointer`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-message`} className={labelStyle}>
                Details
              </label>
              <textarea
                key={`message-${k}`}
                id={`${uid}-message`}
                name="message"
                defaultValue={seed?.message ?? ""}
                required
                rows={4}
                placeholder="Where it is, roughly how long, and what you have in mind."
                aria-invalid={Boolean(state.fieldErrors?.message)}
                aria-describedby={
                  state.fieldErrors?.message ? `${uid}-message-error` : undefined
                }
                className={`${field} mt-3 resize-none`}
              />
              {state.fieldErrors?.message ? (
                <p
                  id={`${uid}-message-error`}
                  className="mt-2 text-xs text-signal"
                >
                  {state.fieldErrors.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <Submit />
              <p
                role="status"
                aria-live="polite"
                className={`text-[13px] ${
                  state.status === "ok" ? "text-cyan" : "text-signal"
                }`}
              >
                {state.message}
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
