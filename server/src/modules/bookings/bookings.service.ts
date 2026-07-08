import { pool } from "../../db/pool.js";
import { HttpError } from "../../middleware/error-handler.js";
import type { CartItemInput, CustomerInput } from "../../types.js";
import { getPaymentProvider } from "../payments/index.js";
import { getNotificationProvider } from "../notifications/index.js";
import { getRemainingForSlotLocked } from "../availability/availability.service.js";
import * as chargesRepo from "./charges.repository.js";
import type { CartSnapshotItem } from "./charges.repository.js";
import * as bookingsRepo from "./bookings.repository.js";

interface EnrichedItem extends CartSnapshotItem {}

async function enrichAndValidateCartItem(item: CartItemInput): Promise<EnrichedItem> {
  const { rows } = await pool.query<{
    activity_name: string;
    hotel_id: string;
    hotel_name: string;
    price_cents: number;
    capacity: number;
  }>(
    `SELECT a.name AS activity_name, a.hotel_id, h.name AS hotel_name, ap.price_cents, a.capacity
     FROM activities a
     JOIN hotels h ON h.id = a.hotel_id
     JOIN activity_prices ap ON ap.activity_id = a.id AND ap.category = $2
     WHERE a.id = $1 AND a.active = true`,
    [item.activityId, item.category]
  );
  if (rows.length === 0) throw new HttpError(400, `Atividade ou categoria inválida: ${item.activityId}`);
  if (item.qty < 1) throw new HttpError(400, "Quantidade deve ser maior que zero");

  const row = rows[0];

  // Optimistic (non-locking) pre-check for a fast fail + good UX; the authoritative
  // check happens transactionally in finalizeBookingsFromCharge.
  const { rows: occRows } = await pool.query<{ occupied: string }>(
    `SELECT COALESCE(SUM(qty), 0) AS occupied FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND booking_time = $3 AND status <> 'cancelado'`,
    [item.activityId, item.date, item.time]
  );
  const remaining = row.capacity - Number(occRows[0].occupied);
  if (item.qty > remaining) {
    throw new HttpError(409, `Vagas insuficientes para ${row.activity_name} em ${item.date} ${item.time}`);
  }

  return {
    activityId: item.activityId,
    hotelId: row.hotel_id,
    activityName: row.activity_name,
    hotelName: row.hotel_name,
    category: item.category,
    date: item.date,
    time: item.time,
    qty: item.qty,
    unitPriceCents: row.price_cents,
    totalCents: row.price_cents * item.qty,
  };
}

export async function createChargeFromCart(cart: CartItemInput[], customer: CustomerInput) {
  if (cart.length === 0) throw new HttpError(400, "Carrinho vazio");

  const enriched: EnrichedItem[] = [];
  for (const item of cart) {
    enriched.push(await enrichAndValidateCartItem(item));
  }
  const amountCents = enriched.reduce((s, i) => s + i.totalCents, 0);

  const charge = await chargesRepo.createCharge(enriched, customer, amountCents);

  const provider = getPaymentProvider();
  const { providerRef, pixCopyPaste } = await provider.createCharge({
    amountCents,
    chargeId: charge.id,
    customer,
  });
  await chargesRepo.setProviderInfo(charge.id, providerRef, pixCopyPaste);

  return {
    chargeId: charge.id,
    amount: amountCents / 100,
    pixCopyPaste,
    status: "pending" as const,
  };
}

export async function getChargeStatus(chargeId: string) {
  const charge = await chargesRepo.getChargeById(chargeId);
  if (!charge) throw new HttpError(404, "Cobrança não encontrada");
  const bookings =
    charge.status === "approved" ? await bookingsRepo.getBookingsByPaymentRef(charge.id) : [];
  return { status: charge.status, bookings: bookings.map(toBookingDTO) };
}

function slotSortKey(item: CartSnapshotItem) {
  return `${item.activityId}|${item.date}|${item.time}`;
}

/** The single funnel every payment path (manual simulate-approve today, a real
 *  Mercado Pago webhook later) must call to turn an approved charge into bookings. */
export async function finalizeBookingsFromCharge(chargeId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const charge = await chargesRepo.getChargeByIdLocked(client, chargeId);
    if (!charge) throw new HttpError(404, "Cobrança não encontrada");
    if (charge.status !== "pending") {
      await client.query("ROLLBACK");
      throw new HttpError(409, `Cobrança já está em status '${charge.status}'`);
    }

    const items = [...charge.cart_snapshot].sort((a, b) => (slotSortKey(a) < slotSortKey(b) ? -1 : 1));

    for (const item of items) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [slotSortKey(item)]);
      const remaining = await getRemainingForSlotLocked(client, item.activityId, item.date, item.time);
      if (remaining < item.qty) {
        await client.query("ROLLBACK");
        throw new HttpError(
          409,
          `Vagas esgotadas para ${item.activityName} em ${item.date} ${item.time} — tente outro horário`
        );
      }
    }

    const createdBookings = [];
    for (const item of items) {
      const booking = await bookingsRepo.insertBookingFromCartItem(
        client,
        item,
        { name: charge.customer_name, phone: charge.customer_phone, email: charge.customer_email },
        charge.id
      );
      createdBookings.push(booking);
    }

    await chargesRepo.markChargeApproved(client, charge.id);
    await client.query("COMMIT");

    const notifier = getNotificationProvider();
    for (const booking of createdBookings) {
      await notifier.sendWhatsApp({
        toNumber: await getHotelWaNumberSafe(booking.hotel_id),
        hotelName: booking.hotel_name,
        bookingId: booking.id,
        message: buildWhatsAppMessage(booking),
      });
    }

    return createdBookings.map(toBookingDTO);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already rolled back */
    }
    throw err;
  } finally {
    client.release();
  }
}

async function getHotelWaNumberSafe(hotelId: string): Promise<string> {
  const { rows } = await pool.query<{ whatsapp_number: string }>(
    "SELECT whatsapp_number FROM hotels WHERE id = $1",
    [hotelId]
  );
  return rows[0]?.whatsapp_number ?? "";
}

const CATEGORY_LABELS: Record<string, string> = {
  hospede: "Hóspede",
  visitante: "Visitante",
  dayuse: "Day Use",
  passaporte: "Passaporte dos Sonhos",
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildWhatsAppMessage(booking: bookingsRepo.BookingRow): string {
  return (
    `🔔 *Nova venda confirmada — ${booking.hotel_name}*\n` +
    `Atividade: ${booking.activity_name}\n` +
    `Categoria: ${CATEGORY_LABELS[booking.category] ?? booking.category}\n` +
    `Data/Hora: ${booking.booking_date} às ${booking.booking_time.slice(0, 5)}\n` +
    `Quantidade: ${booking.qty} pessoa(s)\n` +
    `Valor: ${formatBRL(booking.total_cents)} — pago via Pix ✅\n` +
    `Cliente: ${booking.customer_name} — ${booking.customer_phone}\n` +
    `Voucher: ${booking.voucher_code}`
  );
}

export function toBookingDTO(row: bookingsRepo.BookingRow) {
  return {
    id: row.id,
    voucherCode: row.voucher_code,
    hotelId: row.hotel_id,
    activityId: row.activity_id,
    activityName: row.activity_name,
    hotelName: row.hotel_name,
    category: row.category,
    date: row.booking_date,
    time: row.booking_time.slice(0, 5),
    qty: row.qty,
    unitPrice: row.unit_price_cents / 100,
    total: row.total_cents / 100,
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
    status: row.status,
    used: row.used,
    createdAt: row.created_at,
  };
}
