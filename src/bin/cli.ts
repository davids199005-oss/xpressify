import { Command } from 'commander';
import { registerNewCommand } from '../commands/new.command';
import { registerGenerateCommand } from '../commands/generate.command';

const program = new Command();

program
  .name('xpressify')
  .description('Modern Express CLI — scaffold TypeScript + ESM projects instantly')
  .version('0.0.1');

registerNewCommand(program);
registerGenerateCommand(program);

if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}

program.parse();