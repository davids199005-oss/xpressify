import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import type { GenerateOptions } from '../schemas/generate-options.schema';

export async function generateMiddleware(options: GenerateOptions): Promise<void> {
  const { name, projectRoot } = options;
  const names = resolveNames(name);

  const outputPath = path.join(
    projectRoot,
    'src',
    'middlewares',
    `${names.kebab}.middleware.ts`,
  );

  await templateService.renderToFile(
    'generate/middleware/middleware.ts.hbs',
    outputPath,
    { ...names },
  );

  logger.success(`Created middleware: src/middlewares/${names.kebab}.middleware.ts`);
  logger.dim(`\n  Register it in your app.ts or router:`);
  logger.dim(`  import { ${names.camel}Middleware } from './middlewares/${names.kebab}.middleware.js';`);
  logger.dim(`  app.use(${names.camel}Middleware);`);
}