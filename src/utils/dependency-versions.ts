/**
 * Версии зависимостей, которые CLI ставит в сгенерированный проект.
 *
 * ЕДИНОЕ МЕСТО ПРАВДЫ — если хочешь обновить какую-то зависимость,
 * делай это только здесь. Генератор и установщик всегда используют эти constraints.
 *
 * Почему версии запиннены, а не установка идёт "latest":
 * Если в npm install передать просто "express", npm поставит текущую latest.
 * Когда Express 6 выйдет с breaking changes — все новые пользователи CLI
 * получат сломанный сгенерированный проект на следующий же день. Неприемлемо.
 *
 * Политика версионирования:
 * - используем caret (^) — пользователь получает patch/minor-обновления в рамках мажора
 * - мажор закрепляем явно под тот, который проверен и работает в наших шаблонах
 * - при обновлении мажора CLI бампает СВОЮ версию (breaking change для сгенерированных проектов)
 *
 * Проверка актуальности: Renovate/Dependabot на самом репозитории CLI
 * + раз в квартал ревью вручную.
 */
export const DEP_VERSIONS = {
  // ─── Runtime dependencies ─────────────────────────────────────────────────
  express: '^5.1.0',
  cors: '^2.8.5',
  helmet: '^8.1.0',
  'express-rate-limit': '^8.3.2',
  dotenv: '^17.0.0',
  zod: '^4.3.6',

  // auth feature
  jsonwebtoken: '^9.0.2',
  bcryptjs: '^3.0.2',

  // loggers
  pino: '^9.5.0',
  'pino-pretty': '^13.0.0',
  winston: '^3.17.0',

  // ─── Dev dependencies ─────────────────────────────────────────────────────
  typescript: '^6.0.3',
  tsx: '^4.20.0',
  nodemon: '^3.1.9',

  // types
  '@types/express': '^5.0.0',
  '@types/cors': '^2.8.17',
  '@types/node': '^22.0.0',
  '@types/jsonwebtoken': '^9.0.7',
  '@types/bcryptjs': '^3.0.0',
  '@types/jest': '^30.0.0',

  // linting & formatting
  eslint: '^10.2.0',
  '@eslint/js': '^10.2.0',
  '@typescript-eslint/parser': '^8.58.0',
  '@typescript-eslint/eslint-plugin': '^8.58.0',
  'eslint-config-prettier': '^10.1.0',
  globals: '^17.0.0',
  prettier: '^3.8.0',

  // git hooks
  husky: '^9.1.7',
  'lint-staged': '^16.0.0',

  // testing
  vitest: '^4.1.0',
  jest: '^30.0.0',
  'ts-jest': '^30.0.0',
} as const;

export type DependencyName = keyof typeof DEP_VERSIONS;

/**
 * Форматирует имя пакета в виде "name@^version" для передачи в npm/pnpm/yarn install.
 * Если пакет отсутствует в DEP_VERSIONS — возвращает просто имя (fallback на latest),
 * но логирует предупреждение чтобы такие случаи было легко заметить на ревью.
 */
export function formatDep(name: string): string {
  if (name in DEP_VERSIONS) {
    return `${name}@${DEP_VERSIONS[name as DependencyName]}`;
  }
  // Намеренно не throws: лучше сгенерировать проект с unpinned-зависимостью
  // и напечатать предупреждение, чем падать в production для пользователя.
  // При добавлении новой фичи разработчик CLI увидит это на smoke-тестах.
  console.warn(`[xpressify] Dependency "${name}" is not pinned in DEP_VERSIONS. Using latest.`);
  return name;
}
