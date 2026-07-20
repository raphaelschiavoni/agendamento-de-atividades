import type { Activity, ActivitySchedule, ScheduleSlot } from "../types";

export interface EffectiveSlot {
  time: string; // "HH:MM"
  capacity: number;
}

/** Atividades com "Kids" no título são exclusivas para crianças (sem adultos). */
export function isKidsActivity(name: string): boolean {
  return /\bkids\b/i.test(name);
}

// Fuso de Brasília fixo em -03:00 (sem horário de verão desde 2019).
const BR_OFFSET = "-03:00";
const BOOKING_TOLERANCE_MIN = 10;

/** Um horário só pode ser agendado até o início + 10 min de tolerância. */
export function isSlotBookable(date: string, time: string): boolean {
  const start = new Date(`${date}T${time.slice(0, 5)}:00${BR_OFFSET}`).getTime();
  return Date.now() <= start + BOOKING_TOLERANCE_MIN * 60_000;
}

export function scheduleHasContent(s: ActivitySchedule | null | undefined): boolean {
  if (!s) return false;
  const wd = Object.values(s.weekdays ?? {}).some((slots) => (slots?.length ?? 0) > 0);
  const dt = Object.values(s.dates ?? {}).some((slots) => (slots?.length ?? 0) > 0);
  return wd || dt;
}

/** Horários válidos da atividade numa data (espelha a lógica do servidor). */
export function slotsForDate(activity: Activity, date: string): EffectiveSlot[] {
  const weekday = new Date(`${date}T12:00:00`).getDay();

  if (scheduleHasContent(activity.schedule)) {
    const raw: ScheduleSlot[] =
      activity.schedule?.dates?.[date] ?? activity.schedule?.weekdays?.[String(weekday)] ?? [];
    const map = new Map<string, EffectiveSlot>();
    for (const s of raw) {
      const time = s.time.slice(0, 5);
      if (!map.has(time)) {
        map.set(time, {
          time,
          capacity: typeof s.capacity === "number" && s.capacity > 0 ? Math.floor(s.capacity) : activity.capacity,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
  }

  // Legado
  const weekdays = activity.weekdays ?? [];
  const allowedDates = activity.allowedDates ?? [];
  if (weekdays.length > 0 || allowedDates.length > 0) {
    if (!weekdays.includes(weekday) && !allowedDates.includes(date)) return [];
  }
  const specific = activity.weekdayCapacities?.[weekday];
  const cap = typeof specific === "number" && specific > 0 ? specific : activity.capacity;
  return (activity.times ?? []).map((t) => ({ time: t.slice(0, 5), capacity: cap }));
}

/** Dias da semana com horários (para o calendário do cliente). */
export function calendarWeekdays(activity: Activity): number[] {
  if (scheduleHasContent(activity.schedule)) {
    return Object.entries(activity.schedule?.weekdays ?? {})
      .filter(([, slots]) => (slots?.length ?? 0) > 0)
      .map(([d]) => Number(d));
  }
  return activity.weekdays ?? [];
}

/** Datas pontuais com horários (para o calendário do cliente). */
export function calendarDates(activity: Activity): string[] {
  if (scheduleHasContent(activity.schedule)) {
    return Object.entries(activity.schedule?.dates ?? {})
      .filter(([, slots]) => (slots?.length ?? 0) > 0)
      .map(([d]) => d);
  }
  return activity.allowedDates ?? [];
}
