import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Глобальные хелперы (describe, it, expect) без импорта в каждом файле
    globals: true,

    // Среда выполнения — Node.js (не браузер)
    environment: 'node',

    // Откуда брать тесты
    include: ['tests/**/*.test.ts'],

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