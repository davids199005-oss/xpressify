import pc from 'picocolors';
import ora from 'ora';
import type { Ora } from 'ora';

// Единственный публичный интерфейс для вывода в терминал.
// Все остальные модули импортируют только этот объект — никакого pc.* напрямую.
export const logger = {
  // Информационное сообщение — нейтральный белый цвет
  info: (msg: string): void => {
    console.log(pc.blue(msg));
  },

  // Успех — зелёный с галочкой
  success: (msg: string): void => {
    console.log(pc.green(`✓ ${msg}`));
  },

  // Предупреждение — жёлтый
  warn: (msg: string): void => {
    console.warn(pc.yellow(`⚠ ${msg}`));
  },

  // Ошибка — красный, пишем в stderr а не stdout
  error: (msg: string): void => {
    console.error(pc.red(`✗ ${msg}`));
  },

  // Приглушённый текст для второстепенной информации
  dim: (msg: string): void => {
    console.log(pc.dim(msg));
  },

  // Спиннер для долгих операций (установка зависимостей, копирование файлов)
  // Возвращаем экземпляр ora чтобы вызывающий код мог сделать .succeed() или .fail()
  spinner: (msg: string): Ora => {
    return ora(msg).start();
  },
};