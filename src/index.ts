/**
 * Xpressify — публичный программный API.
 *
 * Экспортируем типы и утилиты для разработчиков которые хотят использовать
 * xpressify как библиотеку в своих скриптах или плагинах, не ограничиваясь CLI.
 *
 * Пример использования:
 *   import type { NewProjectOptions, Feature } from 'xpressify';
 *   import { resolveNames } from 'xpressify';
 */

// ─── Версия ───────────────────────────────────────────────────────────────────
// Читаем version из package.json через fs (см. utils/package-info.ts),
// не через require(), чтобы API был чистым ESM.
import { getPackageVersion } from './utils/package-info';
export const VERSION: string = getPackageVersion();

// ─── Типы схем ────────────────────────────────────────────────────────────────
export type {
  NewProjectOptions,
  PackageManager,
  Feature,
  LoggerLibrary,
  TestingLibrary,
} from './schemas/project-options.schema';

export type { GenerateOptions, GenerateType } from './schemas/generate-options.schema';

// ─── Zod-схемы (для программной валидации) ────────────────────────────────────
export {
  NewProjectOptionsSchema,
  PackageManagerSchema,
  FeatureSchema,
  LoggerLibrarySchema,
  TestingLibrarySchema,
} from './schemas/project-options.schema';

export { GenerateOptionsSchema, GenerateTypeSchema } from './schemas/generate-options.schema';

// ─── Утилиты именования ───────────────────────────────────────────────────────
export {
  resolveNames,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  pluralize,
} from './utils/naming';

// ─── Классы ошибок ────────────────────────────────────────────────────────────
export {
  XpressifyError,
  ProjectExistsError,
  InvalidProjectNameError,
  TemplateNotFoundError,
  NotXpressifyProjectError,
} from './utils/errors';
