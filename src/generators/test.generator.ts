import fs from 'fs/promises';
import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import { XpressifyError } from '../utils/errors';
import { assertWithinProject, toPosix } from './project-boundary';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Генерирует заготовку теста в стиле того фреймворка, который уже стоит
 * в target-проекте.
 *
 * Определение фреймворка:
 *   - vitest в devDependencies → Vitest-шаблон
 *   - jest в devDependencies   → Jest-шаблон
 *   - ни того ни другого       → ошибка с подсказкой как установить
 *
 * Имя может содержать путь. По умолчанию тест создаётся рядом с папкой
 * src/__tests__/ — универсальное место где его найдут оба фреймворка.
 */
export async function generateTest(options: GenerateOptions): Promise<void> {
  const { name, projectRoot } = options;

  const dir = path.dirname(name);
  const baseName = path.basename(name);
  const names = resolveNames(baseName);

  const framework = await detectTestFramework(projectRoot);

  const outputDir = dir === '.'
    ? path.join(projectRoot, 'src', '__tests__')
    : path.resolve(projectRoot, dir);

  const outputPath = path.resolve(outputDir, `${names.kebab}.test.ts`);
  if (dir !== '.') {
    await assertWithinProject(outputPath, projectRoot, name);
  }
  const templatePath = `generate/test/${framework}.test.ts.hbs`;

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  const displayPath = toPosix(path.relative(projectRoot, outputPath));
  logger.success(`Created ${framework} test: ${displayPath}`);
}

type TestFramework = 'vitest' | 'jest';

async function detectTestFramework(projectRoot: string): Promise<TestFramework> {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };

    if (all.vitest) return 'vitest';
    if (all.jest) return 'jest';
  } catch {
    // Падение чтения — игнорируем, сообщаем об отсутствии фреймворка ниже.
  }

  throw new XpressifyError(
    'No test framework detected in package.json. ' +
      'Install vitest (recommended): npm install -D vitest, ' +
      'or jest: npm install -D jest @types/jest ts-jest.',
  );
}