import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async express route handler to automatically catch errors
 * and pass them to the next() middleware.
 * 
 * It strictly types req, res, next to provide inference to controllers.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => unknown
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
