# Xpressify

<div align="center">

<pre>
__   __                        _  __
\ \ / /                       (_)/ _|
 \ V / _ __  _ __ ___  ___ ___ _| |_ _   _
  > < | '_ \| '__/ _ \/ __/ __| |  _| | | |
 / . \| |_) | |  |  __/\__ \__ \ | | | |_| |
/_/ \_\ .__/|_|  \___||___/___/_|_|  \__, |
      | |                              __/ |
      |_|                             |___/

  Modern Express CLI — scaffold TypeScript + ESM projects instantly
  Created by David Veryutin · github.com/davids199005-oss
</pre>

![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178c6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)
![npm](https://img.shields.io/badge/npm-xpressify-cc3534?style=flat-square&logo=npm&logoColor=white)

</div>

---

## What is Xpressify?

Xpressify is a CLI that removes the repetitive setup work of a new Express backend.
Run one command and get a production-ready TypeScript + ESM project with structure,
security middleware, and tooling already wired.

It also helps after project creation: use generators to add routes, middleware,
and TypeScript constructs with consistent architecture and naming.

---

## Quick Start

### 1) Install globally

```bash
npm install -g xpressify
```

### 2) Create a new project

```bash
x new my-api
```

### 3) Start coding

```bash
cd my-api
npm run dev
```

---

## Command Reference

| Command | Alias | Description |
|---|---|---|
| `x new [name]` | `xpressify new [name]` | Scaffold a new Express + TypeScript project with interactive prompts |
| `x generate <type> <name>` | `x g <type> <name>` | Generate code inside an existing Xpressify project |
| `x --help` | `xpressify --help` | Show help |
| `x --version` | `xpressify --version` | Show installed version |

### `new` command

Creates a project and asks you to choose:

- package manager (`npm`, `pnpm`, `yarn`)
- quality tooling (ESLint, Prettier, Husky, GitHub Actions)
- optional libraries (Zod, logger setup, JWT stack)

Example:

```bash
x new my-api
```

Generated base structure:

```
my-api/
├── src/
│   ├── app.ts
│   ├── server.ts
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

### `generate` command

Generates components inside an existing project.
You can run it from any subdirectory; Xpressify will detect the project root.

```bash
x g route users
x g middleware auth
x g class src/models/User
x g interface src/types/Product
x g enum src/enums/Status
```

Supported generator types:

- `route` -> creates route + controller + service
- `middleware` -> creates typed Express middleware
- `class` -> creates TypeScript class
- `interface` -> creates TypeScript interface
- `enum` -> creates TypeScript enum

---

## What You Get by Default

- Express app with practical middleware (`cors`, `helmet`, `express-rate-limit`)
- TypeScript-first setup for modern Node.js (`>= 20`)
- Environment variables support via `dotenv`
- Clean layered folder structure for scalable APIs
- Fast local workflow out of the box (`nodemon`, `tsx`)

---

## Binary Names

All names below are installed globally and point to the same CLI:

```bash
x new my-api
xpressify new my-api
xpressify-cli new my-api
```

---

## Requirements

Node.js `>= 20.0.0`

```bash
node --version
```

---

## Development (for contributors)

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run build` - build with `tsup`
- `npm run typecheck` - run TypeScript checks
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npm run test:coverage` - run tests with coverage

---

## License

MIT - see [LICENSE](./LICENSE)

---

<div align="center">
  <sub>Built with care by <a href="https://github.com/davids199005-oss">David Veryutin</a></sub>
</div>
