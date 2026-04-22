import fs from 'fs/promises';
import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import { assertWithinProject, toPosix } from './project-boundary';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Генерирует DTO (data transfer object).
 *
 * Поведение адаптивно:
 *   - Если в target-проекте в dependencies/devDependencies есть 'zod' —
 *     создаём Zod-schema + тип через z.infer.
 *   - Если нет — создаём обычный TypeScript interface.
 *
 * Мы не устанавливаем Zod автоматически: это слишком агрессивно для generate,
 * который должен быть быстрым (100мс), не сетевым.
 *
 * Имя может содержать путь, аналогично ts-construct: 'src/dtos/User' →
 * файл 'src/dtos/user.dto.ts'.
 */
export async function generateDto(options: GenerateOptions): Promise<void> {
  const { name, projectRoot } = options;

  const dir = path.dirname(name);
  const baseName = path.basename(name);
  const names = resolveNames(baseName);

  const outputDir =
    dir === '.' ? path.join(projectRoot, 'src', 'dtos') : path.resolve(projectRoot, dir);

  const outputPath = path.resolve(outputDir, `${names.kebab}.dto.ts`);

  if (dir !== '.') {
    await assertWithinProject(outputPath, projectRoot, name);
  }

  const hasZod = await projectHasZod(projectRoot);
  const templatePath = hasZod ? 'generate/dto/dto.zod.ts.hbs' : 'generate/dto/dto.plain.ts.hbs';

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  const displayPath = toPosix(path.relative(projectRoot, outputPath));
  logger.success(`Created dto: ${displayPath}`);

  if (!hasZod) {
    logger.dim(
      `\n  ℹ Zod is not in this project — generated a plain interface. ` +
        `Install zod for schema-validated DTOs: npm install zod`,
    );
  }
}

/**
 * Проверяет есть ли zod в package.json target-проекта.
 * Используем простое чтение файла — никаких require(), чтобы работало в ESM.
 */
async function projectHasZod(projectRoot: string): Promise<boolean> {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(pkg.dependencies?.zod ?? pkg.devDependencies?.zod);
  } catch {
    // Нет package.json или невалидный JSON — возвращаем false, идём по plain-пути.
    return false;
  }
}
