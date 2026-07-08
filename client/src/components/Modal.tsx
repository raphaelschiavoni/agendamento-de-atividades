import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(35,57,44,0.5)" }}>
      <div className="rounded-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" style={{ background: "var(--paper)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-lg">{title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
