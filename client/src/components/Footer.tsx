import { Settings } from "lucide-react";

export function Footer({ onAdmin }: { onAdmin: () => void }) {
  return (
    <footer
      className="no-print"
      style={{ background: "#1E3324", color: "#FFFCF6", textAlign: "center", padding: "16px" }}
    >
      <span className="rs-body block" style={{ fontSize: 13, opacity: 0.85 }}>
        Copyright © Rede dos Sonhos Hotéis Fazenda — Todos os direitos reservados
      </span>
      <button
        onClick={onAdmin}
        className="rs-body inline-flex items-center gap-1 mt-2"
        style={{ fontSize: 12, opacity: 0.7, color: "#FFFCF6", textDecoration: "underline" }}
      >
        <Settings size={12} /> Painel Administrativo
      </button>
    </footer>
  );
}
