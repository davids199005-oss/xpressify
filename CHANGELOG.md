# Changelog

All notable changes to Xpressify are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — Unreleased

### BREAKING CHANGES

- **Generated projects now use ESM** instead of CommonJS. The scaffolded
  `package.json` contains `"type": "module"`, and `tsconfig.json` uses
  `"module": "NodeNext"` with `"moduleResolution": "NodeNext"`. Existing
  users upgrading from `1.x` who rely on CJS output in generated
  projects must either migrate their code to ESM or stay on `1.x`.
- The `generate` command argument was previously named with a broken
  `<n>` placeholder due to a typo. It is now `<component-name>`.
  Scripts that passed arguments positionally are unaffected; only help
  output and error messages change.

### Fixed

- **Critical**: Generated routes had broken relative imports. The router
  template imported from `./<name>.controller` and the controller imported
  from `./<name>.service`, but the generator places these files in
  separate directories (`routes/`, `controllers/`, `services/`). Now
  uses correct `../controllers/<name>.controller.js` and
  `../services/<name>.service.js` paths with ESM-compatible `.js`
  extensions.
- **Critical**: `xpressify g enum <name>` created an empty file. The
  `enum.ts.hbs` template now produces a proper `export enum`
  declaration.
- **Critical**: CLI binary failed at runtime with `X.default is not a
  function` because ESM-only dependencies (`ora`, `gradient-string`,
  `@inquirer/prompts`, `execa` and their transitive deps like `chalk`)
  cannot be loaded via `require()` from a CJS bundle. `tsup.config.ts`
  now bundles all of `node_modules` into the CLI — except `figlet`,
  which needs its `.flf` font files on disk and stays external. Bundle
  size grew from ~32 KB to ~1.4 MB, which is acceptable for a CLI and
  yields faster cold-start since Node no longer walks `node_modules`.
- Service template no longer emits `console.log(id)` for unused
  parameters; uses the underscore-prefix convention instead (`_id`).
- Route and middleware generators now print registration hints with
  `.js` extensions in the suggested `import` statement, matching what
  ESM requires at runtime.
- `project-detector.service.ts` now throws the typed
  `NotXpressifyProjectError` instead of a generic `Error`, consistent
  with the rest of the error hierarchy.
- The `NotXpressifyProjectError` message now correctly says
  `<project-name>` (was a broken `<n>` placeholder).
- Removed a stray `x new my-app` example from the `generate` command's
  help text.
- Package manager install commands now match each tool's idiom:
  `npm install`, `pnpm add`, `yarn add` (was universally `add` which
  works for npm as an alias but is not canonical).

### Added

- **Non-interactive mode for `xpressify new`**: flags `--yes`,
  `--features`, `--package-manager`, `--logger`, `--no-install` allow
  CI/CD pipelines and Docker builds to scaffold projects without
  prompts. Example: `xpressify new my-api --yes --features eslint,zod
  --package-manager pnpm`.
- Boundary check in `ts-construct.generator.ts` prevents users from
  accidentally creating files outside the project root via paths
  containing `..`.
- Partial-project rollback: if dependency installation fails mid-way,
  the CLI removes the half-created directory and reports cleanly.
- Base project files (`server.ts`, `app.ts`, `tsconfig.json`,
  `.env.example`, `.gitignore`, `package.json`) moved from inline
  strings to proper Handlebars templates in `templates/base/`, enabling
  easier customisation.

### Changed

- Templates directory path resolution is now robust to changes in the
  bundled output layout; previously it assumed `dist/bin/cli.cjs` as the
  calling location and would silently break if the library API were
  extended to invoke templates directly.
- Path alias `@/` removed from the xpressify source (it was used
  inconsistently in only one file). All internal imports are now
  relative.
- Project name validation regex is exported from the schema as
  `PROJECT_NAME_REGEX` and reused in the interactive prompt to
  eliminate duplication.

## [1.0.1] — Previous release

Initial public release. Known issues fixed in 2.0.0:
generated routes had broken imports, CLI crashed on ESM-only
dependencies in published form, and generated projects claimed ESM
but were CommonJS. Users should upgrade to 2.0.0.
