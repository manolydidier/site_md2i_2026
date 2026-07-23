"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCrmStatuses } from "@/app/hooks/useEmailMarketing";
import { usePermissions } from "@/(permisionGuard)/context/PermissionsContext";
import type {
  CrmStatusOption,
  CrmStatusOptionFormData,
} from "@/app/types/email-marketing";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";

const ORANGE = "#EF9F27";

const DEFAULT_FORM: CrmStatusOptionFormData = {
  label: "",
  key: "",
  color: "#EF9F27",
  description: "",
  sortOrder: 0,
  isDefault: false,
  isActive: true,
};

function slugifyKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function CrmStatusesManager() {
  const { can } = usePermissions();
  const canCreate = can("crm_statuses", "canCreate");
  const canUpdate = can("crm_statuses", "canUpdate");
  const canDeleteStatus = can("crm_statuses", "canDelete");

  const {
    statuses,
    loading,
    error,
    refetch,
    createStatus,
    updateStatus,
    disableStatus,
  } = useCrmStatuses();

  const [form, setForm] = useState<CrmStatusOptionFormData>(DEFAULT_FORM);
  const [editing, setEditing] = useState<CrmStatusOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const activeStatuses = useMemo(
    () => statuses.filter((status) => status.isActive),
    [statuses]
  );

  const inactiveStatuses = useMemo(
    () => statuses.filter((status) => !status.isActive),
    [statuses]
  );

  useEffect(() => {
    if (!editing) return;

    setForm({
      label: editing.label || "",
      key: editing.key || "",
      color: editing.color || "#EF9F27",
      description: editing.description || "",
      sortOrder: editing.sortOrder || 0,
      isDefault: Boolean(editing.isDefault),
      isActive: Boolean(editing.isActive),
    });
  }, [editing]);

  const resetForm = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setMessage(null);
  };

  const updateForm = <K extends keyof CrmStatusOptionFormData>(
    key: K,
    value: CrmStatusOptionFormData[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "label" && !editing
        ? {
            key: slugifyKey(String(value)),
          }
        : {}),
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload: CrmStatusOptionFormData = {
        label: form.label.trim(),
        key: slugifyKey(form.key || form.label),
        color: form.color || "#EF9F27",
        description: form.description?.trim() || null,
        sortOrder: Number(form.sortOrder || 0),
        isDefault: Boolean(form.isDefault),
        isActive: Boolean(form.isActive),
      };

      if (!payload.label) {
        throw new Error("Le libellé du statut est obligatoire.");
      }

      if (!payload.key) {
        throw new Error("La clé technique du statut est obligatoire.");
      }

      if (editing) {
        await updateStatus(editing.id, payload);

        setMessage({
          type: "success",
          text: "Statut CRM modifié avec succès.",
        });
      } else {
        await createStatus(payload);

        setMessage({
          type: "success",
          text: "Nouveau statut CRM ajouté avec succès.",
        });
      }

      resetForm();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erreur pendant l’enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (status: CrmStatusOption) => {
    if (
      !confirm(
        `Désactiver le statut "${status.label}" ? Les contacts existants conserveront leur historique, mais ce statut ne sera plus proposé.`
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await disableStatus(status.id);

      setMessage({
        type: "success",
        text: "Statut CRM désactivé.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erreur pendant la désactivation.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (status: CrmStatusOption) => {
    setSaving(true);
    setMessage(null);

    try {
      await updateStatus(status.id, {
        isActive: true,
      });

      setMessage({
        type: "success",
        text: "Statut CRM réactivé.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erreur pendant la réactivation.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <div>
          <p style={s.eyebrow}>Paramétrage CRM</p>
          <h2 style={s.title}>Statuts CRM dynamiques</h2>
          <p style={s.subtitle}>
            Ajoutez, modifiez et organisez les statuts utilisés dans vos fiches
            contacts et vos automatisations.
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={loading || saving}
          style={s.secondaryButton}
        >
          <RefreshCcw size={15} />
          Recharger
        </button>
      </header>

      {message && (
        <div
          style={{
            ...s.message,
            ...(message.type === "success" ? s.messageSuccess : s.messageError),
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {error && (
        <div style={{ ...s.message, ...s.messageError }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <main style={s.grid}>
        {(canCreate || canUpdate) && (
        <section style={s.card}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>
                {editing ? "Modifier le statut" : "Ajouter un statut"}
              </h3>
              <p style={s.cardText}>
                La clé technique sert aux automatisations. Exemple :
                HOT_PROSPECT.
              </p>
            </div>

            {editing && (
              <button type="button" onClick={resetForm} style={s.iconButton}>
                <X size={15} />
              </button>
            )}
          </div>

          <div style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Libellé public</label>
              <input
                value={form.label}
                onChange={(event) => updateForm("label", event.target.value)}
                placeholder="Ex : Prospect chaud"
                style={s.input}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Clé technique</label>
              <input
                value={form.key || ""}
                onChange={(event) =>
                  updateForm("key", slugifyKey(event.target.value))
                }
                placeholder="Ex : HOT_PROSPECT"
                style={s.input}
              />
              <p style={s.help}>
                Ne change pas cette clé si le statut est déjà utilisé dans des
                automatisations.
              </p>
            </div>

            <div style={s.twoCols}>
              <div style={s.field}>
                <label style={s.label}>Couleur</label>
                <div style={s.colorRow}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      updateForm("color", event.target.value)
                    }
                    style={s.colorInput}
                  />

                  <input
                    value={form.color}
                    onChange={(event) =>
                      updateForm("color", event.target.value)
                    }
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Ordre</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm("sortOrder", Number(event.target.value))
                  }
                  style={s.input}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea
                value={form.description || ""}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Ex : contact intéressé à relancer rapidement..."
                style={s.textarea}
              />
            </div>

            <div style={s.checkGrid}>
              <label style={s.checkCard}>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateForm("isDefault", event.target.checked)
                  }
                />
                <span>Statut par défaut</span>
              </label>

              <label style={s.checkCard}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                />
                <span>Actif</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || (editing ? !canUpdate : !canCreate)}
              style={s.primaryButton}
            >
              {saving ? (
                <Loader2 size={15} className="crm-status-spin" />
              ) : editing ? (
                <Save size={15} />
              ) : (
                <Plus size={15} />
              )}

              {saving
                ? "Enregistrement..."
                : editing
                  ? "Enregistrer les modifications"
                  : "Ajouter le statut"}
            </button>
          </div>
        </section>
        )}

        <section style={s.card}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>Statuts actifs</h3>
              <p style={s.cardText}>
                Ces statuts seront proposés dans les fiches contacts.
              </p>
            </div>

            <span style={s.countBadge}>{activeStatuses.length}</span>
          </div>

          {loading ? (
            <div style={s.loading}>
              <Loader2 size={18} className="crm-status-spin" />
              Chargement des statuts...
            </div>
          ) : activeStatuses.length === 0 ? (
            <div style={s.empty}>Aucun statut actif.</div>
          ) : (
            <div style={s.list}>
              {activeStatuses.map((status) => (
                <StatusRow
                  key={status.id}
                  status={status}
                  canEdit={canUpdate}
                  canDisable={canDeleteStatus}
                  onEdit={() => setEditing(status)}
                  onDisable={() => handleDisable(status)}
                />
              ))}
            </div>
          )}

          {inactiveStatuses.length > 0 && (
            <div style={s.inactiveSection}>
              <h4 style={s.inactiveTitle}>Statuts désactivés</h4>

              <div style={s.list}>
                {inactiveStatuses.map((status) => (
                  <StatusRow
                    key={status.id}
                    status={status}
                    muted
                    canEdit={canUpdate}
                    canDisable={canDeleteStatus}
                    onEdit={() => setEditing(status)}
                    onDisable={() => handleReactivate(status)}
                    disableLabel="Réactiver"
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .crm-status-spin {
          animation: crmStatusSpin 0.8s linear infinite;
        }

        @keyframes crmStatusSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function StatusRow({
  status,
  muted,
  disableLabel = "Désactiver",
  canEdit,
  canDisable,
  onEdit,
  onDisable,
}: {
  status: CrmStatusOption;
  muted?: boolean;
  disableLabel?: string;
  canEdit: boolean;
  canDisable: boolean;
  onEdit: () => void;
  onDisable: () => void;
}) {
  return (
    <article
      style={{
        ...s.statusRow,
        opacity: muted ? 0.58 : 1,
      }}
    >
      <div
        style={{
          ...s.statusColor,
          background: status.color || ORANGE,
        }}
      />

      <div style={s.statusMain}>
        <div style={s.statusTitleRow}>
          <strong style={s.statusLabel}>{status.label}</strong>

          {status.isDefault && <span style={s.defaultBadge}>Défaut</span>}
        </div>

        <span style={s.statusKey}>{status.key}</span>

        {status.description && (
          <p style={s.statusDescription}>{status.description}</p>
        )}
      </div>

      <div style={s.statusMeta}>
        <span style={s.orderBadge}>#{status.sortOrder}</span>

        {canEdit && (
          <button type="button" onClick={onEdit} style={s.rowButton}>
            <Edit3 size={14} />
          </button>
        )}

        {canDisable && (
          <button type="button" onClick={onDisable} style={s.dangerButton}>
            {disableLabel === "Réactiver" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}
      </div>
    </article>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: {
    padding: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },

  eyebrow: {
    margin: "0 0 6px",
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: 22,
    fontWeight: 850,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "7px 0 0",
    maxWidth: 660,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 1.6,
  },

  message: {
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
    fontWeight: 750,
  },

  messageSuccess: {
    color: "#166534",
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
  },

  messageError: {
    color: "#991B1B",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 0.8fr) minmax(0, 1.2fr)",
    gap: 16,
    alignItems: "start",
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },

  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 16,
    fontWeight: 850,
  },

  cardText: {
    margin: "5px 0 0",
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 1.5,
  },

  form: {
    display: "grid",
    gap: 12,
  },

  field: {
    display: "grid",
    gap: 7,
  },

  label: {
    color: "#374151",
    fontSize: 12,
    fontWeight: 800,
  },

  input: {
    width: "100%",
    height: 40,
    padding: "0 11px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    outline: "none",
    fontSize: 13,
    color: "#111827",
    background: "#FFFFFF",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 82,
    padding: 11,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    outline: "none",
    fontSize: 13,
    color: "#111827",
    background: "#FFFFFF",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  help: {
    margin: 0,
    color: "#9CA3AF",
    fontSize: 11,
    lineHeight: 1.4,
  },

  twoCols: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    gap: 10,
  },

  colorRow: {
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    gap: 8,
  },

  colorInput: {
    width: 44,
    height: 40,
    padding: 3,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    cursor: "pointer",
  },

  checkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  checkCard: {
    minHeight: 40,
    padding: "0 11px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#374151",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  primaryButton: {
    height: 42,
    borderRadius: 11,
    border: "1px solid rgba(239,159,39,0.28)",
    background: ORANGE,
    color: "#1A0D00",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 850,
  },

  secondaryButton: {
    height: 38,
    padding: "0 13px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 750,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#6B7280",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  countBadge: {
    minWidth: 34,
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "rgba(239,159,39,0.1)",
    color: ORANGE,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
  },

  loading: {
    minHeight: 160,
    color: "#6B7280",
    display: "grid",
    placeItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 750,
  },

  empty: {
    padding: 20,
    borderRadius: 12,
    background: "#F9FAFB",
    color: "#6B7280",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },

  list: {
    display: "grid",
    gap: 10,
  },

  statusRow: {
    display: "grid",
    gridTemplateColumns: "10px minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 13,
    border: "1px solid #EEF2F7",
    background: "#FFFFFF",
  },

  statusColor: {
    width: 10,
    height: 42,
    borderRadius: 999,
  },

  statusMain: {
    minWidth: 0,
  },

  statusTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  statusLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: 850,
  },

  defaultBadge: {
    padding: "3px 7px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.1)",
    color: "#15803D",
    fontSize: 10,
    fontWeight: 900,
  },

  statusKey: {
    display: "block",
    marginTop: 3,
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
  },

  statusDescription: {
    margin: "5px 0 0",
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 1.45,
  },

  statusMeta: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },

  orderBadge: {
    minWidth: 34,
    height: 28,
    padding: "0 8px",
    borderRadius: 999,
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    color: "#6B7280",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 850,
  },

  rowButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#374151",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  dangerButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#DC2626",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  inactiveSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid #F1F5F9",
  },

  inactiveTitle: {
    margin: "0 0 10px",
    color: "#6B7280",
    fontSize: 12,
    fontWeight: 850,
  },
};