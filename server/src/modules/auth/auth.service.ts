import bcrypt from "bcrypt";
import { pool } from "../../db/pool.js";

export type AdminRole = "admin" | "agendamento";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  hotelId: string | null; // hotel vinculado (Sala de Agendamento); null = todos
}

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  hotel_id: string | null;
}

const BCRYPT_COST = 12;
const SELECT = "id, email, name, role, hotel_id";

function toUser(r: AdminUserRow): AdminUser {
  return { id: r.id, email: r.email, name: r.name, role: r.role, hotelId: r.hotel_id };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const { rows } = await pool.query<AdminUserRow & { password_hash: string }>(
    `SELECT ${SELECT}, password_hash FROM admin_users WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (rows.length === 0) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return toUser(rows[0]);
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const { rows } = await pool.query<AdminUserRow>(`SELECT ${SELECT} FROM admin_users WHERE id = $1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { rows } = await pool.query<AdminUserRow>(`SELECT ${SELECT} FROM admin_users ORDER BY name`);
  return rows.map(toUser);
}

/** Cria o admin se ainda não existir. Idempotente: retorna null se o email já existe
 *  (não sobrescreve a senha de um admin já cadastrado). */
export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: AdminRole = "admin",
  hotelId: string | null = null
): Promise<AdminUser | null> {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query<AdminUserRow>(
    `INSERT INTO admin_users (email, password_hash, name, role, hotel_id) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING
     RETURNING ${SELECT}`,
    [email.toLowerCase(), passwordHash, name, role, hotelId]
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM admin_users WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
