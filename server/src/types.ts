export type Category = "hospede" | "visitante" | "dayuse" | "passaporte";
export const CATEGORIES: Category[] = ["hospede", "visitante", "dayuse", "passaporte"];

/** Atividades com "Kids" no título são exclusivas para crianças (sem adultos). */
export function isKidsActivity(name: string): boolean {
  return /\bkids\b/i.test(name);
}

// Fuso de Brasília fixo em -03:00 (o Brasil não adota horário de verão desde 2019).
const BR_OFFSET = "-03:00";
export const BOOKING_TOLERANCE_MIN = 10;

/** Epoch (ms) do início de um horário interpretado no fuso de Brasília. */
export function slotStartMs(date: string, time: string): number {
  return new Date(`${date}T${time.slice(0, 5)}:00${BR_OFFSET}`).getTime();
}

/** Um horário só pode ser agendado até o seu início + tolerância (10 min).
 *  Depois disso, aquele horário fica indisponível para o dia (só no dia seguinte). */
export function isSlotBookable(date: string, time: string, toleranceMin = BOOKING_TOLERANCE_MIN): boolean {
  return Date.now() <= slotStartMs(date, time) + toleranceMin * 60_000;
}

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
  schedule: ActivitySchedule; // agenda por dia da semana + datas pontuais (preferida quando preenchida)
  times: string[];
  prices: Record<Category, number>;
  // Vagas por categoria por horário: ausente = sem limite; 0 = categoria desabilitada.
  categoryCapacities: Partial<Record<Category, number>>;
}

// Um horário da agenda; capacity ausente => capacidade padrão da atividade.
export interface ScheduleSlot {
  time: string; // "HH:MM"
  capacity?: number;
}

export interface ActivitySchedule {
  weekdays?: Record<string, ScheduleSlot[]>; // chaves "0".."6" (Dom..Sáb)
  dates?: Record<string, ScheduleSlot[]>; // chaves "YYYY-MM-DD" (datas pontuais)
}

export function scheduleHasContent(s: ActivitySchedule | null | undefined): boolean {
  if (!s) return false;
  const wd = Object.values(s.weekdays ?? {}).some((slots) => (slots?.length ?? 0) > 0);
  const dt = Object.values(s.dates ?? {}).some((slots) => (slots?.length ?? 0) > 0);
  return wd || dt;
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
