import { api } from "./client";

export interface AuditLog {
  id: number;
  created_at: string;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  hotel_id: string | null;
  summary: string;
  details: Record<string, unknown>;
}

export interface AuditFilters {
  hotelId?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const listAuditLogs = (f: AuditFilters) => {
  const p = new URLSearchParams();
  if (f.hotelId && f.hotelId !== "all") p.set("hotelId", f.hotelId);
  if (f.action && f.action !== "all") p.set("action", f.action);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.search) p.set("search", f.search);
  const s = p.toString();
  return api.get<AuditLog[]>(`/admin/logs${s ? `?${s}` : ""}`);
};
