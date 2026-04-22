import pluralizeLib from 'pluralize';

/**
 * Утилиты для преобразования имён.
 * Все функции — чистые (pure): одинаковый вход всегда даёт одинаковый выход,
 * нет side effects. Это делает их тривиально тестируемыми.
 */

/**
 * Нормализует произвольный ввод в массив слов.
 * Это внутренняя функция — строительный блок для всех остальных.
 *
 * Примеры:
 *   "my-app"      → ["my", "app"]
 *   "MyApp"       → ["My", "App"]   (разбивает по заглавным буквам)
 *   "my_app"      → ["my", "app"]
 *   "my app"      → ["my", "app"]
 */
function toWords(input: string): string[] {
  return (
    input
      // Разбиваем camelCase и PascalCase: вставляем пробел перед заглавными буквами
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Заменяем все разделители (-, _, пробел) на пробел
      .replace(/[-_\s]+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
  ); // убираем пустые строки на случай двойных разделителей
}

/** "my-app" → "my-app" | "MyApp" → "my-app" */
export function toKebabCase(input: string): string {
  return toWords(input).join('-');
}

/** "my-app" → "myApp" | "my_app" → "myApp" */
export function toCamelCase(input: string): string {
  const words = toWords(input);
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

/** "my-app" → "MyApp" | "my_app" → "MyApp" */
export function toPascalCase(input: string): string {
  return toWords(input)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/** "my-app" → "my_app" | "MyApp" → "my_app" */
export function toSnakeCase(input: string): string {
  return toWords(input).join('_');
}

/**
 * Плюрализация английских слов.
 *
 * Раньше здесь была самописная регулярка, которая ломалась на двух важных
 * случаях: уже-множественные слова (pluralize('users') → 'userses') и
 * иррегулярные формы (child/children, person/people). Теперь используем
 * npm-пакет pluralize — это де-факто стандарт в Node-экосистеме, обрабатывает
 * иррегулярности из CLDR и идемпотентен: pluralize('users') === 'users'.
 *
 * Сохраняем имя функции и сигнатуру (string → string) для обратной
 * совместимости публичного API — эта функция реэкспортируется из index.ts.
 */
export function pluralize(word: string): string {
  return pluralizeLib(word);
}

/**
 * Удобная функция которая возвращает все варианты имени сразу.
 * Генераторы будут вызывать именно её — получают объект и деструктурируют
 * только то что нужно.
 */
export function resolveNames(input: string): {
  original: string;
  kebab: string;
  camel: string;
  pascal: string;
  snake: string;
  plural: string;
  pluralKebab: string;
} {
  const kebab = toKebabCase(input);
  return {
    original: input,
    kebab,
    camel: toCamelCase(input),
    pascal: toPascalCase(input),
    snake: toSnakeCase(input),
    plural: pluralize(toSnakeCase(input)),
    pluralKebab: pluralize(kebab),
  };
}
