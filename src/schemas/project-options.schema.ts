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

export const NewProjectOptionsSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(214, 'Project name is too long')
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      'Project name must contain only lowercase letters, numbers, and hyphens',
    ),
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