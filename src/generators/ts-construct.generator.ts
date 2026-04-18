import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Генерирует TypeScript-конструкцию (class, interface или enum).
 *
 * Ключевая особенность: имя может содержать путь — например 'src/models/User'.
 * В этом случае path.dirname даёт нам 'src/models/', а path.basename даёт 'User'.
 * Файл создаётся именно по указанному пути относительно корня проекта.
 * Если путь не указан (просто 'User'), файл создаётся в текущей директории.
 */
export async function generateTsConstruct(options: GenerateOptions): Promise<void> {
  const { name, projectRoot, type } = options;

  // Разбиваем имя на путь и собственно имя компонента.
  // Например: 'src/models/User' → dir='src/models', baseName='User'
  //           'User'            → dir='.', baseName='User'
  const dir = path.dirname(name);
  const baseName = path.basename(name);
  const names = resolveNames(baseName);

  // Если пользователь указал путь — используем его относительно корня проекта.
  // Если нет (dir === '.') — создаём файл в текущей рабочей директории.
  const outputDir = dir === '.'
    ? process.cwd()
    : path.join(projectRoot, dir);

  const outputPath = path.join(outputDir, `${names.kebab}.${type}.ts`);
  const templatePath = `generate/${type}/${type}.ts.hbs`;

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  // Вычисляем красивый относительный путь для отображения пользователю
  const displayPath = path.relative(projectRoot, outputPath).replace(/\\/g, '/');
  logger.success(`Created ${type}: ${displayPath}`);
}