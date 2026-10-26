import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { listAudit } from "./audit.service.js";

// Página de Logs. ADM vê tudo (pode filtrar por hotel); Sala de Agendamento
// vê apenas os registros do próprio hotel.
export const adminAuditRouter = Router();
adminAuditRouter.use(requireAdmin);
adminAuditRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const u = req.adminUser!;
    const requested = typeof req.query.hotelId === "string" && req.query.hotelId !== "all" ? req.query.hotelId : undefined;
    const hotelId = u.role === "agendamento" && u.hotelId ? u.hotelId : requested;
    res.json(
      await listAudit({
        hotelId,
        action: typeof req.query.action === "string" && req.query.action !== "all" ? req.query.action : undefined,
        from: typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : undefined,
        to: typeof req.query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      })
    );
  })
);
