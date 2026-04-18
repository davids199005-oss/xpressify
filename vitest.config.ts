import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Глобальные хелперы (describe, it, expect) без импорта в каждом файле
    globals: true,

    // Среда выполнения — Node.js (не браузер)
    environment: 'node',

    // Откуда брать тесты — все юнит-тесты в tests/, но e2e смоук-тесты
    // исключены отсюда и запускаются отдельно через npm run test:smoke.
    // Причина разделения: смоук-тесты спавнят реальные процессы CLI и
    // требуют предварительной сборки (dist/), они медленнее и не должны
    // блокировать быструю обратную связь от юнит-тестов.
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],

    // Coverage — отчёт о покрытии кода тестами
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // Исключаем точку входа CLI — там нечего тестировать юнит-тестами
      exclude: ['src/bin/**'],
    },
  },
});
