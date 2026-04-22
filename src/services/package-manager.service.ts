import { execa } from 'execa';
import type {
  PackageManager,
  Feature,
  LoggerLibrary,
  TestingLibrary,
} from '../schemas/project-options.schema';
import { XpressifyError } from '../utils/errors';
import { formatDep } from '../utils/dependency-versions';

/**
 * Таймаут на одну команду установки — 10 минут.
 *
 * Выбран как компромисс: монорепы с большим числом зависимостей на медленном
 * диске/сети действительно могут требовать несколько минут, но бесконечное
 * ожидание — худший UX (CI-раннеры просто уйдут в таймаут раннера без
 * диагностики). 10 минут покрывают 99% реальных случаев.
 */
const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;

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
  docker: {
    // Docker — это только файлы (Dockerfile, .dockerignore, compose).
    // Никаких npm-пакетов не требуется.
    deps: [],
    devDeps: [],
  },
  testing: {
    // Конкретные пакеты тест-фреймворка определяются отдельно через
    // getTestingDeps(), по аналогии с logger — выбор vitest/jest
    // — это отдельное поле testingLibrary в NewProjectOptions.
    deps: [],
    devDeps: [],
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
 * Возвращает пакеты для выбранного тест-фреймворка.
 * Vitest и Jest ставятся только в devDependencies.
 */
export function getTestingDeps(library: TestingLibrary): {
  deps: string[];
  devDeps: string[];
} {
  if (library === 'vitest') {
    return {
      deps: [],
      devDeps: ['vitest'],
    };
  }
  return {
    deps: [],
    // ts-jest нужен чтобы Jest понимал TypeScript-исходники в ESM-проекте.
    devDeps: ['jest', '@types/jest', 'ts-jest'],
  };
}

/**
 * Собирает финальные списки зависимостей из выбранных фич.
 * Возвращает два дедуплицированных массива — для deps и devDeps.
 */
export function resolveDependencies(
  features: Feature[],
  loggerLibrary: LoggerLibrary | null,
  testingLibrary: TestingLibrary | null = null,
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

  // Аналогично — пакеты тест-фреймворка
  if (testingLibrary) {
    const testingDeps = getTestingDeps(testingLibrary);
    testingDeps.deps.forEach((d) => deps.add(d));
    testingDeps.devDeps.forEach((d) => devDeps.add(d));
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
  npm: { bin: 'npm', subcommand: 'install' },
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

    // Применяем semver-constraints из DEP_VERSIONS, чтобы пользователь получил
    // воспроизводимый результат независимо от того, когда запустил xpressify.
    // См. src/utils/dependency-versions.ts для обоснования pinning'а.
    const pinnedDeps = deps.map(formatDep);

    // npm и pnpm используют --save-dev, yarn использует --dev
    const devFlag = packageManager === 'yarn' ? '--dev' : '--save-dev';
    const flags = isDev ? [devFlag] : [];

    try {
      await execa(bin, [subcommand, ...flags, ...pinnedDeps], {
        cwd: targetDir,
        // stdio: 'inherit' — вывод команды идёт напрямую в терминал пользователя.
        // Альтернатива 'pipe' — мы перехватываем вывод, но тогда пользователь
        // не видит прогресс установки в реальном времени.
        stdio: 'inherit',
        timeout: INSTALL_TIMEOUT_MS,
      });
    } catch (err: unknown) {
      // execa бросает ошибку с флагом timedOut:true если превышен timeout.
      // Переводим её в XpressifyError с понятным сообщением — это ожидаемый
      // пользовательский сценарий (медленная сеть/приватный реестр без auth),
      // а не внутренний баг, поэтому стектрейс показывать ни к чему.
      const e = err as { timedOut?: boolean; command?: string; shortMessage?: string };
      if (e.timedOut) {
        throw new XpressifyError(
          `Installation timed out after ${INSTALL_TIMEOUT_MS / 60_000} minutes ` +
            `running "${e.command ?? `${bin} ${subcommand}`}". ` +
            `Check your network connection and that the ${packageManager} registry is reachable.`,
        );
      }
      // Любая другая ошибка выполнения (нет бинарника, код != 0) — также
      // уводим пользователя от стектрейса: он чаще всего видит ошибки
      // npm/pnpm/yarn в своём stdout выше и так.
      throw new XpressifyError(
        `"${bin} ${subcommand}" failed${e.shortMessage ? `: ${e.shortMessage}` : ''}. ` +
          `See output above for details.`,
      );
    }
  },
};
