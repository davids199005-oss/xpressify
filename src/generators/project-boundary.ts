import fs from 'fs/promises';
import path from 'path';
import { XpressifyError } from '../utils/errors';

/**
 * Приводит путь к posix-виду (слэши только прямые).
 * Используется для отображения пользователю и для сравнений, которые
 * должны быть одинаковыми на разных ОС.
 */
export function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Бросает XpressifyError если outputPath (после резолва symlink'ов) выходит
 * за пределы projectRoot. Резолвит сначала родительскую директорию (файла
 * ещё нет), затем сравнивает канонический родитель с каноническим projectRoot.
 */
export async function assertWithinProject(
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
