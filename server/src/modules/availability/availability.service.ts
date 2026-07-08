import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";

export interface SlotAvailability {
  time: string;
  remaining: number;
}

/** Read-only view used by the client to display remaining slots. Not authoritative by itself —
 *  the real check happens transactionally at booking-confirmation time (see bookings.service.ts). */
export async function getAvailabilityForDate(activityId: string, date: string): Promise<SlotAvailability[]> {
  const { rows: activityRows } = await pool.query<{ capacity: number }>(
    "SELECT capacity FROM activities WHERE id = $1",
    [activityId]
  );
  if (activityRows.length === 0) return [];
  const capacity = activityRows[0].capacity;

  const { rows: timeRows } = await pool.query<{ time_of_day: string }>(
    `SELECT to_char(time_of_day, 'HH24:MI') AS time_of_day FROM activity_times WHERE activity_id = $1 ORDER BY time_of_day`,
    [activityId]
  );

  const { rows: occupiedRows } = await pool.query<{ booking_time: string; occupied: string }>(
    `SELECT to_char(booking_time, 'HH24:MI') AS booking_time, COALESCE(SUM(qty), 0) AS occupied
     FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND status <> 'cancelado'
     GROUP BY booking_time`,
    [activityId, date]
  );
  const occupiedByTime = new Map(occupiedRows.map((r) => [r.booking_time, Number(r.occupied)]));

  return timeRows.map((t) => ({
    time: t.time_of_day,
    remaining: Math.max(0, capacity - (occupiedByTime.get(t.time_of_day) ?? 0)),
  }));
}

/** Authoritative capacity check, must run inside the same transaction/lock as the insert. */
export async function getRemainingForSlotLocked(
  client: PoolClient,
  activityId: string,
  date: string,
  time: string
): Promise<number> {
  const { rows: activityRows } = await client.query<{ capacity: number }>(
    "SELECT capacity FROM activities WHERE id = $1",
    [activityId]
  );
  if (activityRows.length === 0) throw new Error(`Activity ${activityId} not found`);
  const capacity = activityRows[0].capacity;

  const { rows } = await client.query<{ occupied: string }>(
    `SELECT COALESCE(SUM(qty), 0) AS occupied FROM bookings
     WHERE activity_id = $1 AND booking_date = $2 AND booking_time = $3 AND status <> 'cancelado'`,
    [activityId, date, time]
  );
  const occupied = Number(rows[0].occupied);
  return capacity - occupied;
}
