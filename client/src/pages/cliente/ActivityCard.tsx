import { Clock, Users } from "lucide-react";
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
        <p className="rs-body text-xs opacity-70 mt-1 flex-1">{activity.description}</p>
        {activity.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activity.tags.slice(0, 4).map((t) => (
              <span key={t} className="rs-body" style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "var(--sand)", color: "var(--bark)" }}>{t}</span>
            ))}
          </div>
        )}
        <div className="rs-body flex items-center gap-1 text-xs opacity-60 mt-2">
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
