import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "./test-tools.mjs";
import { serveExport } from "./preview-server.mjs";

// Conservative rendered contrast: remove text paint while retaining geometry,
// photograph the actual composited background, then test every background pixel
// in each text line's rectangle against its original opaque foreground color.
// Including spaces makes the minimum conservative, rather than cherry-picked.
const preview = await serveExport();
const browser = await chromium.launch({ headless: true });
const measurements = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 1,
    });
    await page.goto(preview.url);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "*,*::before,*::after{transition:none!important}",
    });
    const targets = await page.evaluate(() => {
      const result = [];
      for (const selector of [
        "#hero-title",
        ".hero-content > p",
        ".hero .primary-button",
        ".hero-caption",
      ]) {
        const element = document.querySelector(selector);
        if (!element?.getBoundingClientRect().width) continue;
        const style = getComputedStyle(element);
        const color = style.color.match(/[\d.]+/g).map(Number);
        if (color.length > 3 && color[3] !== 1)
          throw new Error("Foreground must be opaque");
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const rectangles = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          rectangles.push(
            ...[...range.getClientRects()].map(({ x, y, width, height }) => ({
              x,
              y,
              width,
              height,
            })),
          );
        }
        const size = parseFloat(style.fontSize),
          weight = Number(style.fontWeight);
        result.push({
          selector,
          color: color.slice(0, 3),
          threshold: size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5,
          rectangles,
        });
        element.style.setProperty("color", "transparent", "important");
      }
      return result;
    });
    const png = (await page.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
    const values = await page.evaluate(
      async ({ png, targets }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const luminance = (rgb) =>
          rgb
            .map((value) => value / 255)
            .map((value) =>
              value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4,
            )
            .reduce(
              (sum, value, index) =>
                sum + value * [0.2126, 0.7152, 0.0722][index],
              0,
            );
        return targets.map(({ selector, color, threshold, rectangles }) => {
          const foreground = luminance(color);
          let minimum = Infinity,
            samples = 0;
          for (const rectangle of rectangles) {
            for (
              let y = Math.max(0, Math.ceil(rectangle.y));
              y <
              Math.min(
                canvas.height,
                Math.floor(rectangle.y + rectangle.height),
              );
              y++
            ) {
              for (
                let x = Math.max(0, Math.ceil(rectangle.x));
                x <
                Math.min(
                  canvas.width,
                  Math.floor(rectangle.x + rectangle.width),
                );
                x++
              ) {
                const index = (y * canvas.width + x) * 4;
                const background = luminance([
                  data[index],
                  data[index + 1],
                  data[index + 2],
                ]);
                minimum = Math.min(
                  minimum,
                  (Math.max(foreground, background) + 0.05) /
                    (Math.min(foreground, background) + 0.05),
                );
                samples++;
              }
            }
          }
          return {
            selector,
            foreground: color,
            minimumRatio: Number(minimum.toFixed(2)),
            requiredRatio: threshold,
            samples,
            passed: minimum >= threshold,
          };
        });
      },
      { png, targets },
    );
    measurements.push({ width, values });
    for (const value of values)
      assert.ok(
        value.passed,
        `${width} ${value.selector}: ${value.minimumRatio}:1 < ${value.requiredRatio}:1`,
      );
    await page.close();
  }
  await mkdir("test/scratch/validation", { recursive: true });
  await writeFile(
    "test/scratch/validation/hero-contrast.json",
    JSON.stringify(
      {
        method:
          "Minimum WCAG 2 contrast over every composited background pixel in text-line rectangles, with text paint removed. Static art, final export, Chromium.",
        measurements,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(measurements, null, 2));
} finally {
  await browser.close();
  await preview.close();
}
