import Hero from "@/components/hero/Hero";
import Work from "@/components/sections/Work";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import InstagramBlock from "@/components/sections/InstagramBlock";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import { readContent } from "@/lib/content/store";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export default async function Home() {
  const content = await readContent();
  const { about, contact, work } = content;

  // LocalBusiness, so a link shared out of the Instagram bio resolves to a
  // real business with a service area rather than an anonymous page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: SITE_NAME,
    alternateName: "JK Visuals",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    telephone: `+${contact.whatsapp}`,
    email: contact.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Khamgaon",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Khamgaon" },
      { "@type": "AdministrativeArea", name: "Buldhana" },
      { "@type": "AdministrativeArea", name: "Vidarbha" },
      { "@type": "AdministrativeArea", name: "Maharashtra" },
    ],
    sameAs: [`https://instagram.com/${contact.instagram}`],
    knowsAbout: [
      "Wedding videography",
      "Event videography",
      "Brand films",
      "Video editing",
    ],
    makesOffer: [
      "Event Films",
      "Wedding Films",
      "Brand Content",
      "Video Editing",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Static, author-controlled object — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        <Hero />
        <Work items={work} />
        <Services />
        <About about={about} />
        <InstagramBlock handle={contact.instagram} />
        <Contact contact={contact} />
      </main>

      <Footer contact={contact} />
    </>
  );
}
