import { z } from 'zod';

export const PackageManagerSchema = z.enum(['npm', 'pnpm', 'yarn']);

export const FeatureSchema = z.enum([
  'eslint',
  'prettier',
  'husky',
  'github-actions',
  'zod',
  'logger',
  'jwt',
]);

// Отдельная схема для выбора логгера — появляется только если выбрана фича 'logger'
export const LoggerLibrarySchema = z.enum(['pino', 'winston']);

// Регулярка валидации имени проекта.
// Экспортируется чтобы переиспользоваться в промпте без дублирования.
// Правила:
//   - только lowercase буквы, цифры и дефисы
//   - не может начинаться или заканчиваться дефисом
//   - одиночный символ тоже допустим (алтернатива через |)
export const PROJECT_NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const PROJECT_NAME_ERROR =
  'Project name must contain only lowercase letters, numbers, and hyphens';

export const NewProjectOptionsSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(214, 'Project name is too long')
    .regex(PROJECT_NAME_REGEX, PROJECT_NAME_ERROR),
  targetDir: z.string(),
  packageManager: PackageManagerSchema.default('npm'),
  features: z.array(FeatureSchema).default([]),
  // Выбор конкретной библиотеки логгера — null если фича 'logger' не выбрана
  loggerLibrary: LoggerLibrarySchema.nullable().default(null),
  installDependencies: z.boolean().default(true),
});

export type NewProjectOptions = z.infer<typeof NewProjectOptionsSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type LoggerLibrary = z.infer<typeof LoggerLibrarySchema>;
