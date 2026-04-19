import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { toKebabCase } from '../utils/naming';
import {
  applyFeatureDependencies,
  getAutoAddedFeatures,
} from '../utils/feature-dependencies';
import type {
  PackageManager,
  Feature,
  LoggerLibrary,
  TestingLibrary,
} from '../schemas/project-options.schema';
import {
  PROJECT_NAME_REGEX,
  PROJECT_NAME_ERROR,
} from '../schemas/project-options.schema';

export interface ProjectPromptAnswers {
  name: string;
  packageManager: PackageManager;
  features: Feature[];
  loggerLibrary: LoggerLibrary | null;
  testingLibrary: TestingLibrary | null;
  installDependencies: boolean;
}

export async function askProjectQuestions(
  suggestedName: string = '',
): Promise<ProjectPromptAnswers> {
  const name = await input({
    message: 'Project name:',
    ...(suggestedName ? { default: toKebabCase(suggestedName) } : {}),
    validate: (value: string) => {
      if (!value.trim()) return 'Project name cannot be empty';
      if (!PROJECT_NAME_REGEX.test(value)) {
        return PROJECT_NAME_ERROR;
      }
      return true;
    },
  });

  const packageManager = await select<PackageManager>({
    message: 'Package manager:',
    choices: [
      { value: 'npm',  name: 'npm  (Node.js default)' },
      { value: 'pnpm', name: 'pnpm (fast, disk-efficient)' },
      { value: 'yarn', name: 'yarn (classic)' },
    ],
    default: 'npm',
  });

  // --- Группа 1: Code Quality ---
  const qualityFeatures = await checkbox<Feature>({
    message: 'Code quality tools:',
    choices: [
      { value: 'eslint',         name: 'ESLint          – static analysis' },
      { value: 'prettier',       name: 'Prettier        – code formatting' },
      { value: 'husky',          name: 'Husky           – git hooks (auto-adds ESLint + Prettier)' },
      { value: 'github-actions', name: 'GitHub Actions  – CI/CD pipeline' },
    ],
  });

  // --- Группа 2: Project Features ---
  const projectFeatures = await checkbox<Feature>({
    message: 'Project features:',
    choices: [
      { value: 'zod',     name: 'Zod      – schema validation library' },
      { value: 'logger',  name: 'Logger   – structured logging (pino or winston)' },
      { value: 'jwt',     name: 'JWT      – jsonwebtoken + bcryptjs (deps only)' },
      { value: 'docker',  name: 'Docker   – Dockerfile + .dockerignore + docker-compose.yml' },
      { value: 'testing', name: 'Testing  – unit tests (vitest or jest)' },
    ],
  });

  // Conditional prompt: выбор конкретного логгера появляется только
  // если пользователь включил фичу 'logger'.
  let loggerLibrary: LoggerLibrary | null = null;
  if (projectFeatures.includes('logger')) {
    loggerLibrary = await select<LoggerLibrary>({
      message: 'Choose logger library:',
      choices: [
        { value: 'pino',    name: 'Pino    – fast, JSON structured (recommended)' },
        { value: 'winston', name: 'Winston – flexible, multiple transports' },
      ],
      default: 'pino',
    });
  }

  // Аналогично — выбор тест-фреймворка появляется только при выборе testing.
  let testingLibrary: TestingLibrary | null = null;
  if (projectFeatures.includes('testing')) {
    testingLibrary = await select<TestingLibrary>({
      message: 'Choose testing framework:',
      choices: [
        { value: 'vitest', name: 'Vitest  – fast, ESM-first (recommended)' },
        { value: 'jest',   name: 'Jest    – classic, broad ecosystem' },
      ],
      default: 'vitest',
    });
  }

  // Объединяем обе группы и применяем feature dependencies через общий хелпер.
  // См. src/utils/feature-dependencies.ts — единственное место где живут
  // правила "одна фича тянет другие". Non-interactive режим вызывает ту же
  // функцию, гарантируя одинаковое поведение.
  const allSelected: Feature[] = [...qualityFeatures, ...projectFeatures];
  const features = applyFeatureDependencies(allSelected);

  const autoAdded = getAutoAddedFeatures(allSelected, features);
  if (autoAdded.length > 0) {
    console.log(
      `\n  ℹ Added automatically due to dependencies: ${autoAdded.join(', ')}.\n`,
    );
  }

  const installDependencies = await confirm({
    message: 'Install dependencies after scaffolding?',
    default: true,
  });

  return {
    name,
    packageManager,
    features,
    loggerLibrary,
    testingLibrary,
    installDependencies,
  };
}