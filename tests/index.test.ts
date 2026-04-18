import { describe, it, expect } from 'vitest';
import {
  VERSION,
  NewProjectOptionsSchema,
  GenerateOptionsSchema,
  FeatureSchema,
  resolveNames,
  XpressifyError,
  ProjectExistsError,
  TemplateNotFoundError,
} from '../src/index';

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
});

describe('FeatureSchema', () => {
  it('should accept all valid features', () => {
    const features = ['eslint', 'prettier', 'husky', 'github-actions', 'zod', 'logger', 'jwt'];
    for (const f of features) {
      expect(() => FeatureSchema.parse(f)).not.toThrow();
    }
  });

  it('should reject unknown features', () => {
    expect(() => FeatureSchema.parse('docker')).toThrow();
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
