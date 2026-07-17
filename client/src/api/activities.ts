import { api } from "./client";
import type { Activity, SlotAvailability } from "../types";

export const listAllActivities = () => api.get<Activity[]>("/activities");

export const getActivity = (id: string) => api.get<Activity>(`/activities/${id}`);

export const getAvailability = (id: string, date: string, category?: string) =>
  api.get<{ date: string; times: SlotAvailability[] }>(
    `/activities/${id}/availability?date=${date}${category ? `&category=${category}` : ""}`
  );

// admin
export const listActivitiesAdmin = (hotelId: string) =>
  api.get<Activity[]>(`/admin/activities?hotelId=${hotelId}`);

export const createActivityAdmin = (input: Omit<Activity, "id">) =>
  api.post<Activity>("/admin/activities", input);

export const updateActivityAdmin = (id: string, patch: Partial<Activity>) =>
  api.patch<Activity>(`/admin/activities/${id}`, patch);

export const toggleActivityAdmin = (id: string, active: boolean) =>
  api.patch<Activity>(`/admin/activities/${id}/toggle-active`, { active });

export const deleteActivityAdmin = (id: string) => api.del<void>(`/admin/activities/${id}`);
