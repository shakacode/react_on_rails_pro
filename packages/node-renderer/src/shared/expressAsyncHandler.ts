import { NextFunction, Request, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Inspiration from https://github.com/Abazhenov/express-async-handler/blob/master/index.js
const asyncUtil = (fn: AsyncHandler): AsyncHandler =>
  function asyncUtilWrap(req, res, next) {
    const fnReturn = fn(req, res, next);
    // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
    return Promise.resolve(fnReturn).catch(next);
  };

export = asyncUtil;
