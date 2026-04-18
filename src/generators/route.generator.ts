import path from 'path';
import { templateService } from '../services/template.service';
import { resolveNames } from '../utils/naming';
import { logger } from '../utils/logger';
import type { GenerateOptions } from '../schemas/generate-options.schema';

export async function generateRoute(options: GenerateOptions): Promise<void> {
  const { name, projectRoot } = options;
  const names = resolveNames(name);

  const files = [
    {
      template: 'generate/route/router.ts.hbs',
      output: path.join(projectRoot, 'src', 'routes', `${names.kebab}.router.ts`),
      label: 'router',
      displayPath: `src/routes/${names.kebab}.router.ts`,
    },
    {
      template: 'generate/route/controller.ts.hbs',
      output: path.join(projectRoot, 'src', 'controllers', `${names.kebab}.controller.ts`),
      label: 'controller',
      displayPath: `src/controllers/${names.kebab}.controller.ts`,
    },
    {
      template: 'generate/route/service.ts.hbs',
      output: path.join(projectRoot, 'src', 'services', `${names.kebab}.service.ts`),
      label: 'service',
      displayPath: `src/services/${names.kebab}.service.ts`,
    },
  ];

  for (const file of files) {
    await templateService.renderToFile(file.template, file.output, { ...names });
    logger.success(`Created ${file.label}: ${file.displayPath}`);
  }

  logger.dim(`\n  Don't forget to register the router in your app.ts:`);
  logger.dim(`  import ${names.camel}Router from './routes/${names.kebab}.router.js';`);
  logger.dim(`  app.use('/${names.pluralKebab}', ${names.camel}Router);`);
}