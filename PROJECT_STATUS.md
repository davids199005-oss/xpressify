# Xpressify — Project Status & Roadmap

> Живой документ: обновляй в конце каждой сессии, чтобы в следующий раз быстро восстановить контекст.

---

## 📍 Где мы сейчас

**Текущая фаза:** Phase 4 — Polish & Publish
**Последняя сессия:** 18 апреля 2026 (Session 03)
**Следующий шаг:** динамическая версия → README → publint → npm publish

---

## ⚡ Быстрый старт сессии

```powershell
cd D:\xpressify
npm run build
x --help
x g --help
git log --oneline
```

Ожидаемый результат: help с командами `new` и `generate|g`, все генераторы в списке.

---

## ✅ Phase 1 — Foundation (ЗАВЕРШЕНА)

Dual-package сборка (ESM + CJS), TypeScript 6.0 strict, Prettier, ESLint flat config,
Vitest с coverage, GitHub Actions CI матрица Node 20/22. Все проверки зелёные.


## ✅ Phase 2 — Scaffolding (`xpressify new`) (ЗАВЕРШЕНА)

Полная реализация `xpressify new [name]` / `x new [name]`.

**Утилиты:** `logger.ts`, `naming.ts` + тесты, `errors.ts`.
**Схема:** `project-options.schema.ts` — NewProjectOptionsSchema через Zod.
**Промпты:** два checkbox (Code Quality / Project Features), conditional select
для логгера (pino/winston), husky auto-adds eslint + prettier.
**Сервисы:** `filesystem.service.ts`, `template.service.ts` (Handlebars),
`package-manager.service.ts` (exhaustive FEATURE_DEPS Record).
**Шаблоны:** `templates/logger/pino.config.ts.hbs`, `winston.config.ts.hbs`.
**Генератор:** 4 шага — директория → base files → logger config → install deps.
Base files: package.json, tsconfig.json, .env.example, .gitignore, src/server.ts,
src/app.ts. Структура src/: routes/, controllers/, services/, middlewares/, utils/
(каждая с .gitkeep).
**Команда:** `new.command.ts` с dependency injection и двухуровневым error handling.

Фичи: eslint, prettier, husky, github-actions, zod, logger (pino/winston), jwt.
Core deps всегда: express, dotenv, cors, helmet, express-rate-limit + dev types.

---

## ✅ Phase 3 — Generate (`xpressify generate`) (ЗАВЕРШЕНА)

Полная реализация `xpressify generate <type> <name>` / `x g <type> <name>`.

**Схема:** `generate-options.schema.ts` — GenerateOptionsSchema, поддержка
путей в имени (`src/models/User`).
**Сервис:** `project-detector.service.ts` — upward traversal для поиска package.json.
**Генераторы:**
- `route.generator.ts` — три файла в layered structure:
  src/routes/, src/controllers/, src/services/
- `middleware.generator.ts` — один файл в src/middlewares/
- `ts-construct.generator.ts` — единый генератор для class/interface/enum,
  поддержка произвольного пути (`x g class src/models/User`)

**Шаблоны:** `templates/generate/route/` (router, controller, service),
`templates/generate/middleware/`, `templates/generate/class/`,
`templates/generate/interface/`, `templates/generate/enum/`.
**Команда:** `generate.command.ts` с алиасом `g`, switch по типу,
примеры в addHelpText.
**Binary aliases:** `xpressify`, `xpressify-cli`, `x` — все указывают на cli.cjs.

Поддерживаемые типы: route, middleware, class, interface, enum.

---

## 🎁 Phase 4 — Polish & Publish ← ТЕКУЩАЯ

- [ ] **Динамическая версия** — читать из package.json вместо хардкода '0.0.1'
- [ ] **README** — полное описание, примеры команд, список фич
- [ ] **CHANGELOG.md** — conventional changelog
- [ ] **Проверка через publint** — убедиться что пакет корректно опубликован
- [ ] **Проверка через @arethetypeswrong/cli** — типы dual-package корректны
- [ ] **npm publish --access public**

---

## 🔧 Технические решения

**TypeScript 6.0** — удалён `baseUrl`, `ignoreDeprecations: "6.0"` в tsup.
**picocolors** — вместо chalk v5 (ESM-only).
**commander v14** — v15 требует Node 22.12+.
**CLI только CJS** — нативный `__dirname`, нет неоднозначности.
**FEATURE_DEPS как Record<Feature, ...>** — exhaustive record, compile-time safety.
**JSON.stringify для конфигов** — безопаснее Handlebars для JSON.
**Единый ts-construct.generator** — параметрический полиморфизм вместо трёх файлов.
**path.dirname/basename для имён** — `x g class src/models/User` работает как в Angular CLI.
**Binary aliases** — `x` и `xpressify-cli` как алиасы для удобства.

---

## ❓ Открытые вопросы

- **github-actions фича** — FEATURE_DEPS пустой, нужно решить генерировать ли CI.
- **Windows symbolic links** — `npm link` требует прав админа.

---

## 🐛 Troubleshooting

**`npm run build` падает** — запусти из `D:\xpressify`.
**DTS Build падает** — проверь `ignoreDeprecations: "6.0"` в tsup.config.ts.
**`x` не найдена** — открой PowerShell от администратора, повтори `npm link`.

---

## 📅 История сессий

### Session 01 — 18 апреля 2026
Walking skeleton, dual-package инфраструктура, Phase 1 на 80%.

### Session 02 — 18 апреля 2026
Phase 1 завершена (Prettier, ESLint, Vitest, CI зелёный).
Phase 2 полностью реализована: утилиты, схемы, промпты, сервисы, генератор, команда `new`.

### Session 03 — 18 апреля 2026
Phase 3 полностью реализована: project-detector, генераторы route/middleware/
class/interface/enum, команда `generate` с алиасом `g`, binary alias `x`.
Ключевые решения: layered structure для route, единый ts-construct генератор,
поддержка путей в именах компонентов.

### Session 04 — TBD
Phase 4: polish и публикация на npm.
