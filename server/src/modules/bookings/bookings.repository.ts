import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import type { Category } from "../../types.js";
import type { CartSnapshotItem } from "./charges.repository.js";

export interface BookingRow {
  id: string;
  voucher_code: string;
  hotel_id: string;
  activity_id: string;
  activity_name: string;
  hotel_name: string;
  category: Category;
  booking_date: string;
  booking_time: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: "pendente" | "pago" | "cancelado";
  used: boolean;
  used_at: string | null;
  payment_ref: string | null;
  created_at: string;
}

function genVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "RS-";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function insertBookingFromCartItem(
  client: PoolClient,
  item: CartSnapshotItem,
  customer: { name: string; phone: string; email?: string | null },
  paymentRef: string
): Promise<BookingRow> {
  const voucherCode = genVoucherCode();
  const { rows } = await client.query<BookingRow>(
    `INSERT INTO bookings (
       voucher_code, hotel_id, activity_id, activity_name, hotel_name, category,
       booking_date, booking_time, qty, unit_price_cents, total_cents,
       customer_name, customer_phone, customer_email, status, payment_ref
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pago',$15)
     RETURNING *`,
    [
      voucherCode,
      item.hotelId,
      item.activityId,
      item.activityName,
      item.hotelName,
      item.category,
      item.date,
      item.time,
      item.qty,
      item.unitPriceCents,
      item.totalCents,
      customer.name,
      customer.phone,
      customer.email ?? null,
      paymentRef,
    ]
  );
  return rows[0];
}

export interface ListBookingsFilters {
  hotelId?: string;
  status?: "all" | "utilizado" | "cancelado" | "pendente-uso";
  search?: string;
}

export async function listBookings(filters: ListBookingsFilters): Promise<BookingRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.hotelId && filters.hotelId !== "all") {
    params.push(filters.hotelId);
    clauses.push(`hotel_id = $${params.length}`);
  }
  if (filters.status === "utilizado") clauses.push("used = true");
  else if (filters.status === "cancelado") clauses.push("status = 'cancelado'");
  else if (filters.status === "pendente-uso") clauses.push("used = false AND status <> 'cancelado'");

  if (filters.search) {
    params.push(`%${filters.search}%`);
    const idx = params.length;
    clauses.push(`(customer_name ILIKE $${idx} OR customer_phone ILIKE $${idx} OR voucher_code ILIKE $${idx})`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query<BookingRow>(
    `SELECT * FROM bookings ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function markBookingUsed(id: string): Promise<BookingRow | null> {
  const { rows } = await pool.query<BookingRow>(
    "UPDATE bookings SET used = true, used_at = now(), updated_at = now() WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0] ?? null;
}

export async function cancelBooking(id: string): Promise<BookingRow | null> {
  const { rows } = await pool.query<BookingRow>(
    "UPDATE bookings SET status = 'cancelado', updated_at = now() WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0] ?? null;
}

export async function getBookingsByPaymentRef(paymentRef: string): Promise<BookingRow[]> {
  const { rows } = await pool.query<BookingRow>("SELECT * FROM bookings WHERE payment_ref = $1", [paymentRef]);
  return rows;
}

export async function getBookingByVoucherCode(code: string): Promise<BookingRow | null> {
  const { rows } = await pool.query<BookingRow>("SELECT * FROM bookings WHERE voucher_code = $1", [code]);
  return rows[0] ?? null;
}
