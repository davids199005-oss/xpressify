import path from 'path';
import type { Command } from 'commander';
import { askProjectQuestions } from '../prompts/project.prompts';
import { generateProject } from '../generators/project.generator';
import { NewProjectOptionsSchema } from '../schemas/project-options.schema';
import { logger } from '../utils/logger';
import { XpressifyError } from '../utils/errors';

/**
 * Регистрирует команду 'new' в экземпляре commander.
 *
 * Обрати внимание на паттерн: функция принимает program и добавляет к нему
 * команду, вместо того чтобы создавать program внутри. Это называется
 * dependency injection на минималках — cli.ts контролирует жизненный цикл
 * program, а команды просто регистрируют себя. Это важно для тестируемости:
 * в тестах можно создать тестовый program и зарегистрировать команду на нём.
 */
export function registerNewCommand(program: Command): void {
  program
    .command('new [name]')
    .description('Scaffold a new Express + TypeScript project')
    .addHelpText('after', `
Examples:
  $ x new my-app
  $ xpressify new my-app
  `)
    .action(async (name?: string) => {
      try {
        // Запускаем интерактивный диалог, передавая имя из аргумента CLI
        // как suggested name — пользователь может его подтвердить или изменить
        const answers = await askProjectQuestions(name ?? '');

        // targetDir — абсолютный путь к директории нового проекта.
        // process.cwd() — это текущая рабочая директория пользователя,
        // то есть место откуда он запустил команду. Именно туда мы
        // создаём проект, как это делают все CLI-инструменты.
        const targetDir = path.resolve(process.cwd(), answers.name);

        // Валидируем через Zod-схему — это второй слой защиты после промптов.
        // parse() бросает ZodError если данные невалидны.
        // safeParse() вернул бы { success, data, error } без исключения —
        // но здесь нам удобнее поймать ошибку в общем catch-блоке ниже.
        const options = NewProjectOptionsSchema.parse({
          ...answers,
          targetDir,
        });

        // Передаём валидированные опции в генератор
        await generateProject(options);
      } catch (err) {
        // Разделяем обработку наших ошибок и неожиданных системных ошибок.
        // XpressifyError — это ожидаемые ошибки (директория уже существует,
        // шаблон не найден и т.д.). Для них показываем только сообщение.
        // Всё остальное — неожиданный баг, показываем стектрейс для диагностики.
        if (err instanceof XpressifyError) {
          logger.error(err.message);
        } else if (err instanceof Error) {
          logger.error(`Unexpected error: ${err.message}`);
          console.error(err.stack);
        }

        // Код выхода 1 сигнализирует оболочке что команда завершилась с ошибкой.
        // Это важно для CI/CD — скрипты проверяют код выхода чтобы понять
        // успешно ли выполнилась команда.
        process.exit(1);
      }
    });
}