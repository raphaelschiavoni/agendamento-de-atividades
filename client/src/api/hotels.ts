import { api } from "./client";
import type { Activity, Hotel } from "../types";

export const listHotels = () => api.get<Hotel[]>("/hotels");
export const getHotel = (id: string) => api.get<Hotel>(`/hotels/${id}`);
export const getHotelActivities = (id: string) => api.get<Activity[]>(`/hotels/${id}/activities`);

// admin
export const listHotelsAdmin = () => api.get<Hotel[]>("/admin/hotels");
export const updateHotelAdmin = (id: string, patch: Partial<Hotel>) =>
  api.patch<Hotel>(`/admin/hotels/${id}`, patch);
