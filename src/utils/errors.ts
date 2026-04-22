/**
 * Кастомные классы ошибок для Xpressify.
 *
 * Зачем не использовать обычный Error?
 * Потому что `catch (err)` ловит всё подряд — и наши ошибки, и баги в коде,
 * и ошибки файловой системы. Кастомные классы позволяют в обработчике написать
 * `if (err instanceof ProjectExistsError)` и показать пользователю точное,
 * понятное сообщение вместо стектрейса.
 */

/**
 * Базовый класс для всех ошибок Xpressify.
 * Наследует от Error, добавляет поле name для удобной идентификации.
 *
 * Паттерн "базовый класс ошибок" позволяет ловить либо конкретную ошибку
 * (instanceof ProjectExistsError), либо любую ошибку нашего приложения
 * (instanceof XpressifyError) — в зависимости от того, насколько
 * детальная обработка нужна в конкретном месте.
 */
export class XpressifyError extends Error {
  constructor(message: string) {
    super(message);
    // Без этой строки name будет 'Error' вместо 'XpressifyError' —
    // это особенность наследования от встроенных классов в TypeScript.
    this.name = this.constructor.name;
  }
}

/**
 * Директория с таким именем уже существует.
 * Бросается в project.generator.ts перед началом scaffolding.
 */
export class ProjectExistsError extends XpressifyError {
  constructor(projectName: string) {
    super(`Directory "${projectName}" already exists.`);
  }
}

/**
 * Имя проекта не прошло валидацию Zod-схемы.
 * Бросается когда пользователь вводит имя с недопустимыми символами.
 */
export class InvalidProjectNameError extends XpressifyError {
  constructor(name: string, reason: string) {
    super(`Invalid project name "${name}": ${reason}`);
  }
}

/**
 * Шаблон не найден в директории templates/.
 * Бросается в template.service.ts если запрошенный .hbs файл отсутствует.
 */
export class TemplateNotFoundError extends XpressifyError {
  constructor(templatePath: string) {
    super(`Template not found: "${templatePath}"`);
  }
}

/**
 * Команда запущена вне директории Node.js-проекта.
 * Бросается в project-detector.service когда нет package.json ни в текущей,
 * ни в родительских директориях.
 */
export class NotXpressifyProjectError extends XpressifyError {
  constructor() {
    super('Not inside a Node.js project. Run "xpressify new <project-name>" to create one first.');
  }
}

/**
 * Type guard для работы с unknown в catch-блоках.
 *
 * TypeScript типизирует `catch (err)` как unknown по умолчанию (useUnknownInCatchVariables).
 * Для безопасного доступа к err.message нам нужен guard, потому что JavaScript
 * позволяет throw'ать что угодно — строки, объекты, null. В реальности такое
 * бывает редко, но type-safe код обязан это учитывать.
 *
 * Использовать так:
 *   catch (err) {
 *     const msg = err instanceof XpressifyError
 *       ? err.message
 *       : isError(err) ? err.message : String(err);
 *   }
 */
export function isError(err: unknown): err is Error {
  return err instanceof Error;
}

/**
 * Извлекает человекочитаемое сообщение из произвольно брошенного значения.
 * XpressifyError и обычный Error → err.message. Остальное — приводится к строке.
 *
 * Нужна чтобы не дублировать цепочку проверок в каждом catch-блоке команд.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof XpressifyError) return err.message;
  if (isError(err)) return err.message;
  return String(err);
}
