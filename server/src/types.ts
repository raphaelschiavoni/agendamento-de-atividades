export type Category = "hospede" | "visitante" | "dayuse" | "passaporte";
export const CATEGORIES: Category[] = ["hospede", "visitante", "dayuse", "passaporte"];

export type BookingStatus = "pendente" | "pago" | "cancelado";

export interface HotelDTO {
  id: string;
  name: string;
  city: string;
  address: string | null;
  email: string | null;
  photo: string | null;
  tour360Url: string | null; // link do tour virtual 360°
  mapUrl: string | null; // link de rota/mapa (Google Maps)
  waNumber?: string; // only included on admin-facing responses
}

export interface ActivityDTO {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  durationMin: number;
  capacity: number;
  active: boolean;
  photo: string | null;
  tags: string[];
  weekdays: number[]; // dias da semana permitidos (0=Dom..6=Sáb); vazio = todos os dias
  allowedDates: string[]; // datas específicas 'YYYY-MM-DD' (complementam os dias da semana)
  weekdayCapacities: Record<number, number>; // capacidade/horário por dia da semana (sobrepõe a padrão)
  times: string[];
  prices: Record<Category, number>;
}

/** Capacidade efetiva por horário numa data: a do dia da semana, se definida; senão a padrão. */
export function effectiveCapacity(capacity: number, weekdayCapacities: Record<number, number> | null, date: string): number {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const specific = weekdayCapacities?.[weekday];
  return typeof specific === "number" && specific > 0 ? specific : capacity;
}

export interface CartItemInput {
  activityId: string;
  category: Category;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  qty: number; // total = adults + children
  adults?: number;
  children?: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
}

// Dados do pedido que valem para a reserva toda (não por atividade).
export interface OrderInput {
  // Hotel onde o cliente está hospedado (Passaporte dos Sonhos / Hóspede).
  guestHotelId?: string;
  // Número do chalé/quarto (hóspedes).
  roomNumber?: string;
}
