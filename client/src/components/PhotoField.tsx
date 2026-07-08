import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Images, Upload, X } from "lucide-react";
import { listUploads, uploadPhoto } from "../api/dashboard";

type Status = "idle" | "ok" | "error" | "loading";

export function PhotoField({ value, onChange }: { value?: string | null; onChange: (v: string) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const img = new Image();
    img.onload = () => setStatus("ok");
    img.onerror = () => setStatus("error");
    img.src = value;
  }, [value]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadPhoto(file);
      onChange(url);
    } catch {
      setStatus("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-medium opacity-70">Foto</label>
      <div className="flex flex-wrap gap-2 mt-1">
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole a URL da imagem, ou envie/escolha um arquivo"
          className="rounded-md px-3 py-2 text-sm"
          style={{ border: "1px solid var(--line)", flex: "1 1 200px" }}
        />
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-xs whitespace-nowrap"
          style={{ border: "1px solid var(--line)" }}
        >
          <Images size={13} /> Escolher da biblioteca
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-xs whitespace-nowrap"
          style={{ border: "1px solid var(--line)" }}
        >
          <Upload size={13} /> {uploading ? "Enviando…" : "Enviar arquivo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {libraryOpen && (
        <MediaLibrary
          onClose={() => setLibraryOpen(false)}
          onPick={(url) => {
            onChange(url);
            setLibraryOpen(false);
          }}
        />
      )}

      {value && (
        <div className="mt-2">
          {status === "ok" && (
            <div>
              <img
                src={value}
                alt="pré-visualização"
                style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }}
              />
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--moss)" }}>
                <CheckCircle2 size={12} /> Imagem carregada com sucesso.
              </p>
            </div>
          )}
          {status === "loading" && <p className="text-xs opacity-60">Testando o link…</p>}
          {status === "error" && (
            <div className="rounded-md p-2 text-xs" style={{ background: "var(--clay-light)", color: "var(--bark)" }}>
              <p className="flex items-center gap-1 font-medium" style={{ color: "var(--danger)" }}>
                <AlertTriangle size={12} /> Este link não carregou.
              </p>
              <p className="mt-1 opacity-80">
                Verifique se é o endereço do arquivo de imagem (termina em .jpg, .png ou .webp), não da página. Se o
                link estiver certo mas ainda assim não abrir, use "Escolher da biblioteca" ou "Enviar arquivo".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MediaLibrary({ onClose, onPick }: { onClose: () => void; onPick: (url: string) => void }) {
  const { data: photos = [], isLoading } = useQuery({ queryKey: ["uploads"], queryFn: listUploads });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]" style={{ background: "rgba(35,57,44,0.5)" }}>
      <div className="rounded-lg w-full max-w-2xl p-4 max-h-[85vh] overflow-y-auto" style={{ background: "var(--paper)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-lg">Fotos já enviadas</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-xs opacity-60 mb-3">Clique numa foto para usá-la nesta atividade.</p>
        {isLoading && <p className="text-sm opacity-60">Carregando…</p>}
        {!isLoading && photos.length === 0 && <p className="text-sm opacity-60">Nenhuma foto enviada ainda.</p>}
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
          {photos.map((p) => (
            <button
              key={p.url}
              onClick={() => onPick(p.url)}
              className="rounded-md overflow-hidden"
              style={{ border: "1px solid var(--line)", aspectRatio: "4 / 3" }}
              title={p.url}
            >
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
