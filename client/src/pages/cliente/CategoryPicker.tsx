import { CATEGORY_META, CATEGORY_ORDER } from "../../lib/constants";
import type { Category } from "../../types";

export function CategoryPicker({ category, setCategory }: { category: Category; setCategory: (c: Category) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          onClick={() => setCategory(c)}
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            background: category === c ? CATEGORY_META[c].color : CATEGORY_META[c].bg,
            color: category === c ? "#fff" : "var(--bark)",
            border: "1px solid " + CATEGORY_META[c].color,
          }}
        >
          {CATEGORY_META[c].label}
        </button>
      ))}
    </div>
  );
}
