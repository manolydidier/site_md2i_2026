// src/app/components/email-marketing/CampaignsList.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCampaigns, useCampaignStatus } from "@/app/hooks/useEmailMarketing";
import type { Campaign } from "@/app/types/email-marketing";

import {
  AlertCircle,
  BarChart2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  FileEdit,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";

import styles from "./CampaignsList.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignsListProps {
  onNew: () => void;
  onEdit: (campaign: Campaign) => void;
}

type StatusKey = "DRAFT" | "SENDING" | "SENT" | "FAILED" | "SCHEDULED";

type CampaignStatusConfig = {
  label: string;
  icon: ReactNode;
  className: string;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<StatusKey, CampaignStatusConfig> = {
  DRAFT: {
    label: "Brouillon",
    icon: <FileEdit size={13} />,
    className: styles.statusDraft,
  },
  SENDING: {
    label: "En cours",
    icon: <Loader2 size={13} className={styles.spin} />,
    className: styles.statusSending,
  },
  SENT: {
    label: "Envoyée",
    icon: <CheckCircle size={13} />,
    className: styles.statusSent,
  },
  FAILED: {
    label: "Échouée",
    icon: <AlertCircle size={13} />,
    className: styles.statusFailed,
  },
  SCHEDULED: {
    label: "Planifiée",
    icon: <Clock size={13} />,
    className: styles.statusScheduled,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string | Date | null, withLabel?: string) {
  if (!value) return null;
  const formatted = new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { formatted, label: withLabel };
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function CampaignsList({ onNew, onEdit }: CampaignsListProps) {
  const {
    campaigns,
    total,
    loading,
    page,
    setPage,
    refetch,
    deleteCampaign,
    duplicateCampaign,
  } = useCampaigns();

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const hasCampaigns = campaigns.length > 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSend = async (campaign: Campaign) => {
    const target = campaign.group?.name ?? "les destinataires de la campagne";
    const confirmed = confirm(
      `Envoyer définitivement « ${campaign.name} » à ${target} ?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur pendant l'envoi.");
        return;
      }

      setSendingId(campaign.id);
      refetch();
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    const confirmed = confirm(`Supprimer « ${campaign.name} » ?`);
    if (!confirmed) return;
    await deleteCampaign(campaign.id);
    refetch();
  };

  const handleDuplicate = async (campaign: Campaign) => {
    await duplicateCampaign(campaign.id);
    refetch();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <section className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Email marketing</span>
          <h2 className={styles.title}>Campagnes</h2>
          <p className={styles.description}>
            Créez, modifiez, prévisualisez et envoyez vos campagnes email.
          </p>
        </div>

        <button type="button" onClick={onNew} className={styles.primaryButton}>
          <Plus size={15} />
          Nouvelle campagne
        </button>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.count}>
          <strong>{total}</strong>
          <span>{total > 1 ? "campagnes" : "campagne"}</span>
        </div>

        {hasCampaigns && (
          <button
            type="button"
            onClick={refetch}
            className={styles.secondaryButton}
          >
            <RefreshCw size={13} />
            Actualiser
          </button>
        )}
      </div>

      {/* Table panel */}
      <div className={styles.panel}>
        {loading ? (
          <LoadingState />
        ) : !hasCampaigns ? (
          <EmptyState onNew={onNew} />
        ) : (
          <>
            <div className={styles.tableHead}>
              <span>Campagne</span>
              <span>Groupe</span>
              <span>Statut</span>
              <span>Résultat</span>
              <span>Date</span>
              <span className={styles.actionsHead}>Actions</span>
            </div>

            <div className={styles.rows}>
              {campaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  isSending={sendingId === campaign.id}
                  onEdit={() => onEdit(campaign)}
                  onDelete={() => handleDelete(campaign)}
                  onDuplicate={() => handleDuplicate(campaign)}
                  onSend={() => handleSend(campaign)}
                  onPreview={() => setPreviewCampaign(campaign)}
                  onStats={() =>
                    setStatsId((curr) =>
                      curr === campaign.id ? null : campaign.id
                    )
                  }
                  showStats={statsId === campaign.id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrevious={() => setPage(Math.max(1, page - 1))}
          onNext={() => setPage(Math.min(totalPages, page + 1))}
        />
      )}

      {/* Preview modal */}
      {previewCampaign && (
        <PreviewModal
          campaign={previewCampaign}
          onClose={() => setPreviewCampaign(null)}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className={styles.state}>
      <Loader2 size={28} className={cn(styles.spin, styles.stateIconMuted)} />
      <h3>Chargement des campagnes…</h3>
      <p>Veuillez patienter pendant la récupération des données.</p>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className={styles.state}>
      <div className={styles.emptyIcon}>
        <FileEdit size={26} />
      </div>
      <h3>Aucune campagne</h3>
      <p>Créez votre première campagne pour commencer.</p>
      <button type="button" onClick={onNew} className={styles.primaryButton}>
        <Plus size={15} />
        Nouvelle campagne
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CampaignRow
// ---------------------------------------------------------------------------

interface CampaignRowProps {
  campaign: Campaign;
  isSending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSend: () => void;
  onPreview: () => void;
  onStats: () => void;
  showStats: boolean;
}

function CampaignRow({
  campaign,
  isSending,
  onEdit,
  onDelete,
  onDuplicate,
  onSend,
  onPreview,
  onStats,
  showStats,
}: CampaignRowProps) {
  const isActivelySending = isSending || campaign.status === "SENDING";
  const status = useCampaignStatus(campaign.id, isActivelySending);

  const progress = status?.progress ?? 0;
  const displayStatus: StatusKey =
    isActivelySending && status
      ? "SENDING"
      : (campaign.status as StatusKey);

  const displayConfig = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.DRAFT;

  const sentCount = status?.sentCount ?? campaign.sentCount ?? 0;
  const failedCount = status?.failedCount ?? campaign.failedCount ?? 0;

  const canEdit = campaign.status === "DRAFT" || campaign.status === "FAILED";
  const canSend = campaign.status === "DRAFT" || campaign.status === "FAILED";
  const canDelete = campaign.status !== "SENDING";
  const canShowStats = campaign.status === "SENT";

  // Date display: prefer sentAt, fall back to createdAt
  const dateInfo = campaign.sentAt
    ? formatDate(campaign.sentAt, "Envoyée")
    : formatDate(campaign.createdAt, "Créée");

  return (
    <article className={styles.rowWrap}>
      <div className={styles.row}>
        {/* Campaign name + subject */}
        <div className={styles.campaignMain}>
          <div className={styles.campaignIcon}>
            <Mail size={17} />
          </div>
          <div className={styles.campaignText}>
            <h3>{campaign.name}</h3>
            <p>{campaign.subject || "Sujet non renseigné"}</p>
          </div>
        </div>

        {/* Group badge */}
        <div className={styles.groupCell}>
          {campaign.group ? (
            <span className={styles.groupBadge}>{campaign.group.name}</span>
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </div>

        {/* Status + progress */}
        <div className={styles.statusCell}>
          <span className={cn(styles.status, displayConfig.className)}>
            {displayConfig.icon}
            {displayConfig.label}
          </span>

          {isActivelySending && status && (
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <small>{progress}%</small>
            </div>
          )}
        </div>

        {/* Sent / failed counts */}
        <div className={styles.resultCell}>
          {campaign.status === "SENT" || campaign.status === "SENDING" ? (
            <>
              <strong>{sentCount.toLocaleString("fr-FR")}</strong>
              <span>envoyés</span>
              {failedCount > 0 && <small>{failedCount} échec(s)</small>}
            </>
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </div>

        {/* Date */}
        <div className={styles.dateCell}>
          {dateInfo ? (
            <>
              <span>{dateInfo.formatted}</span>
              {dateInfo.label && (
                <span className={styles.dateLabel}>{dateInfo.label}</span>
              )}
            </>
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <ActionButton label="Prévisualiser" onClick={onPreview}>
            <Eye size={15} />
          </ActionButton>

          {canShowStats && (
            <ActionButton label="Statistiques" onClick={onStats}>
              <BarChart2 size={15} />
            </ActionButton>
          )}

          {canEdit && (
            <ActionButton label="Modifier" onClick={onEdit}>
              <FileEdit size={15} />
            </ActionButton>
          )}

          {canSend && (
            <ActionButton
              label="Envoyer"
              onClick={onSend}
              disabled={isActivelySending}
            >
              {isActivelySending ? (
                <Loader2 size={15} className={styles.spin} />
              ) : (
                <Send size={15} />
              )}
            </ActionButton>
          )}

          <ActionButton label="Dupliquer" onClick={onDuplicate}>
            <Copy size={15} />
          </ActionButton>

          {canDelete && (
            <ActionButton label="Supprimer" onClick={onDelete} danger>
              <Trash2 size={15} />
            </ActionButton>
          )}
        </div>
      </div>

      {/* Expandable stats panel */}
      {showStats && canShowStats && (
        <div className={styles.statsContainer}>
          <CampaignStats campaignId={campaign.id} />
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// ActionButton
// ---------------------------------------------------------------------------

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        styles.actionButton,
        danger && styles.actionButtonDanger
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <footer className={styles.pagination}>
      <p>
        Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
      </p>
      <div className={styles.paginationActions}>
        <button
          type="button"
          onClick={onPrevious}
          disabled={page === 1}
          className={styles.pageButton}
          aria-label="Page précédente"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page === totalPages}
          className={styles.pageButton}
          aria-label="Page suivante"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// PreviewModal
// ---------------------------------------------------------------------------

function PreviewModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={styles.previewBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.previewModal} role="dialog" aria-modal="true">
        <header className={styles.previewHeader}>
          <div>
            <h3>{campaign.name}</h3>
            <p>Sujet : {campaign.subject || "Non renseigné"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fermer la prévisualisation"
          >
            <X size={15} />
          </button>
        </header>

        <iframe
          srcDoc={campaign.htmlContent}
          className={styles.previewFrame}
          sandbox="allow-same-origin"
          title={`Prévisualisation de ${campaign.name}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CampaignStats
// ---------------------------------------------------------------------------

type LogEntry = {
  email: string;
  status: string;
  message?: string;
  createdAt: string;
};

function CampaignStats({ campaignId }: { campaignId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setLogs(data.logs ?? []);
        setLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setLogs([]);
        setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const stats = useMemo(() => {
    const sent = logs.filter((l) => l.status?.toLowerCase() === "sent").length;
    return { sent, failed: logs.length - sent, total: logs.length };
  }, [logs]);

  if (!loaded) {
    return (
      <div className={styles.statsLoading}>
        <Loader2 size={14} className={styles.spin} />
        Chargement du journal…
      </div>
    );
  }

  return (
    <div className={styles.statsBox}>
      <header className={styles.statsHeader}>
        <h4>Journal d&apos;envoi</h4>
        <p>
          {stats.total} entrée(s) — {stats.sent} envoyé(s),{" "}
          {stats.failed} échec(s)
        </p>
      </header>

      <div className={styles.statsList}>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>Aucun log disponible.</p>
        ) : (
          logs.map((log, i) => {
            const isSent = log.status?.toLowerCase() === "sent";
            return (
              <div key={`${log.email}-${i}`} className={styles.statsItem}>
                <span
                  className={cn(
                    styles.statusDot,
                    isSent ? styles.statusDotSent : styles.statusDotFailed
                  )}
                />
                <span className={styles.statsEmail}>{log.email}</span>
                <span className={isSent ? styles.sentText : styles.failedText}>
                  {log.status}
                </span>
                <span className={styles.statsMessage}>
                  {log.message || "—"}
                </span>
                <span className={styles.statsTime}>
                  {new Date(log.createdAt).toLocaleTimeString("fr-FR")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}