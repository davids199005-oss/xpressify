import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: {
        compilerOptions: {
            ignoreDeprecations: "6.0"
        },
    },
    clean: true,
    sourcemap: true,
    target: "node20",
    platform: "node",
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "cjs" ? ".cjs" : ".js",
      };
    },
    skipNodeModulesBundle: true,
    splitting: false,
    minify: false,
    shims: true,
  },
  {
    entry: ["src/bin/cli.ts"],
    format: ["cjs"],
    dts: false,
    clean: false,
    sourcemap: true,
    target: "node20",
    platform: "node",
    outDir: "dist/bin",
    outExtension() {
      return { js: ".cjs" };
    },
    skipNodeModulesBundle: true,
    splitting: false,
    minify: false,
    shims: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);