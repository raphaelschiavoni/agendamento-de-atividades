import type { Request } from "express";
import { pool } from "../../db/pool.js";

export interface AuditEntry {
  action: string;
  entityType: "booking" | "activity" | "hotel" | "user";
  entityId?: string | null;
  hotelId?: string | null;
  summary: string;
  details?: Record<string, unknown>;
}

/** Registra uma ação do painel. Nunca lança — auditoria não pode quebrar a ação principal. */
export async function recordAudit(req: Request, entry: AuditEntry): Promise<void> {
  const u = req.adminUser;
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, admin_name, admin_email, action, entity_type, entity_id, hotel_id, summary, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        u?.id ?? null, u?.name ?? null, u?.email ?? null,
        entry.action, entry.entityType, entry.entityId ?? null, entry.hotelId ?? null,
        entry.summary, JSON.stringify(entry.details ?? {}),
      ]
    );
  } catch (err) {
    console.error("[audit] falha ao registrar:", err);
  }
}

export interface AuditFilters {
  hotelId?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
}

export async function listAudit(filters: AuditFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.hotelId) { clauses.push(`hotel_id = $${i++}`); params.push(filters.hotelId); }
  if (filters.action) { clauses.push(`action LIKE $${i++}`); params.push(filters.action + "%"); }
  if (filters.from) { clauses.push(`created_at >= $${i++}`); params.push(filters.from); }
  if (filters.to) { clauses.push(`created_at < ($${i++}::date + interval '1 day')`); params.push(filters.to); }
  if (filters.search) {
    clauses.push(`(admin_name ILIKE $${i} OR summary ILIKE $${i})`);
    params.push(`%${filters.search}%`);
    i++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 300, 1000);
  const { rows } = await pool.query(
    `SELECT id, created_at, admin_name, admin_email, action, entity_type, entity_id, hotel_id, summary, details
     FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ${limit}`,
    params
  );
  return rows;
}
