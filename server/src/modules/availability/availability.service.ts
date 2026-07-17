import type { Pool, PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import { effectiveCapacity, scheduleHasContent, type ActivitySchedule } from "../../types.js";

export interface SlotAvailability {
  time: string;
  remaining: number;
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

/** Read-only view used by the client to display remaining slots. Not authoritative by itself —
 *  the real check happens transactionally at booking-confirmation time (see bookings.service.ts). */
export async function getAvailabilityForDate(activityId: string, date: string): Promise<SlotAvailability[]> {
  const slots = await getEffectiveSlots(pool, activityId, date);
  if (!slots || slots.length === 0) return [];

  const { rows: occupiedRows } = await pool.query<{ booking_time: string; occupied: string }>(
    `SELECT to_char(booking_time, 'HH24:MI') AS booking_time, COALESCE(SUM(qty), 0) AS occupied
     FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND status <> 'cancelado'
     GROUP BY booking_time`,
    [activityId, date]
  );
  const occupiedByTime = new Map(occupiedRows.map((r) => [r.booking_time, Number(r.occupied)]));

  return slots.map((s) => ({
    time: s.time,
    remaining: Math.max(0, s.capacity - (occupiedByTime.get(s.time) ?? 0)),
  }));
}

/** Authoritative capacity check, must run inside the same transaction/lock as the insert.
 *  Retorna -1 quando o horário não existe/não opera nessa data. */
export async function getRemainingForSlotLocked(
  client: PoolClient,
  activityId: string,
  date: string,
  time: string
): Promise<number> {
  const slots = await getEffectiveSlots(client, activityId, date);
  const slot = slots?.find((s) => s.time === time.slice(0, 5));
  if (!slot) return -1;

  const { rows } = await client.query<{ occupied: string }>(
    `SELECT COALESCE(SUM(qty), 0) AS occupied FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND booking_time = $3 AND status <> 'cancelado'`,
    [activityId, date, time]
  );
  const occupied = Number(rows[0].occupied);
  return slot.capacity - occupied;
}
