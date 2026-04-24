import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { handleCommandError } from '../../src/utils/error-handler';
import { XpressifyError } from '../../src/utils/errors';
import { logger } from '../../src/utils/logger';

/**
 * Юнит-тесты унифицированной обработки ошибок.
 *
 * Спай на logger.error снимает фактический аргумент сообщения,
 * спай на process.exit не даёт vitest-процессу реально завершиться.
 */
describe('handleCommandError', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    // process.exit бросает чтобы прервать выполнение handleCommandError,
    // как делает настоящий exit — иначе код после exit в проде не выполнился бы.
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`__exit__ ${code ?? 0}`);
    });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env['XPRESSIFY_DEBUG'];
  });

  afterEach(() => {
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('formats ZodError into field: message lines without stack', () => {
    const schema = z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
    });
    let caught: unknown;
    try {
      schema.parse({ name: 'a' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ZodError);

    expect(() => handleCommandError(caught)).toThrow('__exit__ 1');

    expect(errorSpy).toHaveBeenCalledOnce();
    const msg = errorSpy.mock.calls[0]?.[0] as string;
    expect(msg).toContain('name:');
    expect(msg).toContain('Name must be at least 3 characters');
    expect(msg).not.toContain('Unexpected error');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('uses "value" as path when ZodError issue has empty path', () => {
    const schema = z.string().min(3);
    let caught: unknown;
    try {
      schema.parse('a');
    } catch (err) {
      caught = err;
    }
    expect(() => handleCommandError(caught)).toThrow('__exit__ 1');
    const msg = errorSpy.mock.calls[0]?.[0] as string;
    expect(msg.startsWith('value:')).toBe(true);
  });

  it('prints XpressifyError message as-is', () => {
    expect(() => handleCommandError(new XpressifyError('Directory already exists'))).toThrow(
      '__exit__ 1',
    );

    expect(errorSpy).toHaveBeenCalledWith('Directory already exists');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('prints plain Error message without stack and without prefix', () => {
    expect(() => handleCommandError(new Error('boom'))).toThrow('__exit__ 1');

    expect(errorSpy).toHaveBeenCalledWith('boom');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('emits stack for plain Error when XPRESSIFY_DEBUG=1', () => {
    process.env['XPRESSIFY_DEBUG'] = '1';
    const err = new Error('boom');
    expect(() => handleCommandError(err)).toThrow('__exit__ 1');

    expect(errorSpy).toHaveBeenCalledWith('boom');
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe(err.stack);
  });

  it('stringifies non-Error throws', () => {
    expect(() => handleCommandError('something weird')).toThrow('__exit__ 1');
    expect(errorSpy).toHaveBeenCalledWith('something weird');
  });
});
