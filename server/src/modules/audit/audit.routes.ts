import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { scopedHotelId } from "../auth/auth.service.js";
import { listAudit } from "./audit.service.js";

// Página de Logs. Master vê tudo (pode filtrar por hotel); usuário travado em 1 hotel
// (admin de hotel ou sala) vê apenas os registros do próprio hotel.
export const adminAuditRouter = Router();
adminAuditRouter.use(requireAdmin);
adminAuditRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const requested = typeof req.query.hotelId === "string" && req.query.hotelId !== "all" ? req.query.hotelId : undefined;
    const hotelId = scopedHotelId(req.adminUser!) ?? requested;
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
