import { api } from "./client";
import type { DashboardSummary, WhatsappLogEntry } from "../types";

export const getDashboardSummary = () => api.get<DashboardSummary>("/admin/dashboard/summary");
export const listWhatsappLog = (hotelId?: string) =>
  api.get<WhatsappLogEntry[]>(`/admin/whatsapp-log${hotelId && hotelId !== "all" ? `?hotelId=${hotelId}` : ""}`);

export const uploadPhoto = async (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: form });
  if (!res.ok) throw new Error("Falha no upload da foto");
  return res.json();
};

export const listUploads = () => api.get<{ url: string }[]>("/admin/uploads");
