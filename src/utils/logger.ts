const isDev = (() => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('return import.meta.env.DEV')();
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
})();

const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  },
};

export default logger;
