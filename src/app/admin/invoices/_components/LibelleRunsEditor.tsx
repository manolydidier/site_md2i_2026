"use client";

import { useState, type CSSProperties } from "react";
import { X, Plus, Trash2, RotateCcw } from "lucide-react";
import StyleEditor from "./StyleEditor";
import { DEFAULT_TEXT_STYLE, type TextRun } from "@/app/lib/invoices/style";

const BORDER = "#E5E7EB";
const ORANGE = "#EF9F27";
const MUTED = "#6B7280";

function splitIntoRuns(text: string): TextRun[] {
  const words = text.split(/(\s+)/).filter((part) => part.length > 0);
  return words.length > 0 ? words.map((text) => ({ text, style: null })) : [{ text: "", style: null }];
}

export default function LibelleRunsEditor({
  libelle,
  initialRuns,
  onSave,
  onClose,
}: {
  libelle: string;
  initialRuns: TextRun[] | null;
  onSave: (runs: TextRun[]) => void;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<TextRun[]>(
    initialRuns && initialRuns.length > 0 ? initialRuns : splitIntoRuns(libelle)
  );

  function updateRun(index: number, patch: Partial<TextRun>) {
    setRuns((prev) => prev.map((run, i) => (i === index ? { ...run, ...patch } : run)));
  }

  function toggleStyle(index: number, enabled: boolean) {
    updateRun(index, { style: enabled ? DEFAULT_TEXT_STYLE : null });
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>Style du LIBELLE, mot par mot</h3>
          <button type="button" onClick={onClose} style={s.closeButton}>
            <X size={16} />
          </button>
        </div>

        <p style={s.helpText}>
          Chaque segment peut être stylé indépendamment. Désactivez le style pour revenir au texte brut.
        </p>

        <button
          type="button"
          onClick={() => setRuns(splitIntoRuns(libelle))}
          style={s.resetButton}
        >
          <RotateCcw size={13} /> Repartir du texte actuel
        </button>

        <div style={s.runsList}>
          {runs.map((run, index) => (
            <div key={index} style={s.runRow}>
              <input
                value={run.text}
                onChange={(e) => updateRun(index, { text: e.target.value })}
                style={s.runInput}
              />
              <label style={s.toggleLabel}>
                <input
                  type="checkbox"
                  checked={run.style !== null}
                  onChange={(e) => toggleStyle(index, e.target.checked)}
                />
                Style
              </label>
              {run.style && (
                <StyleEditor compact value={run.style} onChange={(style) => updateRun(index, { style })} />
              )}
              <button
                type="button"
                onClick={() => setRuns((prev) => prev.filter((_, i) => i !== index))}
                style={s.iconButtonDanger}
                title="Retirer ce segment"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRuns((prev) => [...prev, { text: "", style: null }])}
          style={s.addSegmentButton}
        >
          <Plus size={13} /> Ajouter un segment
        </button>

        <div style={s.actions}>
          <button type="button" onClick={onClose} style={s.cancelButton}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(runs.filter((run) => run.text.length > 0))}
            style={s.saveButton}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 22, width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 800 },
  closeButton: { width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  helpText: { fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 10 },
  resetButton: { height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#F8FAFC", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 },
  runsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  runRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: 10, borderRadius: 10, border: `1px solid ${BORDER}` },
  runInput: { height: 36, minWidth: 90, borderRadius: 8, border: `1px solid ${BORDER}`, padding: "0 10px", fontSize: 13 },
  toggleLabel: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#374151" },
  iconButtonDanger: { width: 30, height: 30, borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  addSegmentButton: { height: 36, padding: "0 14px", borderRadius: 9, border: "1px dashed #CBD5E1", background: "#F8FAFC", color: "#334155", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: `1px solid ${BORDER}` },
  cancelButton: { height: 40, padding: "0 18px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  saveButton: { height: 40, padding: "0 20px", borderRadius: 9, border: "none", background: ORANGE, color: "#1a0d00", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
