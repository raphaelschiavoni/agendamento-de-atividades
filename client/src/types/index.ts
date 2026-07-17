export type Category = "hospede" | "visitante" | "dayuse" | "passaporte";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string | null;
  email: string | null;
  photo: string | null;
  tour360Url: string | null;
  mapUrl: string | null;
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
  weekdays: number[]; // 0=Dom..6=Sáb; vazio = todos os dias
  allowedDates: string[]; // datas específicas 'YYYY-MM-DD' (complementam os dias da semana)
  weekdayCapacities: Record<number, number>; // vagas/horário por dia da semana (sobrepõe a padrão)
  schedule: ActivitySchedule; // agenda por dia da semana + datas pontuais (preferida quando preenchida)
  times: string[];
  prices: Record<Category, number>;
  // Vagas por categoria por horário: ausente = sem limite; 0 = não aparece na categoria.
  categoryCapacities: Partial<Record<Category, number>>;
}

// Um horário da agenda; capacity ausente => capacidade padrão da atividade.
export interface ScheduleSlot {
  time: string; // "HH:MM"
  capacity?: number;
}

export interface ActivitySchedule {
  weekdays?: Record<string, ScheduleSlot[]>; // "0".."6" (Dom..Sáb)
  dates?: Record<string, ScheduleSlot[]>; // "YYYY-MM-DD" (datas pontuais)
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
  adults: number;
  children: number;
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
  adults: number;
  children: number;
  unitPrice: number;
  total: number;
  customer: Customer;
  guestHotelId: string | null;
  roomNumber: string | null;
  status: "pendente" | "pago" | "cancelado";
  approvalStatus: "pendente" | "aprovada";
  used: boolean;
  createdAt: string;
  // Lotação do horário (só na Sala de Agendamento, com withOccupancy).
  slotCapacity?: number;
  slotRemaining?: number;
}

export interface SlotAvailability {
  time: string;
  remaining: number;
  capacity: number;
}

export type AdminRole = "admin" | "agendamento";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  hotelId: string | null; // hotel vinculado (Sala de Agendamento); null = todos
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
