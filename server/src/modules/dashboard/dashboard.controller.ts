import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";

export async function getSummary(_req: Request, res: Response) {
  const { rows: todayRows } = await pool.query<{ count: string; revenue: string }>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS revenue
     FROM bookings WHERE status = 'pago' AND booking_date = CURRENT_DATE`
  );
  const { rows: totalRows } = await pool.query<{ revenue: string }>(
    `SELECT COALESCE(SUM(total_cents), 0) AS revenue FROM bookings WHERE status = 'pago'`
  );
  const { rows: pendingRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM bookings WHERE status = 'pago' AND used = false`
  );
  const { rows: byHotelRows } = await pool.query<{ hotel_id: string; name: string; revenue: string }>(
    `SELECT h.id AS hotel_id, h.name, COALESCE(SUM(b.total_cents), 0) AS revenue
     FROM hotels h
     LEFT JOIN bookings b ON b.hotel_id = h.id AND b.status = 'pago'
     GROUP BY h.id, h.name
     ORDER BY h.name`
  );

  res.json({
    todayBookingsCount: Number(todayRows[0].count),
    todayRevenue: Number(todayRows[0].revenue) / 100,
    totalRevenue: Number(totalRows[0].revenue) / 100,
    pendingVouchers: Number(pendingRows[0].count),
    byHotel: byHotelRows.map((r) => ({ hotelId: r.hotel_id, name: r.name, revenue: Number(r.revenue) / 100 })),
  });
}
