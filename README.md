<div align="center">

```
 __   __                        _  __
 \ \ / /                       (_)/ _|
  \ V / _ __  _ __ ___  ___ ___ _| |_ _   _
   > < | '_ \| '__/ _ \/ __/ __| |  _| | | |
  / . \| |_) | | |  __/\__ \__ \ | | | |_| |
 /_/ \_\ .__/|_|  \___||___/___/_|_|  \__, |
       | |                             __/ |
       |_|                            |___/
```

### Modern Express CLI — TypeScript · ESM · Zod All 

[![npm version](https://img.shields.io/npm/v/xpressify?style=flat-square&color=cc3534&logo=npm&logoColor=white)](https://www.npmjs.com/package/xpressify)
[![npm downloads](https://img.shields.io/npm/dm/xpressify?style=flat-square&color=cc3534)](https://www.npmjs.com/package/xpressify)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-6e40c9?style=flat-square)](./LICENSE)

</div>

---

## What is Xpressify?

Xpressify is a CLI that removes the repetitive setup work of a new Express backend.
Run one command and get a production-ready **TypeScript + ESM** project with structure,
security middleware, and tooling already wired.

It also helps after project creation: use generators to add routes, middleware,
and TypeScript constructs with consistent architecture and naming — just like
Angular CLI does for frontend projects.

---

## Quick Start

```bash
# Install globally
npm install -g xpressify

# Create a new project (interactive)
xpressify new my-api

# Or scaffold non-interactively (CI-friendly)
xpressify new my-api --yes --features eslint,prettier,zod

# Start coding
cd my-api
npm run dev
```

---

## Command Reference

| Command | Description |
|---|---|
| `xpressify new [name]` | Scaffold a new Express + TypeScript project |
| `xpressify generate <type> <component-name>` | Generate a component inside an existing project |
| `xpressify g <type> <component-name>` | Alias for `generate` |
| `xpressify --help` | Show help |
| `xpressify --version` | Show installed version |

The binary is also available as short aliases `x` and `xpressify-cli` —
`x g route users` is equivalent to `xpressify generate route users`.

---

## `new` — Create a project

### Interactive mode

```bash
xpressify new my-api
```

The command launches an interactive prompt where you pick your package manager,
quality tooling, and optional libraries. When done, you get:

```
my-api/
├── src/
│   ├── app.ts            ← Express app with cors, helmet, rate-limit
│   ├── server.ts         ← Entry point with dotenv
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   └── utils/
├── .env.example
├── .gitignore
├── tsconfig.json         ← NodeNext module + moduleResolution
└── package.json          ← "type": "module"
```

### Non-interactive mode

Pass `--yes` (or any configuration flag) to skip the prompts. This is what you
want in CI pipelines, Docker images, and one-shot scaffolding scripts:

```bash
# Defaults (npm, no optional features, install deps)
xpressify new my-api --yes

# Pick features and package manager
xpressify new my-api --yes \
  --features eslint,prettier,zod \
  --package-manager pnpm

# Logger feature + specific library
xpressify new my-api --yes \
  --features logger,jwt \
  --logger winston

# Scaffold only, skip dependency install
xpressify new my-api --yes --no-install
```

Flags for `new`:

| Flag | Description | Default |
|---|---|---|
| `-y, --yes` | Skip all prompts | — |
| `--package-manager <pm>` | `npm`, `pnpm`, or `yarn` | `npm` |
| `--features <list>` | Comma-separated feature list (see below) | `` (none) |
| `--logger <library>` | `pino` or `winston` (only with `logger` feature) | `pino` |
| `--no-install` | Skip dependency installation | install |

### What you can select

**Code quality tools**

| Option | What it does |
|---|---|
| `eslint` | Static analysis with TypeScript rules |
| `prettier` | Opinionated code formatting |
| `husky` | Git hooks — auto-adds ESLint + Prettier |
| `github-actions` | CI pipeline for Node 20 / 22 |

**Project features**

| Option | What it does |
|---|---|
| `zod` | Runtime schema validation |
| `logger` | Structured logging — choose `pino` or `winston` |
| `jwt` | Adds `jsonwebtoken` + `bcryptjs` to deps |

---

## `generate` — Add components

Run from anywhere inside your project. Xpressify walks up the directory tree
to find `package.json` automatically.

```bash
# Route — creates router + controller + service (3 files)
xpressify g route users
xpressify g route user-profile

# Middleware — creates typed Express middleware
xpressify g middleware auth
xpressify g middleware request-logger

# TypeScript constructs — supports path notation
xpressify g class src/models/User
xpressify g interface src/types/Product
xpressify g enum src/enums/Status
```

### Generator types

| Type | Output |
|---|---|
| `route` | `src/routes/<name>.router.ts` + `src/controllers/<name>.controller.ts` + `src/services/<name>.service.ts` |
| `middleware` | `src/middlewares/<name>.middleware.ts` |
| `class` | `<path>/<name>.class.ts` |
| `interface` | `<path>/<name>.interface.ts` |
| `enum` | `<path>/<name>.enum.ts` |

Generated files use ESM-compatible `.js` extensions in relative imports,
matching the `NodeNext` module resolution used in the scaffolded `tsconfig.json`.

---

## Programmatic API

Xpressify also works as a library. Types, Zod schemas, naming utilities,
and error classes are all exported from the main entry point:

```typescript
import type { NewProjectOptions, Feature, GenerateOptions } from 'xpressify';
import {
  NewProjectOptionsSchema,
  PROJECT_NAME_REGEX,
  resolveNames,
  XpressifyError,
} from 'xpressify';

// Validate options programmatically
const options = NewProjectOptionsSchema.parse({
  name: 'my-api',
  targetDir: '/projects/my-api',
  packageManager: 'pnpm',
  features: ['eslint', 'prettier', 'zod'],
  loggerLibrary: null,
  installDependencies: true,
});

// Use the naming utilities
const names = resolveNames('user-profile');
// { kebab: 'user-profile', pascal: 'UserProfile', camel: 'userProfile', ... }

// Validate a project name directly
const isValid = PROJECT_NAME_REGEX.test('my-api'); // true
```

---

## What You Get by Default

Every generated project ships with practical, production-oriented defaults:
Express with `cors`, `helmet`, and `express-rate-limit` pre-wired; a `/health`
endpoint out of the box; **ESM output** via `"type": "module"` in `package.json`
and `NodeNext` in `tsconfig.json`; TypeScript strict mode targeting `ES2022`;
`tsx` + `nodemon` for a fast local dev loop with no build step; and `dotenv`
for environment variables.

Relative imports in the scaffold use `.js` extensions (`import app from './app.js'`),
which is what Node requires at runtime for ESM and what `tsc` preserves under
`NodeNext` module resolution.

---

## Requirements

Node.js `>= 20.0.0`

```bash
node --version
```

---

## Upgrading from 1.x

Version `2.0.0` is a breaking release — generated projects now use ESM
instead of CommonJS, and the `generate` command argument was renamed from
the broken `<n>` placeholder to `<component-name>`. Existing projects
scaffolded by `1.x` are not affected; only newly generated projects get
the new defaults. See [CHANGELOG.md](./CHANGELOG.md) for the full list
of changes.

---

## Development

```bash
git clone https://github.com/davids199005-oss/xpressify.git
cd xpressify
npm install
npm run dev       # tsup in watch mode
```

Useful scripts:

```bash
npm run build          # production build with tsup
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test           # Vitest
npm run test:coverage  # Vitest + coverage report
```

The CLI binary is bundled with all `node_modules` inlined (except `figlet`,
which reads its `.flf` font files at runtime). This is deliberate — several
direct dependencies are ESM-only and cannot be loaded via `require()` from
a CJS bundle. See `tsup.config.ts` for the exact configuration.

---

## License

MIT © [David Veryutin](https://github.com/davids199005-oss)
