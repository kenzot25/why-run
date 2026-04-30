import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  shims: true,
  noExternal: ["@why-run/core"],
})
