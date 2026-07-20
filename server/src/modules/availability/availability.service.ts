import type { Pool, PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import { effectiveCapacity, isSlotBookable, scheduleHasContent, type ActivitySchedule } from "../../types.js";

export interface SlotAvailability {
  time: string;
  remaining: number;
  capacity: number;
}

export interface EffectiveSlot {
  time: string; // "HH:MM"
  capacity: number;
}

type Queryable = Pool | PoolClient;

/**
 * Fonte única dos horários válidos de uma atividade numa data, com a capacidade de cada um.
 * - Com `schedule` preenchida: datas pontuais têm prioridade; senão os horários do dia da semana.
 * - Sem `schedule` (legado): usa activity_times + weekdays/allowed_dates + weekday_capacities.
 * Retorna [] quando a atividade não opera na data; null quando a atividade não existe.
 */
export async function getEffectiveSlots(q: Queryable, activityId: string, date: string): Promise<EffectiveSlot[] | null> {
  const { rows } = await q.query<{
    capacity: number;
    weekdays: number[];
    allowed_dates: string[];
    weekday_capacities: Record<string, number> | null;
    schedule: ActivitySchedule | null;
  }>(
    "SELECT capacity, weekdays, allowed_dates, weekday_capacities, schedule FROM activities WHERE id = $1",
    [activityId]
  );
  if (rows.length === 0) return null;
  const a = rows[0];
  const weekday = new Date(`${date}T12:00:00`).getDay();

  if (scheduleHasContent(a.schedule)) {
    const slots = a.schedule?.dates?.[date] ?? a.schedule?.weekdays?.[String(weekday)] ?? [];
    return dedupeSorted(
      slots.map((s) => ({
        time: s.time.slice(0, 5),
        capacity: typeof s.capacity === "number" && s.capacity > 0 ? Math.floor(s.capacity) : a.capacity,
      }))
    );
  }

  // Legado
  const weekdays = a.weekdays ?? [];
  const allowedDates = a.allowed_dates ?? [];
  if (weekdays.length > 0 || allowedDates.length > 0) {
    const ok = weekdays.includes(weekday) || allowedDates.includes(date);
    if (!ok) return [];
  }
  const { rows: timeRows } = await q.query<{ time_of_day: string }>(
    `SELECT to_char(time_of_day, 'HH24:MI') AS time_of_day FROM activity_times WHERE activity_id = $1 ORDER BY time_of_day`,
    [activityId]
  );
  const cap = effectiveCapacity(a.capacity, a.weekday_capacities as Record<number, number> | null, date);
  return timeRows.map((t) => ({ time: t.time_of_day, capacity: cap }));
}

function dedupeSorted(slots: EffectiveSlot[]): EffectiveSlot[] {
  const map = new Map<string, EffectiveSlot>();
  for (const s of slots) if (!map.has(s.time)) map.set(s.time, s);
  return Array.from(map.values()).sort((x, y) => x.time.localeCompare(y.time));
}

export interface OccupancyGuest {
  name: string;
  qty: number;
}
export interface ActivityOccupancy {
  activityId: string;
  activityName: string;
  slots: { time: string; capacity: number; reserved: number; remaining: number; guests: OccupancyGuest[] }[];
}

/** Quadro de ocupação por horário de todas as atividades ativas de um hotel numa data,
 *  com os nomes das pessoas agendadas em cada horário (para conferência). */
export async function getHotelOccupancy(hotelId: string, date: string): Promise<ActivityOccupancy[]> {
  const { rows: acts } = await pool.query<{ id: string; name: string }>(
    "SELECT id, name FROM activities WHERE hotel_id = $1 AND active = true ORDER BY name",
    [hotelId]
  );
  const out: ActivityOccupancy[] = [];
  for (const a of acts) {
    const slots = await getAvailabilityForDate(a.id, date);
    if (slots.length === 0) continue;

    const { rows: guestRows } = await pool.query<{ booking_time: string; customer_name: string; qty: number }>(
      `SELECT to_char(booking_time, 'HH24:MI') AS booking_time, customer_name, qty
       FROM bookings
       WHERE activity_id = $1 AND booking_date = $2 AND status <> 'cancelado'
       ORDER BY booking_time, customer_name`,
      [a.id, date]
    );
    const guestsByTime = new Map<string, OccupancyGuest[]>();
    for (const g of guestRows) {
      const list = guestsByTime.get(g.booking_time) ?? [];
      list.push({ name: g.customer_name, qty: g.qty });
      guestsByTime.set(g.booking_time, list);
    }

    out.push({
      activityId: a.id,
      activityName: a.name,
      slots: slots.map((s) => ({
        time: s.time,
        capacity: s.capacity,
        reserved: s.capacity - s.remaining,
        remaining: s.remaining,
        guests: guestsByTime.get(s.time) ?? [],
      })),
    });
  }
  return out;
}

/** Quota de vagas da categoria por horário: null = sem limite; 0 = categoria desabilitada. */
export async function getCategoryQuota(q: Queryable, activityId: string, category: string): Promise<number | null> {
  const { rows } = await q.query<{ cap: number | null }>(
    "SELECT (category_capacities ->> $2)::int AS cap FROM activities WHERE id = $1",
    [activityId, category]
  );
  const cap = rows[0]?.cap;
  return typeof cap === "number" && Number.isFinite(cap) && cap >= 0 ? cap : null;
}

/** Read-only view used by the client to display remaining slots. Not authoritative by itself —
 *  the real check happens transactionally at booking-confirmation time (see bookings.service.ts).
 *  Com `category`, o restante considera também a quota daquela categoria. */
export async function getAvailabilityForDate(
  activityId: string,
  date: string,
  category?: string,
  opts?: { hideExpired?: boolean }
): Promise<SlotAvailability[]> {
  let slots = await getEffectiveSlots(pool, activityId, date);
  if (!slots || slots.length === 0) return [];
  // No fluxo de agendamento, esconde horários que já começaram (+ tolerância).
  if (opts?.hideExpired) slots = slots.filter((s) => isSlotBookable(date, s.time));
  if (slots.length === 0) return [];

  const quota = category ? await getCategoryQuota(pool, activityId, category) : null;
  if (quota === 0) return []; // categoria desabilitada para esta atividade

  const { rows: occupiedRows } = await pool.query<{ booking_time: string; occupied: string; occupied_cat: string }>(
    `SELECT to_char(booking_time, 'HH24:MI') AS booking_time,
            COALESCE(SUM(qty), 0) AS occupied,
            COALESCE(SUM(qty) FILTER (WHERE category = $3::customer_category), 0) AS occupied_cat
     FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND status <> 'cancelado'
     GROUP BY booking_time`,
    [activityId, date, category ?? null]
  );
  const byTime = new Map(occupiedRows.map((r) => [r.booking_time, { total: Number(r.occupied), cat: Number(r.occupied_cat) }]));

  return slots.map((s) => {
    const occ = byTime.get(s.time) ?? { total: 0, cat: 0 };
    let remaining = s.capacity - occ.total;
    if (quota !== null && quota > 0) remaining = Math.min(remaining, quota - occ.cat);
    return { time: s.time, remaining: Math.max(0, remaining), capacity: s.capacity };
  });
}

/** Authoritative capacity check, must run inside the same transaction/lock as the insert.
 *  Retorna -1 quando o horário não existe nessa data ou a categoria está desabilitada. */
export async function getRemainingForSlotLocked(
  q: Queryable,
  activityId: string,
  date: string,
  time: string,
  category?: string
): Promise<number> {
  const slots = await getEffectiveSlots(q, activityId, date);
  const slot = slots?.find((s) => s.time === time.slice(0, 5));
  if (!slot) return -1;

  const quota = category ? await getCategoryQuota(q, activityId, category) : null;
  if (quota === 0) return -1;

  const { rows } = await q.query<{ occupied: string; occupied_cat: string }>(
    `SELECT COALESCE(SUM(qty), 0) AS occupied,
            COALESCE(SUM(qty) FILTER (WHERE category = $4::customer_category), 0) AS occupied_cat
     FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND booking_time = $3 AND status <> 'cancelado'`,
    [activityId, date, time, category ?? null]
  );
  let remaining = slot.capacity - Number(rows[0].occupied);
  if (quota !== null && quota > 0) remaining = Math.min(remaining, quota - Number(rows[0].occupied_cat));
  return remaining;
}
