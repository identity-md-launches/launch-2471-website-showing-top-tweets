import { copyFile } from "node:fs/promises";
import { chromium } from "./test-tools.mjs";
import { serveExport } from "./preview-server.mjs";

// Render a code-native share composition with the same local artwork and font.
// This does not call an image service or change the original illustration.
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url('/preview/assets/manrope-latin.woff2');font-weight:200 800}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#102017;color:#e8eedf;font-family:Manrope,Arial,sans-serif;overflow:hidden}
.art{position:absolute;inset:0;width:1200px;height:630px;object-fit:cover;object-position:right 42%}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#102017 0%,#102017f2 30%,#10201744 70%,transparent)}
.content{position:relative;padding:54px 60px}.brand{display:flex;align-items:center;gap:12px;font-size:27px;font-weight:700}.brand img{width:42px;height:42px}.brand span{font-weight:400}h1{font-size:76px;line-height:1.08;letter-spacing:-4px;margin:74px 0 24px;max-width:600px}p{font-size:24px;line-height:1.5;margin:0;max-width:480px}.badge{position:absolute;bottom:48px;left:60px;font-size:18px;background:#c1ed72;color:#18250f;padding:12px 20px;border-radius:6px;font-weight:700}
</style><img class="art" src="/preview/assets/ai-pepe-squad.webp" alt=""><div class="shade"></div><div class="content"><div class="brand"><img src="/preview/favicon.svg" alt="">swamp<span>signal.</span></div><h1>Frogs with<br>a hive mind.</h1><p>Top tweets from the<br>IdentityMD community.</p></div><div class="badge">Find your signal.</div></html>`;

const preview = await serveExport({ "/share-card": html });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(new URL("/share-card", preview.url).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "public/assets/social-card.jpg",
    type: "jpeg",
    quality: 88,
  });
  await copyFile(
    "public/assets/social-card.jpg",
    "dist/assets/social-card.jpg",
  );
  console.log(
    "Rendered public/assets/social-card.jpg (1200 × 630) and copied it into dist/.",
  );
} finally {
  await browser?.close();
  await preview.close();
}
