import { Command } from 'commander';
import pc from 'picocolors';

const program = new Command();
program
  .name('xpressify')
  .description('Modern Express CLI with TypeScript, ESM and Zod')
  .version('0.0.1');

program
  .command('hello')
  .description('Command to verify cli writing')
  .action(() => {
    console.log(pc.cyanBright('Hello From Xpressify!'));
    console.log(pc.dim('This is a simple CLI tool built with TypeScript and ESM.'));
  });

program.parse();
