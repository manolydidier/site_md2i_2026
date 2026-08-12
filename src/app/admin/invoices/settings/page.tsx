"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Star, Upload, Pencil, X } from "lucide-react";
import { usePermissions } from "@/(permisionGuard)/context/PermissionsContext";
import StyleEditor from "../_components/StyleEditor";
import RichTextEditor from "../_components/RichTextEditor";
import { DEFAULT_LIBELLE_STYLE, DEFAULT_TEXT_STYLE, type TextStyle, type TextLine } from "@/app/lib/invoices/style";

const ORANGE = "#EF9F27";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";

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
  { key: "suppliers", label: "Fournisseurs" },
  { key: "clients", label: "Clients" },
  { key: "payment-modes", label: "Modes de paiement" },
  { key: "date-types", label: "Types de date" },
  { key: "headers", label: "En-têtes" },
  { key: "footers", label: "Pieds de page" },
  { key: "libelle-style", label: "Style LIBELLE" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function InvoiceSettingsPage() {
  const { can } = usePermissions();
  const canManage = can("invoice_settings", "canCreate") || can("invoice_settings", "canUpdate");
  const [tab, setTab] = useState<TabKey>("suppliers");

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <Link href="/admin/invoices" style={s.backLink}>
            <ArrowLeft size={14} />
            Retour aux factures
          </Link>
          <h1 style={s.title}>Paramètres de facturation</h1>
        </div>
      </header>

      <div style={s.tabRow}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{ ...s.tabButton, ...(tab === t.key ? s.tabButtonActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {tab === "suppliers" && <SuppliersTab canManage={canManage} />}
        {tab === "clients" && <ClientsTab canManage={canManage} />}
        {tab === "payment-modes" && <SimpleListTab canManage={canManage} endpoint="/api/invoice-payment-modes" label="mode de paiement" />}
        {tab === "date-types" && <SimpleListTab canManage={canManage} endpoint="/api/invoice-date-types" label="type de date" />}
        {tab === "headers" && <HeadersTab canManage={canManage} />}
        {tab === "footers" && <FootersTab canManage={canManage} />}
        {tab === "libelle-style" && <LibelleStyleTab canManage={canManage} />}
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
          <button type="button" onClick={handleCreate} disabled={saving} style={s.addButton}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow}>
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
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} title="Supprimer">
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
              <button type="button" onClick={resetForm} style={s.iconButton} title="Annuler la modification">
                <X size={14} />
              </button>
            )}
          </div>

          <RichTextEditor key={editingId ?? "new"} initialValue={content} onChange={setContent} uploadFolder="clients" />

          <button type="button" onClick={handleSave} disabled={saving} style={{ ...s.addButton, alignSelf: "flex-start" }}>
            {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer ce client"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow}>
              <div>
                <div style={s.listTitle}>
                  {item.name} {item.isDefault && <span style={s.defaultBadge}>Par défaut</span>}
                </div>
              </div>
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button type="button" onClick={() => startEdit(item)} style={s.iconButton} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} title="Supprimer">
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
            <button type="button" onClick={resetForm} style={s.iconButton} title="Annuler la modification">
              <X size={14} />
            </button>
          )}
          <button type="button" onClick={handleSave} disabled={saving} style={s.addButton}>
            {editingId ? "Enregistrer" : <><Plus size={14} /> Ajouter</>}
          </button>
        </div>
      )}

      {loading ? (
        <div style={s.muted}>Chargement…</div>
      ) : (
        <div style={s.list}>
          {items.map((item) => (
            <div key={item.id} style={s.listRow}>
              <div style={s.listTitle}>{item.label}</div>
              {canManage && (
                <div style={s.listActions}>
                  <button
                    type="button"
                    onClick={() => { setEditingId(item.id); setNewLabel(item.label); }}
                    style={s.iconButton}
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} title="Supprimer">
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
          <label style={s.uploadButton}>
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
                  <button type="button" onClick={() => handleRename(item.id)} style={s.iconButton} title="Enregistrer">
                    <Pencil size={12} />
                  </button>
                  <button type="button" onClick={() => setRenamingId(null)} style={s.iconButton} title="Annuler">
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
                  <button type="button" onClick={() => handleSetDefault(item.id)} style={s.iconButton} title="Définir par défaut">
                    <Star size={14} fill={item.isDefault ? ORANGE : "none"} color={item.isDefault ? ORANGE : MUTED} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRenamingId(item.id); setRenameValue(item.name); }}
                    style={s.iconButton}
                    title="Renommer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} title="Supprimer">
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
              <button type="button" onClick={resetForm} style={s.iconButton} title="Annuler la modification">
                <X size={14} />
              </button>
            )}
          </div>

          {lines.map((line, index) => (
            <div key={index} style={s.footerLineEditor}>
              <input
                placeholder={`Ligne ${index + 1}`}
                value={line.text}
                onChange={(e) => updateLine(index, { text: e.target.value })}
                style={s.input}
              />
              <StyleEditor compact value={line.style} onChange={(style) => updateLine(index, { style })} />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                style={s.iconButtonDanger}
                title="Retirer la ligne"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { text: "", style: DEFAULT_TEXT_STYLE }])}
              style={s.secondaryButton}
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
            <button type="button" onClick={handleSave} disabled={saving} style={s.addButton}>
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
            <div key={item.id} style={s.listRow}>
              <div>
                <div style={s.listTitle}>{item.name}</div>
                <div style={s.listSubtitle}>{item.lines.map((l) => l.text).join(" · ")}</div>
              </div>
              {canManage && (
                <div style={s.listActions}>
                  <button type="button" onClick={() => startEdit(item)} style={s.iconButton} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} style={s.iconButtonDanger} title="Supprimer">
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/invoice-document-settings")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.libelleStyle) setStyle(j.data.libelleStyle);
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
        body: JSON.stringify({ libelleStyle: style }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={s.muted}>Chargement…</div>;

  return (
    <div>
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
        <button type="button" onClick={handleSave} disabled={saving} style={{ ...s.addButton, marginTop: 18 }}>
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
  tabRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 },
  tabButton: { height: 38, padding: "0 16px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabButtonActive: { background: ORANGE, borderColor: ORANGE, color: "#1a0d00" },
  card: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, boxSizing: "border-box" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20, alignItems: "center" },
  input: { height: 40, borderRadius: 9, border: `1px solid ${BORDER}`, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" },
  addButton: { height: 40, padding: "0 16px", borderRadius: 9, border: "none", background: ORANGE, color: "#1a0d00", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  secondaryButton: { height: 40, padding: "0 16px", borderRadius: 9, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  uploadButton: { height: 40, padding: "0 16px", borderRadius: 9, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  listRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}` },
  listTitle: { fontSize: 13.5, fontWeight: 700 },
  listSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  listActions: { display: "flex", gap: 6 },
  iconButton: { width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: SURFACE, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  iconButtonDanger: { width: 32, height: 32, borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  defaultBadge: { fontSize: 10, fontWeight: 800, color: ORANGE, marginLeft: 6 },
  muted: { fontSize: 13, color: MUTED, padding: "12px 0" },
  headerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  headerCard: { border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 },
  headerImg: { width: "100%", height: 80, objectFit: "contain", marginBottom: 8, background: BG, borderRadius: 8 },
  footerBuilder: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` },
  footerLineEditor: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  helpText: { fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 },
};
