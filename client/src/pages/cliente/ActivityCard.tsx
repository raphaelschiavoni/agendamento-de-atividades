import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Users } from "lucide-react";
import { HotelCover } from "../../components/HotelCover";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import type { Activity, Category } from "../../types";

export function ActivityCard({
  activity,
  category,
  hotelId,
  onSchedule,
}: {
  activity: Activity;
  category: Category;
  hotelId: string;
  onSchedule: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const price = activity.prices[category] || 0;
  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(30,51,36,0.05)" }}>
      <HotelCover hotelId={hotelId} photo={activity.photo} height={130}>
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          <span className="rs-body" style={{ background: "rgba(255,252,246,0.9)", color: "var(--forest)", fontSize: 11, padding: "2px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {activity.durationMin} min
          </span>
        </div>
      </HotelCover>
      <div className="p-4 flex flex-col flex-1">
        <div className="rs-display" style={{ color: "var(--forest)", fontSize: 17, fontWeight: 600 }}>{activity.name}</div>
        <p
          className="rs-body text-xs opacity-70 mt-1"
          style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {activity.description}
        </p>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="rs-body flex items-center gap-1 text-xs mt-1.5 self-start"
          style={{ color: "var(--moss)" }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Ocultar detalhes" : "Ver detalhes da atividade"}
        </button>

        {expanded && (
          <div className="mt-2 rounded-md p-2.5 text-xs" style={{ background: "var(--cream)" }}>
            <div className="flex items-center gap-1 mb-1" style={{ color: "var(--forest)" }}>
              <Clock size={12} /> Duração: {activity.durationMin} minutos
            </div>
            {activity.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {activity.tags.map((t) => (
                  <span key={t} className="rs-body" style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "var(--sand)", color: "var(--bark)" }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rs-body flex items-center gap-1 text-xs opacity-60 mt-2 flex-1">
          <Users size={12} /> até {activity.capacity} pessoas por horário
        </div>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
          <span className="rs-display" style={{ color: CATEGORY_META[category].color, fontWeight: 600, fontSize: 16 }}>
            {price === 0 ? "Incluso" : formatBRL(price)}
          </span>
          <button
            onClick={onSchedule}
            className="rs-body px-3.5 py-1.5 rounded-md text-sm"
            style={{ background: "var(--forest)", color: "var(--paper)" }}
          >
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
