# Xpressify — Project Status & Roadmap

> Живой документ: обновляй в конце каждой сессии, чтобы в следующий раз быстро восстановить контекст.

---

## 📍 Где мы сейчас

**Текущая фаза:** Phase 4 — Polish & Publish (95% завершена)
**Последняя сессия:** 18 апреля 2026 (Session 03)
**Следующий шаг:** npm publish --access public

---

## ⚡ Быстрый старт сессии

```powershell
cd D:\xpressify
npm run build
x --help
git log --oneline
```

---

## ✅ Phase 1 — Foundation (ЗАВЕРШЕНА)

Dual-package сборка (ESM + CJS), TypeScript 6.0 strict, Prettier, ESLint flat config,
Vitest с coverage, GitHub Actions CI матрица Node 20/22. Все проверки зелёные.

---

## ✅ Phase 2 — Scaffolding (`xpressify new`) (ЗАВЕРШЕНА)

Полная реализация `x new [name]` с интерактивными промптами, Zod-валидацией,
сервисным слоем и генерацией базового Express-проекта.

Утилиты: logger.ts, naming.ts + тесты, errors.ts.
Схема: project-options.schema.ts — NewProjectOptionsSchema через Zod.
Промпты: два checkbox (Code Quality / Project Features), conditional select для
логгера (pino/winston), husky auto-adds eslint + prettier.
Сервисы: filesystem.service.ts, template.service.ts (Handlebars),
package-manager.service.ts (exhaustive FEATURE_DEPS Record).
Генератор: 4 шага — директория → base files → logger config → install deps.
Base files: package.json, tsconfig.json, .env.example, .gitignore,
src/server.ts, src/app.ts.
Структура src/: routes/, controllers/, services/, middlewares/, utils/ (с .gitkeep).

Фичи: eslint, prettier, husky, github-actions, zod, logger (pino/winston), jwt.
Core deps всегда: express, dotenv, cors, helmet, express-rate-limit + dev types.


## ✅ Phase 3 — Generate (`xpressify generate`) (ЗАВЕРШЕНА)

Полная реализация `x g <type> <n>` с поддержкой путей в именах.

Схема: generate-options.schema.ts — типы route, middleware, class, interface, enum.
Поле name поддерживает path-нотацию (src/models/User).
Сервис: project-detector.service.ts — upward traversal для поиска package.json,
позволяет запускать команду из любой поддиректории проекта.
Генераторы:
  - route.generator.ts — 3 файла в layered structure:
    src/routes/, src/controllers/, src/services/
  - middleware.generator.ts — src/middlewares/
  - ts-construct.generator.ts — единый для class/interface/enum,
    поддержка произвольного пути через path.dirname/basename

Шаблоны: templates/generate/ — router, controller, service, middleware,
class, interface, enum. Каждый с next-step hint в выводе.
Команда: generate.command.ts с алиасом g, switch по типу (open/closed principle).
Binary aliases: xpressify, xpressify-cli, x — все указывают на dist/bin/cli.cjs.

---

## ✅ Phase 4 — Polish & Publish (95% ЗАВЕРШЕНА)

- [x] Динамическая версия из package.json через require() в CJS-контексте
- [x] ASCII-арт баннер (figlet + gradient-string), подавляется при --help/-V
- [x] Авторская подпись в баннере с ссылкой на GitHub
- [x] README полностью переписан — ASCII-баннер в code block, таблицы,
      дерево структуры, примеры команд, бейджи
- [x] publint — All good!
- [x] @arethetypeswrong/cli — No problems found, все 4 режима зелёные
      (node10, node16 CJS, node16 ESM, bundler)
- [ ] **npm publish --access public** ← единственный оставшийся шаг

---

## 🔧 Технические решения

**TypeScript 6.0** — удалён baseUrl, ignoreDeprecations: "6.0" в tsup.
**picocolors** — вместо chalk v5 (ESM-only).
**commander v14** — v15 требует Node 22.12+.
**CLI только CJS** — нативный __dirname, нет неоднозначности при глобальной установке.
**FEATURE_DEPS как Record<Feature, ...>** — exhaustive record, compile-time safety.
**JSON.stringify для конфигов** — безопаснее Handlebars для JSON-файлов.
**Единый ts-construct.generator** — параметрический полиморфизм вместо трёх файлов.
**path.dirname/basename** — x g class src/models/User как в Angular CLI.
**Binary aliases** — x и xpressify-cli зарегистрированы в bin поля package.json.
**Динамическая версия** — require('../../package.json') с eslint-disable комментарием.
**Баннер подавляется** — проверка process.argv на --version/-V/--help/-h.
**ASCII баннер в README** — code block вместо SVG (GitHub sanitizer блокирует
linearGradient + url() refs в SVG).

---

## ❓ Открытые вопросы

**github-actions фича** — FEATURE_DEPS пустой массив. Решить: генерировать ли
.github/workflows/ci.yml для сгенерированного проекта в следующей итерации?

**Windows symbolic links** — npm link требует прав админа или Developer Mode.
Добавить в документацию для контрибьюторов.

---

## 🐛 Troubleshooting

**npm run build падает с "No input files"** — запусти из D:\xpressify.

**DTS Build падает** — проверь ignoreDeprecations: "6.0" в tsup.config.ts.

**x не найдена после npm link** — открой PowerShell от администратора, повтори npm link.

**SVG не отображается на GitHub** — GitHub sanitizer вырезает linearGradient
с url() refs. Решение: использовать прямые fill="#hex" цвета в каждом элементе.

---

## 📅 История сессий

### Session 01 — 18 апреля 2026
Walking skeleton, dual-package инфраструктура, Phase 1 на 80%.
Препятствия: имя expressify-cli занято → xpressify. TS 6.0 адаптация.

### Session 02 — 18 апреля 2026
Phase 1 завершена (Prettier, ESLint flat config, Vitest, GitHub Actions CI зелёный).
Phase 2 полностью реализована: утилиты, схемы, промпты с двумя группами и
conditional select для логгера, три сервиса, Handlebars-шаблоны, генератор, команда new.
Ключевые решения: layered architecture, exhaustive Record, dependency injection.

### Session 03 — 18 апреля 2026
Phase 3 полностью реализована: project-detector с upward traversal,
генераторы route/middleware/class/interface/enum, команда generate с алиасом g,
binary alias x, поддержка path-нотации в именах компонентов.
Phase 4 почти завершена: динамическая версия, figlet баннер с gradient-string,
README с ASCII code block баннером, publint и attw оба зелёные.
Финальный шаг: npm publish --access public.

### Session 04 — TBD
Запустить npm publish. После публикации — обновить README с npm-бейджем версии.
