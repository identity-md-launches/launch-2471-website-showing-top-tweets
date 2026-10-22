import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit, AxeBuilder } from "./test-tools.mjs";
import { serveExport } from "./preview-server.mjs";

const output = "test/scratch/validation";
await mkdir(output, { recursive: true });
const preview = await serveExport();
const results = [];
const engines = process.argv.includes("--webkit")
  ? [
      ["chromium", chromium],
      ["webkit", webkit],
    ]
  : [["chromium", chromium]];
let failed = false;

async function check(engine, name, operation) {
  try {
    const detail = await operation();
    results.push({ engine, name, passed: true, ...(detail ? { detail } : {}) });
    console.log(`PASS ${engine}: ${name}`);
  } catch (error) {
    failed = true;
    results.push({ engine, name, passed: false, error: error.message });
    console.error(`FAIL ${engine}: ${name}: ${error.message}`);
  }
}

for (const [name, launcher] of engines) {
  let browser;
  try {
    browser = await launcher.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [],
      badResponses = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(preview.url))
        badResponses.push(`${response.status()} ${response.url()}`);
    });
    const card = () => page.locator(".post-card");
    const search = () =>
      page.getByRole("searchbox", { name: "Search posts, people or topics" });
    const filter = (topic) =>
      page
        .locator(".topic-filters")
        .getByRole("button", { name: topic, exact: true });
    async function load(hash = "") {
      await page.goto(preview.url + hash);
      await page.locator(".post-card, .empty-state").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
    }
    await load();

    await check(
      name,
      "production export loads at a gateway subpath",
      async () => {
        assert.equal(await card().count(), 3);
        assert.match(await page.title(), /Top IdentityMD tweets/);
        assert.match(
          await page.locator(".results-toolbar").innerText(),
          /6 posts to explore/,
        );
      },
    );
    await check(
      name,
      "390px first screen contains a post and its primary action",
      async () => {
        const post = await card().first().boundingBox();
        const action = await card()
          .first()
          .getByRole("link", { name: /Read on X/ })
          .boundingBox();
        assert.ok(post.y < 844);
        assert.ok(
          action.y + action.height <= 844,
          `Read on X ends at ${action.y + action.height}px`,
        );
        return {
          firstPostTop: post.y,
          readActionBottom: action.y + action.height,
        };
      },
    );
    await check(
      name,
      "responsive reflow at 320, 390, 560, 760, 900, 1100 and 1440px",
      async () => {
        const sizes = [];
        for (const width of [320, 390, 560, 760, 900, 1100, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const measured = await page.evaluate(() => ({
            viewport: innerWidth,
            document: document.documentElement.scrollWidth,
          }));
          assert.ok(measured.document <= width, JSON.stringify(measured));
          sizes.push(measured);
        }
        return sizes;
      },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await check(
      name,
      "all four topic filters use the complete collection",
      async () => {
        for (const [topic, count] of [
          ["AI agents", 3],
          ["Building", 2],
          ["Community", 3],
          ["Memes", 1],
        ]) {
          await filter(topic).click();
          assert.equal(await card().count(), count);
          assert.equal(
            await filter(topic).getAttribute("aria-pressed"),
            "true",
          );
        }
        await filter("All posts").click();
      },
    );
    await check(
      name,
      "search finds an author beyond the first page",
      async () => {
        await search().fill("Cryptamurai");
        assert.equal(await card().count(), 1);
        assert.match(await card().innerText(), /Cryptamurai/);
      },
    );
    await check(
      name,
      "search ignores accents and combines words and topics",
      async () => {
        await search().fill("damian");
        assert.equal(await card().count(), 1);
        assert.match(await card().innerText(), /Damián Et/);
        await search().fill("AI network");
        await filter("AI agents").click();
        assert.equal(await card().count(), 1);
        assert.match(await card().innerText(), /Meme Indexer/);
      },
    );
    await check(
      name,
      "empty search explains recovery and clear resets both filters",
      async () => {
        await search().fill("nothing_matches_98421");
        assert.equal(await card().count(), 0);
        assert.match(
          await page.locator(".empty-state").innerText(),
          /No signals found/,
        );
        await page
          .locator(".empty-state")
          .getByRole("button", { name: "Clear filters" })
          .click();
        assert.equal(await search().inputValue(), "");
        assert.equal(
          await filter("All posts").getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(await card().count(), 3);
      },
    );
    await check(name, "newest sort and show-more work together", async () => {
      await page
        .getByRole("combobox", { name: "Sort posts" })
        .selectOption("newest");
      assert.equal(
        await card().first().getAttribute("data-post-id"),
        "2090762111030817073",
      );
      await page.getByRole("button", { name: "Show 3 more posts" }).click();
      assert.equal(await card().count(), 6);
      await page
        .getByRole("combobox", { name: "Sort posts" })
        .selectOption("picks");
      assert.equal(await card().count(), 3);
      assert.equal(
        await card().first().getAttribute("data-post-id"),
        "2090686744920481869",
      );
    });
    await check(
      name,
      "post context expands and exposes its source",
      async () => {
        const first = card().first();
        await first.locator("summary").click();
        assert.equal(await first.locator("details").getAttribute("open"), "");
        assert.match(
          await first.locator("details").innerText(),
          /author’s perspective/,
        );
        assert.equal(
          await first
            .getByRole("link", { name: /View source preview/ })
            .getAttribute("href"),
          "https://zamantika.com/MemeIndexer/status/2090686744920481869",
        );
        await first.locator("summary").click();
      },
    );
    await check(
      name,
      "original post action dispatches the correct URL in a new tab",
      async () => {
        await context.route("https://x.com/**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<title>External navigation test</title>",
          }),
        );
        const [popup] = await Promise.all([
          page.waitForEvent("popup"),
          card()
            .first()
            .getByRole("link", { name: /Read on X/ })
            .click(),
        ]);
        await popup.waitForLoadState();
        assert.equal(
          popup.url(),
          "https://x.com/MemeIndexer/status/2090686744920481869",
        );
        await popup.close();
      },
    );
    await check(
      name,
      "bookmark saves, persists on reload, and removes in Saved",
      async () => {
        await card()
          .first()
          .getByRole("button", {
            name: "Save post from Meme Indexer",
            exact: true,
          })
          .click();
        assert.equal(
          await card()
            .first()
            .getByRole("button", {
              name: "Remove saved post from Meme Indexer",
            })
            .getAttribute("aria-pressed"),
          "true",
        );
        await page
          .getByRole("button", { name: "Saved posts, 1", exact: true })
          .click();
        assert.equal(await card().count(), 1);
        assert.equal(await page.locator(".hero").count(), 0);
        await page.reload();
        await card().first().waitFor();
        assert.equal(await card().count(), 1);
        await card()
          .first()
          .getByRole("button", { name: "Remove saved post from Meme Indexer" })
          .click();
        assert.equal(await card().count(), 0);
        assert.match(
          await page.locator(".empty-state").innerText(),
          /Keep a little signal/,
        );
        await page
          .locator(".empty-state")
          .getByRole("button", { name: "Explore the feed" })
          .click();
      },
    );
    if (name === "chromium") {
      await check(
        name,
        "copy link writes the original URL to the clipboard",
        async () => {
          await context.grantPermissions(["clipboard-read", "clipboard-write"]);
          await card()
            .first()
            .getByRole("button", { name: "Copy link to Meme Indexer’s post" })
            .click();
          assert.equal(
            await page.evaluate(() => navigator.clipboard.readText()),
            "https://x.com/MemeIndexer/status/2090686744920481869",
          );
          assert.equal(
            await card()
              .first()
              .getByRole("button", { name: "Copy link to Meme Indexer’s post" })
              .getAttribute("title"),
            "Link copied",
          );
        },
      );
    }
    await check(name, "bookmarks synchronize between tabs", async () => {
      const other = await context.newPage();
      await other.goto(preview.url);
      await other.locator(".post-card").first().waitFor();
      await card()
        .first()
        .getByRole("button", {
          name: "Save post from Meme Indexer",
          exact: true,
        })
        .click();
      await other
        .getByRole("button", { name: "Saved posts, 1", exact: true })
        .waitFor();
      await card()
        .first()
        .getByRole("button", { name: "Remove saved post from Meme Indexer" })
        .click();
      await other
        .getByRole("button", { name: "Saved posts", exact: true })
        .waitFor();
      await other.close();
    });
    await check(
      name,
      "about dialog traps focus, closes with Escape and restores focus",
      async () => {
        const trigger = page
          .getByRole("button", { name: "About this feed", exact: true })
          .first();
        await trigger.click();
        assert.equal(
          await page.locator("dialog").evaluate((dialog) => dialog.open),
          true,
        );
        for (let step = 0; step < 4; step++) {
          await page.keyboard.press("Tab");
          assert.equal(
            await page.evaluate(() =>
              Boolean(document.activeElement.closest("dialog")),
            ),
            true,
          );
        }
        await page.keyboard.press("Escape");
        assert.equal(
          await page.locator("dialog").evaluate((dialog) => dialog.open),
          false,
        );
        assert.equal(
          await trigger.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        );
      },
    );
    await check(
      name,
      "keyboard skip link and Enter activate the feed controls",
      async () => {
        await load();
        await page.keyboard.press("Tab");
        assert.equal(
          await page
            .locator(".skip-link")
            .evaluate((element) => element === document.activeElement),
          true,
        );
        await page.screenshot({
          animations: "disabled",
          path: `${output}/${name}-keyboard-focus.png`,
        });
        await page.keyboard.press("Enter");
        assert.equal(
          await page
            .locator("#feed")
            .evaluate((element) => element === document.activeElement),
          true,
        );
        await filter("Memes").focus();
        await page.keyboard.press("Enter");
        assert.equal(await card().count(), 1);
        await filter("All posts").click();
      },
    );
    await check(
      name,
      "reduced motion disables transitions and continuous animation",
      async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
          await page
            .locator(".topic-filter")
            .first()
            .evaluate(
              (element) => getComputedStyle(element).transitionDuration,
            ),
          "0s",
        );
        assert.equal(
          await page.evaluate(
            () =>
              document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.effect?.getTiming().iterations === Infinity,
                ).length,
          ),
          0,
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
      },
    );
    await check(
      name,
      "share image, favicon, font and artwork load locally",
      async () => {
        const dimensions = await page.evaluate(async () => {
          const src = document.querySelector(
            'meta[property="og:image"]',
          ).content;
          const image = new Image();
          image.src = new URL(src, location.href).href;
          await image.decode();
          return [image.naturalWidth, image.naturalHeight];
        });
        assert.deepEqual(dimensions, [1200, 630]);
        assert.equal(
          await page.evaluate(
            () =>
              document.fonts.check("400 16px Manrope") &&
              document.fonts.check("700 16px Manrope"),
          ),
          true,
        );
        for (const path of [
          "favicon.svg",
          "assets/ai-pepe-squad.webp",
          "assets/manrope-latin.woff2",
        ])
          assert.equal(
            (await page.request.get(preview.url + path)).status(),
            200,
          );
      },
    );
    await check(name, "automated WCAG A/AA scan: feed and about", async () => {
      const audits = [];
      for (const state of ["feed", "about"]) {
        if (state === "about")
          await page
            .getByRole("button", { name: "About this feed", exact: true })
            .first()
            .click();
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        audits.push({
          state,
          violations: audit.violations.map(({ id, nodes }) => ({
            id,
            elements: nodes.map((node) => node.target),
          })),
          incomplete: audit.incomplete.map(({ id }) => id),
        });
        assert.deepEqual(audits.at(-1).violations, []);
        if (state === "about") await page.keyboard.press("Escape");
      }
      return audits;
    });
    await check(
      name,
      "200% text enlargement remains in the viewport",
      async () => {
        await page.addStyleTag({ content: "html{font-size:200% !important}" });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Horizontal overflow with enlarged text",
        );
        await page.screenshot({
          animations: "disabled",
          path: `${output}/${name}-text-200.png`,
          fullPage: true,
        });
        await page.reload();
      },
    );
    await check(
      name,
      "no runtime errors or failed production resources",
      async () => {
        assert.deepEqual(errors, []);
        assert.deepEqual(badResponses, []);
      },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await load();
    await page.screenshot({
      animations: "disabled",
      path: `${output}/${name}-390.png`,
      fullPage: true,
    });
    await page.screenshot({
      animations: "disabled",
      path: `${output}/${name}-390-first.png`,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      animations: "disabled",
      path: `${output}/${name}-1440.png`,
      fullPage: true,
    });
    await page.screenshot({
      animations: "disabled",
      path: `${output}/${name}-1440-first.png`,
    });

    await check(
      name,
      "clipboard denial has a focused, selectable manual fallback",
      async () => {
        const fallback = await browser.newContext();
        await fallback.addInitScript(() =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async () => {
                throw new Error("Denied for validation");
              },
            },
          }),
        );
        const fallbackPage = await fallback.newPage();
        await fallbackPage.goto(preview.url);
        await fallbackPage
          .getByRole("button", { name: "Copy link to Meme Indexer’s post" })
          .click();
        const input = fallbackPage.locator(".manual-copy input");
        assert.equal(
          await input.inputValue(),
          "https://x.com/MemeIndexer/status/2090686744920481869",
        );
        await fallbackPage.waitForFunction(() => {
          const element = document.querySelector(".manual-copy input");
          return (
            element === document.activeElement &&
            element.selectionEnd === element.value.length
          );
        });
        assert.equal(
          await input.evaluate(
            (element) =>
              element === document.activeElement &&
              element.selectionEnd === element.value.length,
          ),
          true,
        );
        await fallback.close();
      },
    );
    await check(
      name,
      "unavailable browser storage keeps bookmarks usable for the visit",
      async () => {
        const denied = await browser.newContext();
        await denied.addInitScript(() => {
          Storage.prototype.setItem = () => {
            throw new DOMException("Denied for validation", "SecurityError");
          };
        });
        const deniedPage = await denied.newPage();
        await deniedPage.goto(preview.url);
        await deniedPage
          .getByRole("button", {
            name: "Save post from Meme Indexer",
            exact: true,
          })
          .click();
        assert.match(
          await deniedPage.locator(".storage-note").innerText(),
          /last for this visit/,
        );
        await deniedPage
          .getByRole("button", { name: "Saved posts, 1", exact: true })
          .click();
        assert.equal(await deniedPage.locator(".post-card").count(), 1);
        await denied.close();
      },
    );
    await check(
      name,
      "malformed stored bookmarks recover without crashing",
      async () => {
        await page.evaluate(() =>
          localStorage.setItem("swamp-signal:saved:v1", "{malformed"),
        );
        await load("#saved");
        assert.equal(await card().count(), 0);
        assert.match(
          await page.locator(".empty-state").innerText(),
          /Save a post/,
        );
      },
    );
    await context.close();
  } catch (error) {
    failed = true;
    results.push({
      engine: name,
      name: "browser execution",
      passed: false,
      error: error.message,
    });
    console.error(`${name}: ${error.message}`);
  } finally {
    await browser?.close();
  }
}
await preview.close();
await writeFile(
  `${output}/results.json`,
  JSON.stringify({ urlPath: "/preview/", results }, null, 2) + "\n",
);
console.log(
  `${results.filter((result) => result.passed).length}/${results.length} checks passed. Results: ${output}/results.json`,
);
process.exitCode = failed ? 1 : 0;
