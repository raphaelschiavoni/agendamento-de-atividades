export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium opacity-70">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md px-3 py-2 mt-1 text-sm"
        style={{ border: "1px solid var(--line)" }}
      />
    </div>
  );
}
