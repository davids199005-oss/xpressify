import type { Feature } from '../schemas/project-options.schema';

/**
 * Правила "одна фича тянет другие".
 *
 * Раньше эта логика дублировалась в двух местах: в интерактивных промптах
 * и в обработчике non-interactive-флагов команды new. При добавлении нового
 * правила было легко забыть обновить одно из них — поведение двух режимов
 * расходилось.
 *
 * Теперь это единственное место где живут такие правила. И промпты, и
 * CLI-флаги вызывают applyFeatureDependencies() после своих пользовательских
 * выборов и получают одинаково расширенный список фич.
 */
const DEPENDENCIES: Partial<Record<Feature, readonly Feature[]>> = {
  // Husky — это git-хук, без ESLint и Prettier он не имеет смысла:
  // хук ставится для того чтобы автоматически гонять линтер и форматтер
  // перед коммитом. Если пользователь выбрал husky, молча добавляем обе фичи.
  husky: ['eslint', 'prettier'],
};

/**
 * Возвращает новый массив фич с добавленными зависимостями.
 * Идемпотентна: если зависимость уже в списке — не дублирует.
 * Не изменяет исходный массив (pure function).
 */
export function applyFeatureDependencies(features: Feature[]): Feature[] {
  const result = new Set<Feature>(features);
  for (const feature of features) {
    const deps = DEPENDENCIES[feature];
    if (deps) {
      for (const dep of deps) {
        result.add(dep);
      }
    }
  }
  return Array.from(result);
}

/**
 * Возвращает только те фичи, которые были добавлены автоматически
 * из-за зависимостей (есть в финальном списке, но не были выбраны пользователем).
 * Используется в интерактивном режиме чтобы показать "ℹ Husky requires: ...".
 */
export function getAutoAddedFeatures(userSelected: Feature[], finalFeatures: Feature[]): Feature[] {
  const selectedSet = new Set(userSelected);
  return finalFeatures.filter((f) => !selectedSet.has(f));
}
