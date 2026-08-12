"use client";

import type { CSSProperties } from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { SAFE_FONT_FAMILIES, type TextStyle, type TextAlign } from "@/app/lib/invoices/style";

const BORDER = "#E5E7EB";
const ORANGE = "#EF9F27";

export default function StyleEditor({
  value,
  onChange,
  compact = false,
}: {
  value: TextStyle;
  onChange: (next: TextStyle) => void;
  compact?: boolean;
}) {
  function set<K extends keyof TextStyle>(key: K, val: TextStyle[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div style={{ ...s.wrap, gap: compact ? 8 : 12 }}>
      <label style={s.field}>
        <span style={s.label}>Police</span>
        <select value={value.fontFamily} onChange={(e) => set("fontFamily", e.target.value as TextStyle["fontFamily"])} style={s.select}>
          {SAFE_FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </label>

      <label style={s.field}>
        <span style={s.label}>Taille</span>
        <input
          type="number"
          min={6}
          max={72}
          value={value.fontSize}
          onChange={(e) => set("fontSize", Math.max(6, Math.min(72, Number(e.target.value) || 12)))}
          style={s.number}
        />
      </label>

      <label style={s.field}>
        <span style={s.label}>Couleur texte</span>
        <input type="color" value={value.color} onChange={(e) => set("color", e.target.value)} style={s.color} />
      </label>

      <label style={s.field}>
        <span style={s.label}>Fond</span>
        <input
          type="color"
          value={value.backgroundColor || "#ffffff"}
          onChange={(e) => set("backgroundColor", e.target.value)}
          style={s.color}
        />
        <button type="button" onClick={() => set("backgroundColor", null)} style={s.clearButton}>
          Aucun
        </button>
      </label>

      <div style={s.field}>
        <span style={s.label}>Style</span>
        <div style={s.toggleRow}>
          <ToggleButton active={value.bold} onClick={() => set("bold", !value.bold)} icon={<Bold size={14} />} title="Gras" />
          <ToggleButton active={value.italic} onClick={() => set("italic", !value.italic)} icon={<Italic size={14} />} title="Italique" />
          <ToggleButton active={value.underline} onClick={() => set("underline", !value.underline)} icon={<Underline size={14} />} title="Souligné" />
        </div>
      </div>

      <div style={s.field}>
        <span style={s.label}>Alignement</span>
        <div style={s.toggleRow}>
          {(["left", "center", "right"] as TextAlign[]).map((align) => (
            <ToggleButton
              key={align}
              active={value.align === align}
              onClick={() => set("align", align)}
              icon={align === "left" ? <AlignLeft size={14} /> : align === "center" ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              title={align}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        ...s.toggleButton,
        background: active ? ORANGE : "#fff",
        color: active ? "#1a0d00" : "#374151",
        borderColor: active ? ORANGE : BORDER,
      }}
    >
      {icon}
    </button>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { display: "flex", flexWrap: "wrap", alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" },
  select: { height: 36, borderRadius: 8, border: `1px solid ${BORDER}`, padding: "0 10px", fontSize: 13 },
  number: { height: 36, width: 70, borderRadius: 8, border: `1px solid ${BORDER}`, padding: "0 10px", fontSize: 13 },
  color: { height: 36, width: 44, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 2, cursor: "pointer" },
  clearButton: { height: 36, padding: "0 8px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 11, cursor: "pointer", marginLeft: 4 },
  toggleRow: { display: "flex", gap: 4 },
  toggleButton: { width: 36, height: 36, borderRadius: 8, border: "1px solid", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
};
