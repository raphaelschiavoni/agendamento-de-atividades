import { pool } from "../../db/pool.js";
import type { HotelDTO } from "../../types.js";

interface HotelRow {
  id: string;
  name: string;
  city: string;
  address: string | null;
  whatsapp_number: string;
  email: string | null;
  photo_url: string | null;
  tour360_url: string | null;
  map_url: string | null;
}

function toDTO(row: HotelRow, includeWa: boolean): HotelDTO {
  const dto: HotelDTO = {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    email: row.email,
    photo: row.photo_url,
    tour360Url: row.tour360_url,
    mapUrl: row.map_url,
  };
  if (includeWa) dto.waNumber = row.whatsapp_number;
  return dto;
}

export async function listHotels(includeWa = false): Promise<HotelDTO[]> {
  const { rows } = await pool.query<HotelRow>("SELECT * FROM hotels ORDER BY name");
  return rows.map((r) => toDTO(r, includeWa));
}

export async function getHotelById(id: string, includeWa = false): Promise<HotelDTO | null> {
  const { rows } = await pool.query<HotelRow>("SELECT * FROM hotels WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  return toDTO(rows[0], includeWa);
}

export async function getHotelWaNumber(id: string): Promise<string | null> {
  const { rows } = await pool.query<{ whatsapp_number: string }>(
    "SELECT whatsapp_number FROM hotels WHERE id = $1",
    [id]
  );
  return rows[0]?.whatsapp_number ?? null;
}

export interface UpdateHotelInput {
  name?: string;
  city?: string;
  address?: string;
  waNumber?: string;
  email?: string;
  photo?: string;
  tour360Url?: string;
  mapUrl?: string;
}

export async function updateHotel(id: string, input: UpdateHotelInput): Promise<HotelDTO | null> {
  const { rows } = await pool.query<HotelRow>(
    `UPDATE hotels SET
       name = COALESCE($2, name),
       city = COALESCE($3, city),
       address = COALESCE($4, address),
       whatsapp_number = COALESCE($5, whatsapp_number),
       email = COALESCE($6, email),
       photo_url = COALESCE($7, photo_url),
       tour360_url = COALESCE($8, tour360_url),
       map_url = COALESCE($9, map_url),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, input.name, input.city, input.address, input.waNumber, input.email, input.photo, input.tour360Url, input.mapUrl]
  );
  if (rows.length === 0) return null;
  return toDTO(rows[0], true);
}
