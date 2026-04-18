import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { toKebabCase } from '../utils/naming';
import type {
  PackageManager,
  Feature,
  LoggerLibrary,
} from '../schemas/project-options.schema';

export interface ProjectPromptAnswers {
  name: string;
  packageManager: PackageManager;
  features: Feature[];
  loggerLibrary: LoggerLibrary | null;
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
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(value)) {
        return 'Use only lowercase letters, numbers, and hyphens';
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
      { value: 'zod',    name: 'Zod     – schema validation library' },
      { value: 'logger', name: 'Logger  – structured logging (pino or winston)' },
      { value: 'jwt',    name: 'JWT     – jsonwebtoken + bcryptjs (deps only)' },
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

  // Объединяем обе группы и применяем feature dependencies
  const allSelected: Feature[] = [...qualityFeatures, ...projectFeatures];
  const featuresSet = new Set<Feature>(allSelected);

  if (featuresSet.has('husky')) {
    featuresSet.add('eslint');
    featuresSet.add('prettier');
  }

  const features = Array.from(featuresSet);

  const autoAdded = features.filter((f) => !allSelected.includes(f));
  if (autoAdded.length > 0) {
    console.log(
      `\n  ℹ Husky requires: ${autoAdded.join(', ')} — added automatically.\n`,
    );
  }

  const installDependencies = await confirm({
    message: 'Install dependencies after scaffolding?',
    default: true,
  });

  return { name, packageManager, features, loggerLibrary, installDependencies };
}