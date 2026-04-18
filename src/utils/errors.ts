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
 * Команда запущена вне директории xpressify-проекта.
 * Актуально для Phase 3 (generate) — нельзя генерировать роуты
 * если нет package.json с нужной сигнатурой.
 */
export class NotXpressifyProjectError extends XpressifyError {
  constructor() {
    super(
      'Not an Xpressify project. Run "xpressify new <name>" to create one.',
    );
  }
}