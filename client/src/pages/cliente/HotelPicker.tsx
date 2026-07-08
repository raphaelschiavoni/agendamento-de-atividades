import { ChevronLeft, MapPin } from "lucide-react";
import { HotelCover } from "../../components/HotelCover";
import type { Hotel } from "../../types";

export function HotelPicker({ hotels, onPick }: { hotels: Hotel[]; onPick: (hotelId: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="px-6 pt-10 pb-6 text-center">
        <h2 className="rs-display" style={{ color: "var(--forest)", fontSize: 34, fontWeight: 600 }}>Qual sonho você vai viver hoje?</h2>
        <p className="rs-body text-sm opacity-70 mt-2">Escolha o hotel fazenda da rede para ver e agendar as atividades disponíveis.</p>
      </div>
      <div className="grid gap-5 px-6 pb-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {hotels.map((h) => (
          <button
            key={h.id}
            onClick={() => onPick(h.id)}
            className="text-left rounded-xl overflow-hidden transition"
            style={{ background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(30,51,36,0.06)" }}
          >
            <HotelCover hotelId={h.id} photo={h.photo} height={150}>
              <div style={{ position: "absolute", left: 16, bottom: 12 }}>
                <div className="rs-display" style={{ color: "var(--paper)", fontSize: 20, fontWeight: 600 }}>{h.name}</div>
                <div className="rs-body flex items-center gap-1 mt-0.5" style={{ color: "var(--gold)", fontSize: 12 }}>
                  <MapPin size={12} /> {h.city}
                </div>
              </div>
            </HotelCover>
            <div className="rs-body px-4 py-3 flex items-center justify-between text-sm" style={{ color: "var(--forest)" }}>
              <span className="opacity-70">Ver atividades</span>
              <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
