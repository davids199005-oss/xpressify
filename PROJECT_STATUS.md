# Xpressify — Project Status & Roadmap

> Живой документ: обновляй в конце каждой сессии, чтобы в следующий раз быстро восстановить контекст.

---

## 📍 Где мы сейчас

**Текущая фаза:** Phase 4 — Polish & Publish (90% завершена)
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

Утилиты: logger.ts, naming.ts + тесты, errors.ts. Схема: project-options.schema.ts.
Промпты: два checkbox (Code Quality / Project Features), conditional select для
логгера, husky auto-adds eslint + prettier. Сервисы: filesystem, template (Handlebars),
package-manager (exhaustive FEATURE_DEPS Record). Генератор: 4 шага.
Base files: package.json, tsconfig.json, .env.example, .gitignore, src/server.ts,
src/app.ts. Структура src/: routes/, controllers/, services/, middlewares/, utils/.

Фичи: eslint, prettier, husky, github-actions, zod, logger (pino/winston), jwt.
Core deps всегда: express, dotenv, cors, helmet, express-rate-limit + dev types.

---

## ✅ Phase 3 — Generate (`xpressify generate`) (ЗАВЕРШЕНА)

Полная реализация `x g <type> <n>` с поддержкой путей в именах.

Схема: generate-options.schema.ts с типами route, middleware, class, interface, enum.
Сервис: project-detector.service.ts — upward traversal для поиска package.json.
Генераторы: route (3 файла в layered structure), middleware, ts-construct (единый
для class/interface/enum с поддержкой произвольного пути).
Шаблоны: templates/generate/ — router, controller, service, middleware, class,
interface, enum. Команда: generate.command.ts с алиасом g.
Binary aliases: xpressify, xpressify-cli, x.


## ✅ Phase 4 — Polish & Publish (ПОЧТИ ЗАВЕРШЕНА)

- [x] Динамическая версия из package.json через require() в cli.ts
- [x] ASCII-арт баннер с gradient-string + figlet, подавляется при --help/--version
- [x] Авторская подпись в баннере с ссылкой на GitHub
- [x] SVG-баннер для README (assets/banner.svg) — имитация терминала с градиентом
- [x] README переписан с нуля — таблицы фич, дерево структуры, примеры команд
- [x] publint — All good!
- [x] @arethetypeswrong/cli — No problems found, все 4 режима зелёные
- [ ] Обновить banner.svg URL на абсолютный raw.githubusercontent.com для npm-страницы
- [ ] npm publish --access public

---

## 🔧 Технические решения

**TypeScript 6.0** — удалён baseUrl, ignoreDeprecations: "6.0" в tsup.
**picocolors** — вместо chalk v5 (ESM-only).
**commander v14** — v15 требует Node 22.12+.
**CLI только CJS** — нативный __dirname, нет неоднозначности.
**FEATURE_DEPS как Record<Feature, ...>** — exhaustive record, compile-time safety.
**JSON.stringify для конфигов** — безопаснее Handlebars для JSON.
**Единый ts-construct.generator** — параметрический полиморфизм вместо трёх файлов.
**path.dirname/basename для имён** — x g class src/models/User как в Angular CLI.
**Binary aliases** — x и xpressify-cli как алиасы для удобства.
**SVG-баннер** — векторный, масштабируется без потери качества, рендерится на GitHub.
**Динамическая версия** — require('../../package.json') в CJS-контексте, eslint-disable.
**Баннер подавляется** — проверяем process.argv на --version/-V/--help/-h перед выводом.

---

## ❓ Открытые вопросы

- **github-actions фича** — FEATURE_DEPS пустой, нужно решить генерировать ли CI.
- **Windows symbolic links** — npm link требует прав админа или Developer Mode.
- **npm banner URL** — после публикации заменить относительный путь к SVG на
  абсолютный https://raw.githubusercontent.com/davids199005-oss/xpressify/main/assets/banner.svg

---

## 🐛 Troubleshooting

**npm run build падает** — запусти из D:\xpressify.
**DTS Build падает** — проверь ignoreDeprecations: "6.0" в tsup.config.ts.
**x не найдена** — открой PowerShell от администратора, повтори npm link.
**Баннер не отображается на npm** — путь к SVG должен быть абсолютным URL.

---

## 📅 История сессий

### Session 01 — 18 апреля 2026
Walking skeleton, dual-package инфраструктура, Phase 1 на 80%.

### Session 02 — 18 апреля 2026
Phase 1 завершена (Prettier, ESLint, Vitest, CI зелёный).
Phase 2 полностью реализована: утилиты, схемы, промпты, сервисы, генератор, команда new.

### Session 03 — 18 апреля 2026
Phase 3 полностью реализована: project-detector, генераторы route/middleware/
class/interface/enum, команда generate с алиасом g, binary alias x.
Phase 4 почти завершена: динамическая версия, ASCII баннер с градиентом и подписью,
SVG баннер для README, publint и attw оба зелёные. Осталось: npm publish.

### Session 04 — TBD
Финальный шаг: обновить URL баннера на абсолютный и опубликовать на npm.
