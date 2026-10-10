import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

const root = import.meta.dirname;

export default defineConfig({
  // Tests import the package through its own public export
  // (`@dldc/chemin`), exactly like the JSR manifest used to. The alias points
  // that self-reference at the source so tests run against the same code the
  // package will be built from.
  resolve: {
    alias: {
      "@dldc/chemin": resolve(root, "mod.ts"),
    },
  },

  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.types.ts"],
    },
  },

  fmt: {
    ignorePatterns: [
      "**/__snapshots__/**",
      "**/*.md",
      ".github/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
  },

  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      // `any` was the only excluded rule in the previous Deno lint config.
      "no-explicit-any": "off",
    },
  },

  // Library build (tsdown). The entry map mirrors the export map in
  // package.json so the public export has its own emitted module and types.
  pack: {
    entry: {
      mod: "mod.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
