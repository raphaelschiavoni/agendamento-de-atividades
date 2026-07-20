import { pool } from "../../db/pool.js";
import { HttpError } from "../../middleware/error-handler.js";
import { isKidsActivity, isSlotBookable, type CartItemInput, type CustomerInput, type OrderInput } from "../../types.js";
import { getPaymentProvider } from "../payments/index.js";
import { getNotificationProvider } from "../notifications/index.js";
import { getAvailabilityForDate, getEffectiveSlots, getRemainingForSlotLocked } from "../availability/availability.service.js";
import * as chargesRepo from "./charges.repository.js";
import type { CartSnapshotItem } from "./charges.repository.js";
import * as bookingsRepo from "./bookings.repository.js";

interface EnrichedItem extends CartSnapshotItem {}

interface ResolvedOrder {
  guestHotelId: string | null;
  guestHotelName: string | null;
  roomNumber: string | null;
}

async function enrichAndValidateCartItem(item: CartItemInput, order: ResolvedOrder): Promise<EnrichedItem> {
  const { rows } = await pool.query<{
    activity_name: string;
    hotel_id: string;
    hotel_name: string;
    price_cents: number;
  }>(
    `SELECT a.name AS activity_name, a.hotel_id, h.name AS hotel_name, ap.price_cents
     FROM activities a
     JOIN hotels h ON h.id = a.hotel_id
     JOIN activity_prices ap ON ap.activity_id = a.id AND ap.category = $2
     WHERE a.id = $1 AND a.active = true`,
    [item.activityId, item.category]
  );
  if (rows.length === 0) throw new HttpError(400, `Atividade ou categoria inválida: ${item.activityId}`);
  if (item.qty < 1) throw new HttpError(400, "Quantidade deve ser maior que zero");

  const row = rows[0];

  // Valida data + horário + capacidade pela agenda efetiva (fonte única).
  const slots = await getEffectiveSlots(pool, item.activityId, item.date);
  if (!slots || slots.length === 0) {
    throw new HttpError(409, `${row.activity_name} não está disponível nessa data.`);
  }
  const slot = slots.find((s) => s.time === item.time.slice(0, 5));
  if (!slot) {
    throw new HttpError(409, `${row.activity_name} não possui o horário ${item.time} nessa data.`);
  }
  if (!isSlotBookable(item.date, item.time)) {
    throw new HttpError(409, `O horário ${item.time.slice(0, 5)} de ${row.activity_name} já passou. Escolha outro horário ou o próximo dia.`);
  }
  const adults = item.adults ?? item.qty;
  const children = item.children ?? 0;

  // Atividade Kids: exclusiva para crianças (sem adultos).
  if (isKidsActivity(row.activity_name)) {
    if (adults > 0) throw new HttpError(409, `${row.activity_name} é exclusiva para crianças (Kids).`);
    if (children < 1) throw new HttpError(400, `${row.activity_name} exige ao menos 1 criança.`);
  }

  // Optimistic (non-locking) pre-check for a fast fail + good UX; the authoritative
  // check happens transactionally in finalizeBookingsFromCharge.
  const remaining = await getRemainingForSlotLocked(pool, item.activityId, item.date, item.time, item.category);
  if (remaining === -1) {
    // Slot já foi validado acima; -1 aqui significa categoria desabilitada (quota 0).
    throw new HttpError(409, `${row.activity_name} não está disponível para a categoria selecionada.`);
  }
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
    adults,
    children,
    unitPriceCents: row.price_cents,
    totalCents: row.price_cents * item.qty,
    guestHotelId: order.guestHotelId,
    guestHotelName: order.guestHotelName,
    roomNumber: order.roomNumber,
  };
}

async function resolveOrder(order: OrderInput): Promise<ResolvedOrder> {
  let guestHotelId: string | null = null;
  let guestHotelName: string | null = null;
  if (order.guestHotelId) {
    const { rows } = await pool.query<{ id: string; name: string }>(
      "SELECT id, name FROM hotels WHERE id = $1",
      [order.guestHotelId]
    );
    if (rows.length === 0) throw new HttpError(400, "Hotel de hospedagem inválido");
    guestHotelId = rows[0].id;
    guestHotelName = rows[0].name;
  }
  return { guestHotelId, guestHotelName, roomNumber: order.roomNumber?.trim() || null };
}

export async function createChargeFromCart(cart: CartItemInput[], customer: CustomerInput, order: OrderInput = {}) {
  if (cart.length === 0) throw new HttpError(400, "Carrinho vazio");

  const resolvedOrder = await resolveOrder(order);
  const enriched: EnrichedItem[] = [];
  for (const item of cart) {
    enriched.push(await enrichAndValidateCartItem(item, resolvedOrder));
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
      if (!isSlotBookable(item.date, item.time)) {
        await client.query("ROLLBACK");
        throw new HttpError(409, `O horário ${item.time.slice(0, 5)} de ${item.activityName} já passou — escolha outro horário ou o próximo dia.`);
      }
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [slotSortKey(item)]);
      const remaining = await getRemainingForSlotLocked(client, item.activityId, item.date, item.time, item.category);
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

    // O resumo no WhatsApp da recepção NÃO é disparado aqui: a reserva nasce
    // 'pendente' e só notifica quando a Sala de Agendamento aprovar (approveBooking).
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

/** Aprovação pela Sala de Agendamento: marca como aprovada e dispara o resumo no WhatsApp. */
export async function approveBookingAndNotify(bookingId: string, approvedBy: string) {
  const booking = await bookingsRepo.approveBooking(bookingId, approvedBy);
  if (!booking) {
    throw new HttpError(409, "Reserva não encontrada, já aprovada ou cancelada");
  }
  const notifier = getNotificationProvider();
  await notifier.sendWhatsApp({
    toNumber: await getHotelWaNumberSafe(booking.hotel_id),
    hotelName: booking.hotel_name,
    hotelId: booking.hotel_id,
    bookingId: booking.id,
    message: await buildWhatsAppMessage(booking),
  });
  return toBookingDTO(booking);
}

export interface EditBookingInput {
  date?: string;
  time?: string;
  adults?: number;
  children?: number;
}

/** Edição de reserva pela operação (mudar horário/data ou nº de participantes),
 *  revalidando a vaga no horário-alvo dentro de uma transação com lock. */
export async function editBooking(bookingId: string, input: EditBookingInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const booking = await bookingsRepo.getBookingByIdForUpdate(client, bookingId);
    if (!booking) {
      await client.query("ROLLBACK");
      throw new HttpError(404, "Reserva não encontrada");
    }
    if (booking.status === "cancelado") {
      await client.query("ROLLBACK");
      throw new HttpError(409, "Reserva cancelada não pode ser editada");
    }

    const newDate = input.date ?? booking.booking_date;
    const newTime = (input.time ?? booking.booking_time).slice(0, 5);
    const adults = input.adults ?? booking.adults;
    const children = input.children ?? booking.children;
    if (children < 0) {
      await client.query("ROLLBACK");
      throw new HttpError(400, "Número de crianças inválido");
    }
    if (isKidsActivity(booking.activity_name)) {
      if (adults > 0) {
        await client.query("ROLLBACK");
        throw new HttpError(409, `${booking.activity_name} é exclusiva para crianças (Kids).`);
      }
      if (children < 1) {
        await client.query("ROLLBACK");
        throw new HttpError(400, `${booking.activity_name} exige ao menos 1 criança.`);
      }
    } else if (adults < 1) {
      await client.query("ROLLBACK");
      throw new HttpError(400, "É necessário ao menos 1 adulto");
    }
    const newQty = adults + children;

    // Serializa com checkouts concorrentes no mesmo slot.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${booking.activity_id}|${newDate}|${newTime}`]);

    const remaining = await getRemainingForSlotLocked(client, booking.activity_id, newDate, newTime, booking.category);
    if (remaining === -1) {
      await client.query("ROLLBACK");
      throw new HttpError(409, `${booking.activity_name} não tem esse horário disponível nessa data.`);
    }
    // No mesmo slot, a própria reserva já ocupa lugares — soma-os de volta ao disponível.
    const sameSlot = booking.booking_date === newDate && booking.booking_time.slice(0, 5) === newTime;
    const effectiveRemaining = remaining + (sameSlot ? booking.qty : 0);
    if (newQty > effectiveRemaining) {
      await client.query("ROLLBACK");
      throw new HttpError(409, `Vagas insuficientes para ${booking.activity_name} em ${newDate} ${newTime} (restam ${Math.max(0, effectiveRemaining)}).`);
    }

    const totalCents = booking.unit_price_cents * newQty;
    const updated = await bookingsRepo.updateBookingDetails(client, bookingId, {
      date: newDate,
      time: newTime,
      qty: newQty,
      adults,
      children,
      totalCents,
    });
    await client.query("COMMIT");
    return toBookingDTO(updated!);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* já revertido */
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

async function buildWhatsAppMessage(booking: bookingsRepo.BookingRow): Promise<string> {
  const participantes =
    booking.children > 0
      ? `${booking.qty} pessoa(s) (${booking.adults} adulto(s), ${booking.children} criança(s))`
      : `${booking.qty} pessoa(s)`;
  let hospedagem = "";
  if (booking.guest_hotel_id) {
    const { rows } = await pool.query<{ name: string }>("SELECT name FROM hotels WHERE id = $1", [
      booking.guest_hotel_id,
    ]);
    const guestName = rows[0]?.name ?? booking.guest_hotel_id;
    hospedagem = `Hospedado em: ${guestName}`;
    if (booking.room_number) hospedagem += ` (Chalé/Quarto ${booking.room_number})`;
    hospedagem += "\n";
    if (booking.category === "passaporte" && guestName !== booking.hotel_name) {
      hospedagem += `✨ Passaporte dos Sonhos — usando atividade de outro hotel da rede\n`;
    }
  } else if (booking.room_number) {
    hospedagem = `Chalé/Quarto: ${booking.room_number}\n`;
  }
  return (
    `🔔 *Nova venda confirmada — ${booking.hotel_name}*\n` +
    `Atividade: ${booking.activity_name}\n` +
    `Categoria: ${CATEGORY_LABELS[booking.category] ?? booking.category}\n` +
    hospedagem +
    `Data/Hora: ${booking.booking_date} às ${booking.booking_time.slice(0, 5)}\n` +
    `Participantes: ${participantes}\n` +
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
    adults: row.adults,
    children: row.children,
    unitPrice: row.unit_price_cents / 100,
    total: row.total_cents / 100,
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
    guestHotelId: row.guest_hotel_id,
    roomNumber: row.room_number,
    status: row.status,
    approvalStatus: row.approval_status,
    used: row.used,
    createdAt: row.created_at,
  };
}

type BookingDTO = ReturnType<typeof toBookingDTO> & { slotCapacity?: number; slotRemaining?: number };

/** Anexa a lotação do horário (capacidade e vagas restantes) a cada reserva —
 *  usado pela Sala de Agendamento para colorir os cards por ocupação. */
export async function attachOccupancy(dtos: BookingDTO[]): Promise<BookingDTO[]> {
  const distinct = new Map<string, { activityId: string; date: string }>();
  for (const b of dtos) distinct.set(`${b.activityId}|${b.date}`, { activityId: b.activityId, date: b.date });

  const byKey = new Map<string, Map<string, { capacity: number; remaining: number }>>();
  for (const { activityId, date } of distinct.values()) {
    const slots = await getAvailabilityForDate(activityId, date);
    byKey.set(`${activityId}|${date}`, new Map(slots.map((s) => [s.time, { capacity: s.capacity, remaining: s.remaining }])));
  }

  return dtos.map((b) => {
    const slot = byKey.get(`${b.activityId}|${b.date}`)?.get(b.time);
    return slot ? { ...b, slotCapacity: slot.capacity, slotRemaining: slot.remaining } : b;
  });
}
