import { api } from "./client";
import type { Booking, Category } from "../types";

export interface CartItemInput {
  activityId: string;
  category: Category;
  date: string;
  time: string;
  qty: number;
  adults: number;
  children: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderInput {
  guestHotelId?: string;
  roomNumber?: string;
}

export interface CreateChargeResult {
  chargeId: string;
  amount: number;
  pixCopyPaste: string;
  status: "pending";
}

export const createCharge = (cart: CartItemInput[], customer: CustomerInput, order: OrderInput = {}) =>
  api.post<CreateChargeResult>("/checkout/charges", { cart, customer, ...order });

export const getCharge = (chargeId: string) =>
  api.get<{ status: string; bookings: Booking[] }>(`/checkout/charges/${chargeId}`);

export const simulateApprove = (chargeId: string) =>
  api.post<{ bookings: Booking[] }>(`/checkout/charges/${chargeId}/simulate-approve`);

export const getVoucher = (code: string) => api.get<Booking>(`/vouchers/${code}`);

// admin
export interface ListBookingsFilters {
  hotelId?: string;
  status?: "all" | "utilizado" | "cancelado" | "pendente-uso";
  approvalStatus?: "pendente" | "aprovada";
  date?: string; // data da atividade (YYYY-MM-DD)
  search?: string;
  withOccupancy?: boolean; // anexa lotação do horário (Sala de Agendamento)
}

export const listBookingsAdmin = (filters: ListBookingsFilters) => {
  const params = new URLSearchParams();
  if (filters.hotelId) params.set("hotelId", filters.hotelId);
  if (filters.status) params.set("status", filters.status);
  if (filters.approvalStatus) params.set("approvalStatus", filters.approvalStatus);
  if (filters.date) params.set("date", filters.date);
  if (filters.search) params.set("search", filters.search);
  if (filters.withOccupancy) params.set("withOccupancy", "1");
  return api.get<Booking[]>(`/admin/bookings?${params.toString()}`);
};

export const approveBookingAdmin = (id: string) => api.patch<Booking>(`/admin/bookings/${id}/approve`);

export const markUsedAdmin = (id: string) => api.patch<Booking>(`/admin/bookings/${id}/mark-used`);
export const cancelBookingAdmin = (id: string) => api.patch<Booking>(`/admin/bookings/${id}/cancel`);
