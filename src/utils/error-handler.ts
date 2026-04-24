import { ZodError } from 'zod';
import { XpressifyError } from './errors';
import { logger } from './logger';

/**
 * Единая точка обработки ошибок для всех CLI-команд.
 *
 * Принцип: пользователь видит одно аккуратное сообщение — без префикса
 * "Unexpected error" и без stack trace, который только сбивает с толку
 * когда реальная причина в невалидном вводе. Stack trace доступен через
 * переменную окружения XPRESSIFY_DEBUG=1 — для самого разработчика CLI.
 */
export function handleCommandError(err: unknown): never {
  if (err instanceof ZodError) {
    logger.error(formatZodError(err));
  } else if (err instanceof XpressifyError) {
    logger.error(err.message);
  } else if (err instanceof Error) {
    logger.error(err.message);
    if (process.env['XPRESSIFY_DEBUG'] === '1' && err.stack) {
      console.error(err.stack);
    }
  } else {
    logger.error(String(err));
  }

  process.exit(1);
}

/**
 * Приводит ZodError к одному читаемому сообщению.
 *
 * Формат: каждое issue — строка "<path>: <message>". Если путь пуст
 * (ошибка относится к самому значению, не к полю), используется "value".
 * Несколько issues выводятся подряд, каждое с новой строки.
 */
function formatZodError(err: ZodError): string {
  if (err.issues.length === 0) {
    return 'Invalid input.';
  }

  return err.issues
    .map((issue) => {
      const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'value';
      return `${pathStr}: ${issue.message}`;
    })
    .join('\n');
}
