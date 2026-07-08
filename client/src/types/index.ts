export type Category = "hospede" | "visitante" | "dayuse" | "passaporte";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string | null;
  email: string | null;
  photo: string | null;
  waNumber?: string;
}

export interface Activity {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  durationMin: number;
  capacity: number;
  active: boolean;
  photo: string | null;
  tags: string[];
  times: string[];
  prices: Record<Category, number>;
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
}

export interface CartItem {
  activityId: string;
  hotelId: string;
  hotelName: string;
  activityName: string;
  category: Category;
  date: string;
  time: string;
  qty: number;
  unitPrice: number;
}

export interface Booking {
  id: string;
  voucherCode: string;
  hotelId: string;
  activityId: string;
  activityName: string;
  hotelName: string;
  category: Category;
  date: string;
  time: string;
  qty: number;
  unitPrice: number;
  total: number;
  customer: Customer;
  status: "pendente" | "pago" | "cancelado";
  used: boolean;
  createdAt: string;
}

export interface SlotAvailability {
  time: string;
  remaining: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface WhatsappLogEntry {
  id: string;
  booking_id: string | null;
  to_number: string;
  hotel_name: string;
  message: string;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  todayBookingsCount: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingVouchers: number;
  byHotel: { hotelId: string; name: string; revenue: number }[];
}
