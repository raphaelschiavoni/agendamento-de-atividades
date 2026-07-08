export function PixQrPlaceholder() {
  // Padrão visual estilo QR — placeholder ilustrativo (não é um QR real/escaneável)
  const cells: number[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 21 * 21; i++) cells.push(rand() > 0.55 ? 1 : 0);
  return (
    <svg viewBox="0 0 210 210" width="160" height="160">
      <rect width="210" height="210" fill="#fff" />
      {cells.map((c, i) =>
        c ? <rect key={i} x={(i % 21) * 10} y={Math.floor(i / 21) * 10} width="10" height="10" fill="var(--bark)" /> : null
      )}
      {[[0, 0], [15, 0], [0, 15]].map(([x, y], idx) => (
        <g key={idx}>
          <rect x={x * 10} y={y * 10} width="60" height="60" fill="#fff" stroke="var(--bark)" strokeWidth="6" />
          <rect x={x * 10 + 18} y={y * 10 + 18} width="24" height="24" fill="var(--bark)" />
        </g>
      ))}
    </svg>
  );
}
