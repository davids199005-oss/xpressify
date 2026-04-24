# Changelog

All notable changes to Xpressify are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2] — Unreleased

### Changed

- **BREAKING (generate)**: `g class`, `g interface`, `g enum` without an
  explicit path now scaffold into typed subdirectories under the project
  root (`src/classes/`, `src/interfaces/`, `src/enums/`) instead of the
  current working directory. Explicit paths (`g class src/models/User`)
  are unchanged. The result no longer depends on where inside the project
  the command was invoked — running from `src/services/` lands the file in
  the same place as running from the project root.

### Fixed

- **Clean error output**: invalid user input (bad project name, unknown
  `--package-manager`, illegal characters in component name) now produces
  a single readable message. The CLI no longer prints the `Unexpected
  error:` prefix or a raw stack trace for user-input errors. Stack traces
  are still available for debugging by setting `XPRESSIFY_DEBUG=1` in the
  environment.

## [2.2.1]

### Fixed

- **Install failure in 2.2.0**: three pinned versions in
  `dependency-versions.ts` referenced npm releases that don't exist,
  causing `npm install` to fail with `ETARGET` when scaffolding a
  new project with optional features:
  - `@eslint/js` pinned to `^10.2.0`, actual latest is `10.0.1`.
    Corrected to `^10.0.0`. (Unlike `eslint` itself, `@eslint/js` is
    published less frequently and their minor versions don't track.)
  - `ts-jest` pinned to `^30.0.0`, which does not exist. Latest is
    `29.4.9`. Corrected to `^29.4.0`.
  - `pino` pinned to `^9.5.0` — still valid but outdated; latest is
    `10.x`. Bumped to `^10.0.0` since the template only uses basic API
    stable across both majors.

## [2.2.0] — Unreleased

### Fixed

- **Security**: generated `app.ts` called `cors()` without options, which
  allows any origin to make credentialed requests. The template now
  reads allowed origins from a `CORS_ORIGIN` env var (comma-separated)
  and disables CORS entirely when the variable is absent — a safe
  default for APIs not called from a browser.
- **Rate-limit API**: generated `app.ts` used the deprecated `max`
  option from `express-rate-limit` v6. The template now uses `limit`,
  `standardHeaders: 'draft-8'`, `legacyHeaders: false`, and `ipv6Subnet`
  per the v8 API.
- **Graceful shutdown**: generated `server.ts` now handles `SIGTERM` and
  `SIGINT` by draining in-flight requests through `server.close()` with
  a 10-second timeout before force-exiting. Without this, orchestrators
  (k8s, Docker, PM2, systemd) dropped in-flight requests on restart.
- **Startup errors**: generated `server.ts` now listens for the
  `server.on('error')` event and exits with a clear message on
  `EADDRINUSE` / `EACCES` instead of dumping a stack trace.
- **Docker signal handling**: generated `Dockerfile` now uses `tini` as
  PID 1 (`ENTRYPOINT ["/sbin/tini", "--"]`) so SIGTERM is forwarded to
  the Node.js process. Without it, `docker stop` always timed out after
  10 seconds before force-killing the container.
- **Dependency pinning**: the CLI previously installed `express`,
  `helmet`, `cors`, `express-rate-limit`, and every other dependency
  as "latest" at install time. When a breaking major release of any
  of these shipped, every newly scaffolded project broke the same day.
  All versions are now pinned via semver ranges in
  `src/utils/dependency-versions.ts`, a single source of truth.

### Added

- `app.ts` template now includes a 404 handler and a 4-argument error
  handler. Body parsers are configured with a 100 KB limit to prevent
  trivial payload-based DoS.
- `app.ts` template explicitly disables the `X-Powered-By` header and
  includes a commented-out `app.set('trust proxy', 1)` with guidance
  on when and how to enable it for deploys behind Nginx / Cloudflare
  / Railway / Fly.
- `env.example` template now lists `CORS_ORIGIN` with a usage comment.
- `Dockerfile` template now includes a `HEALTHCHECK` that uses the
  built-in `fetch` (Node 22+) against `/health` — no `curl` or `wget`
  in the image, no extra dependency.

### Changed

- **BREAKING**: generated projects require Node.js `>= 22.0.0`.
  Previous minimum was `>= 20.0.0`. Node 20 reached end-of-life on
  2026-04-30 and no longer receives security patches.
- **BREAKING**: the CLI itself now requires Node.js `>= 22.0.0`.
- Dockerfile base image upgraded from `node:20-alpine` to
  `node:22-alpine`.
- `.nvmrc` template bumped from `20` to `22`.
- CI matrix now runs on Node 22 and 24 (was 20 and 22).

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
