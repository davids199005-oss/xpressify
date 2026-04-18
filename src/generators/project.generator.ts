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

export async function generateProject(options: NewProjectOptions): Promise<void> {
  const { name, targetDir, packageManager, features, loggerLibrary, installDependencies } = options;

  // ─── Шаг 1: Создание директории проекта ───────────────────────────────────
  const dirSpinner = logger.spinner(`Creating project directory ${name}...`);
  await filesystemService.createProjectDir(targetDir);
  dirSpinner.succeed(`Created directory: ${name}`);

  // ─── Шаг 2: Генерация базовых файлов и структуры директорий ───────────────
  const filesSpinner = logger.spinner('Scaffolding base project files...');
  await scaffoldBaseFiles(targetDir, options);
  filesSpinner.succeed('Base files created');

  // ─── Шаг 3: Генерация файлов для выбранных фич ────────────────────────────
  if (features.includes('logger') && loggerLibrary) {
    const loggerSpinner = logger.spinner(`Adding ${loggerLibrary} logger config...`);
    const templatePath = `logger/${loggerLibrary}.config.ts.hbs`;
    const outputPath = path.join(targetDir, 'src', 'config', 'logger.config.ts');
    await templateService.renderToFile(templatePath, outputPath, {});
    loggerSpinner.succeed(`Logger config created (${loggerLibrary})`);
  }

  // ─── Шаг 4: Установка зависимостей ────────────────────────────────────────
  if (installDependencies) {
    const { deps: featureDeps, devDeps: featureDevDeps } = resolveDependencies(
      features,
      loggerLibrary,
    );

    const allDeps = [...CORE_DEPS, ...featureDeps];
    const allDevDeps = [...CORE_DEV_DEPS, ...featureDevDeps];

    const depsSpinner = logger.spinner('Installing dependencies...');
    // Останавливаем спиннер перед install — execa с stdio:'inherit'
    // пишет напрямую в терминал и будет конфликтовать со спиннером
    depsSpinner.stop();

    logger.info('\nInstalling dependencies:');
    await packageManagerService.install(packageManager, targetDir, allDeps, false);

    logger.info('\nInstalling dev dependencies:');
    await packageManagerService.install(packageManager, targetDir, allDevDeps, true);

    logger.success('Dependencies installed');
  }

  // ─── Финальное сообщение ──────────────────────────────────────────────────
  printSuccessMessage(name, packageManager);
}

async function scaffoldBaseFiles(
  targetDir: string,
  options: NewProjectOptions,
): Promise<void> {
  const { name } = options;

  // package.json генерируем как объект и сериализуем — это безопаснее
  // чем Handlebars-шаблон для JSON, TypeScript гарантирует структуру
  const packageJson = {
    name,
    version: '0.1.0',
    description: '',
    main: 'dist/server.js',
    scripts: {
      dev: 'tsx watch src/server.ts',
      build: 'tsc',
      start: 'node dist/server.js',
    },
    dependencies: {},
    devDependencies: {},
  };

  await filesystemService.writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'commonjs',
      lib: ['ES2022'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await filesystemService.writeFile(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
  );

  const envExample = ['NODE_ENV=development', 'PORT=3000'].join('\n');
  await filesystemService.writeFile(path.join(targetDir, '.env.example'), envExample);

  const gitignore = ['node_modules', 'dist', '.env', '*.log'].join('\n');
  await filesystemService.writeFile(path.join(targetDir, '.gitignore'), gitignore);

  // ─── Создаём базовую структуру директорий src/ ────────────────────────────
  // Git не отслеживает пустые директории — добавляем .gitkeep в каждую.
  // Это конвенция всего сообщества: пустой файл-маркер который говорит
  // "эта папка должна существовать в репозитории". Когда пользователь
  // добавит первый реальный файл, .gitkeep можно удалить.
  const srcDirs = [
    'src/routes',
    'src/controllers',
    'src/services',
    'src/middlewares',
    'src/utils',
  ];

  for (const dir of srcDirs) {
    await filesystemService.writeFile(
      path.join(targetDir, dir, '.gitkeep'),
      '',
    );
  }

  // src/server.ts — точка входа, подключает dotenv и запускает сервер
  const serverTs = `import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  await filesystemService.writeFile(
    path.join(targetDir, 'src', 'server.ts'),
    serverTs,
  );

  // src/app.ts — Express-приложение с базовыми middleware
  const appTs = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
`;

  await filesystemService.writeFile(
    path.join(targetDir, 'src', 'app.ts'),
    appTs,
  );
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