"use client";

import { useId, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import Magnetic from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";
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

/** 10 digits for an Indian mobile, up to 13 to allow a country code. */
const MIN_DIGITS = 10;
const MAX_DIGITS = 13;

type FieldErrors = Partial<Record<"name" | "phone" | "message", string>>;

/** 2026-08-28 -> 28/08/2026, which is how the date will be read locally. */
function readableDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export default function Contact({ contact }: { contact: ContactContent }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [handedOff, setHandedOff] = useState(false);
  const uid = useId();

  const whatsapp = `https://wa.me/${contact.whatsapp}`;

  /**
   * The enquiry is handed to WhatsApp rather than emailed. window.open is
   * called synchronously inside the submit handler so the browser still counts
   * it as a user gesture — do it after an await and popup blockers eat it.
   */
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();

    // Honeypot. Bots fill every field; humans never see this one.
    if (read("company")) {
      setHandedOff(true);
      return;
    }

    const name = read("name");
    const phone = read("phone");
    const eventType = read("eventType");
    const date = read("date");
    const message = read("message");
    const digits = phone.replace(/\D/g, "");

    const next: FieldErrors = {};
    if (!name) next.name = "Please add your name.";
    if (!phone) next.phone = "Please add a mobile number.";
    else if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
      next.phone = "That does not look like a full mobile number.";
    }
    if (!message) next.message = "Please add a few details.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const lines = [
      "New enquiry from the website",
      "",
      `Name: ${name}`,
      `Mobile: ${phone}`,
      eventType ? `Event: ${eventType}` : null,
      date ? `Date: ${readableDate(date)}` : null,
      "",
      message,
    ].filter((line) => line !== null);

    window.open(
      `${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
    setHandedOff(true);
  };

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
          <form onSubmit={onSubmit} noValidate className="grid gap-10 sm:grid-cols-2">
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
                id={`${uid}-name`}
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${uid}-name-error` : undefined}
                className={`${field} mt-3`}
              />
              {errors.name ? (
                <p id={`${uid}-name-error`} className="mt-2 text-xs text-signal">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-phone`} className={labelStyle}>
                Mobile
              </label>
              <input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
                className={`${field} mt-3`}
              />
              {errors.phone ? (
                <p id={`${uid}-phone-error`} className="mt-2 text-xs text-signal">
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={`${uid}-type`} className={labelStyle}>
                Event type
              </label>
              <select
                id={`${uid}-type`}
                name="eventType"
                defaultValue=""
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
                id={`${uid}-date`}
                name="date"
                type="date"
                className={`${field} mt-3 cursor-pointer`}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-message`} className={labelStyle}>
                Details
              </label>
              <textarea
                id={`${uid}-message`}
                name="message"
                rows={4}
                placeholder="Where it is, roughly how long, and what you have in mind."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? `${uid}-message-error` : undefined
                }
                className={`${field} mt-3 resize-none`}
              />
              {errors.message ? (
                <p
                  id={`${uid}-message-error`}
                  className="mt-2 text-xs text-signal"
                >
                  {errors.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 sm:col-span-2">
              <Magnetic>
                <button
                  type="submit"
                  className="group inline-flex cursor-pointer items-center gap-3 py-1 text-sm tracking-wide text-bone"
                >
                  <span className="relative">
                    Send on WhatsApp
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

              <p
                role="status"
                aria-live="polite"
                className="text-[13px] text-cyan"
              >
                {handedOff
                  ? "WhatsApp is open with your enquiry - press send there to finish."
                  : ""}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-bone/30 sm:col-span-2">
              This opens WhatsApp with your details filled in. Nothing is sent
              until you press send there.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
