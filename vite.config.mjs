import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Normal installs resolve locally. An optional external dependency directory
// lets restricted build workers keep every dependency outside the submission.
const require = createRequire(
  process.env.SWAMP_DEPENDENCIES
    ? join(process.env.SWAMP_DEPENDENCIES, "package.json")
    : import.meta.url,
);

export default {
  base: "./",
  resolve: {
    alias: {
      "react-dom": dirname(require.resolve("react-dom/package.json")),
      react: dirname(require.resolve("react/package.json")),
    },
  },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
};
