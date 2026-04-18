import { z } from 'zod';



/**
 * Типы компонентов которые можно генерировать.
 * route — генерирует router + controller + service (три файла).
 * middleware — генерирует один файл middleware.
 */
export const GenerateTypeSchema = z.enum([
  'route',
  'middleware',
  'class',
  'interface',
  'enum',
]);

export const GenerateOptionsSchema = z.object({
  // Тип генерируемого компонента
  type: GenerateTypeSchema,

  // Имя компонента — пользователь вводит в любом регистре,
  // генераторы используют resolveNames() для получения всех вариантов.
  // Например: "user-profile", "UserProfile", "userProfile" — всё принимается.
  name: z
  .string()
  .min(1, 'Component name cannot be empty')
  .regex(
    /^[a-zA-Z0-9/_-][a-zA-Z0-9/_.-]*$/,
    'Name may include path segments, e.g. src/models/User',
  ),

  // Абсолютный путь к корню проекта — определяется автоматически
  // через project-detector.service, пользователь не вводит.
  projectRoot: z.string(),
});

export type GenerateOptions = z.infer<typeof GenerateOptionsSchema>;
export type GenerateType = z.infer<typeof GenerateTypeSchema>;