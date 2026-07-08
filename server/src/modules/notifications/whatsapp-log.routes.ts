import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { pool } from "../../db/pool.js";

export const adminWhatsappLogRouter = Router();
adminWhatsappLogRouter.use(requireAdmin);
adminWhatsappLogRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, booking_id, to_number, hotel_name, message, status, created_at FROM whatsapp_log ORDER BY created_at DESC"
    );
    res.json(rows);
  })
);
