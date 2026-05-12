// src/app/components/email-marketing/CampaignsList.tsx
"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
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
  AlertTriangle,
  Rocket,
  Users,
  TrendingUp,
  XCircle,
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

// Popup d'envoi : confirmation → sending → done/error
type SendPopupState =
  | { phase: "idle" }
  | { phase: "confirm"; campaign: Campaign }
  | { phase: "sending"; campaign: Campaign }
  | { phase: "success"; campaign: Campaign; sentCount: number; failedCount: number }
  | { phase: "error"; campaign: Campaign; message: string };

// Popup suppression
type DeletePopupState =
  | { phase: "idle" }
  | { phase: "confirm"; campaign: Campaign };

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

  const [sendPopup, setSendPopup] = useState<SendPopupState>({ phase: "idle" });
  const [deletePopup, setDeletePopup] = useState<DeletePopupState>({ phase: "idle" });
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const hasCampaigns = campaigns.length > 0;

  // -------------------------------------------------------------------------
  // Polling status quand en phase sending
  // -------------------------------------------------------------------------
  const sendingCampaignId =
    sendPopup.phase === "sending" ? sendPopup.campaign.id : null;
  const pollStatus = useCampaignStatus(sendingCampaignId, sendPopup.phase === "sending");

  // Quand le poll indique que c'est terminé → passer à success ou error
  useEffect(() => {
    if (sendPopup.phase !== "sending" || !pollStatus) return;

    if (pollStatus.status === "SENT") {
      setSendPopup({
        phase: "success",
        campaign: sendPopup.campaign,
        sentCount: pollStatus.sentCount,
        failedCount: pollStatus.failedCount,
      });
      refetch();
    } else if (pollStatus.status === "FAILED") {
      setSendPopup({
        phase: "error",
        campaign: sendPopup.campaign,
        message: "L'envoi a échoué. Vérifiez vos paramètres SMTP et réessayez.",
      });
      refetch();
    }
  }, [pollStatus, sendPopup, refetch]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSendRequest = useCallback((campaign: Campaign) => {
    setSendPopup({ phase: "confirm", campaign });
  }, []);

  const handleSendConfirm = useCallback(async () => {
    if (sendPopup.phase !== "confirm") return;
    const { campaign } = sendPopup;

    setSendPopup({ phase: "sending", campaign });

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSendPopup({
          phase: "error",
          campaign,
          message: data.error || "Une erreur est survenue lors du démarrage de l'envoi.",
        });
      }
      // Si OK → le polling prend le relais via useCampaignStatus
    } catch {
      setSendPopup({
        phase: "error",
        campaign,
        message: "Erreur réseau. Vérifiez votre connexion et réessayez.",
      });
    }
  }, [sendPopup]);

  const handleSendCancel = useCallback(() => {
    setSendPopup({ phase: "idle" });
  }, []);

  const handleDeleteRequest = useCallback((campaign: Campaign) => {
    setDeletePopup({ phase: "confirm", campaign });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deletePopup.phase !== "confirm") return;
    await deleteCampaign(deletePopup.campaign.id);
    setDeletePopup({ phase: "idle" });
    refetch();
  }, [deletePopup, deleteCampaign, refetch]);

  const handleDuplicate = useCallback(async (campaign: Campaign) => {
    await duplicateCampaign(campaign.id);
    refetch();
  }, [duplicateCampaign, refetch]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isSendingCampaignId =
    sendPopup.phase === "sending" ? sendPopup.campaign.id : null;

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
          <button type="button" onClick={refetch} className={styles.secondaryButton}>
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
                  isSending={isSendingCampaignId === campaign.id}
                  sendProgress={
                    isSendingCampaignId === campaign.id ? pollStatus : null
                  }
                  onEdit={() => onEdit(campaign)}
                  onDelete={() => handleDeleteRequest(campaign)}
                  onDuplicate={() => handleDuplicate(campaign)}
                  onSend={() => handleSendRequest(campaign)}
                  onPreview={() => setPreviewCampaign(campaign)}
                  onStats={() =>
                    setStatsId((curr) => (curr === campaign.id ? null : campaign.id))
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

      {/* ── SEND POPUP ── */}
      {sendPopup.phase !== "idle" && (
        <SendPopup
          state={sendPopup}
          pollStatus={pollStatus}
          onConfirm={handleSendConfirm}
          onCancel={handleSendCancel}
          onClose={() => setSendPopup({ phase: "idle" })}
        />
      )}

      {/* ── DELETE POPUP ── */}
      {deletePopup.phase === "confirm" && (
        <DeletePopup
          campaign={deletePopup.campaign}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletePopup({ phase: "idle" })}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// SendPopup — confirmation → loading → résultat
// ---------------------------------------------------------------------------

interface SendPopupProps {
  state: SendPopupState;
  pollStatus: ReturnType<typeof useCampaignStatus>;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function SendPopup({ state, pollStatus, onConfirm, onCancel, onClose }: SendPopupProps) {
  // Fermer sur Escape (sauf pendant l'envoi)
  useEffect(() => {
    if (state.phase === "sending") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state.phase === "confirm") onCancel();
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [state.phase, onCancel, onClose]);

  const progress = pollStatus?.progress ?? 0;
  const sentCount = pollStatus?.sentCount ?? 0;
  const failedCount = pollStatus?.failedCount ?? 0;
  const totalRecipients = pollStatus?.totalRecipients ?? 0;

  return (
    <div
      className={styles.popupBackdrop}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (state.phase === "sending") return;
        if (state.phase === "confirm") onCancel();
        else onClose();
      }}
    >
      <div className={styles.popupCard} role="dialog" aria-modal="true">

        {/* ── CONFIRM ── */}
        {state.phase === "confirm" && (
          <>
            <div className={styles.popupIconWrap} data-color="orange">
              <Rocket size={26} />
            </div>
            <h3 className={styles.popupTitle}>Confirmer l&apos;envoi</h3>
            <p className={styles.popupSubtitle}>
              Vous êtes sur le point d&apos;envoyer{" "}
              <strong>« {state.campaign.name} »</strong>
              {state.campaign.group && (
                <>
                  {" "}au groupe{" "}
                  <strong>{state.campaign.group.name}</strong>
                </>
              )}.
            </p>

            <div className={styles.popupInfoRow}>
              <div className={styles.popupInfoItem}>
                <Mail size={14} />
                <span>Sujet : <strong>{state.campaign.subject || "—"}</strong></span>
              </div>
              {state.campaign.group && (
                <div className={styles.popupInfoItem}>
                  <Users size={14} />
                  <span>Destinataires : groupe <strong>{state.campaign.group.name}</strong></span>
                </div>
              )}
            </div>

            <p className={styles.popupWarning}>
              <AlertTriangle size={13} />
              Cette action est irréversible. Les emails seront envoyés immédiatement.
            </p>

            <div className={styles.popupActions}>
              <button
                type="button"
                onClick={onCancel}
                className={styles.popupCancelBtn}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={styles.popupConfirmBtn}
              >
                <Send size={15} />
                Lancer l&apos;envoi
              </button>
            </div>
          </>
        )}

        {/* ── SENDING ── */}
        {state.phase === "sending" && (
          <>
            <div className={styles.popupIconWrap} data-color="blue">
              <Loader2 size={26} className={styles.spin} />
            </div>
            <h3 className={styles.popupTitle}>Envoi en cours…</h3>
            <p className={styles.popupSubtitle}>
              <strong>« {state.campaign.name} »</strong> est en cours d&apos;envoi.
              Ne fermez pas cette fenêtre.
            </p>

            {/* Barre de progression */}
            <div className={styles.sendingProgressWrap}>
              <div className={styles.sendingProgressTrack}>
                <div
                  className={styles.sendingProgressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.sendingProgressMeta}>
                <span className={styles.sendingProgressPct}>{progress}%</span>
                {totalRecipients > 0 && (
                  <span className={styles.sendingProgressCount}>
                    {sentCount + failedCount} / {totalRecipients} traités
                  </span>
                )}
              </div>
            </div>

            {/* Stats en temps réel */}
            {totalRecipients > 0 && (
              <div className={styles.sendingStats}>
                <div className={styles.sendingStatItem} data-type="sent">
                  <CheckCircle size={14} />
                  <strong>{sentCount}</strong>
                  <span>envoyés</span>
                </div>
                {failedCount > 0 && (
                  <div className={styles.sendingStatItem} data-type="failed">
                    <XCircle size={14} />
                    <strong>{failedCount}</strong>
                    <span>échecs</span>
                  </div>
                )}
                <div className={styles.sendingStatItem} data-type="total">
                  <Users size={14} />
                  <strong>{totalRecipients}</strong>
                  <span>destinataires</span>
                </div>
              </div>
            )}

            <p className={styles.sendingNote}>
              L&apos;envoi continue en arrière-plan même si vous fermez cette fenêtre.
            </p>

            <button
              type="button"
              onClick={onClose}
              className={styles.popupCancelBtn}
              style={{ marginTop: "4px" }}
            >
              Fermer et continuer en arrière-plan
            </button>
          </>
        )}

        {/* ── SUCCESS ── */}
        {state.phase === "success" && (
          <>
            <div className={styles.popupIconWrap} data-color="green">
              <CheckCircle size={26} />
            </div>
            <h3 className={styles.popupTitle}>Envoi terminé !</h3>
            <p className={styles.popupSubtitle}>
              La campagne <strong>« {state.campaign.name} »</strong> a été envoyée avec succès.
            </p>

            <div className={styles.successStats}>
              <div className={styles.successStatItem}>
                <TrendingUp size={18} className={styles.successStatIcon} />
                <strong>{state.sentCount.toLocaleString("fr-FR")}</strong>
                <span>emails envoyés</span>
              </div>
              {state.failedCount > 0 && (
                <div className={styles.successStatItem} data-failed>
                  <AlertCircle size={18} className={styles.failedStatIcon} />
                  <strong>{state.failedCount}</strong>
                  <span>échecs</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={styles.popupConfirmBtn}
              data-success
            >
              <CheckCircle size={15} />
              Parfait, fermer
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {state.phase === "error" && (
          <>
            <div className={styles.popupIconWrap} data-color="red">
              <AlertCircle size={26} />
            </div>
            <h3 className={styles.popupTitle}>Erreur d&apos;envoi</h3>
            <p className={styles.popupSubtitle}>
              L&apos;envoi de <strong>« {state.campaign.name} »</strong> a échoué.
            </p>

            <div className={styles.errorBox}>
              <AlertTriangle size={13} />
              <span>{state.message}</span>
            </div>

            <div className={styles.popupActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.popupCancelBtn}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(styles.popupConfirmBtn, styles.popupConfirmBtnRed)}
              >
                Réessayer plus tard
              </button>
            </div>
          </>
        )}

        {/* Bouton X en haut à droite (sauf pendant sending) */}
        {state.phase !== "sending" && (
          <button
            type="button"
            className={styles.popupClose}
            onClick={state.phase === "confirm" ? onCancel : onClose}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeletePopup
// ---------------------------------------------------------------------------

function DeletePopup({
  campaign,
  onConfirm,
  onCancel,
}: {
  campaign: Campaign;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className={styles.popupBackdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.popupCard} role="dialog" aria-modal="true">
        <button
          type="button"
          className={styles.popupClose}
          onClick={onCancel}
          aria-label="Fermer"
        >
          <X size={14} />
        </button>

        <div className={styles.popupIconWrap} data-color="red">
          <Trash2 size={26} />
        </div>
        <h3 className={styles.popupTitle}>Supprimer la campagne</h3>
        <p className={styles.popupSubtitle}>
          Êtes-vous sûr de vouloir supprimer <strong>« {campaign.name} »</strong> ?
          Cette action est définitive.
        </p>

        <div className={styles.popupActions}>
          <button type="button" onClick={onCancel} className={styles.popupCancelBtn}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(styles.popupConfirmBtn, styles.popupConfirmBtnRed)}
          >
            <Trash2 size={15} />
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (inchangés dans leur logique)
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
  sendProgress: ReturnType<typeof useCampaignStatus>;
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
  sendProgress,
  onEdit,
  onDelete,
  onDuplicate,
  onSend,
  onPreview,
  onStats,
  showStats,
}: CampaignRowProps) {
  const isActivelySending = isSending || campaign.status === "SENDING";
  const progress = sendProgress?.progress ?? 0;

  const displayStatus: StatusKey =
    isActivelySending ? "SENDING" : (campaign.status as StatusKey);
  const displayConfig = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.DRAFT;

  const sentCount = sendProgress?.sentCount ?? campaign.sentCount ?? 0;
  const failedCount = sendProgress?.failedCount ?? campaign.failedCount ?? 0;

  const canEdit = campaign.status === "DRAFT" || campaign.status === "FAILED";
  const canSend = campaign.status === "DRAFT" || campaign.status === "FAILED";
  const canDelete = campaign.status !== "SENDING";
  const canShowStats = campaign.status === "SENT";

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
          {isActivelySending && sendProgress && (
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
              {dateInfo.label && <span className={styles.dateLabel}>{dateInfo.label}</span>}
            </>
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </div>

        {/* Actions */}
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
      className={cn(styles.actionButton, danger && styles.actionButtonDanger)}
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

function PreviewModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={styles.previewBackdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
    return () => { mounted = false; };
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
          {stats.total} entrée(s) — {stats.sent} envoyé(s), {stats.failed} échec(s)
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
                <span className={styles.statsMessage}>{log.message || "—"}</span>
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
