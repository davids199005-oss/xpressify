import path from 'path';
import type { Command } from 'commander';
import { askProjectQuestions, type ProjectPromptAnswers } from '../prompts/project.prompts';
import { generateProject } from '../generators/project.generator';
import {
  NewProjectOptionsSchema,
  FeatureSchema,
  LoggerLibrarySchema,
  TestingLibrarySchema,
  PackageManagerSchema,
  type LoggerLibrary,
  type TestingLibrary,
} from '../schemas/project-options.schema';
import { toKebabCase } from '../utils/naming';
import { applyFeatureDependencies } from '../utils/feature-dependencies';
import { logger } from '../utils/logger';
import { XpressifyError, isError } from '../utils/errors';

/**
 * Опции CLI команды new.
 * Commander.js заполняет это объект на основе флагов которые передал пользователь.
 * Все поля опциональные — если пользователь не передал флаг, его здесь не будет
 * (за исключением --no-install, у которого дефолт true благодаря commander).
 */
interface NewCommandFlags {
  yes?: boolean;
  packageManager?: string;
  features?: string;
  logger?: string;
  testingLibrary?: string;
  install: boolean; // commander превращает --no-install в install: false
}

/**
 * Регистрирует команду 'new' в экземпляре commander.
 *
 * Команда поддерживает два режима:
 *  1. Интерактивный (по умолчанию): задаёт вопросы через @inquirer/prompts.
 *  2. Non-interactive: если передан любой из флагов (-y, --features, ...),
 *     вопросы пропускаются и значения берутся из флагов + дефолтов схемы.
 *     Это нужно для CI/CD и Docker-сборок где TTY недоступен.
 */
export function registerNewCommand(program: Command): void {
  program
    .command('new [name]')
    .description('Scaffold a new Express + TypeScript project')
    .option('-y, --yes', 'Skip all prompts and use defaults (name must be passed as argument)')
    .option('--package-manager <pm>', 'Package manager: npm, pnpm, or yarn (default: npm)')
    .option(
      '--features <list>',
      'Comma-separated features: eslint,prettier,husky,github-actions,zod,logger,jwt,docker,testing',
    )
    .option(
      '--logger <library>',
      'Logger library when "logger" feature is selected: pino or winston (default: pino)',
    )
    .option(
      '--testing-library <library>',
      'Testing framework when "testing" feature is selected: vitest or jest (default: vitest)',
    )
    .option('--no-install', 'Skip dependency installation after scaffolding')
    .addHelpText(
      'after',
      `
Examples:
  Interactive mode:
    $ x new my-app
    $ xpressify new my-app

  Non-interactive mode (CI/Docker-friendly):
    $ xpressify new my-app --yes
    $ xpressify new my-app --yes --features eslint,prettier,zod
    $ xpressify new my-app --yes --features logger --logger winston
    $ xpressify new my-app --yes --package-manager pnpm --no-install
  `,
    )
    .action(async (nameArg: string | undefined, flags: NewCommandFlags) => {
      try {
        const isNonInteractive = isNonInteractiveMode(flags);

        const answers = isNonInteractive
          ? buildNonInteractiveAnswers(nameArg, flags)
          : await askProjectQuestions(nameArg ?? '');

        // targetDir — абсолютный путь к директории нового проекта.
        // process.cwd() — это текущая рабочая директория пользователя,
        // то есть место откуда он запустил команду. Именно туда мы
        // создаём проект, как это делают все CLI-инструменты.
        const targetDir = path.resolve(process.cwd(), answers.name);

        // Валидируем через Zod-схему — это второй слой защиты после промптов
        // (или после парсинга CLI-флагов). parse() бросает ZodError
        // если данные невалидны — ловим в общем catch-блоке ниже.
        const options = NewProjectOptionsSchema.parse({
          ...answers,
          targetDir,
        });

        await generateProject(options);
      } catch (err) {
        // Разделяем обработку наших ошибок и неожиданных системных ошибок.
        // XpressifyError — это ожидаемые ошибки (директория уже существует,
        // шаблон не найден и т.д.). Для них показываем только сообщение.
        // Для Error — стектрейс для диагностики. Для чего-то ещё (null,
        // строка, объект без message) — приводим к строке через getErrorMessage.
        if (err instanceof XpressifyError) {
          logger.error(err.message);
        } else if (isError(err)) {
          logger.error(`Unexpected error: ${err.message}`);
          console.error(err.stack);
        } else {
          logger.error(`Unexpected error: ${String(err)}`);
        }

        // Код выхода 1 сигнализирует оболочке что команда завершилась с ошибкой.
        // Это важно для CI/CD — скрипты проверяют код выхода чтобы понять
        // успешно ли выполнилась команда.
        process.exit(1);
      }
    });
}

/**
 * Режим считается non-interactive если передан -y/--yes или хотя бы один
 * из флагов конфигурации. Это более forgiving чем требовать только --yes:
 * если пользователь передал конкретные опции, он явно знает что хочет.
 */
function isNonInteractiveMode(flags: NewCommandFlags): boolean {
  return Boolean(
    flags.yes ||
    flags.features !== undefined ||
    flags.packageManager !== undefined ||
    flags.logger !== undefined ||
    flags.testingLibrary !== undefined,
  );
}

/**
 * Собирает объект ответов из CLI-флагов без интерактивных промптов.
 * Валидация идёт через Zod-схемы конкретных полей — это гарантирует
 * что сообщение об ошибке будет понятным, а не "TypeError".
 */
function buildNonInteractiveAnswers(
  nameArg: string | undefined,
  flags: NewCommandFlags,
): ProjectPromptAnswers {
  if (!nameArg) {
    throw new XpressifyError(
      'Project name is required in non-interactive mode. ' +
        'Usage: xpressify new <project-name> --yes [...flags]',
    );
  }

  const name = toKebabCase(nameArg);

  // Package manager: дефолт 'npm' если не указан; валидация через схему.
  const packageManager = flags.packageManager
    ? PackageManagerSchema.parse(flags.packageManager)
    : 'npm';

  // Features: парсим CSV-строку в массив, валидируем каждый элемент.
  // Пустая строка → пустой массив; пробелы вокруг запятых убираем.
  const features = flags.features
    ? flags.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => FeatureSchema.parse(f))
    : [];

  // Применяем feature dependencies через общий хелпер.
  // Именно этот вызов гарантирует что интерактивный и non-interactive режимы
  // дают одинаковые финальные списки фич — правила живут в одном месте
  // (src/utils/feature-dependencies.ts).
  const finalFeatures = applyFeatureDependencies(features);

  // Logger library имеет смысл только если выбрана фича 'logger'.
  // Если фича не выбрана — принудительно null, чтобы Zod-валидация прошла.
  const loggerLibrary: LoggerLibrary | null = finalFeatures.includes('logger')
    ? flags.logger
      ? LoggerLibrarySchema.parse(flags.logger)
      : 'pino' // дефолт по умолчанию — как и в интерактивном режиме
    : null;

  // Аналогично для testing — дефолт 'vitest' если фича выбрана, но флаг не задан.
  const testingLibrary: TestingLibrary | null = finalFeatures.includes('testing')
    ? flags.testingLibrary
      ? TestingLibrarySchema.parse(flags.testingLibrary)
      : 'vitest'
    : null;

  return {
    name,
    packageManager,
    features: finalFeatures,
    loggerLibrary,
    testingLibrary,
    installDependencies: flags.install,
  };
}
