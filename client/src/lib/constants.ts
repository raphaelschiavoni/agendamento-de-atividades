import type { Category } from "../types";

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; desc: string }> = {
  hospede: {
    label: "Hóspede",
    color: "var(--moss)",
    bg: "var(--moss-light)",
    desc: "Estou hospedado neste hotel e quero reservar uma atividade.",
  },
  visitante: {
    label: "Visitante",
    color: "var(--clay)",
    bg: "var(--clay-light)",
    desc: "Não estou hospedado, quero conhecer as atividades (pago).",
  },
  dayuse: {
    label: "Day Use",
    color: "var(--gold)",
    bg: "var(--gold-light)",
    desc: "Pacotes e combos especiais para aproveitar o dia.",
  },
  passaporte: {
    label: "Passaporte dos Sonhos",
    color: "var(--plum)",
    bg: "var(--plum-light)",
    desc: "Estou hospedado em um dos 5 hotéis e posso usar as atividades dos outros sem custo.",
  },
};

export const CATEGORY_ORDER: Category[] = ["hospede", "visitante", "dayuse", "passaporte"];

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
