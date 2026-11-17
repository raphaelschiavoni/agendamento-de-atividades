import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { scopedHotelId } from "../auth/auth.service.js";
import { pool } from "../../db/pool.js";

export const adminWhatsappLogRouter = Router();
adminWhatsappLogRouter.use(requireAdmin);
adminWhatsappLogRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    // Usuário travado em 1 hotel vê só o dele; master filtra livremente.
    const requested = typeof req.query.hotelId === "string" && req.query.hotelId !== "all" ? req.query.hotelId : undefined;
    const hotelId = scopedHotelId(req.adminUser!) ?? requested;

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
