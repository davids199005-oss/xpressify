# Xpressify — Project Status & Roadmap

> Живой документ: обновляй в конце каждой сессии, чтобы в следующий раз быстро восстановить контекст.

---

## 📍 Где мы сейчас

**Текущая фаза:** Phase 3 — Generate (`xpressify generate`)
**Последняя сессия:** 18 апреля 2026 (Session 02)
**Следующий шаг:** GenerateOptionsSchema → project-detector.service → шаблоны → генераторы → generate.command.ts

---

## ⚡ Быстрый старт сессии

```powershell
cd D:\xpressify
npm run build
node dist/bin/cli.cjs --help
node dist/bin/cli.cjs new --help
git log --oneline
```

Ожидаемый результат: help-экран с командой `new [name]`, история коммитов.

---

## ✅ Phase 1 — Foundation (ЗАВЕРШЕНА)

Полный фундамент: dual-package сборка (ESM + CJS), TypeScript 6.0 strict,
Prettier, ESLint flat config с type-aware правилами, Vitest с coverage,
GitHub Actions CI матрица Node 20/22. Все проверки зелёные.


## ✅ Phase 2 — Scaffolding (`xpressify new`) (ЗАВЕРШЕНА)

Полная реализация команды `xpressify new [name]` с интерактивными промптами,
Zod-валидацией, сервисным слоем и генерацией базового Express-проекта.

**Утилиты** (`src/utils/`): `logger.ts` — обёртка над picocolors + ora,
`naming.ts` — kebab/camel/pascal/snake + pluralize с тестами,
`errors.ts` — иерархия кастомных ошибок (XpressifyError и наследники).

**Схемы** (`src/schemas/`): `project-options.schema.ts` — NewProjectOptionsSchema
с полями name, targetDir, packageManager, features, loggerLibrary, installDependencies.

**Промпты** (`src/prompts/`): `project.prompts.ts` — два checkbox (Code Quality
и Project Features), conditional select для логгера (pino/winston),
feature dependencies (husky auto-adds eslint + prettier).

**Сервисы** (`src/services/`):
- `filesystem.service.ts` — exists, createProjectDir, writeFile, readFile, copyFile
- `template.service.ts` — Handlebars render + renderToFile, путь через __dirname
- `package-manager.service.ts` — exhaustive FEATURE_DEPS Record, resolveDependencies,
  install через execa с stdio:'inherit'

**Шаблоны** (`templates/logger/`): `pino.config.ts.hbs` и `winston.config.ts.hbs`.

**Генератор** (`src/generators/project.generator.ts`): 4 шага: создание директории →
scaffold базовых файлов (package.json, tsconfig.json, .env.example, .gitignore,
src/server.ts, src/app.ts) → генерация logger.config.ts → установка зависимостей.

Core deps всегда: express, dotenv, cors, helmet, express-rate-limit.
Core devDeps всегда: @types/express, @types/cors, @types/node, typescript, tsx, nodemon.

**Команда** (`src/commands/new.command.ts`): dependency injection паттерн,
двухуровневый error handling, process.exit(1) при ошибке.

**Финальный список фич:** eslint, prettier, husky (auto-deps), github-actions,
zod (deps only), logger (pino/winston → генерирует logger.config.ts),
jwt (deps only: jsonwebtoken + bcryptjs + types).


## 🎯 Phase 3 — Generate (`xpressify generate`) ← ТЕКУЩАЯ

Команда `xpressify generate <type> <name>` (алиас `g`) генерирует компоненты
внутри существующего xpressify-проекта.

### План реализации (в порядке зависимостей)

- [ ] **`src/schemas/generate-options.schema.ts`** — GenerateOptionsSchema:
  тип компонента (route, middleware), имя, targetDir
- [ ] **`src/services/project-detector.service.ts`** — проверяет что CWD
  является xpressify-проектом (наличие package.json)
- [ ] **Шаблоны** (`templates/generate/`):
  - [ ] `route/router.ts.hbs` — Express router с CRUD-заглушками
  - [ ] `route/controller.ts.hbs` — контроллер с типизированными handlers
  - [ ] `route/service.ts.hbs` — сервисный слой
  - [ ] `middleware/middleware.ts.hbs` — типизированный Express middleware
- [ ] **Генераторы** (`src/generators/`):
  - [ ] `route.generator.ts` — генерирует router + controller + service
  - [ ] `middleware.generator.ts` — генерирует middleware
- [ ] **`src/commands/generate.command.ts`** — subcommands: `route`, `middleware`
- [ ] **Подключить в `src/bin/cli.ts`**
- [ ] **Тесты** для каждого генератора

---

## 🎁 Phase 4 — Polish & Publish

- [ ] Расширенный README с примерами использования
- [ ] CHANGELOG.md
- [ ] Проверка через `publint` и `@arethetypeswrong/cli`
- [ ] Динамическая версия из package.json
- [ ] `npm publish --access public`

---

## 🔧 Технические решения

**TypeScript 6.0** — удалён `baseUrl`, добавлен `ignoreDeprecations: "6.0"` в tsup.

**picocolors** — вместо chalk v5 (ESM-only), работает в обоих форматах.

**commander v14** — v15 ESM-only, требует Node 22.12+.

**CLI только CJS** — `.cjs` однозначен, нативный `__dirname` без shim-ов.

**FEATURE_DEPS как Record<Feature, ...>** — exhaustive record, новая фича без
записи → ошибка компиляции, а не runtime-баг.

**package.json через JSON.stringify** — безопаснее Handlebars для JSON,
TypeScript гарантирует структуру, нет проблем с экранированием.

**Двухуровневый error handling** — XpressifyError (ожидаемое) → только сообщение,
Error (неожиданное) → сообщение + стектрейс. process.exit(1) для CI/CD.

---

## ❓ Открытые вопросы

- **github-actions фича** — в FEATURE_DEPS пустой массив. Решить: генерировать
  ли `.github/workflows/ci.yml` для сгенерированного проекта?
- **Windows symbolic links** — `npm link` требует прав админа или Developer Mode.

---

## 🐛 Troubleshooting

**`npm run build` падает с "No input files"** — запусти из `D:\xpressify`.

**DTS Build падает** — проверь `ignoreDeprecations: "6.0"` в `tsup.config.ts`.

**`xpressify` не найдена после `npm link`** — открой PowerShell от администратора.

---

## 📅 История сессий

### Session 01 — 18 апреля 2026
Walking skeleton, dual-package инфраструктура, Phase 1 на 80%.
Препятствия: имя `expressify-cli` занято → `xpressify`. TS 6.0 адаптация.

### Session 02 — 18 апреля 2026
Завершена Phase 1 (Prettier, ESLint, Vitest, CI зелёный на Node 20/22).
Полностью реализована Phase 2: утилиты, схемы, промпты с группами фич,
три сервиса, Handlebars-шаблоны логгера, генератор, команда `new`.
Ключевые решения: layered architecture, exhaustive Record, dependency injection.

### Session 03 — TBD
Phase 3: команда `generate` с субкомандами `route` и `middleware`.
