import { describe, it, expect } from 'vitest';
import {
  VERSION,
  NewProjectOptionsSchema,
  GenerateOptionsSchema,
  FeatureSchema,
  TestingLibrarySchema,
  resolveNames,
  XpressifyError,
  ProjectExistsError,
  TemplateNotFoundError,
} from '../src/index';
import { applyFeatureDependencies, getAutoAddedFeatures } from '../src/utils/feature-dependencies';
import { isError, getErrorMessage } from '../src/utils/errors';

describe('VERSION', () => {
  it('should match package.json version', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json') as { version: string };
    expect(VERSION).toBe(pkg.version);
  });

  it('should be a valid semver string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('NewProjectOptionsSchema', () => {
  it('should parse valid options with defaults', () => {
    const result = NewProjectOptionsSchema.parse({
      name: 'my-app',
      targetDir: '/tmp/my-app',
    });
    expect(result.name).toBe('my-app');
    expect(result.packageManager).toBe('npm');
    expect(result.features).toEqual([]);
    expect(result.loggerLibrary).toBeNull();
    expect(result.installDependencies).toBe(true);
  });

  it('should reject invalid project name', () => {
    expect(() =>
      NewProjectOptionsSchema.parse({ name: 'My App!', targetDir: '/tmp' }),
    ).toThrow();
  });

  it('should reject empty project name', () => {
    expect(() =>
      NewProjectOptionsSchema.parse({ name: '', targetDir: '/tmp' }),
    ).toThrow();
  });
});

describe('GenerateOptionsSchema', () => {
  it('should parse valid generate options', () => {
    const result = GenerateOptionsSchema.parse({
      type: 'route',
      name: 'users',
      projectRoot: '/tmp/my-app',
    });
    expect(result.type).toBe('route');
    expect(result.name).toBe('users');
  });

  it('should accept path notation in name', () => {
    const result = GenerateOptionsSchema.parse({
      type: 'class',
      name: 'src/models/User',
      projectRoot: '/tmp/my-app',
    });
    expect(result.name).toBe('src/models/User');
  });

  it('should reject unknown generate type', () => {
    expect(() =>
      GenerateOptionsSchema.parse({ type: 'component', name: 'btn', projectRoot: '/tmp' }),
    ).toThrow();
  });

  it('should accept the new dto, test and util types', () => {
    expect(() =>
      GenerateOptionsSchema.parse({ type: 'dto', name: 'User', projectRoot: '/tmp' }),
    ).not.toThrow();
    expect(() =>
      GenerateOptionsSchema.parse({ type: 'test', name: 'users', projectRoot: '/tmp' }),
    ).not.toThrow();
    expect(() =>
      GenerateOptionsSchema.parse({ type: 'util', name: 'format-date', projectRoot: '/tmp' }),
    ).not.toThrow();
  });
});

describe('FeatureSchema', () => {
  it('should accept all valid features', () => {
    const features = [
      'eslint',
      'prettier',
      'husky',
      'github-actions',
      'zod',
      'logger',
      'jwt',
      'docker',
      'testing',
    ];
    for (const f of features) {
      expect(() => FeatureSchema.parse(f)).not.toThrow();
    }
  });

  it('should reject unknown features', () => {
    expect(() => FeatureSchema.parse('prisma')).toThrow();
  });
});

describe('TestingLibrarySchema', () => {
  it('accepts vitest and jest', () => {
    expect(() => TestingLibrarySchema.parse('vitest')).not.toThrow();
    expect(() => TestingLibrarySchema.parse('jest')).not.toThrow();
  });

  it('rejects anything else', () => {
    expect(() => TestingLibrarySchema.parse('mocha')).toThrow();
  });
});

describe('applyFeatureDependencies', () => {
  it('adds eslint and prettier when husky is selected', () => {
    const result = applyFeatureDependencies(['husky']);
    expect(result).toContain('eslint');
    expect(result).toContain('prettier');
    expect(result).toContain('husky');
  });

  it('is idempotent — adding husky twice does not duplicate deps', () => {
    const result = applyFeatureDependencies(['husky', 'eslint']);
    expect(result.filter((f) => f === 'eslint')).toHaveLength(1);
  });

  it('leaves unrelated feature sets alone', () => {
    const result = applyFeatureDependencies(['zod', 'jwt']);
    expect(result.sort()).toEqual(['jwt', 'zod']);
  });

  it('does not mutate its input', () => {
    const input = ['husky'] as const;
    const copy = [...input];
    applyFeatureDependencies([...input]);
    expect([...input]).toEqual(copy);
  });
});

describe('getAutoAddedFeatures', () => {
  it('reports only features that were not originally selected', () => {
    const result = getAutoAddedFeatures(['husky'], ['husky', 'eslint', 'prettier']);
    expect(result.sort()).toEqual(['eslint', 'prettier']);
  });

  it('returns empty when nothing was auto-added', () => {
    const result = getAutoAddedFeatures(['zod'], ['zod']);
    expect(result).toEqual([]);
  });
});

describe('isError / getErrorMessage', () => {
  it('isError narrows Error instances', () => {
    expect(isError(new Error('boom'))).toBe(true);
    expect(isError(new XpressifyError('x'))).toBe(true);
    expect(isError('string')).toBe(false);
    expect(isError(null)).toBe(false);
  });

  it('getErrorMessage unwraps message or stringifies fallback', () => {
    expect(getErrorMessage(new XpressifyError('hello'))).toBe('hello');
    expect(getErrorMessage(new Error('oops'))).toBe('oops');
    expect(getErrorMessage('raw string')).toBe('raw string');
    expect(getErrorMessage(null)).toBe('null');
  });
});

describe('resolveNames (re-exported from index)', () => {
  it('should correctly resolve all name variants', () => {
    const names = resolveNames('user-profile');
    expect(names.kebab).toBe('user-profile');
    expect(names.pascal).toBe('UserProfile');
    expect(names.camel).toBe('userProfile');
  });
});

describe('Error classes', () => {
  it('XpressifyError should be instanceof Error', () => {
    const err = new XpressifyError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('XpressifyError');
  });

  it('ProjectExistsError should be instanceof XpressifyError', () => {
    const err = new ProjectExistsError('my-app');
    expect(err).toBeInstanceOf(XpressifyError);
    expect(err.message).toContain('my-app');
  });

  it('TemplateNotFoundError should include template path in message', () => {
    const err = new TemplateNotFoundError('generate/route/router.ts.hbs');
    expect(err.message).toContain('generate/route/router.ts.hbs');
  });
});
