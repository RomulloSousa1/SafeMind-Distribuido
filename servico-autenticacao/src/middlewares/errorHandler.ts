import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../errors/httpError.js';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ erro: 'Dados inválidos', detalhes: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  console.error('[Erro não tratado]', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}
