"use client";

// Éditeur de texte riche maison (contentEditable + document.execCommand) —
// pas de librairie d'édition (TipTap/Quill) pour rester cohérent avec le
// reste du module. Le HTML produit est toujours nettoyé côté serveur avant
// stockage (src/app/lib/invoices/sanitize-html.ts) : ce composant ne fait
// aucune promesse de sécurité, juste de l'ergonomie de saisie.
//
// Non contrôlé après le montage initial (le DOM du contentEditable est la
// source de vérité pendant la frappe, pour éviter les sauts de curseur) —
// utiliser une prop `key` différente pour forcer une réinitialisation
// (ex. changer de client en édition).

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bold, Italic, Underline, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const BORDER = "#E5E7EB";

export default function RichTextEditor({
  initialValue,
  onChange,
  uploadFolder = "clients",
}: {
  initialValue: string;
  onChange: (html: string) => void;
  uploadFolder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialValue || "";
    // Volontairement exécuté une seule fois au montage — voir commentaire en tête de fichier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emitChange();
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", uploadFolder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de l'upload.");
      exec("insertHTML", `<img src="${json.url}" alt="" style="max-width:100%;" />`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.toolbar}>
        <ToolbarButton onClick={() => exec("bold")} title="Gras"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italique"><Italic size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Souligné"><Underline size={14} /></ToolbarButton>
        <input
          type="color"
          title="Couleur du texte"
          onChange={(e) => exec("foreColor", e.target.value)}
          style={s.colorInput}
        />
        <ToolbarButton onClick={() => exec("justifyLeft")} title="Aligner à gauche"><AlignLeft size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Centrer"><AlignCenter size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Aligner à droite"><AlignRight size={14} /></ToolbarButton>
        <label style={{ ...s.toolbarButton, cursor: uploading ? "wait" : "pointer" }} title="Insérer une image">
          <ImageIcon size={14} />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        style={s.editable}
      />
    </div>
  );
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} style={s.toolbarButton}>
      {children}
    </button>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" },
  toolbar: { display: "flex", gap: 4, padding: 6, borderBottom: `1px solid ${BORDER}`, background: "#F8FAFC", flexWrap: "wrap" },
  toolbarButton: { width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  colorInput: { width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, padding: 2, cursor: "pointer" },
  editable: { minHeight: 140, padding: 12, fontSize: 14, lineHeight: 1.6, outline: "none" },
};
