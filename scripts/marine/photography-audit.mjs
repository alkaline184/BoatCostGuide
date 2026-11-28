import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

const dir = ".marine-evaluation";
const audit = JSON.parse(await readFile(dir + "/audit.json", "utf8"));
const partial = process.argv.includes("--partial");
if (!audit.complete && !partial)
  throw new Error(
    "Finish the provider evaluation before running the photography audit.",
  );
const sample = audit.photos;
const escape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Private photography audit</title>
<style>body{font:15px system-ui;margin:24px;background:#eef3f1;color:#173841}h1{margin:0}main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}figure{margin:0;background:#fff;padding:12px;border-radius:8px}img{width:100%;height:170px;object-fit:contain;background:#f0f2f2;display:block}figcaption{padding-top:8px;min-height:42px}small{display:block;margin-top:5px}</style>
<h1>Private photography audit</h1><p>Provider-hosted photos · Data by TheBoatDB</p><main>${sample
  .map((row, index) => {
    const url = row.url ? new URL(row.url) : null;
    return `<figure>${url?.origin === "https://cdn.sanity.io" ? `<img src="${escape(url.href)}" referrerpolicy="no-referrer" alt="">` : `<div>No primary photo</div>`}<figcaption><b>${index + 1}. ${escape(row.label)}</b><small>${escape(row.category)} · target ${escape(row.expected)}</small></figcaption></figure>`;
  })
  .join("")}</main></html>`;

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1320, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load", timeout: 60000 });
  const figures = await page.locator("figure").all();
  const fingerprints = new Set();
  const results = [];
  for (const [i, figure] of figures.entries()) {
    const image = figure.locator("img");
    const dimensions = (await image.count())
      ? await image.evaluate((img) => [img.naturalWidth, img.naturalHeight])
      : [0, 0];
    const loaded = dimensions.every((n) => n > 0);
    const hash = loaded
      ? createHash("sha256")
          .update(await image.screenshot())
          .digest("hex")
      : null;
    const duplicate = hash !== null && fingerprints.has(hash);
    if (hash) fingerprints.add(hash);
    const row = sample[i];
    results.push({
      number: i + 1,
      id: row.id,
      category: row.category,
      loaded,
      width: dimensions[0],
      height: dimensions[1],
      usable: loaded && dimensions[0] >= 640 && dimensions[1] >= 360,
      duplicate,
      primary: row.primary,
      gallery: row.gallery,
      alt: row.alt,
      credit: row.credit,
    });
  }
  await page.screenshot({
    path: dir + (partial ? "/contact-sheet-preview.png" : "/contact-sheet.png"),
    fullPage: true,
  });
  await writeFile(
    dir + (partial ? "/photos-preview.json" : "/photos.json"),
    JSON.stringify(results, null, 2),
    {
      mode: 0o600,
    },
  );
  console.log(
    JSON.stringify({
      sample: results.length,
      primary: results.filter((r) => r.primary).length,
      loaded: results.filter((r) => r.loaded).length,
      usable: results.filter((r) => r.usable).length,
      duplicates: results.filter((r) => r.duplicate).length,
      galleries: results.filter((r) => r.gallery > 0).length,
    }),
  );
} finally {
  await browser.close();
}
