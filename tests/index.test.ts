import { describe, it, expect } from 'vitest';
import { VERSION, greet } from '../src/index';

describe('VERSION', () => {
  it('should be a valid semver string', () => {
    // Проверяем формат X.Y.Z — простая защита от случайной поломки экспорта
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('greet', () => {
  it('should return a greeting with the given name', () => {
    const result = greet('World');
    expect(result).toBe('Hello From Xpressify, World!');
  });

  it('should include the name in the output', () => {
    // Второй тест проверяет поведение на другом входе — это называется
    // parametric thinking: функция должна работать не только для одного значения
    const result = greet('David');
    expect(result).toContain('David');
  });
});