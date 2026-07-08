import "../config/env.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db/pool.js";
import { CATEGORIES, type Category } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SeedHotel {
  id: string;
  name: string;
  city: string;
  address: string;
  waNumber: string;
  email: string;
  photo: string;
}

interface SeedActivity {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  durationMin: number;
  capacity: number;
  times: string[];
  active: boolean;
  days: number[];
  photo: string;
  tags: string[];
  prices: Record<Category, number>;
}

interface SeedData {
  hotels: SeedHotel[];
  activities: SeedActivity[];
}

async function main() {
  // IMPORTANTE: só popula quando o catálogo está vazio. Se já existem atividades,
  // o seed é ignorado para NUNCA sobrescrever edições feitas no painel (fotos,
  // preços, etiquetas etc.). Passe SEED_FORCE=1 para forçar (uso manual apenas).
  const { rows } = await pool.query<{ n: string }>("SELECT COUNT(*) AS n FROM activities");
  const existentes = Number(rows[0].n);
  if (existentes > 0 && process.env.SEED_FORCE !== "1") {
    console.log(`Catálogo já possui ${existentes} atividades — seed ignorado (edições preservadas).`);
    await pool.end();
    return;
  }

  const raw = readFileSync(path.join(__dirname, "dados-reais-hoteis.json"), "utf-8");
  const data: SeedData = JSON.parse(raw);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const h of data.hotels) {
      await client.query(
        `INSERT INTO hotels (id, name, city, address, whatsapp_number, email, photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, city = EXCLUDED.city, address = EXCLUDED.address,
           whatsapp_number = EXCLUDED.whatsapp_number, email = EXCLUDED.email,
           photo_url = EXCLUDED.photo_url, updated_at = now()`,
        [h.id, h.name, h.city, h.address, h.waNumber, h.email, h.photo || null]
      );
    }

    for (const a of data.activities) {
      await client.query(
        `INSERT INTO activities (id, hotel_id, name, description, duration_min, capacity, active, photo_url, tags, weekdays)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           hotel_id = EXCLUDED.hotel_id, name = EXCLUDED.name, description = EXCLUDED.description,
           duration_min = EXCLUDED.duration_min, capacity = EXCLUDED.capacity, active = EXCLUDED.active,
           photo_url = EXCLUDED.photo_url, tags = EXCLUDED.tags, weekdays = EXCLUDED.weekdays, updated_at = now()`,
        [a.id, a.hotelId, a.name, a.description, a.durationMin, a.capacity, a.active, a.photo || null, a.tags, a.days ?? []]
      );

      await client.query("DELETE FROM activity_times WHERE activity_id = $1", [a.id]);
      for (const t of a.times) {
        await client.query("INSERT INTO activity_times (activity_id, time_of_day) VALUES ($1, $2)", [a.id, t]);
      }

      await client.query("DELETE FROM activity_prices WHERE activity_id = $1", [a.id]);
      for (const category of CATEGORIES) {
        const cents = Math.round((a.prices[category] ?? 0) * 100);
        await client.query("INSERT INTO activity_prices (activity_id, category, price_cents) VALUES ($1,$2,$3)", [
          a.id,
          category,
          cents,
        ]);
      }
    }

    await client.query("COMMIT");
    console.log(`Seed concluído: ${data.hotels.length} hotéis, ${data.activities.length} atividades.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
