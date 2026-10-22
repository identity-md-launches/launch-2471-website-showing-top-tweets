import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(
  process.env.SWAMP_TEST_DEPENDENCIES
    ? join(process.env.SWAMP_TEST_DEPENDENCIES, "package.json")
    : import.meta.url,
);

export const { chromium, webkit } = require("playwright");
export const { default: AxeBuilder } = require("@axe-core/playwright");
