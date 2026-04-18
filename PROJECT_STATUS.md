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

