import { api } from "./client";
import type { Category } from "../types";

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  hotelId?: string;
  category?: string;
}

export interface AnalyticsSummary {
  totals: {
    bookings: number;
    revenue: number;
    adults: number;
    children: number;
    participants: number;
    used: number;
    pending: number;
  };
  byHotel: { hotelId: string; name: string; bookings: number; revenue: number }[];
  byCategory: { category: Category; bookings: number; revenue: number; participants: number }[];
  topActivities: { activityName: string; hotelName: string; bookings: number; participants: number; revenue: number }[];
  passaporteCross: { guestHotel: string; activityHotel: string; bookings: number; participants: number }[];
}

export interface CustomerRow {
  name: string;
  phone: string;
  email: string | null;
  bookings: number;
  participants: number;
  totalSpent: number;
  lastBooking: string;
  hotels: string;
}

function qs(filters: AnalyticsFilters): string {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.hotelId && filters.hotelId !== "all") p.set("hotelId", filters.hotelId);
  if (filters.category && filters.category !== "all") p.set("category", filters.category);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const getAnalyticsSummary = (filters: AnalyticsFilters) =>
  api.get<AnalyticsSummary>(`/admin/analytics/summary${qs(filters)}`);

export const getAnalyticsCustomers = (filters: AnalyticsFilters) =>
  api.get<CustomerRow[]>(`/admin/analytics/customers${qs(filters)}`);
