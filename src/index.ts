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
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const VERSION: string = (require('../package.json') as { version: string }).version;

// ─── Типы схем ────────────────────────────────────────────────────────────────
export type {
  NewProjectOptions,
  PackageManager,
  Feature,
  LoggerLibrary,
} from './schemas/project-options.schema';

export type {
  GenerateOptions,
  GenerateType,
} from './schemas/generate-options.schema';

// ─── Zod-схемы (для программной валидации) ────────────────────────────────────
export {
  NewProjectOptionsSchema,
  PackageManagerSchema,
  FeatureSchema,
  LoggerLibrarySchema,
} from './schemas/project-options.schema';

export {
  GenerateOptionsSchema,
  GenerateTypeSchema,
} from './schemas/generate-options.schema';

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
