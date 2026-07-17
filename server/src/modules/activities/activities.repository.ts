import { pool } from "../../db/pool.js";
import { CATEGORIES, type ActivityDTO, type Category } from "../../types.js";

interface ActivityRow {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  duration_min: number;
  capacity: number;
  active: boolean;
  photo_url: string | null;
  tags: string[];
  weekdays: number[];
  allowed_dates: string[];
}

async function attachTimesAndPrices(rows: ActivityRow[]): Promise<ActivityDTO[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const { rows: timeRows } = await pool.query<{ activity_id: string; time_of_day: string }>(
    `SELECT activity_id, to_char(time_of_day, 'HH24:MI') AS time_of_day
     FROM activity_times WHERE activity_id = ANY($1) ORDER BY time_of_day`,
    [ids]
  );
  const { rows: priceRows } = await pool.query<{ activity_id: string; category: Category; price_cents: number }>(
    `SELECT activity_id, category, price_cents FROM activity_prices WHERE activity_id = ANY($1)`,
    [ids]
  );

  const timesByActivity = new Map<string, string[]>();
  for (const t of timeRows) {
    const list = timesByActivity.get(t.activity_id) ?? [];
    list.push(t.time_of_day);
    timesByActivity.set(t.activity_id, list);
  }

  const pricesByActivity = new Map<string, Record<Category, number>>();
  for (const p of priceRows) {
    const rec = pricesByActivity.get(p.activity_id) ?? ({} as Record<Category, number>);
    rec[p.category] = p.price_cents / 100;
    pricesByActivity.set(p.activity_id, rec);
  }

  return rows.map((r) => {
    const prices = pricesByActivity.get(r.id) ?? ({} as Record<Category, number>);
    for (const c of CATEGORIES) if (prices[c] === undefined) prices[c] = 0;
    return {
      id: r.id,
      hotelId: r.hotel_id,
      name: r.name,
      description: r.description,
      durationMin: r.duration_min,
      capacity: r.capacity,
      active: r.active,
      photo: r.photo_url,
      tags: r.tags,
      weekdays: r.weekdays ?? [],
      allowedDates: r.allowed_dates ?? [],
      times: timesByActivity.get(r.id) ?? [],
      prices,
    };
  });
}

export async function listActivitiesForHotel(
  hotelId: string,
  opts: { onlyActive: boolean }
): Promise<ActivityDTO[]> {
  const { rows } = await pool.query<ActivityRow>(
    opts.onlyActive
      ? "SELECT * FROM activities WHERE hotel_id = $1 AND active = true ORDER BY name"
      : "SELECT * FROM activities WHERE hotel_id = $1 ORDER BY name",
    [hotelId]
  );
  return attachTimesAndPrices(rows);
}

export async function listAllActive(): Promise<ActivityDTO[]> {
  const { rows } = await pool.query<ActivityRow>(
    "SELECT * FROM activities WHERE active = true ORDER BY hotel_id, name"
  );
  return attachTimesAndPrices(rows);
}

export async function getActivityById(id: string): Promise<ActivityDTO | null> {
  const { rows } = await pool.query<ActivityRow>("SELECT * FROM activities WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const [dto] = await attachTimesAndPrices(rows);
  return dto;
}

export interface UpsertActivityInput {
  hotelId: string;
  name: string;
  description: string;
  durationMin: number;
  capacity: number;
  active: boolean;
  photo?: string;
  tags: string[];
  weekdays: number[];
  allowedDates: string[];
  times: string[];
  prices: Record<Category, number>;
}

function genActivityId(): string {
  return "a" + Math.random().toString(36).slice(2, 10);
}

export async function createActivity(input: UpsertActivityInput): Promise<ActivityDTO> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = genActivityId();
    await client.query(
      `INSERT INTO activities (id, hotel_id, name, description, duration_min, capacity, active, photo_url, tags, weekdays, allowed_dates)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, input.hotelId, input.name, input.description, input.durationMin, input.capacity, input.active, input.photo ?? null, input.tags, input.weekdays ?? [], input.allowedDates ?? []]
    );
    await insertTimesAndPrices(client, id, input.times, input.prices);
    await client.query("COMMIT");
    return (await getActivityById(id))!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateActivity(id: string, input: Partial<UpsertActivityInput>): Promise<ActivityDTO | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE activities SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         duration_min = COALESCE($4, duration_min),
         capacity = COALESCE($5, capacity),
         active = COALESCE($6, active),
         photo_url = COALESCE($7, photo_url),
         tags = COALESCE($8, tags),
         weekdays = COALESCE($9, weekdays),
         allowed_dates = COALESCE($10, allowed_dates),
         updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [id, input.name, input.description, input.durationMin, input.capacity, input.active, input.photo, input.tags, input.weekdays, input.allowedDates]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    if (input.times) {
      await client.query("DELETE FROM activity_times WHERE activity_id = $1", [id]);
      await insertTimes(client, id, input.times);
    }
    if (input.prices) {
      await client.query("DELETE FROM activity_prices WHERE activity_id = $1", [id]);
      await insertPrices(client, id, input.prices);
    }
    await client.query("COMMIT");
    return getActivityById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleActivityActive(id: string, active: boolean): Promise<ActivityDTO | null> {
  const { rows } = await pool.query("UPDATE activities SET active = $2, updated_at = now() WHERE id = $1 RETURNING id", [id, active]);
  if (rows.length === 0) return null;
  return getActivityById(id);
}

export async function deleteActivity(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM activities WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

async function insertTimes(client: import("pg").PoolClient, activityId: string, times: string[]) {
  for (const t of times) {
    await client.query("INSERT INTO activity_times (activity_id, time_of_day) VALUES ($1, $2) ON CONFLICT DO NOTHING", [activityId, t]);
  }
}

async function insertPrices(client: import("pg").PoolClient, activityId: string, prices: Record<Category, number>) {
  for (const c of CATEGORIES) {
    const cents = Math.round((prices[c] ?? 0) * 100);
    await client.query(
      "INSERT INTO activity_prices (activity_id, category, price_cents) VALUES ($1,$2,$3) ON CONFLICT (activity_id, category) DO UPDATE SET price_cents = EXCLUDED.price_cents",
      [activityId, c, cents]
    );
  }
}

async function insertTimesAndPrices(client: import("pg").PoolClient, activityId: string, times: string[], prices: Record<Category, number>) {
  await insertTimes(client, activityId, times);
  await insertPrices(client, activityId, prices);
}
