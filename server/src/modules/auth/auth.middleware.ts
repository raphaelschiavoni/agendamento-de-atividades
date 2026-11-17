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

/** Exige papel de administrador master da rede (usar após requireAdmin).
 *  Só o master mexe em usuários, dashboard global e configurações sensíveis. */
export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  if (req.adminUser?.role !== "admin") {
    next(new HttpError(403, "Acesso restrito ao administrador"));
    return;
  }
  next();
}

/** Exige papel de gestão: master OU administrador de hotel (usar após requireAdmin).
 *  A Sala de Agendamento (operação) não gerencia catálogo/relatórios. O escopo por
 *  hotel é garantido dentro de cada controller via scopedHotelId/assertHotelScope. */
export function requireManage(req: Request, _res: Response, next: NextFunction) {
  const role = req.adminUser?.role;
  if (role !== "admin" && role !== "hotel_admin") {
    next(new HttpError(403, "Acesso restrito aos administradores"));
    return;
  }
  next();
}

/** Garante que um recurso de um dado hotel pertence ao hotel do usuário.
 *  Master passa sempre; administrador de hotel só no próprio hotel. */
export function assertHotelScope(req: Request, hotelId: string | null | undefined) {
  const user = req.adminUser!;
  if (user.role === "admin") return;
  if (!user.hotelId || hotelId !== user.hotelId) {
    throw new HttpError(403, "Este recurso pertence a outro hotel");
  }
}
