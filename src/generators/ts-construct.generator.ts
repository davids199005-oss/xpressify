import fs from 'fs/promises';
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
 * projectRoot. Проверка учитывает symlink'и — мы резолвим канонические пути
 * через fs.realpath, иначе злоумышленник (или случайный промах) с symlink'ом
 * внутри проекта мог бы создать файл за его пределами.
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

  // Проверка границ проекта с учётом symlink'ов.
  // Проверяем только случай с явным путём — генерация в cwd безопасна
  // по определению (пользователь явно попросил именно туда).
  if (dir !== '.') {
    await assertWithinProject(outputPath, projectRoot, name);
  }

  const templatePath = `generate/${type}/${type}.ts.hbs`;

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  // Красивый относительный путь для вывода — всегда с прямыми слэшами,
  // чтобы пользователи на Windows не путались и чтобы тесты (e2e smoke)
  // могли писать единые assert'ы.
  const displayPath = toPosix(path.relative(projectRoot, outputPath));
  logger.success(`Created ${type}: ${displayPath}`);
}

/**
 * Приводит путь к posix-виду (слэши только прямые).
 * Используется для отображения пользователю и для сравнений, которые
 * должны быть одинаковыми на разных ОС.
 */
function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Бросает XpressifyError если outputPath (после резолва symlink'ов) выходит
 * за пределы projectRoot. Резолвит сначала родительскую директорию (файла
 * ещё нет), затем сравнивает канонический родитель с каноническим projectRoot.
 */
async function assertWithinProject(
  outputPath: string,
  projectRoot: string,
  originalName: string,
): Promise<void> {
  const realProjectRoot = await fs.realpath(projectRoot);

  // Находим ближайший существующий предок outputPath. Файла может ещё не быть,
  // и промежуточные директории могут отсутствовать — это штатная ситуация
  // для генератора. Поэтому идём вверх пока realpath не перестанет падать.
  let ancestor = path.dirname(outputPath);
  let realAncestor: string | null = null;
  while (true) {
    try {
      realAncestor = await fs.realpath(ancestor);
      break;
    } catch {
      const parent = path.dirname(ancestor);
      if (parent === ancestor) break;
      ancestor = parent;
    }
  }

  // Если вообще не смогли ничего зарезолвить (теоретически невозможно —
  // корень файловой системы всегда существует), фолбэк на path.resolve.
  const effectiveAncestor = realAncestor ?? path.resolve(ancestor);

  // Собираем «виртуальный» канонический путь результата: берём
  // зарезолвленного предка и приклеиваем остаток, который ещё не существует.
  const remainder = path.relative(ancestor, outputPath);
  const canonicalOutput = path.resolve(effectiveAncestor, remainder);

  const rootWithSep = realProjectRoot.endsWith(path.sep)
    ? realProjectRoot
    : realProjectRoot + path.sep;

  if (
    canonicalOutput !== realProjectRoot &&
    !canonicalOutput.startsWith(rootWithSep)
  ) {
    throw new XpressifyError(
      `Refusing to create file outside of project root: "${toPosix(canonicalOutput)}". ` +
        `The path "${originalName}" resolved outside of "${toPosix(realProjectRoot)}".`,
    );
  }
}
