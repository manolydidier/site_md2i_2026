"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw } from "lucide-react";
import StyleEditor from "./StyleEditor";
import { DEFAULT_TEXT_STYLE, toCssStyle, type TextRun, type TextStyle } from "@/app/lib/invoices/style";

const BORDER = "#E5E7EB";
const ORANGE = "#EF9F27";
const MUTED = "#6B7280";

function sameStyle(a: TextStyle | null, b: TextStyle | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.color === b.color &&
    a.backgroundColor === b.backgroundColor &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.align === b.align
  );
}

function runsToCharStyles(text: string, runs: TextRun[] | null): (TextStyle | null)[] {
  const styles: (TextStyle | null)[] = [];
  if (runs && runs.length > 0) {
    for (const run of runs) {
      for (let i = 0; i < run.text.length; i += 1) styles.push(run.style);
    }
  }
  while (styles.length < text.length) styles.push(null);
  return styles.slice(0, text.length);
}

function charStylesToRuns(text: string, styles: (TextStyle | null)[]): TextRun[] {
  const runs: TextRun[] = [];
  let i = 0;
  while (i < text.length) {
    let j = i + 1;
    while (j < text.length && sameStyle(styles[j], styles[i])) j += 1;
    runs.push({ text: text.slice(i, j), style: styles[i] ?? null });
    i = j;
  }
  return runs.length > 0 ? runs : [{ text, style: null }];
}

/** Offset (en caractères) d'un point de la sélection par rapport au début du conteneur. */
function charOffsetInContainer(container: Node, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.setEnd(node, offset);
  return range.toString().length;
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
  const text = useMemo(
    () => (initialRuns && initialRuns.length > 0 ? initialRuns.map((r) => r.text).join("") : libelle),
    [libelle, initialRuns]
  );
  const [charStyles, setCharStyles] = useState<(TextStyle | null)[]>(() => runsToCharStyles(text, initialRuns));
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [pendingStyle, setPendingStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const previewRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const segments = useMemo(() => {
    const bounds = new Set<number>([0, text.length]);
    let i = 0;
    while (i < text.length) {
      let j = i + 1;
      while (j < text.length && sameStyle(charStyles[j], charStyles[i])) j += 1;
      bounds.add(j);
      i = j;
    }
    if (selection) {
      bounds.add(selection.start);
      bounds.add(selection.end);
    }
    const sorted = Array.from(bounds).sort((a, b) => a - b);
    const result: { text: string; style: TextStyle | null; selected: boolean }[] = [];
    for (let k = 0; k < sorted.length - 1; k += 1) {
      const start = sorted[k];
      const end = sorted[k + 1];
      if (start >= end) continue;
      result.push({
        text: text.slice(start, end),
        style: charStyles[start] ?? null,
        selected: Boolean(selection) && start >= selection!.start && end <= selection!.end,
      });
    }
    return result;
  }, [text, charStyles, selection]);

  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !previewRef.current) return;
    const range = sel.getRangeAt(0);
    if (!previewRef.current.contains(range.commonAncestorContainer)) return;

    const a = charOffsetInContainer(previewRef.current, range.startContainer, range.startOffset);
    const b = charOffsetInContainer(previewRef.current, range.endContainer, range.endOffset);
    const from = Math.max(0, Math.min(a, b));
    const to = Math.min(text.length, Math.max(a, b));
    if (to <= from) return;

    setSelection({ start: from, end: to });

    let uniform: TextStyle | null = charStyles[from] ?? null;
    for (let i = from + 1; i < to; i += 1) {
      if (!sameStyle(charStyles[i], uniform)) {
        uniform = null;
        break;
      }
    }
    setPendingStyle(uniform ?? DEFAULT_TEXT_STYLE);
  }

  function applyStyleToSelection() {
    if (!selection) return;
    const { start, end } = selection;
    setCharStyles((prev) => prev.map((st, i) => (i >= start && i < end ? pendingStyle : st)));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  function clearStyleOnSelection() {
    if (!selection) return;
    const { start, end } = selection;
    setCharStyles((prev) => prev.map((st, i) => (i >= start && i < end ? null : st)));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  function clearAllStyles() {
    setCharStyles(new Array(text.length).fill(null));
    setSelection(null);
  }

  if (!mounted) return null;

  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>Style du LIBELLE</h3>
          <button type="button" onClick={onClose} style={s.closeButton}>
            <X size={16} />
          </button>
        </div>

        <p style={s.helpText}>
          Sélectionnez du texte à la souris — comme dans Word — puis appliquez un style à la sélection.
        </p>

        <div ref={previewRef} onMouseUp={handleMouseUp} style={s.preview}>
          {segments.length > 0 ? (
            segments.map((seg, i) => (
              <span
                key={i}
                style={{
                  ...(seg.style ? toCssStyle(seg.style) : undefined),
                  ...(seg.selected ? { backgroundColor: "rgba(239,159,39,0.30)" } : null),
                }}
              >
                {seg.text}
              </span>
            ))
          ) : (
            <span style={s.emptyPreview}>Libellé vide</span>
          )}
        </div>

        {selection ? (
          <div style={s.selectionPanel}>
            <div style={s.selectionHeader}>
              <span style={s.selectionLabel}>Sélection : « {text.slice(selection.start, selection.end)} »</span>
              <button type="button" onClick={() => setSelection(null)} style={s.closeButtonSmall}>
                <X size={13} />
              </button>
            </div>
            <StyleEditor compact value={pendingStyle} onChange={setPendingStyle} />
            <div style={s.selectionActions}>
              <button type="button" onClick={clearStyleOnSelection} style={s.cancelButton}>
                Retirer le style
              </button>
              <button type="button" onClick={applyStyleToSelection} style={s.saveButton}>
                Appliquer à la sélection
              </button>
            </div>
          </div>
        ) : (
          <p style={s.hintText}>Faites glisser la souris sur un ou plusieurs mots ci-dessus pour les styler.</p>
        )}

        <button type="button" onClick={clearAllStyles} style={s.resetButton}>
          <RotateCcw size={13} /> Retirer tous les styles
        </button>

        <div style={s.actions}>
          <button type="button" onClick={onClose} style={s.cancelButton}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(charStylesToRuns(text, charStyles))}
            style={s.saveButton}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const s: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 22, width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 800 },
  closeButton: { width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  closeButtonSmall: { width: 24, height: 24, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  helpText: { fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 12 },
  preview: {
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: "14px 16px",
    fontSize: 14,
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    userSelect: "text",
    cursor: "text",
    marginBottom: 12,
    background: "#FAFAFA",
  },
  emptyPreview: { color: MUTED, fontStyle: "italic" },
  hintText: { fontSize: 12, color: MUTED, marginBottom: 14 },
  selectionPanel: { border: `1px solid ${ORANGE}`, background: "#FFF8EC", borderRadius: 10, padding: 12, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 },
  selectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  selectionLabel: { fontSize: 12.5, fontWeight: 700, color: "#334155", overflow: "hidden", textOverflow: "ellipsis" },
  selectionActions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  resetButton: { height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#F8FAFC", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: `1px solid ${BORDER}` },
  cancelButton: { height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "#fff", color: "#374151", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  saveButton: { height: 38, padding: "0 18px", borderRadius: 9, border: "none", background: ORANGE, color: "#1a0d00", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
};
