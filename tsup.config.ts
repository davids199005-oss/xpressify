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
    // Бандлим ВСЁ из node_modules в CLI-бинарник — КРОМЕ figlet.
    // Причина бандлинга: экосистема npm активно мигрирует на ESM-only
    // (chalk, ora, gradient-string, @inquirer/prompts, execa и их транзитивные
    // зависимости). Без бандлинга Node падает с "X.default is not a function"
    // при попытке require() чистого ESM-модуля.
    // Причина исключения figlet: figlet читает свои .flf шрифты с диска
    // через __dirname во время выполнения. При бандлинге __dirname смещается
    // в dist/bin/, и шрифты теряются. Оставляем figlet external — он CJS,
    // работает через require без проблем, и находит свои шрифты в собственной
    // папке node_modules.
    //
    // Regex с negative lookahead: /^(?!figlet$).+/ матчит любую непустую
    // строку, которая НЕ равна точно "figlet". Комбинация noExternal + external
    // для фигурного типа пакета (с файловыми ассетами) недостаточна — tsup
    // резолвит noExternal первым и регекс /.+/ поглощает figlet.
    // Размер self-contained бандла ~1.4 MB — приемлемо для CLI.
    noExternal: [/^(?!figlet$).+/],
    external: ["figlet"],
    splitting: false,
    minify: false,
    shims: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
