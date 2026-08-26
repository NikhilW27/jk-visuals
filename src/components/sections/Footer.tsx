import type { ContactContent } from "@/lib/content/types";

export default function Footer({ contact }: { contact: ContactContent }) {
  return (
    <footer className="shell border-t border-bone/12 py-10 md:py-12">
      <div className="flex flex-col gap-6 font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase md:flex-row md:items-center md:justify-between">
        <p className="text-bone/55">Jayesh Kute</p>

        <nav aria-label="Elsewhere">
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
            <li>
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors duration-300 hover:text-signal"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors duration-300 hover:text-signal"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="transition-colors duration-300 hover:text-signal"
              >
                Email
              </a>
            </li>
          </ul>
        </nav>

        <p>&copy; {new Date().getFullYear()} &mdash; {contact.location}</p>
      </div>
    </footer>
  );
}
