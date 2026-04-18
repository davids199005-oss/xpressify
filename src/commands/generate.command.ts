import type { Command } from 'commander';
import { GenerateOptionsSchema } from '../schemas/generate-options.schema';
import { projectDetectorService } from '../services/project-detector.service';
import { generateRoute } from '../generators/route.generator';
import { generateMiddleware } from '../generators/middleware.generator';
import { logger } from '../utils/logger';
import { XpressifyError } from '../utils/errors';
import { generateTsConstruct } from '@/generators/ts-construct.generator';

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate <type> <name>')
    .alias('g')
    .description('Generate a component inside an existing project')
    .addHelpText('after', `
Examples:
  $ xpressify generate route users
  $ xpressify g route user-profile
  $ xpressify generate middleware auth
  $ xpressify g class src/models/User
  $ xpressify g interface src/types/Product
  $ xpressify g enum src/enums/Status
  $ x new my-app
  $ x g route users
  $ x g route user-profile
  $ x g middleware auth
  $ x g class src/models/User
  $ x g interface src/types/Product
  $ x g enum src/enums/Status
  `)
    .action(async (type: string, name: string) => {
      try {
        const projectRoot = await projectDetectorService.requireProjectRoot(
          process.cwd(),
        );

        const options = GenerateOptionsSchema.parse({ type, name, projectRoot });

        switch (options.type) {
          case 'route':
            await generateRoute(options);
            break;
          case 'middleware':
            await generateMiddleware(options);
            break;
          case 'class':
          case 'enum':
          case 'interface':
            await generateTsConstruct(options);
            break;

        }
      } catch (err) {
        if (err instanceof XpressifyError) {
          logger.error(err.message);
        } else if (err instanceof Error) {
          logger.error(`Unexpected error: ${err.message}`);
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}