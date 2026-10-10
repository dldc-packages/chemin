import { defineConfig } from "bumpp";

export default defineConfig({
  // Bump package.json, commit, tag, push — in one interactive step.
  // The `release` script runs `npm run release:check` (vp check + test + pack)
  // via `--execute` before committing, so a broken release never gets tagged.
  commit: "chore: release {tag}",
  tag: "v{version}",
});
