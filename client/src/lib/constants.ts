import type { Category } from "../types";

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string }> = {
  hospede: { label: "Hóspede", color: "var(--moss)", bg: "var(--moss-light)" },
  visitante: { label: "Visitante", color: "var(--clay)", bg: "var(--clay-light)" },
  dayuse: { label: "Day Use", color: "var(--gold)", bg: "var(--gold-light)" },
  passaporte: { label: "Passaporte dos Sonhos", color: "var(--plum)", bg: "var(--plum-light)" },
};

export const CATEGORY_ORDER: Category[] = ["hospede", "visitante", "dayuse", "passaporte"];

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
