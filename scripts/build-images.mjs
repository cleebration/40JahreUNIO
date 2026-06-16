#!/usr/bin/env node
/**
 * Bild-Pipeline für 40jahreunio
 * --------------------------------------------------------------------------
 * Verarbeitet die Original-Einsendungen (aus Google Drive) zu web-optimierten
 * Bildern in public/werke/<slug>.jpg.
 *
 * VORBEREITUNG (einmalig):
 *   1. Drive-Ordner herunterladen (ZIP) und ALLE Bilddateien nach
 *      ./raw-images/ entpacken. Das Drive-Präfix "<hash>-" darf im Dateinamen
 *      bleiben; es wird automatisch entfernt.
 *   2. Sonderformate werden automatisch umgewandelt, sofern ein Werkzeug da ist:
 *        - PDF  -> "pdftoppm" (poppler-utils)   brew install poppler
 *        - BMP  -> "sips" (auf macOS eingebaut) oder ImageMagick
 *
 * KORREKTUREN (optional, ohne Bildbearbeitung):
 *   Datei  image-fixes.json  im Projektordner. Pro Werk:
 *     - nur drehen:        "<slug>": 180
 *     - drehen + zuschneiden: "<slug>": { "rotate": 90, "trim": true }
 *     - PDF-Beschnitt aus:    "<slug>": { "trim": false }
 *   Den <slug> aus der Adresszeile ablesen:  /werk/<slug>
 *   Drehung in Grad im Uhrzeigersinn: 90, 180 oder 270.
 *   PDFs werden standardmäßig automatisch beschnitten (weißer Rand).
 *
 * AUSFÜHREN:  npm run images
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import sharp from "sharp";
import { WORKS } from "../src/data.js";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "raw-images");
const OUT = path.join(ROOT, "public", "werke");
const FIXES_PATH = path.join(ROOT, "image-fixes.json");

const MAX_EDGE = 1600; // längste Kante
const QUALITY = 82;
const TRIM_THRESHOLD = 18; // Toleranz für "fast weiß" beim Beschneiden

const norm = (s) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/^[0-9a-f]{8,}-/, "") // Drive-Hash-Präfix entfernen
    .trim();

async function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    else out.push(p);
  }
  return out;
}

async function commandExists(cmd, probe = ["-h"]) {
  try {
    await execFileP(cmd, probe);
    return true;
  } catch (e) {
    return e && e.code !== "ENOENT";
  }
}

async function loadFixes() {
  try {
    const raw = JSON.parse(await fs.readFile(FIXES_PATH, "utf8"));
    const out = {};
    for (const [slug, val] of Object.entries(raw)) {
      if (slug.startsWith("_")) continue; // Hinweis-/Beispiel-Felder ignorieren
      if (typeof val === "number") out[slug] = { rotate: val };
      else if (val && typeof val === "object") out[slug] = val;
    }
    return out;
  } catch {
    return {};
  }
}

async function pdfToPng(pdfPath, pdftoppmOk) {
  if (!pdftoppmOk) throw { skip: "pdf" };
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "unio-pdf-"));
  const prefix = path.join(tmp, "page");
  await execFileP("pdftoppm", ["-png", "-r", "150", "-f", "1", "-l", "1", pdfPath, prefix]);
  const files = (await fs.readdir(tmp)).filter((f) => f.endsWith(".png"));
  if (!files.length) throw new Error("pdftoppm: keine Seite erzeugt");
  return path.join(tmp, files[0]);
}

async function bmpToPng(bmpPath, tools) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "unio-bmp-"));
  const out = path.join(tmp, "page.png");
  if (tools.sips) await execFileP("sips", ["-s", "format", "png", bmpPath, "--out", out]);
  else if (tools.magick) await execFileP("magick", [bmpPath, out]);
  else if (tools.convert) await execFileP("convert", [bmpPath, out]);
  else throw { skip: "bmp" };
  return out;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const rawFiles = await walk(RAW);
  const fixes = await loadFixes();

  const index = new Map();
  for (const f of rawFiles) {
    const key = norm(path.basename(f));
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(f);
  }

  const tools = {
    pdftoppm: await commandExists("pdftoppm"),
    sips: await commandExists("sips"),
    magick: await commandExists("magick", ["-version"]),
    convert: await commandExists("convert", ["-version"]),
  };

  const report = {
    matched: [],
    missing: [],
    skipped: [],
    rotated: [],
    trimmed: [],
    generatedAt: new Date().toISOString(),
  };

  for (const w of WORKS) {
    const want = norm(w.file);
    const candidates = index.get(want) || [];
    const src = candidates.shift();
    const target = path.join(OUT, `${w.slug}.jpg`);

    if (!src) {
      report.missing.push({ slug: w.slug, name: w.name, file: w.file });
      continue;
    }

    const ext = src.toLowerCase().slice(src.lastIndexOf("."));
    const fix = fixes[w.slug] || {};
    const rotate = Number(fix.rotate) || 0;
    // PDFs standardmäßig beschneiden; per "trim": false abschaltbar.
    // Andere Formate nur, wenn ausdrücklich "trim": true gesetzt ist.
    const trimThis = ext === ".pdf" ? fix.trim !== false : fix.trim === true;

    try {
      let input = src;
      if (ext === ".pdf") input = await pdfToPng(src, tools.pdftoppm);
      else if (ext === ".bmp") input = await bmpToPng(src, tools);

      // 1) EXIF-Lage anwenden
      let buf = await sharp(input).rotate().toBuffer();
      // 2) manuelle Drehung aus image-fixes.json
      if (rotate % 360 !== 0) {
        buf = await sharp(buf).rotate(rotate).toBuffer();
        report.rotated.push({ slug: w.slug, deg: ((rotate % 360) + 360) % 360 });
      }
      // 3) weißen Rand wegschneiden
      if (trimThis) {
        try {
          buf = await sharp(buf)
            .trim({ background: "#ffffff", threshold: TRIM_THRESHOLD })
            .toBuffer();
          report.trimmed.push({ slug: w.slug });
        } catch {
          /* nichts zu beschneiden – Originalpuffer behalten */
        }
      }
      // 4) skalieren + als JPEG speichern
      await sharp(buf)
        .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(target);

      report.matched.push({ slug: w.slug, from: path.basename(src) });
    } catch (err) {
      if (err && err.skip) {
        report.skipped.push({ slug: w.slug, file: w.file, format: err.skip });
      } else {
        report.missing.push({
          slug: w.slug,
          name: w.name,
          file: w.file,
          error: String((err && err.message) || err),
        });
      }
    }
  }

  await fs.writeFile(path.join(OUT, "_report.json"), JSON.stringify(report, null, 2));

  const pdfSkipped = report.skipped.filter((s) => s.format === "pdf").length;
  const bmpSkipped = report.skipped.filter((s) => s.format === "bmp").length;

  console.log(`\nBilder verarbeitet: ${report.matched.length}/${WORKS.length}`);
  if (report.rotated.length) console.log(`Manuell gedreht: ${report.rotated.length}`);
  if (report.trimmed.length) console.log(`Rand beschnitten: ${report.trimmed.length}`);
  if (pdfSkipped) console.log(`PDFs übersprungen (poppler/pdftoppm fehlt): ${pdfSkipped}`);
  if (bmpSkipped) console.log(`BMP übersprungen (sips/ImageMagick fehlt): ${bmpSkipped}`);
  if (report.missing.length) console.log(`Ohne Quelldatei: ${report.missing.length}`);
  console.log("Details in public/werke/_report.json");
  if (!rawFiles.length) {
    console.log("\nHinweis: ./raw-images/ ist leer. Bilder dorthin entpacken.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
