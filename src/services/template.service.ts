import Handlebars from 'handlebars';
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
 * Именно поэтому мы используем import.meta.url для определения __dirname —
 * это ESM-safe способ получить путь к текущему модулю.
 *
 * Но подожди — мы собираем CLI в CJS через tsup, и там есть нативный __dirname.
 * Решение: tsup при сборке CJS автоматически заменяет import.meta.url
 * на __dirname-эквивалент. Поэтому код ниже работает корректно в обоих форматах.
 */

// Путь к директории templates/ — два уровня вверх от dist/bin/ где живёт cli.cjs
// src/services/ → src/ → корень проекта → templates/
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

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