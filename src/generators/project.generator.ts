import path from 'path';
import { logger } from '../utils/logger';
import { filesystemService } from '../services/filesystem.service';
import { templateService } from '../services/template.service';
import { packageManagerService, resolveDependencies } from '../services/package-manager.service';
import type { NewProjectOptions } from '../schemas/project-options.schema';

const CORE_DEPS = [
  'express',
  'dotenv',
  'cors',
  'helmet',
  'express-rate-limit',
];

const CORE_DEV_DEPS = [
  '@types/express',
  '@types/cors',
  '@types/node',
  'typescript',
  'tsx',
  'nodemon',
];

// Базовые файлы проекта, создаваемые из шаблонов templates/base/.
// Вынесено в константу чтобы список был явным и легко расширялся —
// если нужно добавить ещё один базовый файл (например, README.md),
// достаточно добавить строку сюда и создать .hbs-шаблон.
const BASE_FILES: ReadonlyArray<{ template: string; output: string }> = [
  { template: 'base/package.json.hbs',  output: 'package.json' },
  { template: 'base/tsconfig.json.hbs', output: 'tsconfig.json' },
  { template: 'base/env.example.hbs',   output: '.env.example' },
  { template: 'base/gitignore.hbs',     output: '.gitignore' },
  { template: 'base/server.ts.hbs',     output: 'src/server.ts' },
  { template: 'base/app.ts.hbs',        output: 'src/app.ts' },
];

const SRC_DIRS = [
  'src/routes',
  'src/controllers',
  'src/services',
  'src/middlewares',
  'src/utils',
];

export async function generateProject(options: NewProjectOptions): Promise<void> {
  const { name, targetDir, packageManager, features, loggerLibrary, installDependencies } = options;

  // ─── Шаг 1: Создание директории проекта ───────────────────────────────────
  // Создаём директорию ДО try/catch блока — если её создание падает
  // (например, уже существует), откатывать нечего.
  const dirSpinner = logger.spinner(`Creating project directory ${name}...`);
  await filesystemService.createProjectDir(targetDir);
  dirSpinner.succeed(`Created directory: ${name}`);

  // Начиная с этой точки любой сбой требует отката: частично созданный
  // проект хуже, чем отсутствие проекта — пользователь не знает что с ним делать.
  try {
    // ─── Шаг 2: Генерация базовых файлов и структуры директорий ─────────────
    const filesSpinner = logger.spinner('Scaffolding base project files...');
    await scaffoldBaseFiles(targetDir, options);
    filesSpinner.succeed('Base files created');

    // ─── Шаг 3: Генерация файлов для выбранных фич ──────────────────────────
    if (features.includes('logger') && loggerLibrary) {
      const loggerSpinner = logger.spinner(`Adding ${loggerLibrary} logger config...`);
      const templatePath = `logger/${loggerLibrary}.config.ts.hbs`;
      const outputPath = path.join(targetDir, 'src', 'config', 'logger.config.ts');
      await templateService.renderToFile(templatePath, outputPath, {});
      loggerSpinner.succeed(`Logger config created (${loggerLibrary})`);
    }

    // ─── Шаг 4: Установка зависимостей ──────────────────────────────────────
    if (installDependencies) {
      const { deps: featureDeps, devDeps: featureDevDeps } = resolveDependencies(
        features,
        loggerLibrary,
      );

      const allDeps = [...CORE_DEPS, ...featureDeps];
      const allDevDeps = [...CORE_DEV_DEPS, ...featureDevDeps];

      logger.info('\nInstalling dependencies:');
      await packageManagerService.install(packageManager, targetDir, allDeps, false);

      logger.info('\nInstalling dev dependencies:');
      await packageManagerService.install(packageManager, targetDir, allDevDeps, true);

      logger.success('Dependencies installed');
    }

    // ─── Финальное сообщение ────────────────────────────────────────────────
    printSuccessMessage(name, packageManager);
  } catch (err) {
    // Откат: удаляем частично созданную директорию.
    // Используем обычный console.warn вместо logger.warn чтобы избежать
    // потенциального падения логгера внутри уже упавшего контекста.
    logger.warn('Error during project generation. Cleaning up...');
    try {
      await filesystemService.removeDir(targetDir);
      logger.dim(`  Removed partial directory: ${targetDir}`);
    } catch (cleanupErr) {
      // Если даже откат упал — честно говорим об этом.
      // Пользователь должен знать что на диске осталось нечто некорректное.
      logger.error(
        `Failed to clean up partial project at ${targetDir}. ` +
          `Please remove it manually. Cleanup error: ${
            cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)
          }`,
      );
    }
    // Пробрасываем исходную ошибку — её обработает command handler,
    // который покажет пользователю понятное сообщение и выставит exit code.
    throw err;
  }
}

async function scaffoldBaseFiles(
  targetDir: string,
  options: NewProjectOptions,
): Promise<void> {
  // Контекст для Handlebars — на данный момент нужно только имя проекта
  // в package.json. Если в будущем шаблоны будут использовать больше
  // данных (описание, автор), добавятся сюда.
  const context = { name: options.name };

  // Рендерим все базовые файлы из шаблонов.
  // Раньше эти файлы были захардкожены как template literals прямо в коде —
  // теперь они в templates/base/ и могут редактироваться без пересборки.
  for (const { template, output } of BASE_FILES) {
    const outputPath = path.join(targetDir, output);
    await templateService.renderToFile(template, outputPath, context);
  }

  // ─── Создаём базовую структуру директорий src/ ────────────────────────────
  // Git не отслеживает пустые директории — добавляем .gitkeep в каждую.
  // Это конвенция всего сообщества: пустой файл-маркер который говорит
  // "эта папка должна существовать в репозитории". Когда пользователь
  // добавит первый реальный файл, .gitkeep можно удалить.
  for (const dir of SRC_DIRS) {
    await filesystemService.writeFile(
      path.join(targetDir, dir, '.gitkeep'),
      '',
    );
  }
}

function printSuccessMessage(name: string, packageManager: string): void {
  console.log('');
  logger.success(`Project "${name}" created successfully!`);
  console.log('');
  logger.info('Next steps:');
  logger.dim(`  cd ${name}`);
  logger.dim(`  cp .env.example .env`);
  logger.dim(`  ${packageManager} run dev`);
  console.log('');
}
