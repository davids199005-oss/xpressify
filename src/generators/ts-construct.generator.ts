import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import { XpressifyError } from '../utils/errors';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Генерирует TypeScript-конструкцию (class, interface или enum).
 *
 * Ключевая особенность: имя может содержать путь — например 'src/models/User'.
 * В этом случае path.dirname даёт нам 'src/models/', а path.basename даёт 'User'.
 * Файл создаётся именно по указанному пути относительно корня проекта.
 * Если путь не указан (просто 'User'), файл создаётся в текущей директории.
 *
 * Безопасность: путь нормализуется и проверяется что он не выходит за пределы
 * projectRoot. Без этой проверки пользователь мог бы передать '../../etc/passwd'
 * и создать файл вне проекта.
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
    : path.resolve(projectRoot, dir);

  const outputPath = path.resolve(outputDir, `${names.kebab}.${type}.ts`);

  // Проверка границ проекта: нормализованный путь должен начинаться с projectRoot
  // (либо с cwd когда пользователь не указал путь — в этом случае cwd обычно
  // внутри проекта, но явно не запрещаем работу вне проекта если dir === '.').
  // Проверяем только случай с явным путём, чтобы не мешать работе с относительными
  // путями от cwd, но предотвратить '../../outside-project' диверсии.
  if (dir !== '.' && !outputPath.startsWith(path.resolve(projectRoot) + path.sep)) {
    throw new XpressifyError(
      `Refusing to create file outside of project root: "${outputPath}". ` +
        `The path "${name}" resolved outside of "${projectRoot}".`,
    );
  }

  const templatePath = `generate/${type}/${type}.ts.hbs`;

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  // Вычисляем красивый относительный путь для отображения пользователю
  const displayPath = path.relative(projectRoot, outputPath).replace(/\\/g, '/');
  logger.success(`Created ${type}: ${displayPath}`);
}
