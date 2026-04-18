import { z } from 'zod';

/**
 * Список поддерживаемых package manager-ов.
 * z.enum гарантирует что придёт только одно из этих трёх значений —
 * никаких "yarn2" или опечаток типа "npn".
 */
export const PackageManagerSchema = z.enum(['npm', 'pnpm', 'yarn']);

/**
 * Список опциональных фич которые пользователь может включить.
 * Используем z.enum внутри z.array — массив из допустимых значений.
 */
export const FeatureSchema = z.enum([
  'docker',
  'eslint',
  'prettier',
  'husky',
  'github-actions',
]);

/**
 * Главная схема — всё что нужно знать генератору для создания проекта.
 *
 * Обрати внимание на валидацию имени проекта: это не просто "непустая строка".
 * Мы применяем те же правила что и npm для имён пакетов:
 * только строчные буквы, цифры и дефисы. Это важно потому что имя проекта
 * станет именем директории и полем "name" в package.json.
 */
export const NewProjectOptionsSchema = z.object({
  // Имя проекта — аргумент из CLI ("xpressify new my-app")
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(214, 'Project name is too long') // лимит npm
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      'Project name must contain only lowercase letters, numbers, and hyphens',
    ),

  // Куда создавать проект — по умолчанию текущая директория + имя проекта.
  // Генератор подставит это значение автоматически, пользователь не вводит.
  targetDir: z.string(),

  // Какой package manager использовать для установки зависимостей
  packageManager: PackageManagerSchema.default('npm'),

  // Массив выбранных фич — по умолчанию пустой (минимальный проект)
  features: z.array(FeatureSchema).default([]),

  // Устанавливать ли зависимости сразу после scaffolding
  installDependencies: z.boolean().default(true),
});

/**
 * TypeScript-тип выведенный из схемы.
 *
 * Это ключевой паттерн Zod: ты не пишешь тип вручную и не дублируешь
 * информацию. Схема — единственный источник правды, а тип выводится из неё.
 * Если добавишь новое поле в схему, тип обновится автоматически.
 */
export type NewProjectOptions = z.infer<typeof NewProjectOptionsSchema>;

/**
 * Тип для package manager — выводим из под-схемы.
 * Используется в package-manager.service.ts чтобы не дублировать union-тип.
 */
export type PackageManager = z.infer<typeof PackageManagerSchema>;

/**
 * Тип для отдельной фичи.
 */
export type Feature = z.infer<typeof FeatureSchema>;