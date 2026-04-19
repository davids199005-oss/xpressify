import fs from 'fs';
import path from 'path';

/**
 * Читает версию xpressify из собственного package.json.
 *
 * Не используем `require('../../package.json')` по двум причинам:
 *   1. Это ESM-проект, а require() — CJS-конструкция; eslint-disable был
 *      единственным способом заткнуть линтер. Избегаем костылей.
 *   2. В чистом ESM-потреблении (например, внутри Node worker threads)
 *      require('./*.json') не работает — нужен assert { type: 'json' }
 *      либо явное чтение файла.
 *
 * Путь к package.json зависит от того, из какого артефакта tsup запустили код:
 *   dev (tsx)            → src/utils/     → ../../package.json
 *   dist/index.{js,cjs}  → dist/          → ../package.json
 *   dist/bin/cli.cjs     → dist/bin/      → ../../package.json
 * Перебираем кандидатов — это тот же приём что в resolveTemplatesDir().
 *
 * Работает одинаково в ESM и CJS, потому что tsup имеет shims: true и
 * пробрасывает __dirname в ESM-сборку.
 */
function resolvePackageJsonPath(): string {
  const candidates = [
    path.resolve(__dirname, '../../package.json'),
    path.resolve(__dirname, '../package.json'),
    path.resolve(__dirname, '../../../package.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate the xpressify package.json. Searched: ${candidates.join(', ')}.`,
  );
}

export function getPackageVersion(): string {
  const pkgPath = resolvePackageJsonPath();
  const content = fs.readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(content) as { version: string };
  return pkg.version;
}
