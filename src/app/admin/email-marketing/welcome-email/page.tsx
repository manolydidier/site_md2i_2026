"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/(permisionGuard)/context/PermissionsContext";
import {
  Mail,
  Save,
  RotateCcw,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCcw,
} from "lucide-react";

type DelayUnit = "MINUTES" | "HOURS" | "DAYS";

type DraftCampaign = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  status: "DRAFT";
  updatedAt: string;
};

type WelcomeConfig = {
  isActive: boolean;
  delayValue: number;
  delayUnit: DelayUnit;
  selectedCampaignId: string | null;
  selectedCampaign: DraftCampaign | null;
};

const DEFAULT_CONFIG: WelcomeConfig = {
  isActive: false,
  delayValue: 0,
  delayUnit: "MINUTES",
  selectedCampaignId: null,
  selectedCampaign: null,
};

function cleanEmailHtml(html: string) {
  return html
    .replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/@import[^;]+;/gi, "");
}

function renderPreview(template: string) {
  return cleanEmailHtml(template || "")
    .replaceAll("{{firstName}}", "Manou")
    .replaceAll("{{lastName}}", "Ravelojaona")
    .replaceAll("{{fullName}}", "Manou Ravelojaona")
    .replaceAll("{{contactName}}", "Manou Ravelojaona")
    .replaceAll("{{email}}", "manou@example.com")
    .replaceAll("{{phone}}", "+261 34 00 000 00")
    .replaceAll("{{companyName}}", "Entreprise Test")
    .replaceAll("{{city}}", "Antananarivo")
    .replaceAll("{{country}}", "Madagascar");
}

function getDelayLabel(delayValue: number, delayUnit: DelayUnit) {
  if (delayValue === 0) {
    return "Envoyé immédiatement après la création du contact";
  }

  const unitLabels: Record<DelayUnit, string> = {
    MINUTES: delayValue > 1 ? "minutes" : "minute",
    HOURS: delayValue > 1 ? "heures" : "heure",
    DAYS: delayValue > 1 ? "jours" : "jour",
  };

  return `Envoyé ${delayValue} ${unitLabels[delayUnit]} après la création du contact`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function WelcomeEmailAutomationPage() {
  const { can } = usePermissions();
  const canUpdate = can("email_automations", "canUpdate");

  const [config, setConfig] = useState<WelcomeConfig>(DEFAULT_CONFIG);
  const [initialConfig, setInitialConfig] =
    useState<WelcomeConfig>(DEFAULT_CONFIG);

  const [draftCampaigns, setDraftCampaigns] = useState<DraftCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedCampaign = useMemo(() => {
    return (
      draftCampaigns.find(
        (campaign) => campaign.id === config.selectedCampaignId
      ) ||
      config.selectedCampaign ||
      null
    );
  }, [draftCampaigns, config.selectedCampaignId, config.selectedCampaign]);

  const hasChanges = useMemo(() => {
    return (
      config.isActive !== initialConfig.isActive ||
      config.delayValue !== initialConfig.delayValue ||
      config.delayUnit !== initialConfig.delayUnit ||
      config.selectedCampaignId !== initialConfig.selectedCampaignId
    );
  }, [config, initialConfig]);

  const isInvalidActiveConfig = config.isActive && !config.selectedCampaignId;

  const delayLabel = useMemo(() => {
    return getDelayLabel(config.delayValue, config.delayUnit);
  }, [config.delayValue, config.delayUnit]);

  const previewSubject = selectedCampaign
    ? renderPreview(selectedCampaign.subject)
    : "Aucune campagne sélectionnée";

  const previewContent = selectedCampaign
    ? renderPreview(selectedCampaign.htmlContent)
    : "<p>Choisissez une campagne brouillon pour voir l’aperçu.</p>";

  const loadWelcomeConfig = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/email-automations/welcome", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger le paramétrage.");
      }

      const nextConfig: WelcomeConfig = {
        isActive: Boolean(data.automation?.isActive),
        delayValue: Number(data.automation?.delayValue || 0),
        delayUnit: data.automation?.delayUnit || "MINUTES",
        selectedCampaignId: data.automation?.selectedCampaignId || null,
        selectedCampaign: data.automation?.selectedCampaign || null,
      };

      setConfig(nextConfig);
      setInitialConfig(nextConfig);
      setDraftCampaigns(data.draftCampaigns || []);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erreur lors du chargement.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWelcomeConfig();
  }, []);

  const updateConfig = <K extends keyof WelcomeConfig>(
    key: K,
    value: WelcomeConfig[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setMessage(null);
  };

  const handleSave = async () => {
    if (isInvalidActiveConfig) {
      setMessage({
        type: "error",
        text: "Choisissez une campagne brouillon avant d’activer l’automatisation.",
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/email-automations/welcome", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: config.selectedCampaignId,
          delayValue: config.delayValue,
          delayUnit: config.delayUnit,
          isActive: config.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde.");
      }

      const nextConfig: WelcomeConfig = {
        isActive: Boolean(data.automation?.isActive),
        delayValue: Number(data.automation?.delayValue || 0),
        delayUnit: data.automation?.delayUnit || "MINUTES",
        selectedCampaignId: data.automation?.selectedCampaignId || null,
        selectedCampaign: data.automation?.selectedCampaign || null,
      };

      setConfig(nextConfig);
      setInitialConfig(nextConfig);

      setMessage({
        type: "success",
        text: "Paramétrage de l’email de bienvenue sauvegardé.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erreur lors de la sauvegarde.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingCard}>Chargement du paramétrage...</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.breadcrumb}>
            <span style={s.breadcrumbAccent}>Email Marketing</span>
            <span style={s.slash}>/</span>
            <span>Email de bienvenue</span>
          </div>

          <div style={s.titleRow}>
            <div style={s.iconBadge}>
              <Mail size={22} />
            </div>

            <div>
              <h1 style={s.title}>Email de bienvenue</h1>
              <p style={s.subtitle}>
                Choisissez une campagne brouillon à envoyer automatiquement aux
                nouveaux contacts.
              </p>
            </div>
          </div>
        </div>

        <div style={s.headerActions}>
          <a href="/admin/email-marketing" style={s.secondaryLink}>
            <ArrowLeft size={16} />
            Retour
          </a>

          <button
            type="button"
            onClick={loadWelcomeConfig}
            disabled={saving}
            style={{
              ...s.button,
              ...s.secondaryButton,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <RefreshCcw size={16} />
            Recharger
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            style={{
              ...s.button,
              ...s.secondaryButton,
              opacity: !hasChanges || saving ? 0.5 : 1,
            }}
          >
            <RotateCcw size={16} />
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canUpdate || !hasChanges || saving || isInvalidActiveConfig}
            style={{
              ...s.button,
              ...s.primaryButton,
              opacity:
                !hasChanges || saving || isInvalidActiveConfig ? 0.5 : 1,
            }}
          >
            <Save size={16} />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </header>

      {message && (
        <div
          style={{
            ...s.message,
            ...(message.type === "success" ? s.messageSuccess : s.messageError),
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}
          {message.text}
        </div>
      )}

      {isInvalidActiveConfig && (
        <div style={{ ...s.message, ...s.messageError }}>
          <AlertCircle size={17} />
          L’automatisation est active, mais aucune campagne n’est sélectionnée.
        </div>
      )}

      <main style={s.grid}>
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h2 style={s.cardTitle}>Paramétrage</h2>
              <p style={s.cardSubtitle}>
                Cette automatisation utilise le déclencheur CONTACT_CREATED.
              </p>
            </div>
          </div>

          <div style={s.statusSummary}>
            <div>
              <span style={s.statusLabel}>État actuel</span>
              <strong
                style={{
                  color: config.isActive ? "#166534" : "#991B1B",
                }}
              >
                {config.isActive ? "Active" : "Inactive"}
              </strong>
            </div>

            <div>
              <span style={s.statusLabel}>Campagne</span>
              <strong>{selectedCampaign ? selectedCampaign.name : "Non définie"}</strong>
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Statut</label>

            <button
              type="button"
              onClick={() => updateConfig("isActive", !config.isActive)}
              style={{
                ...s.statusToggle,
                ...(config.isActive ? s.statusActive : s.statusInactive),
              }}
            >
              {config.isActive
                ? "Automatisation active"
                : "Automatisation inactive"}
            </button>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Campagne à utiliser</label>

            <select
              value={config.selectedCampaignId || ""}
              onChange={(e) =>
                updateConfig("selectedCampaignId", e.target.value || null)
              }
              style={s.select}
            >
              <option value="">Choisir une campagne brouillon</option>

              {draftCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} — {campaign.subject}
                </option>
              ))}
            </select>

            <p style={s.helpTextPlain}>
              Seules les campagnes avec le statut brouillon sont disponibles.
              Le contenu de cette campagne sera utilisé pour l’email de
              bienvenue.
            </p>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Délai d’envoi</label>

            <div style={s.delayRow}>
              <input
                type="number"
                min={0}
                value={config.delayValue}
                onChange={(e) =>
                  updateConfig(
                    "delayValue",
                    Math.max(0, Number(e.target.value))
                  )
                }
                style={s.input}
              />

              <select
                value={config.delayUnit}
                onChange={(e) =>
                  updateConfig("delayUnit", e.target.value as DelayUnit)
                }
                style={s.select}
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Heures</option>
                <option value="DAYS">Jours</option>
              </select>
            </div>

            <div style={s.helpText}>
              <Clock size={14} />
              {delayLabel}
            </div>
          </div>

          {selectedCampaign && (
            <div style={s.selectedBox}>
              <strong>Campagne sélectionnée</strong>
              <span>Nom : {selectedCampaign.name}</span>
              <span>Sujet : {selectedCampaign.subject}</span>
              <span>
                Expéditeur campagne : {selectedCampaign.fromName} &lt;
                {selectedCampaign.fromEmail}&gt;
              </span>
              <span>
                Reply-to : {selectedCampaign.replyTo || "Non défini"}
              </span>
              <span>
                Dernière modification : {formatDate(selectedCampaign.updatedAt)}
              </span>
            </div>
          )}

          {draftCampaigns.length === 0 && (
            <div style={s.warningBox}>
              Aucune campagne brouillon disponible. Crée d’abord une campagne
              brouillon nommée par exemple “Email de bienvenue”.
            </div>
          )}

          <div style={s.infoBox}>
            <strong>Important</strong>
            <p>
              Pour que l’email parte directement après la création d’un contact,
              le délai doit être réglé sur <strong>0 MINUTES</strong>. Les
              délais futurs seront envoyés par le cron.
            </p>
          </div>
        </section>

        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h2 style={s.cardTitle}>Aperçu</h2>
              <p style={s.cardSubtitle}>
                L’aperçu utilise des données fictives de contact.
              </p>
            </div>

            <div style={s.previewIcon}>
              <Eye size={18} />
            </div>
          </div>

          <div style={s.previewMeta}>
            <span>À : manou@example.com</span>
            <span>{delayLabel}</span>
            <span>
              Expéditeur :{" "}
              {selectedCampaign
                ? `${selectedCampaign.fromName} <${selectedCampaign.fromEmail}>`
                : "Non défini"}
            </span>
          </div>

          <div style={s.previewEmail}>
            <div style={s.previewSubject}>{previewSubject}</div>

            <div
              style={s.previewBody}
              dangerouslySetInnerHTML={{
                __html: previewContent,
              }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239,159,39,0.1)";
const ORANGE_BORDER = "rgba(239,159,39,0.25)";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT_TEXT = "#9CA3AF";

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    padding: 32,
    boxSizing: "border-box",
  },

  loadingCard: {
    padding: 24,
    borderRadius: 16,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: 14,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    marginBottom: 22,
    flexWrap: "wrap",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    color: MUTED,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  breadcrumbAccent: {
    color: ORANGE,
  },

  slash: {
    color: SOFT_TEXT,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: "5px 0 0",
    color: MUTED,
    fontSize: 14,
  },

  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  button: {
    height: 40,
    padding: "0 15px",
    borderRadius: 11,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  primaryButton: {
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
  },

  secondaryButton: {
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
  },

  secondaryLink: {
    height: 40,
    padding: "0 15px",
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },

  message: {
    marginBottom: 18,
    padding: "12px 14px",
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
  },

  messageSuccess: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },

  messageError: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(380px, 0.9fr)",
    gap: 20,
    alignItems: "start",
  },

  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    padding: 20,
    boxSizing: "border-box",
  },

  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },

  cardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: MUTED,
    fontSize: 13,
  },

  statusSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },

  statusLabel: {
    display: "block",
    marginBottom: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: 700,
  },

  fieldGroup: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    marginBottom: 7,
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
  },

  input: {
    width: "100%",
    height: 42,
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    padding: "0 12px",
    fontSize: 14,
    color: TEXT,
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    height: 42,
    borderRadius: 11,
    border: `1px solid ${BORDER}`,
    padding: "0 12px",
    fontSize: 14,
    color: TEXT,
    background: SURFACE,
    outline: "none",
    boxSizing: "border-box",
  },

  delayRow: {
    display: "grid",
    gridTemplateColumns: "130px 1fr",
    gap: 10,
  },

  helpText: {
    marginTop: 8,
    color: MUTED,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
  },

  helpTextPlain: {
    margin: "8px 0 0",
    color: MUTED,
    fontSize: 13,
  },

  statusToggle: {
    height: 40,
    padding: "0 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },

  statusActive: {
    border: "1px solid #BBF7D0",
    background: "#DCFCE7",
    color: "#166534",
  },

  statusInactive: {
    border: "1px solid #FECACA",
    background: "#FEE2E2",
    color: "#991B1B",
  },

  selectedBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE_SOFT,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#92400e",
    fontSize: 13,
  },

  warningBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #FDE68A",
    background: "#FEF3C7",
    color: "#92400E",
    fontSize: 13,
    fontWeight: 700,
  },

  infoBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #DBEAFE",
    background: "#EFF6FF",
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 1.6,
  },

  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: ORANGE_SOFT,
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  previewMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 14,
    color: MUTED,
    fontSize: 13,
  },

  previewEmail: {
    border: `1px solid ${BORDER}`,
    borderRadius: 15,
    overflow: "hidden",
    background: "#FFFFFF",
  },

  previewSubject: {
    padding: 15,
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 15,
    fontWeight: 800,
    color: TEXT,
    background: "#F9FAFB",
  },

  previewBody: {
    padding: 18,
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.7,
  },
};