// src/app/components/email-mrketing/CampaignsList.tsx
"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
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
  Inbox,
  Sparkles,
  Calendar,
  MoreHorizontal,
} from "lucide-react";

import styles from "./CampaignsList.module.css";

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

type SendPopupState =
  | { phase: "idle" }
  | { phase: "confirm"; campaign: Campaign }
  | { phase: "sending"; campaign: Campaign }
  | {
      phase: "success";
      campaign: Campaign;
      sentCount: number;
      failedCount: number;
    }
  | { phase: "error"; campaign: Campaign; message: string };

type DeletePopupState =
  | { phase: "idle" }
  | { phase: "confirm"; campaign: Campaign };

type LogEntry = {
  email: string;
  status: string;
  message?: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<StatusKey, CampaignStatusConfig> = {
  DRAFT: {
    label: "Brouillon",
    icon: <FileEdit size={12} />,
    className: styles.statusDraft,
  },
  SENDING: {
    label: "En cours",
    icon: <Loader2 size={12} className={styles.spin} />,
    className: styles.statusSending,
  },
  SENT: {
    label: "Envoyée",
    icon: <CheckCircle size={12} />,
    className: styles.statusSent,
  },
  FAILED: {
    label: "Échouée",
    icon: <AlertCircle size={12} />,
    className: styles.statusFailed,
  },
  SCHEDULED: {
    label: "Planifiée",
    icon: <Clock size={12} />,
    className: styles.statusScheduled,
  },
};

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

  return {
    formatted,
    label: withLabel,
  };
}

async function readJsonSafe<T = any>(res: Response): Promise<T | null> {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: text || `Réponse non JSON. Status HTTP: ${res.status}`,
    } as T;
  }
}

function getCampaignGroupsLabel(campaign: Campaign) {
  const names = new Set<string>();

  campaign.campaignGroups?.forEach((item) => {
    const name = item.group?.name?.trim();

    if (name) {
      names.add(name);
    }
  });

  if (names.size > 0) {
    return Array.from(names).join(", ");
  }

  return campaign.group?.name || "";
}

async function fetchCampaignDetails(campaign: Campaign) {
  try {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "GET",
      cache: "no-store",
    });

    const freshCampaign = await readJsonSafe<Campaign & { error?: string }>(
      res
    );

    if (res.ok && freshCampaign?.id) {
      return freshCampaign;
    }

    console.warn("[CampaignsList] Impossible de recharger la campagne", {
      status: res.status,
      response: freshCampaign,
    });

    return campaign;
  } catch (error) {
    console.warn("[CampaignsList] Erreur reload campagne", error);
    return campaign;
  }
}

export function CampaignsList({ onNew, onEdit }: CampaignsListProps) {
  const campaignState = useCampaigns();

  const campaigns = Array.isArray(campaignState.campaigns)
    ? campaignState.campaigns
    : [];

  const total = Number.isFinite(Number(campaignState.total))
    ? Number(campaignState.total)
    : campaigns.length;

  const loading = Boolean(campaignState.loading);
  const page = Number(campaignState.page || 1);
  const setPage = campaignState.setPage;
  const refetch = campaignState.refetch;
  const deleteCampaign = campaignState.deleteCampaign;
  const duplicateCampaign = campaignState.duplicateCampaign;

  const [sendPopup, setSendPopup] = useState<SendPopupState>({
    phase: "idle",
  });

  const [deletePopup, setDeletePopup] = useState<DeletePopupState>({
    phase: "idle",
  });

  const [activeSendingCampaign, setActiveSendingCampaign] =
    useState<Campaign | null>(null);

  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const hasCampaigns = campaigns.length > 0;

  const activeSendingCampaignId = activeSendingCampaign?.id || null;

  const pollStatus = useCampaignStatus(
    activeSendingCampaignId,
    Boolean(activeSendingCampaignId)
  );

  // Statistiques globales pour les indicateurs en haut
  const overviewStats = useMemo(() => {
    const sent = campaigns.filter((c) => c.status === "SENT").length;
    const drafts = campaigns.filter((c) => c.status === "DRAFT").length;
    const sending = campaigns.filter((c) => c.status === "SENDING").length;
    return { sent, drafts, sending };
  }, [campaigns]);

  useEffect(() => {
    if (!activeSendingCampaign || !pollStatus) return;

    if (pollStatus.status === "SENT") {
      const finishedCampaign = activeSendingCampaign;

      setActiveSendingCampaign(null);
      refetch();

      setSendPopup((current) => {
        if (
          current.phase === "sending" &&
          current.campaign.id === finishedCampaign.id
        ) {
          return {
            phase: "success",
            campaign: finishedCampaign,
            sentCount: pollStatus.sentCount,
            failedCount: pollStatus.failedCount,
          };
        }

        return current;
      });
    }

    if (pollStatus.status === "FAILED") {
      const failedCampaign = activeSendingCampaign;

      setActiveSendingCampaign(null);
      refetch();

      setSendPopup((current) => {
        if (
          current.phase === "sending" &&
          current.campaign.id === failedCampaign.id
        ) {
          return {
            phase: "error",
            campaign: failedCampaign,
            message:
              "L'envoi a échoué. Vérifiez vos paramètres d'envoi et réessayez.",
          };
        }

        return current;
      });
    }
  }, [pollStatus, activeSendingCampaign, refetch]);

  const handleSendRequest = useCallback(
    async (campaign: Campaign) => {
      const freshCampaign = await fetchCampaignDetails(campaign);

      if (activeSendingCampaign?.id === freshCampaign.id) {
        setSendPopup({
          phase: "sending",
          campaign: freshCampaign,
        });

        return;
      }

      if (freshCampaign.status === "SENDING") {
        setActiveSendingCampaign(freshCampaign);

        setSendPopup({
          phase: "sending",
          campaign: freshCampaign,
        });

        return;
      }

      setSendPopup({
        phase: "confirm",
        campaign: freshCampaign,
      });
    },
    [activeSendingCampaign]
  );

  const handleSendConfirm = useCallback(async () => {
    if (sendPopup.phase !== "confirm") return;

    const { campaign } = sendPopup;

    setActiveSendingCampaign(campaign);

    setSendPopup({
      phase: "sending",
      campaign,
    });

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
      });

      const data = await readJsonSafe<{ error?: string }>(res);

      if (!res.ok) {
        setActiveSendingCampaign(null);

        setSendPopup({
          phase: "error",
          campaign,
          message:
            data?.error ||
            "Une erreur est survenue lors du démarrage de l'envoi.",
        });

        return;
      }

      refetch();
    } catch {
      setActiveSendingCampaign(null);

      setSendPopup({
        phase: "error",
        campaign,
        message: "Erreur réseau. Vérifiez votre connexion et réessayez.",
      });
    }
  }, [sendPopup, refetch]);

  const handleSendCancel = useCallback(() => {
    setSendPopup({
      phase: "idle",
    });
  }, []);

  const handleDeleteRequest = useCallback((campaign: Campaign) => {
    setDeletePopup({
      phase: "confirm",
      campaign,
    });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deletePopup.phase !== "confirm") return;

    await deleteCampaign(deletePopup.campaign.id);

    setDeletePopup({
      phase: "idle",
    });

    refetch();
  }, [deletePopup, deleteCampaign, refetch]);

  const handleDuplicate = useCallback(
    async (campaign: Campaign) => {
      await duplicateCampaign(campaign.id);
      refetch();
    },
    [duplicateCampaign, refetch]
  );

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.kicker}>
            <Sparkles size={12} />
            Email marketing
          </span>
          <h2 className={styles.title}>Campagnes</h2>
          <p className={styles.description}>
            Créez, modifiez, prévisualisez et envoyez vos campagnes email.
          </p>
        </div>

        <div className={styles.headerRight}>
          {hasCampaigns && (
            <button
              type="button"
              onClick={refetch}
              className={styles.iconButton}
              aria-label="Actualiser"
              title="Actualiser"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <button type="button" onClick={onNew} className={styles.primaryButton}>
            <Plus size={15} />
            Nouvelle campagne
          </button>
        </div>
      </header>

      {/* Overview stats */}
      {hasCampaigns && (
        <div className={styles.overview}>
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon} data-color="blue">
              <Mail size={16} />
            </div>
            <div>
              <span className={styles.overviewValue}>{total}</span>
              <span className={styles.overviewLabel}>
                {total > 1 ? "campagnes" : "campagne"}
              </span>
            </div>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon} data-color="green">
              <CheckCircle size={16} />
            </div>
            <div>
              <span className={styles.overviewValue}>{overviewStats.sent}</span>
              <span className={styles.overviewLabel}>envoyées</span>
            </div>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon} data-color="amber">
              <FileEdit size={16} />
            </div>
            <div>
              <span className={styles.overviewValue}>
                {overviewStats.drafts}
              </span>
              <span className={styles.overviewLabel}>brouillons</span>
            </div>
          </div>

          {overviewStats.sending > 0 && (
            <div className={styles.overviewCard} data-active>
              <div className={styles.overviewIcon} data-color="indigo">
                <Loader2 size={16} className={styles.spin} />
              </div>
              <div>
                <span className={styles.overviewValue}>
                  {overviewStats.sending}
                </span>
                <span className={styles.overviewLabel}>en cours</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.panel}>
        {loading ? (
          <LoadingState />
        ) : !hasCampaigns ? (
          <EmptyState onNew={onNew} />
        ) : (
          <div className={styles.rows}>
            {campaigns.map((campaign) => {
              const isActiveSending =
                activeSendingCampaign?.id === campaign.id ||
                campaign.status === "SENDING";

              return (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  isSending={isActiveSending}
                  sendProgress={
                    activeSendingCampaign?.id === campaign.id
                      ? pollStatus
                      : null
                  }
                  onEdit={() => onEdit(campaign)}
                  onDelete={() => handleDeleteRequest(campaign)}
                  onDuplicate={() => handleDuplicate(campaign)}
                  onSend={() => handleSendRequest(campaign)}
                  onPreview={() => setPreviewCampaign(campaign)}
                  onStats={() =>
                    setStatsId((current) =>
                      current === campaign.id ? null : campaign.id
                    )
                  }
                  showStats={statsId === campaign.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrevious={() => setPage(Math.max(1, page - 1))}
          onNext={() => setPage(Math.min(totalPages, page + 1))}
        />
      )}

      {previewCampaign && (
        <PreviewModal
          campaign={previewCampaign}
          onClose={() => setPreviewCampaign(null)}
        />
      )}

      {sendPopup.phase !== "idle" && (
        <SendPopup
          state={sendPopup}
          pollStatus={pollStatus}
          isBackgroundRunning={Boolean(activeSendingCampaign)}
          onConfirm={handleSendConfirm}
          onCancel={handleSendCancel}
          onClose={() =>
            setSendPopup({
              phase: "idle",
            })
          }
        />
      )}

      {deletePopup.phase === "confirm" && (
        <DeletePopup
          campaign={deletePopup.campaign}
          onConfirm={handleDeleteConfirm}
          onCancel={() =>
            setDeletePopup({
              phase: "idle",
            })
          }
        />
      )}
    </section>
  );
}

interface SendPopupProps {
  state: SendPopupState;
  pollStatus: ReturnType<typeof useCampaignStatus>;
  isBackgroundRunning: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function SendPopup({
  state,
  pollStatus,
  isBackgroundRunning,
  onConfirm,
  onCancel,
  onClose,
}: SendPopupProps) {
  useEffect(() => {
    if (state.phase === "sending") return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (state.phase === "confirm") {
        onCancel();
        return;
      }

      onClose();
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [state.phase, onCancel, onClose]);

  const progress = pollStatus?.progress ?? 0;
  const sentCount = pollStatus?.sentCount ?? 0;
  const failedCount = pollStatus?.failedCount ?? 0;
  const totalRecipients = pollStatus?.totalRecipients ?? 0;

  const groupLabel =
    state.phase !== "idle" ? getCampaignGroupsLabel(state.campaign) : "";

  return (
    <div
      className={styles.popupBackdrop}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (state.phase === "sending") return;

        if (state.phase === "confirm") {
          onCancel();
          return;
        }

        onClose();
      }}
    >
      <div className={styles.popupCard} role="dialog" aria-modal="true">
        {state.phase === "confirm" && (
          <>
            <div className={styles.popupIconWrap} data-color="orange">
              <Rocket size={26} />
            </div>

            <h3 className={styles.popupTitle}>Confirmer l&apos;envoi</h3>

            <p className={styles.popupSubtitle}>
              Vous êtes sur le point d&apos;envoyer{" "}
              <strong>« {state.campaign.name} »</strong>
              {groupLabel && (
                <>
                  {" "}
                  au(x) groupe(s) <strong>{groupLabel}</strong>
                </>
              )}
              .
            </p>

            <div className={styles.popupInfoRow}>
              <div className={styles.popupInfoItem}>
                <Mail size={14} />
                <span>
                  Sujet : <strong>{state.campaign.subject || "—"}</strong>
                </span>
              </div>

              {groupLabel && (
                <div className={styles.popupInfoItem}>
                  <Users size={14} />
                  <span>
                    Destinataires : groupe(s) <strong>{groupLabel}</strong>
                  </span>
                </div>
              )}
            </div>

            <p className={styles.popupWarning}>
              <AlertTriangle size={13} />
              Cette action est irréversible. Les emails seront envoyés
              immédiatement.
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

        {state.phase === "sending" && (
          <>
            <div className={styles.popupIconWrap} data-color="blue">
              <Loader2 size={26} className={styles.spin} />
            </div>

            <h3 className={styles.popupTitle}>
              {isBackgroundRunning ? "Envoi en cours…" : "Préparation…"}
            </h3>

            <p className={styles.popupSubtitle}>
              <strong>« {state.campaign.name} »</strong> est en cours
              d&apos;envoi
              {groupLabel && (
                <>
                  {" "}
                  au(x) groupe(s) <strong>{groupLabel}</strong>
                </>
              )}
              . Vous pouvez fermer cette fenêtre et suivre l&apos;envoi depuis
              le bouton de la ligne.
            </p>

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
              L&apos;envoi continue en arrière-plan. Pour revoir ce statut,
              cliquez sur le bouton d&apos;envoi de cette campagne.
            </p>

            <button
              type="button"
              onClick={onClose}
              className={styles.popupCancelBtn}
              style={{ marginTop: "4px" }}
            >
              Masquer et continuer en arrière-plan
            </button>
          </>
        )}

        {state.phase === "success" && (
          <>
            <div className={styles.popupIconWrap} data-color="green">
              <CheckCircle size={26} />
            </div>

            <h3 className={styles.popupTitle}>Envoi terminé !</h3>

            <p className={styles.popupSubtitle}>
              La campagne <strong>« {state.campaign.name} »</strong> a été
              envoyée avec succès.
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

        {state.phase === "error" && (
          <>
            <div className={styles.popupIconWrap} data-color="red">
              <AlertCircle size={26} />
            </div>

            <h3 className={styles.popupTitle}>Erreur d&apos;envoi</h3>

            <p className={styles.popupSubtitle}>
              L&apos;envoi de <strong>« {state.campaign.name} »</strong> a
              échoué.
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
                className={cn(
                  styles.popupConfirmBtn,
                  styles.popupConfirmBtnRed
                )}
              >
                Réessayer plus tard
              </button>
            </div>
          </>
        )}

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
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className={styles.popupBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
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
          Êtes-vous sûr de vouloir supprimer{" "}
          <strong>« {campaign.name} »</strong> ? Cette action est définitive.
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

function LoadingState() {
  return (
    <div className={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonLineLg} />
            <div className={styles.skeletonLineSm} />
          </div>
          <div className={styles.skeletonBadge} />
          <div className={styles.skeletonActions}>
            <div className={styles.skeletonDot} />
            <div className={styles.skeletonDot} />
            <div className={styles.skeletonDot} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className={styles.state}>
      <div className={styles.emptyIllustration}>
        <div className={styles.emptyCircle} />
        <div className={styles.emptyIcon}>
          <Inbox size={28} />
        </div>
      </div>

      <h3>Aucune campagne pour le moment</h3>

      <p>
        Lancez-vous ! Créez votre première campagne email et atteignez vos
        contacts en quelques clics.
      </p>

      <button type="button" onClick={onNew} className={styles.primaryButton}>
        <Plus size={15} />
        Créer ma première campagne
      </button>
    </div>
  );
}

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

  const displayStatus: StatusKey = isActivelySending
    ? "SENDING"
    : (campaign.status as StatusKey);

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

  const groupLabel = getCampaignGroupsLabel(campaign);

  return (
    <article
      className={cn(
        styles.rowWrap,
        isActivelySending && styles.rowWrapActive
      )}
      data-status={displayStatus.toLowerCase()}
    >
      <div className={styles.rowAccent} />

      <div className={styles.row}>
        <div className={styles.campaignMain}>
          <div className={styles.campaignIcon}>
            <Mail size={18} />
          </div>

          <div className={styles.campaignText}>
            <div className={styles.campaignTitleRow}>
              <h3>{campaign.name}</h3>
              <span className={cn(styles.status, displayConfig.className)}>
                {displayConfig.icon}
                {displayConfig.label}
              </span>
            </div>

            <p className={styles.campaignSubject}>
              {campaign.subject || (
                <span className={styles.muted}>Sujet non renseigné</span>
              )}
            </p>

            <div className={styles.campaignMeta}>
              {groupLabel ? (
                <span className={styles.metaItem} title={groupLabel}>
                  <Users size={11} />
                  {groupLabel}
                </span>
              ) : null}

              {dateInfo && (
                <span className={styles.metaItem}>
                  <Calendar size={11} />
                  {dateInfo.label} le {dateInfo.formatted}
                </span>
              )}

              {(campaign.status === "SENT" || isActivelySending) && (
                <span className={styles.metaItem} data-accent>
                  <CheckCircle size={11} />
                  {sentCount.toLocaleString("fr-FR")} envoyés
                  {failedCount > 0 && ` · ${failedCount} échec(s)`}
                </span>
              )}
            </div>

            {isActivelySending && (
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
        </div>

        <div className={styles.actions}>
          <ActionButton label="Prévisualiser" onClick={onPreview}>
            <Eye size={15} />
          </ActionButton>

          {canShowStats && (
            <ActionButton
              label="Statistiques"
              onClick={onStats}
              active={showStats}
            >
              <BarChart2 size={15} />
            </ActionButton>
          )}

          {canEdit && !isActivelySending && (
            <ActionButton label="Modifier" onClick={onEdit}>
              <FileEdit size={15} />
            </ActionButton>
          )}

          {isActivelySending ? (
            <ActionButton
              label="Suivre l'envoi"
              onClick={onSend}
              variant="primary"
            >
              <Loader2 size={15} className={styles.spin} />
            </ActionButton>
          ) : (
            canSend && (
              <ActionButton
                label="Envoyer"
                onClick={onSend}
                variant="primary"
              >
                <Send size={15} />
              </ActionButton>
            )
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

      {showStats && canShowStats && (
        <div className={styles.statsContainer}>
          <CampaignStats campaignId={campaign.id} />
        </div>
      )}
    </article>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
  disabled = false,
  active = false,
  variant = "default",
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "primary";
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
        danger && styles.actionButtonDanger,
        active && styles.actionButtonActive,
        variant === "primary" && styles.actionButtonPrimary
      )}
    >
      {children}
    </button>
  );
}

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
          <span>Précédent</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={page === totalPages}
          className={styles.pageButton}
          aria-label="Page suivante"
        >
          <span>Suivant</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </footer>
  );
}

function PreviewModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={styles.previewBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.previewModal} role="dialog" aria-modal="true">
        <header className={styles.previewHeader}>
          <div className={styles.previewHeaderInfo}>
            <div className={styles.previewHeaderIcon}>
              <Mail size={16} />
            </div>
            <div>
              <h3>{campaign.name}</h3>
              <p>Sujet : {campaign.subject || "Non renseigné"}</p>
            </div>
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

function CampaignStats({ campaignId }: { campaignId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => readJsonSafe<{ logs?: LogEntry[] }>(res))
      .then((data) => {
        if (!mounted) return;

        setLogs(Array.isArray(data?.logs) ? data.logs : []);
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
    const sent = logs.filter(
      (log) => log.status?.toLowerCase() === "sent"
    ).length;

    return {
      sent,
      failed: logs.length - sent,
      total: logs.length,
      rate: logs.length > 0 ? Math.round((sent / logs.length) * 100) : 0,
    };
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
        <div>
          <h4>Journal d&apos;envoi</h4>
          <p>{stats.total} entrée(s) au total</p>
        </div>

        <div className={styles.statsKpis}>
          <div className={styles.statsKpi} data-type="sent">
            <span className={styles.statsKpiValue}>{stats.sent}</span>
            <span className={styles.statsKpiLabel}>envoyés</span>
          </div>

          <div className={styles.statsKpi} data-type="failed">
            <span className={styles.statsKpiValue}>{stats.failed}</span>
            <span className={styles.statsKpiLabel}>échecs</span>
          </div>

          <div className={styles.statsKpi} data-type="rate">
            <span className={styles.statsKpiValue}>{stats.rate}%</span>
            <span className={styles.statsKpiLabel}>de réussite</span>
          </div>
        </div>
      </header>

      <div className={styles.statsList}>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>Aucun log disponible.</p>
        ) : (
          logs.map((log, index) => {
            const isSent = log.status?.toLowerCase() === "sent";

            return (
              <div key={`${log.email}-${index}`} className={styles.statsItem}>
                <span
                  className={cn(
                    styles.statusDot,
                    isSent ? styles.statusDotSent : styles.statusDotFailed
                  )}
                />

                <span className={styles.statsEmail}>{log.email}</span>

                <span
                  className={cn(
                    styles.statsBadge,
                    isSent ? styles.sentText : styles.failedText
                  )}
                >
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