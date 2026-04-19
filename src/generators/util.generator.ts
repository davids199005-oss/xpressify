import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Генерирует utility-модуль — один файл с функцией-заготовкой.
 *
 * Отличие от ts-construct (class/interface/enum): для утилит дефолтное место —
 * каталог src/utils/ внутри проекта, а не текущая рабочая директория. Это
 * соответствует структуре скаффолдинга, где `src/utils/` создаётся изначально.
 *
 * Имя может содержать путь — 'src/utils/string-helpers' или
 * 'src/modules/auth/token-helpers' — в таком случае используется указанное
 * место и суффикс `.util.ts` добавляется к последнему сегменту.
 */
export async function generateUtil(options: GenerateOptions): Promise<void> {
  const { name, projectRoot } = options;

  const dir = path.dirname(name);
  const baseName = path.basename(name);
  const names = resolveNames(baseName);

  const outputDir = dir === '.'
    ? path.join(projectRoot, 'src', 'utils')
    : path.resolve(projectRoot, dir);

  const outputPath = path.resolve(outputDir, `${names.kebab}.util.ts`);

  await templateService.renderToFile(
    'generate/util/util.ts.hbs',
    outputPath,
    { ...names },
  );

  const displayPath = path.relative(projectRoot, outputPath).split(path.sep).join('/');
  logger.success(`Created util: ${displayPath}`);
}
