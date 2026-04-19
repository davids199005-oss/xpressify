import { Command } from 'commander';
import { registerNewCommand } from '../commands/new.command';
import { registerGenerateCommand } from '../commands/generate.command';
import { printBanner } from '../utils/banner';
import { getPackageVersion } from '../utils/package-info';

// Минимальная требуемая версия Node. Должна совпадать с engines.node
// в корневом package.json и с поддерживаемыми версиями в CI.
const MIN_NODE_MAJOR = 20;

/**
 * Проверяет версию Node до регистрации команд и импорта тяжёлых зависимостей.
 * Если пользователь на Node < 20, он получит понятное сообщение вместо
 * загадочного SyntaxError или "X is not a function" из ESM-only пакетов.
 *
 * Выполняется ДО разбора CLI-флагов чтобы --version и --help тоже защищались
 * (иначе пользователь увидит версию, подумает что всё ок, запустит new и упадёт).
 */
function assertNodeVersion(): void {
  const raw = process.versions.node; // формат "20.10.0"
  const majorStr = raw.split('.')[0];
  const major = majorStr ? Number.parseInt(majorStr, 10) : NaN;

  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    process.stderr.write(
      `xpressify requires Node.js >= ${MIN_NODE_MAJOR}. ` +
        `You are running ${raw}. Please upgrade Node and try again.\n`,
    );
    process.exit(1);
  }
}

assertNodeVersion();

const version = getPackageVersion();

const program = new Command();

program
  .name('xpressify')
  .description('Modern Express CLI — scaffold TypeScript + ESM projects instantly')
  .version(version);

registerNewCommand(program);
registerGenerateCommand(program);

// Показываем баннер только при интерактивном запуске — когда пользователь
// запустил CLI без аргументов или с командой new/generate.
// Не показываем при --version и --help чтобы не засорять вывод
// который может парситься скриптами.
const args = process.argv.slice(2);
const isSilentFlag = args.includes('--version') ||
  args.includes('-V') ||
  args.includes('--help') ||
  args.includes('-h');

if (!isSilentFlag) {
  printBanner();
}

if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse();