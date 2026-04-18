import { describe, it, expect } from 'vitest';
import {
  toKebabCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  pluralize,
  resolveNames,
} from '../../src/utils/naming';

describe('toKebabCase', () => {
  it('should handle kebab-case input', () => {
    expect(toKebabCase('my-app')).toBe('my-app');
  });

  it('should convert PascalCase to kebab-case', () => {
    expect(toKebabCase('MyApp')).toBe('my-app');
  });

  it('should convert camelCase to kebab-case', () => {
    expect(toKebabCase('myApp')).toBe('my-app');
  });

  it('should convert snake_case to kebab-case', () => {
    expect(toKebabCase('my_app')).toBe('my-app');
  });
});

describe('toCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(toCamelCase('my-app')).toBe('myApp');
  });

  it('should convert PascalCase to camelCase', () => {
    expect(toCamelCase('UserProfile')).toBe('userProfile');
  });

  it('should handle single word', () => {
    expect(toCamelCase('user')).toBe('user');
  });
});

describe('toPascalCase', () => {
  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('user-profile')).toBe('UserProfile');
  });

  it('should convert snake_case to PascalCase', () => {
    expect(toPascalCase('user_profile')).toBe('UserProfile');
  });

  it('should handle single word', () => {
    expect(toPascalCase('user')).toBe('User');
  });
});

describe('toSnakeCase', () => {
  it('should convert kebab-case to snake_case', () => {
    expect(toSnakeCase('my-app')).toBe('my_app');
  });

  it('should convert PascalCase to snake_case', () => {
    expect(toSnakeCase('UserProfile')).toBe('user_profile');
  });
});

describe('pluralize', () => {
  it('should add s for regular words', () => {
    expect(pluralize('user')).toBe('users');
  });

  it('should add es for words ending in s/x/z', () => {
    expect(pluralize('status')).toBe('statuses');
    expect(pluralize('box')).toBe('boxes');
  });

  it('should handle y → ies', () => {
    expect(pluralize('category')).toBe('categories');
  });

  it('should keep y → ys when preceded by vowel', () => {
    expect(pluralize('monkey')).toBe('monkeys');
  });
});

describe('resolveNames', () => {
  it('should return all name variants for kebab-case input', () => {
    const names = resolveNames('user-profile');
    expect(names.original).toBe('user-profile');
    expect(names.kebab).toBe('user-profile');
    expect(names.camel).toBe('userProfile');
    expect(names.pascal).toBe('UserProfile');
    expect(names.snake).toBe('user_profile');
  });

  it('should return correct plural variants', () => {
    const names = resolveNames('user');
    expect(names.plural).toBe('users');
    expect(names.pluralKebab).toBe('users');
  });
});