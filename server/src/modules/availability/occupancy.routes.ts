import { Router } from "express";
import { asyncRoute, HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { getHotelOccupancy } from "./availability.service.js";

// Quadro de ocupação por horário (Vendas & Vouchers). Sala de Agendamento
// fica restrita ao próprio hotel; ADM escolhe qualquer hotel.
export const adminOccupancyRouter = Router();
adminOccupancyRouter.use(requireAdmin);
adminOccupancyRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const user = req.adminUser!;
    const requested = typeof req.query.hotelId === "string" ? req.query.hotelId : "";
    const hotelId = user.role === "agendamento" && user.hotelId ? user.hotelId : requested;
    if (!hotelId || hotelId === "all") throw new HttpError(400, "Selecione um hotel para ver a ocupação");
    const date = typeof req.query.date === "string" ? req.query.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Parâmetro 'date' inválido (use YYYY-MM-DD)");
    res.json({ date, activities: await getHotelOccupancy(hotelId, date) });
  })
);
