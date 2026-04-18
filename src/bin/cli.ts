import { Command } from 'commander';
import { registerNewCommand } from '../commands/new.command';

const program = new Command();

program
  .name('xpressify')
  .description('Modern Express CLI — scaffold TypeScript + ESM projects instantly')
  .version('0.0.1');

// Регистрируем команду new
registerNewCommand(program);

// Если запущен без аргументов — показываем help вместо молчаливого выхода
if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse();