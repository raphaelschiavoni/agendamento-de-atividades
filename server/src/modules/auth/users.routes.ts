import { Router } from "express";
import { asyncRoute, HttpError } from "../../middleware/error-handler.js";
import { requireAdmin, requireAdminRole } from "./auth.middleware.js";
import * as authService from "./auth.service.js";

// Gestão de usuários do painel (apenas administrador pleno).
export const adminUsersRouter = Router();
adminUsersRouter.use(requireAdmin, requireAdminRole);

adminUsersRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    res.json(await authService.listAdminUsers());
  })
);

adminUsersRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const { email, password, name, role, hotelId } = req.body ?? {};
    if (!email || !password || !name) throw new HttpError(400, "Informe nome, email e senha");
    if (role && role !== "admin" && role !== "agendamento") throw new HttpError(400, "Papel inválido");
    if (role === "agendamento" && !hotelId) throw new HttpError(400, "Selecione o hotel da Sala de Agendamento");
    const user = await authService.createAdminUser(email, password, name, role ?? "agendamento", hotelId ?? null);
    if (!user) throw new HttpError(409, "Já existe um usuário com esse email");
    res.status(201).json(user);
  })
);

adminUsersRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    if (req.params.id === req.adminUser!.id) throw new HttpError(400, "Você não pode excluir o próprio usuário");
    const ok = await authService.deleteAdminUser(req.params.id);
    if (!ok) throw new HttpError(404, "Usuário não encontrado");
    res.status(204).send();
  })
);
