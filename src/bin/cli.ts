import { Command } from 'commander';
import { registerNewCommand } from '../commands/new.command';
import { registerGenerateCommand } from '../commands/generate.command';
import { printBanner } from '../utils/banner';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../package.json') as { version: string };

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