import { execa } from 'execa';
import type { PackageManager, Feature, LoggerLibrary } from '../schemas/project-options.schema';

/**
 * Маппинг фич на npm-пакеты.
 *
 * Разделяем на dependencies и devDependencies сразу здесь — генератор
 * просто передаст эти массивы в install, не думая о категориях.
 *
 * Обрати внимание: это Record с Feature как ключом, что означает
 * TypeScript проверит что мы не забыли ни одну фичу из FeatureSchema.
 * Если добавим новую фичу в схему и забудем добавить её сюда — получим
 * ошибку компиляции, а не баг в runtime.
 */
const FEATURE_DEPS: Record<Feature, { deps: string[]; devDeps: string[] }> = {
  eslint: {
    deps: [],
    devDeps: [
      'eslint',
      '@eslint/js',
      '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin',
      'eslint-config-prettier',
      'globals',
    ],
  },
  prettier: {
    deps: [],
    devDeps: ['prettier'],
  },
  husky: {
    deps: [],
    devDeps: ['husky', 'lint-staged'],
  },
  'github-actions': {
    // GitHub Actions — это yaml-файлы, не пакеты.
    // Фича попадёт сюда только для генерации файлов в Phase 3.
    // Пока оставляем пустым.
    deps: [],
    devDeps: [],
  },
  zod: {
    deps: ['zod'],
    devDeps: [],
  },
  logger: {
    // Конкретные пакеты логгера определяются отдельно через getLoggerDeps(),
    // потому что зависят от выбора пользователя (pino или winston).
    // Здесь намеренно пусто.
    deps: [],
    devDeps: [],
  },
  jwt: {
    deps: ['jsonwebtoken', 'bcryptjs'],
    devDeps: ['@types/jsonwebtoken', '@types/bcryptjs'],
  },
};

/**
 * Возвращает пакеты для выбранного логгера.
 * Вынесено отдельно потому что loggerLibrary — это не Feature,
 * а отдельное поле в NewProjectOptions.
 */
export function getLoggerDeps(library: LoggerLibrary): {
  deps: string[];
  devDeps: string[];
} {
  if (library === 'pino') {
    return {
      deps: ['pino', 'pino-pretty'],
      devDeps: [],
    };
  }
  return {
    deps: ['winston'],
    devDeps: [],
  };
}

/**
 * Собирает финальные списки зависимостей из выбранных фич.
 * Возвращает два дедуплицированных массива — для deps и devDeps.
 */
export function resolveDependencies(
  features: Feature[],
  loggerLibrary: LoggerLibrary | null,
): { deps: string[]; devDeps: string[] } {
  const deps = new Set<string>();
  const devDeps = new Set<string>();

  for (const feature of features) {
    const featureDeps = FEATURE_DEPS[feature];
    featureDeps.deps.forEach((d) => deps.add(d));
    featureDeps.devDeps.forEach((d) => devDeps.add(d));
  }

  // Добавляем пакеты логгера отдельно если он был выбран
  if (loggerLibrary) {
    const loggerDeps = getLoggerDeps(loggerLibrary);
    loggerDeps.deps.forEach((d) => deps.add(d));
    loggerDeps.devDeps.forEach((d) => devDeps.add(d));
  }

  return {
    deps: Array.from(deps),
    devDeps: Array.from(devDeps),
  };
}

/**
 * Команды установки для каждого package manager.
 * npm использует "install" (канонично), pnpm и yarn используют "add".
 * Используем Record чтобы TypeScript гарантировал покрытие всех трёх вариантов.
 */
const INSTALL_COMMANDS: Record<PackageManager, { bin: string; subcommand: string }> = {
  npm:  { bin: 'npm',  subcommand: 'install' },
  pnpm: { bin: 'pnpm', subcommand: 'add' },
  yarn: { bin: 'yarn', subcommand: 'add' },
};

export const packageManagerService = {
  /**
   * Устанавливает зависимости в указанной директории.
   *
   * cwd — это рабочая директория для execa. Мы передаём targetDir,
   * потому что устанавливаем зависимости внутри сгенерированного проекта,
   * а не внутри самого xpressify.
   */
  install: async (
    packageManager: PackageManager,
    targetDir: string,
    deps: string[],
    isDev: boolean = false,
  ): Promise<void> => {
    if (deps.length === 0) return;

    const { bin, subcommand } = INSTALL_COMMANDS[packageManager];

    // npm и pnpm используют --save-dev, yarn использует --dev
    const devFlag = packageManager === 'yarn' ? '--dev' : '--save-dev';
    const flags = isDev ? [devFlag] : [];

    await execa(bin, [subcommand, ...flags, ...deps], {
      cwd: targetDir,
      // stdio: 'inherit' — вывод команды идёт напрямую в терминал пользователя.
      // Альтернатива 'pipe' — мы перехватываем вывод, но тогда пользователь
      // не видит прогресс установки в реальном времени.
      stdio: 'inherit',
    });
  },
};