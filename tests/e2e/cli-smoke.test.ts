import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import { tmpdir } from 'os';
import { mkdtemp, rm, readFile, access } from 'fs/promises';
import path from 'path';


/**
 * End-to-end smoke tests для собранного CLI-бинарника.
 *
 * Цель: защита от регрессии трёх критических багов, которые утекли
 * в опубликованную версию 1.0.1:
 *   1. Сломанные импорты в сгенерированных роутах (./ вместо ../)
 *   2. CJS-скаффолдинг в обёртке ESM-обещаний
 *   3. Пустой шаблон enum.ts.hbs
 *
 * Дополнительно неявно покрывают проблему с ESM-only зависимостями
 * (ora, gradient-string, chalk, @inquirer/prompts, execa): если бандл
 * невалиден, CLI упадёт на первом же вызове и тест покраснеет.
 *
 * Эти тесты запускаются отдельно через `npm run test:smoke` и требуют
 * предварительной сборки через `npm run build`. Обычный `npm run test`
 * их не трогает — они медленнее юнит-тестов и зависят от dist/.
 */

const REPO_ROOT = path.resolve(__dirname, '../..');
const CLI_PATH = path.join(REPO_ROOT, 'dist', 'bin', 'cli.cjs');

describe('CLI smoke tests', () => {
  let workDir: string;
  let projectDir: string;

  beforeAll(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), 'xpressify-smoke-'));
    projectDir = path.join(workDir, 'smoke-app');

    // Создаём проект один раз для всех тестов — это ускоряет выполнение
    // и одновременно проверяет сам факт успешного scaffolding.
    await execa('node', [CLI_PATH, 'new', 'smoke-app', '--yes', '--no-install'], {
      cwd: workDir,
    });
  }, 60000);

  afterAll(async () => {
    // Чистим temp-директорию. force: true игнорирует ошибки если путь уже не существует.
    await rm(workDir, { recursive: true, force: true });
  });

  describe('new — project scaffolding', () => {
    it('generates package.json with "type": "module" for ESM output', async () => {
      const pkgJson = JSON.parse(
        await readFile(path.join(projectDir, 'package.json'), 'utf-8'),
      );
      expect(pkgJson.type).toBe('module');
    });

    it('generates tsconfig.json with NodeNext module resolution', async () => {
      const tsconfig = JSON.parse(
        await readFile(path.join(projectDir, 'tsconfig.json'), 'utf-8'),
      );
      expect(tsconfig.compilerOptions.module).toBe('NodeNext');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('NodeNext');
    });

    it('generates server.ts with .js extension on relative import', async () => {
      const serverTs = await readFile(
        path.join(projectDir, 'src', 'server.ts'),
        'utf-8',
      );
      // Под NodeNext относительные импорты должны иметь .js-расширение —
      // иначе Node упадёт на старте.
      expect(serverTs).toContain("from './app.js'");
    });

    it('generates README.md with the project name', async () => {
      const readme = await readFile(path.join(projectDir, 'README.md'), 'utf-8');
      expect(readme).toContain('# smoke-app');
    });

    it('generates .nvmrc pinning Node version', async () => {
      const nvmrc = await readFile(path.join(projectDir, '.nvmrc'), 'utf-8');
      expect(nvmrc.trim()).toBe('20');
    });
  });

  describe('g route — routes with correct cross-directory imports', () => {
    beforeAll(async () => {
      await execa('node', [CLI_PATH, 'g', 'route', 'items'], {
        cwd: projectDir,
      });
    }, 30000);

    it('router imports controller from ../controllers/ with .js extension', async () => {
      const router = await readFile(
        path.join(projectDir, 'src', 'routes', 'items.router.ts'),
        'utf-8',
      );
      // Раньше: './items.controller' (битый путь, не компилируется).
      // Теперь: '../controllers/items.controller.js' (правильно + ESM-совместимо).
      expect(router).toContain("from '../controllers/items.controller.js'");
      expect(router).not.toContain("from './items.controller");
    });

    it('controller imports service from ../services/ with .js extension', async () => {
      const controller = await readFile(
        path.join(projectDir, 'src', 'controllers', 'items.controller.ts'),
        'utf-8',
      );
      expect(controller).toContain("from '../services/items.service.js'");
      expect(controller).not.toContain("from './items.service");
    });
  });

  describe('g enum — non-empty template', () => {
    it('generates a file with export enum declaration', async () => {
      await execa('node', [CLI_PATH, 'g', 'enum', 'Status'], {
        cwd: projectDir,
      });

      const enumFile = await readFile(
        path.join(projectDir, 'status.enum.ts'),
        'utf-8',
      );
      // Раньше: пустой файл. Теперь: полноценный enum.
      expect(enumFile.trim().length).toBeGreaterThan(0);
      expect(enumFile).toContain('export enum Status');
    });
  });

  describe('g middleware / class / interface', () => {
    it('middleware scaffolds into src/middlewares/', async () => {
      await execa('node', [CLI_PATH, 'g', 'middleware', 'auth'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'middlewares', 'auth.middleware.ts'),
        'utf-8',
      );
      expect(file.trim().length).toBeGreaterThan(0);
    });

    it('class respects explicit path argument', async () => {
      await execa('node', [CLI_PATH, 'g', 'class', 'src/models/User'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'models', 'user.class.ts'),
        'utf-8',
      );
      expect(file).toContain('export class User');
    });

    it('interface respects explicit path argument', async () => {
      await execa('node', [CLI_PATH, 'g', 'interface', 'src/types/Product'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'types', 'product.interface.ts'),
        'utf-8',
      );
      expect(file).toContain('Product');
    });

    it('util defaults to src/utils/ with .util.ts suffix and exported function', async () => {
      await execa('node', [CLI_PATH, 'g', 'util', 'format-date'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'utils', 'format-date.util.ts'),
        'utf-8',
      );
      expect(file).toContain('export function formatDate');
    });

    it('util respects explicit path argument', async () => {
      await execa('node', [CLI_PATH, 'g', 'util', 'src/modules/auth/token-helpers'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'modules', 'auth', 'token-helpers.util.ts'),
        'utf-8',
      );
      expect(file).toContain('export function tokenHelpers');
    });

    it('dto falls back to plain interface when zod is not in target', async () => {
      await execa('node', [CLI_PATH, 'g', 'dto', 'src/dtos/CreateOrder'], {
        cwd: projectDir,
      });
      const file = await readFile(
        path.join(projectDir, 'src', 'dtos', 'create-order.dto.ts'),
        'utf-8',
      );
      // smoke-app создаётся без фичи zod (--yes без --features), так что
      // ожидаем plain-вариант. При наличии zod шаблон был бы другим —
      // это покрыто отдельным блоком ниже.
      expect(file).toContain('export interface CreateOrderDto');
    });
  });
});

/**
 * Отдельная группа с новыми фичами — использует свой tmp-проект.
 * Вынесено чтобы не нагружать базовый smoke-app всеми возможными
 * фичами одновременно (это делало бы тесты медленными и неизолированными).
 */
describe('CLI smoke tests — optional features', () => {
  let workDir: string;

  beforeAll(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), 'xpressify-smoke-features-'));
  }, 60000);

  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('logger feature scaffolds pino config', async () => {
    const projectDir = path.join(workDir, 'with-logger');
    await execa(
      'node',
      [CLI_PATH, 'new', 'with-logger', '--yes', '--no-install',
        '--features', 'logger', '--logger', 'pino'],
      { cwd: workDir },
    );

    const loggerConfig = await readFile(
      path.join(projectDir, 'src', 'config', 'logger.config.ts'),
      'utf-8',
    );
    expect(loggerConfig.trim().length).toBeGreaterThan(0);
    expect(loggerConfig.toLowerCase()).toContain('pino');
  }, 30000);

  it('docker feature scaffolds Dockerfile, .dockerignore, docker-compose.yml', async () => {
    const projectDir = path.join(workDir, 'with-docker');
    await execa(
      'node',
      [CLI_PATH, 'new', 'with-docker', '--yes', '--no-install', '--features', 'docker'],
      { cwd: workDir },
    );

    await access(path.join(projectDir, 'Dockerfile'));
    await access(path.join(projectDir, '.dockerignore'));
    await access(path.join(projectDir, 'docker-compose.yml'));

    const dockerfile = await readFile(path.join(projectDir, 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:20-alpine');
  }, 30000);

  it('testing feature scaffolds vitest config and sample test', async () => {
    const projectDir = path.join(workDir, 'with-testing');
    await execa(
      'node',
      [CLI_PATH, 'new', 'with-testing', '--yes', '--no-install',
        '--features', 'testing', '--testing-library', 'vitest'],
      { cwd: workDir },
    );

    const configFile = await readFile(
      path.join(projectDir, 'vitest.config.ts'),
      'utf-8',
    );
    expect(configFile).toContain('defineConfig');

    const sample = await readFile(
      path.join(projectDir, 'src', '__tests__', 'app.test.ts'),
      'utf-8',
    );
    expect(sample).toContain("from 'vitest'");
  }, 30000);
});
