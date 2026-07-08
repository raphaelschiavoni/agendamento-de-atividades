import bcrypt from "bcrypt";
import { pool } from "../../db/pool.js";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const { rows } = await pool.query<{ id: string; email: string; name: string; role: string; password_hash: string }>(
    "SELECT id, email, name, role, password_hash FROM admin_users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (rows.length === 0) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  const { password_hash, ...user } = rows[0];
  return user;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const { rows } = await pool.query<AdminUser>("SELECT id, email, name, role FROM admin_users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/** Cria o admin se ainda não existir. Idempotente: retorna null se o email já existe
 *  (não sobrescreve a senha de um admin já cadastrado). */
export async function createAdminUser(email: string, password: string, name: string): Promise<AdminUser | null> {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query<AdminUser>(
    `INSERT INTO admin_users (email, password_hash, name) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, name, role`,
    [email.toLowerCase(), passwordHash, name]
  );
  return rows[0] ?? null;
}
