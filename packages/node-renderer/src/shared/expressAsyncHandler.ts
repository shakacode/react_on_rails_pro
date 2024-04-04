/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
// Inspiration from https://github.com/Abazhenov/express-async-handler/blob/master/index.js
const asyncUtil = <F extends (...args: any[]) => any>(fn: F) =>
  function asyncUtilWrap(...args: Parameters<F>) {
    const fnReturn: ReturnType<F> = fn(...args);
    const next: (reason: unknown) => Promise<ReturnType<F>> = args[args.length - 1];
    return Promise.resolve(fnReturn).catch(next);
  };

export = asyncUtil;
