import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import { assertWithinProject, toPosix } from './project-boundary';
import type { GenerateOptions } from '../schemas/generate-options.schema';

/**
 * Дефолтные директории для каждого типа конструкции относительно projectRoot.
 * Используются когда пользователь указывает только имя без пути.
 * По аналогии с route → src/routes, util → src/utils.
 */
const DEFAULT_DIRS: Record<'class' | 'interface' | 'enum', string> = {
  class: 'src/classes',
  interface: 'src/interfaces',
  enum: 'src/enums',
};

/**
 * Генерирует TypeScript-конструкцию (class, interface или enum).
 *
 * Поведение:
 *   - `g class User`            → projectRoot/src/classes/user.class.ts
 *   - `g interface Product`     → projectRoot/src/interfaces/product.interface.ts
 *   - `g enum Status`           → projectRoot/src/enums/status.enum.ts
 *   - `g class src/models/User` → projectRoot/src/models/user.class.ts
 *
 * Ключевое: результат зависит ТОЛЬКО от projectRoot (определяется
 * через upward-traversal до package.json), а не от текущей рабочей
 * директории. Запуск из любой подпапки проекта даёт один и тот же файл.
 *
 * Безопасность: путь нормализуется и проверяется что он не выходит за
 * пределы projectRoot с учётом symlink'ов через fs.realpath.
 */
export async function generateTsConstruct(options: GenerateOptions): Promise<void> {
  const { name, projectRoot, type } = options;

  // Разбиваем имя на путь и собственно имя компонента.
  // Например: 'src/models/User' → dir='src/models', baseName='User'
  //           'User'            → dir='.', baseName='User'
  const dir = path.dirname(name);
  const baseName = path.basename(name);
  const names = resolveNames(baseName);

  // Если путь не указан — используем типовую папку для конструкции;
  // иначе — указанный путь относительно projectRoot.
  const relativeDir = dir === '.' ? DEFAULT_DIRS[type as keyof typeof DEFAULT_DIRS] : dir;
  const outputDir = path.resolve(projectRoot, relativeDir);

  const outputPath = path.resolve(outputDir, `${names.kebab}.${type}.ts`);

  // Проверяем границы всегда — даже для дефолтного пути. Это упрощает
  // модель безопасности и закрывает крайний случай, если в DEFAULT_DIRS
  // когда-нибудь появится выражение, зависящее от пользовательского ввода.
  await assertWithinProject(outputPath, projectRoot, name);

  const templatePath = `generate/${type}/${type}.ts.hbs`;

  await templateService.renderToFile(templatePath, outputPath, { ...names });

  const displayPath = toPosix(path.relative(projectRoot, outputPath));
  logger.success(`Created ${type}: ${displayPath}`);
}
