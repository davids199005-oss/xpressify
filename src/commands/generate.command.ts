import type { Command } from 'commander';
import { GenerateOptionsSchema } from '../schemas/generate-options.schema';
import { projectDetectorService } from '../services/project-detector.service';
import { generateRoute } from '../generators/route.generator';
import { generateMiddleware } from '../generators/middleware.generator';
import { generateTsConstruct } from '../generators/ts-construct.generator';
import { generateDto } from '../generators/dto.generator';
import { generateTest } from '../generators/test.generator';
import { generateUtil } from '../generators/util.generator';
import { logger } from '../utils/logger';
import { XpressifyError, isError } from '../utils/errors';

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate <type> <component-name>')
    .alias('g')
    .description('Generate a component inside an existing project')
    .addHelpText(
      'after',
      `
Examples:
  $ xpressify generate route users
  $ xpressify g route user-profile
  $ xpressify generate middleware auth
  $ xpressify g class src/models/User
  $ xpressify g interface src/types/Product
  $ xpressify g enum src/enums/Status
  $ xpressify g dto src/dtos/CreateUser
  $ xpressify g test users
  $ xpressify g util format-date
  $ x g route users
  $ x g middleware auth
  `,
    )
    .action(async (type: string, componentName: string) => {
      try {
        const projectRoot = await projectDetectorService.requireProjectRoot(process.cwd());

        const options = GenerateOptionsSchema.parse({
          type,
          name: componentName,
          projectRoot,
        });

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
          case 'dto':
            await generateDto(options);
            break;
          case 'test':
            await generateTest(options);
            break;
          case 'util':
            await generateUtil(options);
            break;
        }
      } catch (err) {
        if (err instanceof XpressifyError) {
          logger.error(err.message);
        } else if (isError(err)) {
          logger.error(`Unexpected error: ${err.message}`);
          console.error(err.stack);
        } else {
          logger.error(`Unexpected error: ${String(err)}`);
        }
        process.exit(1);
      }
    });
}
