import { useEffect, useState, type ReactNode } from "react";

const HOTEL_ILLUSTRATION_THEME: Record<string, { hue: string; ridge: string }> = {
  h1: { hue: "var(--moss)", ridge: "M0 70 C 60 30, 140 100, 220 50 S 340 20, 400 60 L400 120 L0 120 Z" },
  h2: { hue: "var(--clay)", ridge: "M0 90 L60 40 L120 90 L180 30 L240 90 L300 45 L360 90 L400 60 L400 120 L0 120 Z" },
  h3: { hue: "var(--plum)", ridge: "M0 95 C 100 95, 100 60, 200 60 S 300 95, 400 95 L400 120 L0 120 Z" },
  h4: { hue: "var(--forest)", ridge: "M0 100 C 50 20, 120 10, 200 55 C 280 10, 340 20, 400 90 L400 120 L0 120 Z" },
  h5: { hue: "var(--gold)", ridge: "M0 80 L140 80 L140 30 L180 30 L180 80 L400 80 L400 120 L0 120 Z" },
};

export function HotelCover({
  hotelId,
  photo,
  height = 180,
  children,
}: {
  hotelId: string;
  photo?: string | null;
  height?: number;
  children?: ReactNode;
}) {
  const theme = HOTEL_ILLUSTRATION_THEME[hotelId] || HOTEL_ILLUSTRATION_THEME.h1;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [photo]);
  const showPhoto = photo && !failed;
  return (
    <div style={{ position: "relative", height, overflow: "hidden", background: "var(--forest)" }}>
      {showPhoto ? (
        <img
          src={photo}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
      ) : (
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        >
          <rect width="400" height="120" fill="var(--forest)" />
          <circle cx="330" cy="30" r="20" fill={theme.hue} opacity="0.85" />
          <path d={theme.ridge} fill="var(--forest-light)" opacity="0.9" />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(30,51,36,0.05) 40%, rgba(30,51,36,0.75) 100%)",
        }}
      />
      {children}
    </div>
  );
}
