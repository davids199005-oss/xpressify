# Xpressify — Project Status & Roadmap

> Живой документ: обновляй в конце каждой сессии, чтобы в следующий раз быстро восстановить контекст.

---

## 📍 Где мы сейчас

**Текущая фаза:** Phase 1 — Foundation (80% завершена)
**Последняя сессия:** 18 апреля 2026
**Следующий шаг:** Настройка ESLint + Prettier + Vitest (завершение Phase 1)

---

## ⚡ Быстрый старт сессии

Выполни эти команды в начале каждой сессии, чтобы убедиться что всё работает:

```powershell
cd D:\xpressify
npm run build
node dist/bin/cli.cjs hello
git log --oneline
```

Ожидаемый результат: цветное приветствие "Hello from Xpressify!" и история коммитов.

Если что-то сломано — смотри секцию **Troubleshooting** внизу документа.

---

## ✅ Phase 1 — Foundation

### Сделано

- [x] Определена концепция проекта: Modern Express CLI (TypeScript + ESM + Zod)
- [x] Выбрано имя пакета: `xpressify` (свободно на npm, проверено)
- [x] Инициализирован git-репозиторий с `main` как дефолтной веткой
- [x] Настроен `.gitignore` с полным списком исключений
- [x] Создан `package.json` с dual-package декларацией:
  - [x] Поля `main`, `module`, `types` для legacy-консьюмеров
  - [x] Поле `exports` для современных консьюмеров (ESM + CJS)
  - [x] Поле `bin` для CLI-команды `xpressify`
  - [x] Поле `files` для контроля содержимого опубликованного пакета
  - [x] npm scripts: build, dev, test, lint, format, typecheck, prepublishOnly
- [x] Настроен `tsconfig.json`:
  - [x] TypeScript 6.0 в strict режиме
  - [x] moduleResolution: Bundler (современный подход)
  - [x] Полный набор строгих проверок (noUncheckedIndexedAccess, exactOptionalPropertyTypes и др.)
  - [x] verbatimModuleSyntax для явного разделения импортов типов и значений
  - [x] Path alias `@/*` → `./src/*`
- [x] Установлены runtime-зависимости:
  - [x] commander (парсинг CLI)
  - [x] @inquirer/prompts (интерактивные промпты)
  - [x] picocolors (цвета в терминале, ESM+CJS совместимый)
  - [x] ora (спиннеры)
  - [x] execa (запуск child-процессов)
  - [x] fs-extra (удобные fs-операции)
  - [x] handlebars (шаблонизация файлов)
  - [x] zod (валидация)
- [x] Установлены dev-зависимости: typescript, tsup, vitest, @types/node, @types/fs-extra
- [x] Настроен `tsup.config.ts` с двумя конфигурациями:
  - [x] Библиотечная сборка: ESM + CJS, с генерацией `.d.ts` и `.d.cts`
  - [x] CLI-сборка: только CJS, с shebang-баннером, в `dist/bin/`
  - [x] skipNodeModulesBundle для правильной работы зависимостей
  - [x] ignoreDeprecations для DTS-генерации (workaround для TS 6.0)
- [x] Создан `src/index.ts` — публичный API библиотеки (VERSION, greet)
- [x] Создан `src/bin/cli.ts` — CLI-скелет с командой `hello`
- [x] Проверена полная сборка: все 8 артефактов генерируются корректно
- [x] Проверен запуск CLI: `node dist/bin/cli.cjs hello` выводит цветное приветствие
- [x] Создан базовый README.md с vision и roadmap

### Осталось до завершения Phase 1

- [ ] **Настроить ESLint**
  - [ ] Установить: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`
  - [ ] Создать `eslint.config.js` (flat config, современный формат)
  - [ ] Настроить правила под наш strict TypeScript
  - [ ] Добавить `npm run lint` и проверить на текущем коде
- [ ] **Настроить Prettier**
  - [ ] Установить: `prettier`
  - [ ] Создать `.prettierrc` с согласованным стилем
  - [ ] Создать `.prettierignore`
  - [ ] Прогнать `npm run format` на всём проекте
- [ ] **Настроить Vitest**
  - [ ] Создать `vitest.config.ts`
  - [ ] Написать первый тест: `tests/index.test.ts` для функции `greet`
  - [ ] Настроить coverage через `@vitest/coverage-v8`
  - [ ] Проверить `npm run test` и `npm run test:coverage`
- [ ] **Настроить pre-commit hook через husky + lint-staged** (опционально)
  - [ ] Установить husky и lint-staged
  - [ ] Настроить pre-commit: lint + format только на изменённых файлах
- [ ] **GitHub Actions CI**
  - [ ] Создать `.github/workflows/ci.yml`
  - [ ] Запускать typecheck + lint + test + build на каждый push и PR
  - [ ] Матрица Node.js: 20 и 22
- [ ] **Создать LICENSE (MIT)**
- [ ] **Создать репозиторий на GitHub и запушить**
  - [ ] `gh repo create xpressify --public`
  - [ ] `git push -u origin main`

---

## 🚀 Phase 2 — Scaffolding (`xpressify new`)

Запланирована после завершения Phase 1.

### Архитектура

- [ ] **Zod-схемы входных данных**
  - [ ] `src/schemas/project-options.schema.ts` — NewProjectOptionsSchema
  - [ ] Валидация: имя проекта, package manager, выбранные features
- [ ] **Интерактивные промпты**
  - [ ] `src/prompts/project.prompts.ts` — используя @inquirer/prompts
  - [ ] Вопросы: имя, features (docker, eslint, prettier, husky), pm (npm/pnpm/yarn)
- [ ] **Сервисы (SRP: один файл = одна ответственность)**
  - [ ] `src/services/template.service.ts` — загрузка и рендеринг Handlebars
  - [ ] `src/services/filesystem.service.ts` — безопасные fs-операции
  - [ ] `src/services/package-manager.service.ts` — detect + install через execa
  - [ ] `src/services/project-detector.service.ts` — определение xpressify-проекта
- [ ] **Утилиты**
  - [ ] `src/utils/logger.ts` — обёртка над picocolors + ora
  - [ ] `src/utils/naming.ts` — kebab/camel/pascal case, pluralize
  - [ ] `src/utils/paths.ts` — ESM-safe __dirname (хотя мы в CJS, но на будущее)
  - [ ] `src/utils/errors.ts` — custom ошибки (ProjectExistsError и др.)
- [ ] **Generator**
  - [ ] `src/generators/project.generator.ts` — оркестрация scaffolding
- [ ] **Command**
  - [ ] `src/commands/new.command.ts` — регистрация команды в commander
  - [ ] Подключить в `src/bin/cli.ts`
- [ ] **Шаблоны (`templates/project/`)**
  - [ ] package.json.hbs с Express 5 + TypeScript + Zod + Pino + dotenv + tsx
  - [ ] tsconfig.json.hbs
  - [ ] .env.example.hbs, .gitignore
  - [ ] README.md.hbs
  - [ ] src/app.ts.hbs, src/server.ts.hbs
  - [ ] src/config/env.config.ts.hbs, src/config/logger.config.ts.hbs
  - [ ] src/middlewares/error.middleware.ts.hbs, not-found.middleware.ts.hbs
  - [ ] src/modules/health/* — пример модуля
- [ ] **E2E-тесты**
  - [ ] Генерация проекта в tmp-директории
  - [ ] Проверка что `npm install` проходит
  - [ ] Проверка что `tsc --noEmit` проходит на сгенерированном проекте

---

## 🎯 Phase 3 — Generate (`xpressify generate`)

Запланирована после Phase 2.

- [ ] Zod-схема `GenerateOptionsSchema`
- [ ] Команда `src/commands/generate.command.ts` с алиасом `g`
- [ ] Генераторы:
  - [ ] `src/generators/route.generator.ts`
  - [ ] `src/generators/controller.generator.ts`
  - [ ] `src/generators/service.generator.ts`
  - [ ] `src/generators/middleware.generator.ts`
- [ ] Шаблоны в `templates/generate/`
- [ ] Unit-тесты каждого генератора

---

## 🎁 Phase 4 — Polish & Publish

Финальная фаза перед первым релизом.

- [ ] Расширенный README с примерами и GIF-демо (через terminalizer или vhs)
- [ ] CHANGELOG.md с conventional changelog
- [ ] Проверка через `publint` перед публикацией
- [ ] Проверка через `@arethetypeswrong/cli` что типы dual-package корректны
- [ ] Динамическая версия: читать из package.json вместо хардкода
- [ ] Добавить команду `xpressify --help` как default когда запущен без аргументов
- [ ] Error handling: красивые сообщения об ошибках, код выхода
- [ ] Keywords-оптимизация для npm SEO
- [ ] Публикация: `npm publish --access public`
- [ ] Объявление в соцсетях / dev-сообществах

---

## 🔧 Технические решения и их обоснования

Когда вернёшься к проекту и забудешь почему что-то сделано именно так — загляни сюда.

### TypeScript 6.0

Был подтянут автоматически при `npm install typescript`. Оказалось свежее, чем ожидалось. Адаптация:
- Удалён `baseUrl` из `tsconfig.json` (depreciated в 6.0)
- В `tsup.config.ts` для DTS-сборки добавлен `ignoreDeprecations: "6.0"` как workaround

### picocolors вместо chalk

chalk v5 — ESM-only. Для dual-package сборки это создаёт сложности в CJS-части.
picocolors работает одинаково в обоих форматах, zero-dependency, <1KB.

### commander v14

Стабильный LTS, v15 уже ESM-only и требует Node 22.12+. Остаёмся на 14 ради
совместимости с Node 20 LTS.

### CLI-бинарник только в CJS

Избегаем неоднозначности: Node при запуске `.js`-файла смотрит на `type` в
ближайшем package.json, что может привести к непредсказуемому поведению при
глобальной установке. `.cjs` однозначно интерпретируется как CommonJS.
Бонус: нативный `__dirname` без shim-ов через `import.meta.url`.

### skipNodeModulesBundle: true

Зависимости остаются внешними и устанавливаются через `dependencies` нашего
пакета. Это правильно для CLI-инструментов и избавляет от дублирования.

### Path aliases только внутри

`@/*` работает для кода, но в публичных `.d.ts` может оставаться неразрешённым.
Правило: не использовать aliases в типах публичного API (в `src/index.ts`).
Если всплывёт проблема — решать через resolve-tspaths или отказаться от aliases.

---

## ❓ Открытые вопросы

Вопросы, которые отложены до момента когда станут актуальны.

- **TypeScript 6.0 и commander** — пока проблем нет, но следить за совместимостью
- **Windows symbolic links** — `npm link` требует прав админа или Developer Mode,
  отметить в docs для контрибьюторов
- **@davids199005-oss scope** — возможно позже стоит зарегистрировать более
  короткий npm scope для личного бренда (@davidv или похожее)

---

## 🐛 Troubleshooting

Частые проблемы, с которыми ты можешь столкнуться при возвращении к проекту.

### `npm run build` падает с "No input files"

Скорее всего ты запустил команду не из корня проекта. Проверь `pwd` и убедись
что находишься в `D:\xpressify`.

### `npx tsc --noEmit` ругается на `baseUrl`

Значит в `tsconfig.json` снова появился `baseUrl`. Проверь и удали.

### DTS Build падает при сборке

Убедись что в `tsup.config.ts` первая конфигурация имеет:
```typescript
dts: {
  compilerOptions: {
    ignoreDeprecations: "6.0",
  },
},
```

### `xpressify` команда не найдена после `npm link`

На Windows symbolic links требуют прав админа. Закрой PowerShell, открой новый
с правами администратора, повтори `npm link`. Или включи Developer Mode в
настройках Windows.

### Сборка проходит, но `dist` пустой

Убедись что в `package.json` поле `files` включает `"dist"`, иначе `npm pack`
не будет включать собранные артефакты в опубликованный пакет.

---

## 📅 История сессий

### Session 01 — 18 апреля 2026

Первая сессия. Прошли весь цикл от идеи до работающего walking skeleton.
Phase 1 выполнена на 80%, остались только quality-инструменты (lint, format, test).

**Ключевые достижения:** первый успешный `npm run build`, первое работающее
`node dist/bin/cli.cjs hello`, полная dual-package инфраструктура.

**Ключевые препятствия:** имя `expressify-cli` оказалось занято, пришлось долго
искать свободное и пришли к `xpressify`. TypeScript 6.0 потребовал адаптации
конфига. DTS-генерация упала с депрекацией `baseUrl`, решено через
`ignoreDeprecations`.

### Session 02 — TBD

Планируется завершить Phase 1: настроить ESLint, Prettier, Vitest, создать
первые тесты и GitHub Actions CI. Затем запушить в публичный репозиторий на GitHub.
