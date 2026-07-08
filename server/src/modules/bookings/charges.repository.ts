import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import type { CustomerInput } from "../../types.js";

export interface CartSnapshotItem {
  activityId: string;
  hotelId: string;
  activityName: string;
  hotelName: string;
  category: string;
  date: string;
  time: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface ChargeRow {
  id: string;
  provider: string;
  provider_ref: string | null;
  amount_cents: number;
  pix_copy_paste: string | null;
  status: "pending" | "approved" | "expired" | "failed";
  cart_snapshot: CartSnapshotItem[];
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  created_at: string;
  approved_at: string | null;
}

export async function createCharge(
  cart: CartSnapshotItem[],
  customer: CustomerInput,
  amountCents: number
): Promise<ChargeRow> {
  const { rows } = await pool.query<ChargeRow>(
    `INSERT INTO payment_charges (amount_cents, cart_snapshot, customer_name, customer_phone, customer_email)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [amountCents, JSON.stringify(cart), customer.name, customer.phone, customer.email ?? null]
  );
  return rows[0];
}

export async function setProviderInfo(id: string, providerRef: string, pixCopyPaste: string): Promise<void> {
  await pool.query("UPDATE payment_charges SET provider_ref = $2, pix_copy_paste = $3 WHERE id = $1", [
    id,
    providerRef,
    pixCopyPaste,
  ]);
}

export async function getChargeById(id: string): Promise<ChargeRow | null> {
  const { rows } = await pool.query<ChargeRow>("SELECT * FROM payment_charges WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function getChargeByIdLocked(client: PoolClient, id: string): Promise<ChargeRow | null> {
  const { rows } = await client.query<ChargeRow>("SELECT * FROM payment_charges WHERE id = $1 FOR UPDATE", [id]);
  return rows[0] ?? null;
}

export async function markChargeApproved(client: PoolClient, id: string): Promise<void> {
  await client.query("UPDATE payment_charges SET status = 'approved', approved_at = now() WHERE id = $1", [id]);
}
