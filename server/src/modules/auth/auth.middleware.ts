import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import { getAdminUserById, type AdminUser } from "./auth.service.js";

// Usuário autenticado anexado à requisição pelo requireAdmin.
declare module "express-serve-static-core" {
  interface Request {
    adminUser?: AdminUser;
  }
}

/** Exige sessão válida e anexa o usuário (com papel e hotel) em req.adminUser. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    next(new HttpError(401, "Não autenticado"));
    return;
  }
  getAdminUserById(req.session.adminUserId)
    .then((user) => {
      if (!user) {
        next(new HttpError(401, "Não autenticado"));
        return;
      }
      req.adminUser = user;
      next();
    })
    .catch(next);
}

/** Exige papel de administrador pleno (usar após requireAdmin). */
export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  if (req.adminUser?.role !== "admin") {
    next(new HttpError(403, "Acesso restrito ao administrador"));
    return;
  }
  next();
}
