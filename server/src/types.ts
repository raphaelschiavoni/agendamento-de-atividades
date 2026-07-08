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
  times: string[];
  prices: Record<Category, number>;
}

export interface CartItemInput {
  activityId: string;
  category: Category;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  qty: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
}
