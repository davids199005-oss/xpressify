import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { filesystemService } from './filesystem.service';
import { TemplateNotFoundError } from '../utils/errors';

/**
 * Сервис для рендеринга Handlebars-шаблонов.
 *
 * Handlebars работает просто: ты даёшь ему строку-шаблон с плейсхолдерами
 * вида {{variableName}} и объект с данными, а он возвращает готовую строку
 * с подставленными значениями. Условия пишутся как {{#if condition}}...{{/if}}.
 *
 * Мы храним шаблоны в директории templates/ относительно корня пакета.
 * При глобальной установке через npm этот путь будет вести в директорию
 * где установлен xpressify, а не в текущий рабочий каталог пользователя.
 *
 * tsup собирает в несколько entry-points с разной глубиной вложенности:
 *   dist/index.js и dist/index.cjs  → __dirname = dist/
 *   dist/bin/cli.cjs                → __dirname = dist/bin/
 * Поэтому "templates/" относительно __dirname может быть либо '../templates'
 * либо '../../templates'. Функция resolveTemplatesDir() перебирает кандидатов
 * и выбирает существующий — это надёжнее чем захардкоженный один путь,
 * и автоматически подстраивается под изменения в tsup.config.ts.
 */

function resolveTemplatesDir(): string {
  const candidates = [
    path.resolve(__dirname, '../../templates'),
    path.resolve(__dirname, '../templates'),
    // Fallback на случай если tsup поменяет структуру — идём ещё выше.
    path.resolve(__dirname, '../../../templates'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  // Это внутренняя ошибка — пользователь никогда не должен её увидеть
  // если пакет корректно установлен. Если видим — значит templates/
  // не попали в npm-публикацию (проверить поле "files" в package.json).
  throw new Error(
    `Could not locate the xpressify "templates/" directory. ` +
      `Searched: ${candidates.join(', ')}. ` +
      `This usually means the package was built or published incorrectly.`,
  );
}

const TEMPLATES_DIR = resolveTemplatesDir();

export const templateService = {
  /**
   * Рендерит шаблон из файла и возвращает готовую строку.
   *
   * @param templatePath - относительный путь от директории templates/
   *                       например: 'logger/pino.config.ts.hbs'
   * @param context      - данные для подстановки в шаблон
   */
  render: async (
    templatePath: string,
    context: Record<string, unknown>,
  ): Promise<string> => {
    const fullPath = path.join(TEMPLATES_DIR, templatePath);

    // Проверяем что шаблон существует — если нет, бросаем типизированную ошибку
    // вместо невнятного "ENOENT: no such file or directory"
    const exists = await filesystemService.exists(fullPath);
    if (!exists) {
      throw new TemplateNotFoundError(templatePath);
    }

    const source = await filesystemService.readFile(fullPath);

    // Handlebars.compile возвращает функцию-рендерер.
    // Вызываем её с контекстом и получаем готовую строку.
    const template = Handlebars.compile(source);
    return template(context);
  },

  /**
   * Рендерит шаблон и сразу записывает результат в файл.
   * Это удобная комбинация render + writeFile которую генератор
   * будет использовать чаще всего.
   *
   * @param templatePath  - относительный путь от templates/
   * @param outputPath    - абсолютный путь куда записать результат
   * @param context       - данные для подстановки
   */
  renderToFile: async (
    templatePath: string,
    outputPath: string,
    context: Record<string, unknown>,
  ): Promise<void> => {
    const content = await templateService.render(templatePath, context);
    await filesystemService.writeFile(outputPath, content);
  },
};
