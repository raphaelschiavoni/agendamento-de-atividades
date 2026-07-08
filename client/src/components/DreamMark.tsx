export function DreamMark({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="20" r="7" stroke={color} strokeWidth="1.6" />
      <path d="M2 34 C 10 24, 16 24, 22 30 C 28 36, 34 22, 46 30 L46 40 L2 40 Z" fill={color} opacity="0.9" />
      <path d="M6 12 C 12 6, 18 8, 22 4" stroke={color} strokeWidth="1.4" strokeDasharray="1 4" strokeLinecap="round" />
    </svg>
  );
}
