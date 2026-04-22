import path from 'path';
import { filesystemService } from './filesystem.service';
import { NotXpressifyProjectError } from '../utils/errors';

/**
 * Сервис для определения является ли текущая директория xpressify-проектом.
 *
 * Что значит "xpressify-проект"? Это директория в которой есть package.json.
 * Мы намеренно не проверяем наличие специального маркера типа "xpressify: true"
 * в package.json — это было бы излишней строгостью. Любой Node.js-проект
 * с package.json считается валидным местом для генерации компонентов.
 * Это называется принципом наименьшего удивления: пользователь ожидает
 * что generate работает в любом Node-проекте, а не только в "официальных".
 */
export const projectDetectorService = {
  /**
   * Ищет корень проекта начиная с startDir и поднимаясь вверх по дереву
   * директорий пока не найдёт package.json или не дойдёт до корня файловой системы.
   *
   * Этот паттерн называется "upward traversal" — именно так работают
   * git, eslint, prettier когда ищут свои конфиг-файлы. Это позволяет
   * запускать команду из любой поддиректории проекта, а не только из корня.
   *
   * @returns абсолютный путь к корню проекта, или null если не найден
   */
  findProjectRoot: async (startDir: string): Promise<string | null> => {
    let currentDir = startDir;

    while (true) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      const exists = await filesystemService.exists(packageJsonPath);

      if (exists) {
        return currentDir;
      }

      const parentDir = path.dirname(currentDir);

      // path.dirname('/') === '/' на Unix, path.dirname('C:\\') === 'C:\\'
      // на Windows — это признак что мы достигли корня файловой системы
      if (parentDir === currentDir) {
        return null;
      }

      currentDir = parentDir;
    }
  },

  /**
   * Проверяет что директория является корнем проекта и возвращает
   * абсолютный путь к ней. Бросает ошибку если проект не найден —
   * используется в команде generate как guard перед любыми операциями.
   */
  requireProjectRoot: async (startDir: string): Promise<string> => {
    const projectRoot = await projectDetectorService.findProjectRoot(startDir);

    if (!projectRoot) {
      throw new NotXpressifyProjectError();
    }

    return projectRoot;
  },
};
