# Xpressify

<div align="center">


[![npm version](https://img.shields.io/npm/v/xpressify?style=flat-square&color=cc3534&logo=npm&logoColor=white)](https://www.npmjs.com/package/xpressify)
[![npm downloads](https://img.shields.io/npm/dm/xpressify?style=flat-square&color=cc3534)](https://www.npmjs.com/package/xpressify)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-6e40c9?style=flat-square)](./LICENSE)

</div>

---

## What is Xpressify?

Xpressify is a CLI that removes the repetitive setup work of a new Express backend.
Run one command and get a production-ready TypeScript + ESM project with structure,
security middleware, and tooling already wired.

It also helps after project creation: use generators to add routes, middleware,
and TypeScript constructs with consistent architecture and naming — just like
Angular CLI does for frontend projects.

---

## Quick Start

```bash
# Install globally
npm install -g xpressify

# Create a new project
xpressify new my-api

# Start coding
cd my-api
npm run dev
```

---

## Command Reference

| Command | Description |
|---|---|
| `xpressify new [name]` | Scaffold a new Express + TypeScript project |
| `xpressify generate <type> <name>` | Generate a component inside an existing project |
| `xpressify g <type> <name>` | Alias for `generate` |
| `xpressify --help` | Show help |
| `xpressify --version` | Show installed version |

---

## `new` — Create a project

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
├── tsconfig.json
└── package.json
```

### What you can select

**Code quality tools**

| Option | What it does |
|---|---|
| ESLint | Static analysis with TypeScript rules |
| Prettier | Opinionated code formatting |
| Husky | Git hooks — auto-adds ESLint + Prettier |
| GitHub Actions | CI pipeline for Node 20 / 22 |

**Project features**

| Option | What it does |
|---|---|
| Zod | Runtime schema validation |
| Logger | Structured logging — choose pino or winston |
| JWT | Adds `jsonwebtoken` + `bcryptjs` to deps |

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
| `route` | `src/routes/<n>.router.ts` + `src/controllers/<n>.controller.ts` + `src/services/<n>.service.ts` |
| `middleware` | `src/middlewares/<n>.middleware.ts` |
| `class` | `<path>/<n>.class.ts` |
| `interface` | `<path>/<n>.interface.ts` |
| `enum` | `<path>/<n>.enum.ts` |

---

## Programmatic API

Xpressify also works as a library. Types, Zod schemas, naming utilities,
and error classes are all exported from the main entry point:

```typescript
import type { NewProjectOptions, Feature, GenerateOptions } from 'xpressify';
import { NewProjectOptionsSchema, resolveNames, XpressifyError } from 'xpressify';

// Validate options programmatically
const options = NewProjectOptionsSchema.parse({
  name: 'my-api',
  targetDir: '/projects/my-api',
  packageManager: 'pnpm',
  features: ['eslint', 'prettier', 'zod'],
  loggerLibrary: 'pino',
  installDependencies: true,
});

// Use the naming utilities
const names = resolveNames('user-profile');
// { kebab: 'user-profile', pascal: 'UserProfile', camel: 'userProfile', ... }
```

---

## What You Get by Default

Every generated project ships with practical, production-oriented defaults:
Express with `cors`, `helmet`, and `express-rate-limit` pre-wired; a `/health`
endpoint out of the box; TypeScript strict mode targeting ES2022; `tsx` +
`nodemon` for a fast local dev loop; and `dotenv` for environment variables.

---

## Requirements

Node.js `>= 20.0.0`

```bash
node --version
```

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

---

## License

MIT © [David Veryutin](https://github.com/davids199005-oss)
