import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { uploadPhoto } from "../api/dashboard";

type Status = "idle" | "ok" | "error" | "loading";

export function PhotoField({ value, onChange }: { value?: string | null; onChange: (v: string) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [uploading, setUploading] = useState(false);
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
      <div className="flex gap-2 mt-1">
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole a URL da imagem, ou envie um arquivo"
          className="w-full rounded-md px-3 py-2 text-sm"
          style={{ border: "1px solid var(--line)" }}
        />
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
                link estiver certo mas ainda assim não abrir, o site de origem provavelmente bloqueia o uso externo
                da foto — nesse caso use o botão "Enviar arquivo" acima.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
