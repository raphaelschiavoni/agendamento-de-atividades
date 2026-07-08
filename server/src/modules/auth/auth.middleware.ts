import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    next(new HttpError(401, "Não autenticado"));
    return;
  }
  next();
}
