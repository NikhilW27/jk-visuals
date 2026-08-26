import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * The display face is committed to the repo rather than fetched at render
 * time. Google serves EOT to old user agents and woff2 to modern ones on some
 * routes, and satori reads neither; a card that renders is worth more than one
 * that depends on a network call succeeding. Instrument Serif is OFL, so
 * redistributing it here is fine.
 */
async function displayFont(): Promise<Buffer | null> {
  try {
    return await readFile(
      path.join(process.cwd(), "src", "app", "fonts", "InstrumentSerif-Regular.ttf"),
    );
  } catch {
    return null;
  }
}

export default async function Image() {
  const [font, still] = await Promise.all([
    displayFont(),
    readFile(path.join(process.cwd(), "public", "og-frame.jpg"))
      .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`)
      .catch(() => null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#050208",
          color: "#f5f3ef",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 700,
            padding: "62px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 17,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(245,243,239,0.55)",
            }}
          >
            <div style={{ width: 42, height: 2, backgroundColor: "#e01b27" }} />
            Videographer &amp; Editor
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: font ? "Display" : undefined,
                fontSize: 118,
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 26,
                fontSize: 27,
                lineHeight: 1.4,
                color: "rgba(245,243,239,0.6)",
                maxWidth: 520,
              }}
            >
              {SITE_TAGLINE}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 17,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(245,243,239,0.4)",
            }}
          >
            <div style={{ display: "flex" }}>@jk.visuals_03</div>
            <div style={{ display: "flex" }}>Khamgaon, IN</div>
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", width: 500 }}>
          {still ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={still}
              alt=""
              width={500}
              height={630}
              style={{ width: 500, height: 630, objectFit: "cover" }}
            />
          ) : null}
          {/* Feathers the still into the panel, same idea as the hero plate. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              backgroundImage:
                "linear-gradient(to right, #050208 0%, rgba(5,2,8,0.85) 22%, rgba(5,2,8,0) 58%)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Display", data: font, style: "normal" as const, weight: 400 as const }]
        : undefined,
    },
  );
}
