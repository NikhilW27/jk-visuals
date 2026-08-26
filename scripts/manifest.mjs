import { writeFile } from "node:fs/promises";
import path from "node:path";

const HEADER = `// AUTO-GENERATED - do not edit by hand.
// Written by scripts/extract-frames.mjs (real footage) or
// scripts/make-placeholder-frames.mjs (procedural stand-in).
import type { SequenceManifest } from "./frame-sequence";
`;

export async function writeManifest(root, manifest) {
  const body = `${HEADER}
const manifest: SequenceManifest = ${JSON.stringify(manifest, null, 2)};

export default manifest;
`;
  const out = path.join(root, "src", "lib", "sequence-manifest.ts");
  await writeFile(out, body, "utf8");
  return out;
}
