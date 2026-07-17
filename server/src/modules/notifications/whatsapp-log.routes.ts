import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { pool } from "../../db/pool.js";

export const adminWhatsappLogRouter = Router();
adminWhatsappLogRouter.use(requireAdmin);
adminWhatsappLogRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const user = req.adminUser!;
    // Sala de Agendamento vê só o hotel vinculado; ADM pode filtrar livremente.
    const requested = typeof req.query.hotelId === "string" && req.query.hotelId !== "all" ? req.query.hotelId : undefined;
    const hotelId = user.role === "agendamento" && user.hotelId ? user.hotelId : requested;

    const params: unknown[] = [];
    let where = "";
    if (hotelId) {
      params.push(hotelId);
      where = "WHERE hotel_id = $1";
    }
    const { rows } = await pool.query(
      `SELECT id, booking_id, to_number, hotel_name, hotel_id, message, status, created_at
       FROM whatsapp_log ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  })
);
