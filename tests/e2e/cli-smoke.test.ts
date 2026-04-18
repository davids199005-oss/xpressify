import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import { tmpdir } from 'os';
import { mkdtemp, rm, readFile } from 'fs/promises';
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
});
