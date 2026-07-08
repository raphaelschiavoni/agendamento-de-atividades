import type { Request, Response } from "express";
import { pool } from "../../db/pool.js";

// Monta o filtro compartilhado (período por data da atividade, hotel, categoria).
// Considera apenas reservas efetivas (não canceladas), salvo quando indicado.
function buildFilter(query: Request["query"], startIndex = 1) {
  const clauses: string[] = ["b.status <> 'cancelado'"];
  const params: unknown[] = [];
  let i = startIndex;

  const from = typeof query.from === "string" && query.from ? query.from : null;
  const to = typeof query.to === "string" && query.to ? query.to : null;
  const hotelId = typeof query.hotelId === "string" && query.hotelId && query.hotelId !== "all" ? query.hotelId : null;
  const category =
    typeof query.category === "string" && query.category && query.category !== "all" ? query.category : null;

  if (from) { clauses.push(`b.booking_date >= $${i++}`); params.push(from); }
  if (to) { clauses.push(`b.booking_date <= $${i++}`); params.push(to); }
  if (hotelId) { clauses.push(`b.hotel_id = $${i++}`); params.push(hotelId); }
  if (category) { clauses.push(`b.category = $${i++}::customer_category`); params.push(category); }

  return { where: "WHERE " + clauses.join(" AND "), params };
}

export async function getSummary(req: Request, res: Response) {
  const { where, params } = buildFilter(req.query);

  const totals = await pool.query<{
    bookings: string; revenue: string; adults: string; children: string;
    participants: string; used: string; pending: string;
  }>(
    `SELECT
       COUNT(*) AS bookings,
       COALESCE(SUM(b.total_cents),0) AS revenue,
       COALESCE(SUM(b.adults),0) AS adults,
       COALESCE(SUM(b.children),0) AS children,
       COALESCE(SUM(b.qty),0) AS participants,
       COALESCE(SUM(CASE WHEN b.used THEN 1 ELSE 0 END),0) AS used,
       COALESCE(SUM(CASE WHEN NOT b.used THEN 1 ELSE 0 END),0) AS pending
     FROM bookings b ${where}`,
    params
  );

  const byHotel = await pool.query<{ hotel_id: string; name: string; bookings: string; revenue: string }>(
    `SELECT b.hotel_id, b.hotel_name AS name, COUNT(*) AS bookings, COALESCE(SUM(b.total_cents),0) AS revenue
     FROM bookings b ${where}
     GROUP BY b.hotel_id, b.hotel_name
     ORDER BY revenue DESC, bookings DESC`,
    params
  );

  const byCategory = await pool.query<{ category: string; bookings: string; revenue: string; participants: string }>(
    `SELECT b.category, COUNT(*) AS bookings, COALESCE(SUM(b.total_cents),0) AS revenue, COALESCE(SUM(b.qty),0) AS participants
     FROM bookings b ${where}
     GROUP BY b.category
     ORDER BY bookings DESC`,
    params
  );

  const topActivities = await pool.query<{
    activity_name: string; hotel_name: string; bookings: string; participants: string; revenue: string;
  }>(
    `SELECT b.activity_name, b.hotel_name, COUNT(*) AS bookings, COALESCE(SUM(b.qty),0) AS participants, COALESCE(SUM(b.total_cents),0) AS revenue
     FROM bookings b ${where}
     GROUP BY b.activity_name, b.hotel_name
     ORDER BY bookings DESC, participants DESC
     LIMIT 15`,
    params
  );

  // Uso cruzado do Passaporte: hóspede de um hotel usando atividade de outro.
  const passaporteCross = await pool.query<{
    guest_hotel: string; activity_hotel: string; bookings: string; participants: string;
  }>(
    `SELECT COALESCE(gh.name, '—') AS guest_hotel, b.hotel_name AS activity_hotel,
            COUNT(*) AS bookings, COALESCE(SUM(b.qty),0) AS participants
     FROM bookings b
     LEFT JOIN hotels gh ON gh.id = b.guest_hotel_id
     ${where} AND b.category = 'passaporte'
     GROUP BY gh.name, b.hotel_name
     ORDER BY bookings DESC`,
    params
  );

  res.json({
    totals: {
      bookings: Number(totals.rows[0].bookings),
      revenue: Number(totals.rows[0].revenue) / 100,
      adults: Number(totals.rows[0].adults),
      children: Number(totals.rows[0].children),
      participants: Number(totals.rows[0].participants),
      used: Number(totals.rows[0].used),
      pending: Number(totals.rows[0].pending),
    },
    byHotel: byHotel.rows.map((r) => ({
      hotelId: r.hotel_id, name: r.name, bookings: Number(r.bookings), revenue: Number(r.revenue) / 100,
    })),
    byCategory: byCategory.rows.map((r) => ({
      category: r.category, bookings: Number(r.bookings), revenue: Number(r.revenue) / 100, participants: Number(r.participants),
    })),
    topActivities: topActivities.rows.map((r) => ({
      activityName: r.activity_name, hotelName: r.hotel_name, bookings: Number(r.bookings),
      participants: Number(r.participants), revenue: Number(r.revenue) / 100,
    })),
    passaporteCross: passaporteCross.rows.map((r) => ({
      guestHotel: r.guest_hotel, activityHotel: r.activity_hotel, bookings: Number(r.bookings), participants: Number(r.participants),
    })),
  });
}

export async function getCustomers(req: Request, res: Response) {
  const { where, params } = buildFilter(req.query);

  // Agrupa por telefone (identificador do cliente); nome/email = os mais recentes.
  const { rows } = await pool.query<{
    customer_name: string; customer_phone: string; customer_email: string | null;
    bookings: string; participants: string; total_spent: string; last_booking: string; hotels: string;
  }>(
    `SELECT
       (ARRAY_AGG(b.customer_name ORDER BY b.created_at DESC))[1] AS customer_name,
       b.customer_phone,
       (ARRAY_AGG(b.customer_email ORDER BY b.created_at DESC))[1] AS customer_email,
       COUNT(*) AS bookings,
       COALESCE(SUM(b.qty),0) AS participants,
       COALESCE(SUM(b.total_cents),0) AS total_spent,
       MAX(b.created_at) AS last_booking,
       STRING_AGG(DISTINCT b.hotel_name, ', ') AS hotels
     FROM bookings b ${where}
     GROUP BY b.customer_phone
     ORDER BY total_spent DESC, bookings DESC`,
    params
  );

  res.json(
    rows.map((r) => ({
      name: r.customer_name,
      phone: r.customer_phone,
      email: r.customer_email,
      bookings: Number(r.bookings),
      participants: Number(r.participants),
      totalSpent: Number(r.total_spent) / 100,
      lastBooking: r.last_booking,
      hotels: r.hotels,
    }))
  );
}
