const IS_DEV = process.env.NODE_ENV !== 'production';

export const log = {
  info: (...args: unknown[]) => { if (IS_DEV) console.log('[bridge]', ...args); },
  warn: (...args: unknown[]) => { if (IS_DEV) console.warn('[bridge]', ...args); },
  error: (...args: unknown[]) => { if (IS_DEV) console.error('[bridge]', ...args); },
};
