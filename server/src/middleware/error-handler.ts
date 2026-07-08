import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada" });
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export function asyncRoute(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
