import type { Hotel } from "../types";

// Slug da página de cada hotel: primeira palavra do nome, sem acentos.
// "Campo dos Sonhos" -> "campo" | "Parque dos Sonhos" -> "parque" ...
export function slugForHotel(hotel: Pick<Hotel, "name">): string {
  return hotel.name
    .trim()
    .split(/\s+/)[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findHotelBySlug(hotels: Hotel[], slug: string): Hotel | undefined {
  const s = slug.trim().toLowerCase();
  return hotels.find((h) => slugForHotel(h) === s);
}

/** Slug presente na URL atual (ex.: /campo -> "campo"); vazio se raiz. */
export function slugFromLocation(): string {
  return decodeURIComponent(window.location.pathname.replace(/^\//, "").split("/")[0] ?? "").toLowerCase();
}
