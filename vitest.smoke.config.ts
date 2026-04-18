import { defineConfig } from 'vitest/config';

/**
 * Конфиг для end-to-end смоук-тестов CLI.
 *
 * Эти тесты спавнят реальные процессы node для собранного dist/bin/cli.cjs,
 * поэтому требуют предварительной сборки (npm run build) и выполняются
 * заметно медленнее юнит-тестов. Запускаются через npm run test:smoke.
 *
 * В CI этот шаг идёт после build и защищает от регрессии критических багов,
 * которые утекли в 1.0.1: сломанные импорты роутов, CJS-скаффолдинг,
 * ESM-only зависимости CLI.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    include: ['tests/e2e/**/*.test.ts'],

    // Смоук-тесты запускают реальные процессы — таймаут хуков beforeAll/afterAll
    // нужно поднять выше дефолтных 5 секунд, иначе первичный scaffolding
    // может не успеть на медленных CI-раннерах.
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
