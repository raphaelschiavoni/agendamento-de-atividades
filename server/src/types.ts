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

// Marcador de horário para atividades "dia todo" (sem horário fixo).
export const ALL_DAY_TIME = "00:00";
export function isAllDaySlot(time: string): boolean {
  return time.slice(0, 5) === ALL_DAY_TIME;
}

/** Data de hoje no fuso de Brasília ('YYYY-MM-DD'). */
export function brToday(): string {
  const d = new Date(Date.now() - 3 * 3600_000); // BR = UTC-3
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Data agendável (hoje ou futuro, em Brasília) — usado nas atividades dia todo. */
export function isDateBookable(date: string): boolean {
  return date >= brToday();
}

/** Regra unificada: atividade dia todo vale por data; com horário, pela hora + tolerância. */
export function slotBookable(date: string, time: string): boolean {
  return isAllDaySlot(time) ? isDateBookable(date) : isSlotBookable(date, time);
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
  // Atividade disponível o dia todo (sem horário fixo), limitada por dailyCapacity total/dia.
  allDay: boolean;
  dailyCapacity: number;
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
