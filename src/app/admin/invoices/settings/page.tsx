"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Star, Upload, Pencil, X, Truck, Users2, CreditCard, Image as ImageIcon, FileStack, Type } from "lucide-react";
import { usePermissions } from "@/(permisionGuard)/context/PermissionsContext";
import StyleEditor from "../_components/StyleEditor";
import RichTextEditor from "../_components/RichTextEditor";
import { DEFAULT_LIBELLE_STYLE, DEFAULT_TEXT_STYLE, type TextStyle, type TextLine } from "@/app/lib/invoices/style";

const ORANGE = "#EF9F27";
const ORANGE_DEEP = "#B4610F";
const BG = "#F8F7F4";
const SURFACE = "#FFFFFF";
const BORDER = "#E7E4DD";
const TEXT = "#1C1917";
const MUTED = "#6B6660";

type Supplier = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  statNumber: string | null;
  nif: string | null;
  rcs: string | null;
  isDefault: boolean;
};

type SimpleOption = { id: string; label: string; isActive: boolean; sortOrder: number };
type Header = { id: string; name: string; imageUrl: string; altText: string | null; isDefault: boolean };
type Footer = { id: string; name: string; lines: TextLine[]; isDefault: boolean };
type ClientRecord = { id: string; name: string; content: string; isDefault: boolean };

const TABS = [
  { key: "suppliers", label: "Fournisseurs", description: "Les émetteurs possibles d'une facture.", icon: Truck },
  { key: "clients", label: "Clients", description: "Contenu riche (texte, images) affiché sur la facture.", icon: Users2 },
  { key: "payment-modes", label: "Modes de paiement", description: "Options proposées sur chaque facture.", icon: CreditCard },
  { key: "headers", label: "En-têtes", description: "Images utilisables en haut du document.", icon: ImageIcon },
  { key: "footers", label: "Pieds de page", description: "Mentions légales réutilisables en bas du document.", icon: FileStack },
  { key: "libelle-style", label: "Style & numérotation", description: "Style global de la colonne LIBELLE et préfixes de numérotation.", icon: Type },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function InvoiceSettingsPage() {
  const { can } = usePermissions();
  const canManage = can("invoice_settings", "canCreate") || can("invoice_settings", "canUpdate");
  const [tab, setTab] = useState<TabKey>("suppliers");
  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div style={s.page} className="stg-form">
      <style>{`
        .stg-form input:focus, .stg-form select:focus, .stg-form textarea:focus {
          outline: none;
          border-color: ${ORANGE};
          box-shadow: 0 0 0 3px rgba(239,159,39,0.14);
        }
        .stg-form input:hover:not(:focus):not(:disabled) { border-color: #C9C4BB; }
        .stg-add-btn:hover:not(:disabled) { filter: brightness(1.04); }
        .stg-add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .stg-secondary-btn:hover { background: #F5F4F1; }
        .stg-icon-btn:hover { background: #F5F4F1; }
        .stg-icon-btn-danger:hover { background: #FEE2E2; }
        .stg-row:hover { background: #FBFAF9; }

        .stg-workspace { display: grid; grid-template-columns: 208px 1fr; background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 12px; overflow: hidden; }
        .stg-rail { display: flex; flex-direction: column; gap: 1px; padding: 12px 8px; border-right: 1px solid ${BORDER}; background: #FBFAF9; }
        .stg-rail-item { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; border: none; background: transparent; color: #57534E; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; transition: background .12s ease, color .12s ease; }
        .stg-rail-item:hover:not(.active) { background: #F1F0EC; color: #1C1917; }
        .stg-rail-item.active { background: ${SURFACE}; color: #1C1917; box-shadow: inset 2px 0 0 ${ORANGE}; font-weight: 700; }
        .stg-rail-item svg { flex-shrink: 0; color: #A8A29E; }
        .stg-rail-item.active svg { color: ${ORANGE}; }
        .stg-content { padding: 28px 32px; min-width: 0; }

        @media (max-width: 760px) {
          .stg-workspace { grid-template-columns: 1fr; border-radius: 10px; }
          .stg-rail { flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid ${BORDER}; padding: 8px; }
          .stg-rail-item.active { box-shadow: inset 0 -2px 0 ${ORANGE}; }
          .stg-content { padding: 20px; }
        }
      `}</style>

      <header style={s.header}>
        <div>
          <Link href="/admin/invoices" style={s.backLink}>
            <ArrowLeft size={14} />
            Retour aux factures
          </Link>
          <h1 style={s.title}>Paramètres de facturation</h1>
        </div>
      </header>

      <div className="stg-workspace">
        <nav className="stg-rail">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`stg-rail-item${isActive ? " active" : ""}`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="stg-content">
          <h2 style={s.sectionHeading}>{activeTab.label}</h2>
          <p style={s.sectionSubheading}>{activeTab.description}</p>

          {tab === "suppliers" && <SuppliersTab canManage={canManage} />}
          {tab === "clients" && <ClientsTab canManage={canManage} />}
          {tab === "payment-modes" && <SimpleListTab canManage={canManage} endpoint="/api/invoice-payment-modes" label="mode de paiement" />}
          {tab === "headers" && <HeadersTab canManage={canManage} />}
          {tab === "footers" && <FootersTab canManage={canManage} />}
          {tab === "libelle-style" && <LibelleStyleTab canManage={canManage} />}
        </div>
      </div>
    </div>
  );
}

// ── Fournisseurs ───────────────────────────────────────────────────────────
function SuppliersTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", statNumber: "", nif: "", rcs: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/invoice-suppliers")
      .then((r) => r.json())
      .then((j) => setItems(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/invoice-suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", address: "", phone: "", email: "", statNumber: "", nif: "", rcs: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/invoice-suppliers/${id}`, { method: "DELETE" });
    load();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/invoice-suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  return (
    <div>
      {canManage && (
        <div style={s.formGrid}>
          <input placeholder="Nom du fournisseur" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={s.input} />
          <input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={s.input} />
          <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={s.input} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={s.input} />
          <input placeholder="N° Stat" value={form.statNumber} onChange={(e) => setForm({ ...form, statNumber: e.target.value })} style={s.input} />
          <input placeholder="NIF" value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} style={s.input} />
          <input placeholder="RCS" value={form.rcs} onChange={(e) => setForm({ ...form, rcs: e.target.value })} style={s.input} />
          <button type="button" onClick={handleCreate} disabled={saving} style={s.addButton} className="stg-add-btn">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow} className="stg-row">
              <div>
                <div style={s.listTitle}>
                  {item.name} {item.isDefault && <span style={s.defaultBadge}>Par défaut</span>}
                </div>
                <div style={s.listSubtitle}>
                  {[item.address, item.phone, item.email].filter(Boolean).join(" — ")}
                </div>
              </div>
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} className="stg-icon-btn" title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} className="stg-icon-btn-danger" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={s.muted}>Aucun fournisseur.</div>}
        </div>
      )}
    </div>
  );
}

// ── Clients (contenu riche : texte + images, éditeur type traitement de texte) ──
function ClientsTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((j) => setItems(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setContent("");
  }

  function startEdit(item: ClientRecord) {
    setEditingId(item.id);
    setName(item.name);
    setContent(item.content || "");
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, content };
      if (editingId) {
        await fetch(`/api/clients/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  return (
    <div>
      {canManage && (
        <div style={s.footerBuilder}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input placeholder="Nom du client" value={name} onChange={(e) => setName(e.target.value)} style={{ ...s.input, flex: 1 }} />
            {editingId && (
              <button type="button" onClick={resetForm} style={s.iconButton} className="stg-icon-btn" title="Annuler la modification">
                <X size={14} />
              </button>
            )}
          </div>

          <RichTextEditor key={editingId ?? "new"} initialValue={content} onChange={setContent} uploadFolder="clients" />

          <button type="button" onClick={handleSave} disabled={saving} style={{ ...s.addButton, alignSelf: "flex-start" }} className="stg-add-btn">
            {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer ce client"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow} className="stg-row">
              <div>
                <div style={s.listTitle}>
                  {item.name} {item.isDefault && <span style={s.defaultBadge}>Par défaut</span>}
                </div>
              </div>
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} className="stg-icon-btn" title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button type="button" onClick={() => startEdit(item)} style={s.iconButton} className="stg-icon-btn" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} className="stg-icon-btn-danger" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={s.muted}>Aucun client.</div>}
        </div>
      )}
    </div>
  );
}

// ── Modes de paiement / Types de date (structure identique) ────────────────
function SimpleListTab({ canManage, endpoint, label }: { canManage: boolean; endpoint: string; label: string }) {
  const [items, setItems] = useState<SimpleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => r.json())
      .then((j) => setItems(j.data || []))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setEditingId(null);
    setNewLabel("");
  }

  async function handleSave() {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`${endpoint}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newLabel }),
        });
      } else {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newLabel, sortOrder: items.length }),
        });
      }
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  return (
    <div>
      {canManage && (
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <input
            placeholder={`Nouveau ${label}`}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ ...s.input, flex: 1 }}
          />
          {editingId && (
            <button type="button" onClick={resetForm} style={s.iconButton} className="stg-icon-btn" title="Annuler la modification">
              <X size={14} />
            </button>
          )}
          <button type="button" onClick={handleSave} disabled={saving} style={s.addButton} className="stg-add-btn">
            {editingId ? "Enregistrer" : <><Plus size={14} /> Ajouter</>}
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow} className="stg-row">
              <div style={s.listTitle}>{item.label}</div>
              {canManage && (
                <div style={s.listActions}>
                  <button
                    type="button"
                    onClick={() => { setEditingId(item.id); setNewLabel(item.label); }}
                    style={s.iconButton} className="stg-icon-btn"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} className="stg-icon-btn-danger" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={s.muted}>Aucun élément.</div>}
        </div>
      )}
    </div>
  );
}

// ── En-têtes ────────────────────────────────────────────────────────────────
function HeadersTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Header[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/invoice-headers")
      .then((r) => r.json())
      .then((j) => setItems(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(file: File) {
    if (!name.trim()) {
      alert("Donnez un nom à l'en-tête avant d'uploader l'image.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "invoices");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Échec de l'upload.");

      await fetch("/api/invoice-headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageUrl: uploadJson.url, altText: name }),
      });
      setName("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/invoice-headers/${id}`, { method: "DELETE" });
    load();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/invoice-headers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    await fetch(`/api/invoice-headers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue, altText: renameValue }),
    });
    setRenamingId(null);
    load();
  }

  return (
    <div>
      {canManage && (
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <input placeholder="Nom de l'en-tête" value={name} onChange={(e) => setName(e.target.value)} style={{ ...s.input, flex: 1 }} />
          <label style={s.uploadButton} className="stg-secondary-btn">
            <Upload size={14} />
            {uploading ? "Envoi…" : "Uploader une image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.headerGrid}>
          {items.map((item) => (
            <div key={item.id} style={s.headerCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.altText || item.name} style={s.headerImg} />
              {renamingId === item.id ? (
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    style={{ ...s.input, flex: 1, height: 32 }}
                    autoFocus
                  />
                  <button type="button" onClick={() => handleRename(item.id)} style={s.iconButton} className="stg-icon-btn" title="Enregistrer">
                    <Pencil size={12} />
                  </button>
                  <button type="button" onClick={() => setRenamingId(null)} style={s.iconButton} className="stg-icon-btn" title="Annuler">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={s.listTitle}>
                  {item.name} {item.isDefault && <span style={s.defaultBadge}>Par défaut</span>}
                </div>
              )}
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} className="stg-icon-btn" title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRenamingId(item.id); setRenameValue(item.name); }}
                    style={s.iconButton} className="stg-icon-btn"
                    title="Renommer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} className="stg-icon-btn-danger" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={s.muted}>Aucun en-tête.</div>}
        </div>
      )}
    </div>
  );
}

// ── Pieds de page ───────────────────────────────────────────────────────────
function FootersTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Footer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [lines, setLines] = useState<TextLine[]>([{ text: "", style: DEFAULT_TEXT_STYLE }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/invoice-footers")
      .then((r) => r.json())
      .then((j) => setItems(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setLines([{ text: "", style: DEFAULT_TEXT_STYLE }]);
  }

  function startEdit(item: Footer) {
    setEditingId(item.id);
    setName(item.name);
    setLines(item.lines.length > 0 ? item.lines : [{ text: "", style: DEFAULT_TEXT_STYLE }]);
  }

  function updateLine(index: number, patch: Partial<TextLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSave() {
    if (!name.trim() || lines.every((l) => !l.text.trim())) return;
    setSaving(true);
    try {
      const payload = { name, lines: lines.filter((l) => l.text.trim()) };
      if (editingId) {
        await fetch(`/api/invoice-footers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/invoice-footers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/invoice-footers/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  return (
    <div>
      {canManage && (
        <div style={s.footerBuilder}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input placeholder="Nom du pied de page" value={name} onChange={(e) => setName(e.target.value)} style={{ ...s.input, flex: 1 }} />
            {editingId && (
              <button type="button" onClick={resetForm} style={s.iconButton} className="stg-icon-btn" title="Annuler la modification">
                <X size={14} />
              </button>
            )}
          </div>

          {lines.map((line, index) => (
            <div key={index} style={s.footerLineEditor}>
              <div style={s.footerLineHeader}>
                <span style={s.footerLineIndex}>Ligne {index + 1}</span>
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  style={s.iconButtonDanger} className="stg-icon-btn-danger"
                  title="Retirer la ligne"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                placeholder={`Ligne ${index + 1}`}
                value={line.text}
                onChange={(e) => updateLine(index, { text: e.target.value })}
                style={{ ...s.input, width: "100%" }}
              />
              <StyleEditor compact value={line.style} onChange={(style) => updateLine(index, { style })} />
            </div>
          ))}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { text: "", style: DEFAULT_TEXT_STYLE }])}
              style={s.secondaryButton} className="stg-secondary-btn"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
            <button type="button" onClick={handleSave} disabled={saving} style={s.addButton} className="stg-add-btn">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer ce pied de page"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow} className="stg-row">
              <div>
                <div style={s.listTitle}>{item.name}</div>
                <div style={s.listSubtitle}>{item.lines.map((l) => l.text).join(" · ")}</div>
              </div>
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => startEdit(item)} style={s.iconButton} className="stg-icon-btn" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} className="stg-icon-btn-danger" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div style={s.muted}>Aucun pied de page.</div>}
        </div>
      )}
    </div>
  );
}

// ── Style LIBELLE global ────────────────────────────────────────────────────
function LibelleStyleTab({ canManage }: { canManage: boolean }) {
  const [style, setStyle] = useState<TextStyle>(DEFAULT_LIBELLE_STYLE);
  const [facturePrefix, setFacturePrefix] = useState("FA-");
  const [proformaPrefix, setProformaPrefix] = useState("PRO-");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/invoice-document-settings")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.libelleStyle) setStyle(j.data.libelleStyle);
        if (j?.data?.facturePrefix) setFacturePrefix(j.data.facturePrefix);
        if (j?.data?.proformaPrefix) setProformaPrefix(j.data.proformaPrefix);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/invoice-document-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libelleStyle: style, facturePrefix, proformaPrefix }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={s.muted}>Chargement…</div>;

  return (
    <div>
      <div style={s.footerBuilder}>
        <div style={s.footerLineIndex}>Numérotation</div>
        <p style={{ ...s.helpText, marginBottom: 10, marginTop: -4 }}>
          Préfixe automatique proposé pour le N° facture, selon le type de document (Facture ou Facture Proforma).
          Format final : <code>{"{préfixe}{année}-{numéro}"}</code>, ex. <code>{facturePrefix}2025-0001</code>.
        </p>
        <div style={{ ...s.formGrid, marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={s.footerLineIndex}>Préfixe Facture</span>
            <input value={facturePrefix} onChange={(e) => setFacturePrefix(e.target.value)} style={s.input} placeholder="FA-" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={s.footerLineIndex}>Préfixe Facture Proforma</span>
            <input value={proformaPrefix} onChange={(e) => setProformaPrefix(e.target.value)} style={s.input} placeholder="PRO-" />
          </label>
        </div>
      </div>

      <p style={s.helpText}>
        Ce style s&apos;applique à la colonne LIBELLE des lignes de facturation, sur l&apos;aperçu web, l&apos;export Excel et l&apos;export PDF.
      </p>

      <StyleEditor value={style} onChange={setStyle} />

      <div style={{ marginTop: 18, padding: 14, borderRadius: 10, border: `1px dashed ${BORDER}` }}>
        <span style={{ fontFamily: `"${style.fontFamily}"`, fontSize: style.fontSize, color: style.color, backgroundColor: style.backgroundColor || undefined, fontWeight: style.bold ? 700 : 400, fontStyle: style.italic ? "italic" : "normal", textDecoration: style.underline ? "underline" : "none" }}>
          Aperçu : Scans des livres et dossiers fonciers
        </span>
      </div>

      {canManage && (
        <button type="button" onClick={handleSave} disabled={saving} style={{ ...s.addButton, marginTop: 18 }} className="stg-add-btn">
          {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer le style"}
        </button>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: BG, color: TEXT, padding: 32, boxSizing: "border-box" },
  header: { marginBottom: 20 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED, textDecoration: "none", marginBottom: 8 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  sectionHeading: { margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" },
  sectionSubheading: { margin: "4px 0 22px", fontSize: 12.5, color: MUTED },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${BORDER}`, alignItems: "center" },
  input: { height: 38, borderRadius: 7, border: `1px solid ${BORDER}`, padding: "0 11px", fontSize: 13.5, outline: "none", boxSizing: "border-box", background: SURFACE, transition: "border-color 0.15s ease, box-shadow 0.15s ease" },
  addButton: { height: 38, padding: "0 16px", borderRadius: 7, border: "none", background: ORANGE, color: "#1a0d00", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  secondaryButton: { height: 38, padding: "0 16px", borderRadius: 7, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  uploadButton: { height: 38, padding: "0 16px", borderRadius: 7, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  list: { display: "flex", flexDirection: "column", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" },
  listRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderTop: `1px solid ${BORDER}` },
  listTitle: { fontSize: 13.5, fontWeight: 600 },
  listSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  listActions: { display: "flex", gap: 4 },
  iconButton: { width: 30, height: 30, borderRadius: 7, border: "none", background: "transparent", color: "#57534E", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  iconButtonDanger: { width: 30, height: 30, borderRadius: 7, border: "none", background: "transparent", color: "#B42318", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  defaultBadge: { fontSize: 10, fontWeight: 700, color: ORANGE_DEEP, marginLeft: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
  muted: { fontSize: 13, color: MUTED, padding: "12px 0" },
  headerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  headerCard: { border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 },
  headerImg: { width: "100%", height: 80, objectFit: "contain", marginBottom: 8, background: BG, borderRadius: 8 },
  footerBuilder: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` },
  footerLineEditor: { display: "flex", flexDirection: "column", gap: 10, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, background: "#FBFAF9" },
  footerLineHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  footerLineIndex: { fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.06em" },
  helpText: { fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 },
};
