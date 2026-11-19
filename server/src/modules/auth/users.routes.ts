import { Router } from "express";
import { asyncRoute, HttpError } from "../../middleware/error-handler.js";
import { requireAdmin, requireAdminRole } from "./auth.middleware.js";
import * as authService from "./auth.service.js";
import type { AdminRole } from "./auth.service.js";
import { recordAudit } from "../audit/audit.service.js";

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
    if (role && role !== "admin" && role !== "hotel_admin" && role !== "agendamento") throw new HttpError(400, "Papel inválido");
    const finalRole = role ?? "agendamento";
    // Master não fica preso a hotel. Admin de hotel e Sala de Agendamento vinculam-se a 1 hotel
    // (Sala pode ficar sem vínculo = rede inteira); o admin de hotel exige um hotel.
    const finalHotelId = finalRole === "admin" ? null : (hotelId || null);
    if (finalRole === "hotel_admin" && !finalHotelId) throw new HttpError(400, "Selecione o hotel deste administrador");
    const user = await authService.createAdminUser(email, password, name, finalRole, finalHotelId);
    if (!user) throw new HttpError(409, "Já existe um usuário com esse email");
    await recordAudit(req, {
      action: "user.create", entityType: "user", entityId: user.id, hotelId: user.hotelId,
      summary: `Criou o usuário ${user.name} (${user.email}) — ${user.role}`,
    });
    res.status(201).json(user);
  })
);

adminUsersRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const { email, password, name, role, hotelId } = req.body ?? {};
    if (role !== undefined && role !== "admin" && role !== "hotel_admin" && role !== "agendamento")
      throw new HttpError(400, "Papel inválido");
    if (password !== undefined && String(password).length < 6)
      throw new HttpError(400, "A senha precisa de ao menos 6 caracteres");
    const alvo = await authService.getAdminUserById(req.params.id);
    if (!alvo) throw new HttpError(404, "Usuário não encontrado");

    const fields: { email?: string; name?: string; password?: string; role?: AdminRole; hotelId?: string | null } = {};
    if (email !== undefined) fields.email = email;
    if (name !== undefined) fields.name = name;
    if (password !== undefined) fields.password = password;
    if (role !== undefined) fields.role = role;
    // Vínculo de hotel: master nunca fica preso; admin de hotel exige hotel; sala pode ficar na rede.
    const finalRole: AdminRole = (role ?? alvo.role) as AdminRole;
    if (hotelId !== undefined || role !== undefined) {
      const h = finalRole === "admin" ? null : (hotelId !== undefined ? (hotelId || null) : alvo.hotelId);
      if (finalRole === "hotel_admin" && !h) throw new HttpError(400, "Selecione o hotel deste administrador");
      fields.hotelId = h;
    }

    let user: Awaited<ReturnType<typeof authService.updateAdminUser>>;
    try {
      user = await authService.updateAdminUser(req.params.id, fields);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new HttpError(409, "Já existe um usuário com esse email");
      throw e;
    }
    if (!user) throw new HttpError(404, "Usuário não encontrado");
    await recordAudit(req, {
      action: "user.update", entityType: "user", entityId: user.id, hotelId: user.hotelId,
      summary: `Editou o usuário ${user.name} (${user.email})${password !== undefined ? " — senha alterada" : ""}`,
    });
    res.json(user);
  })
);

adminUsersRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    if (req.params.id === req.adminUser!.id) throw new HttpError(400, "Você não pode excluir o próprio usuário");
    const alvo = (await authService.listAdminUsers()).find((u) => u.id === req.params.id);
    const ok = await authService.deleteAdminUser(req.params.id);
    if (!ok) throw new HttpError(404, "Usuário não encontrado");
    await recordAudit(req, {
      action: "user.delete", entityType: "user", entityId: req.params.id, hotelId: alvo?.hotelId ?? null,
      summary: `Excluiu o usuário ${alvo?.name ?? req.params.id}${alvo ? ` (${alvo.email})` : ""}`,
    });
    res.status(204).send();
  })
);
