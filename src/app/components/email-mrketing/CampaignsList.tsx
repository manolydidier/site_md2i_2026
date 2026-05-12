// components/email-marketing/CampaignsList.tsx
"use client";

import { useEffect, useState } from "react";
import { useCampaigns, useCampaignStatus } from "@/app/hooks/useEmailMarketing";
import type { Campaign } from "@/app/types/email-marketing";
import {
  Trash2,
  Copy,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileEdit,
  BarChart2,
  X,
  Mail
} from "lucide-react";

interface CampaignsListProps {
  onNew: () => void;
  onEdit: (campaign: Campaign) => void;
}

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

  const totalPages = Math.ceil(total / 10);

  const handleSend = async (campaign: Campaign) => {
    const target = campaign.group?.name ?? "tous les destinataires";

    if (!confirm(`Envoyer "${campaign.name}" à ${target} ?`)) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur pendant l'envoi");
        return;
      }

      setSendingId(campaign.id);
      refetch();
    } catch {
      alert("Erreur réseau");
    }
  };

  return (
    <div className="campaign-list">
      <div className="campaign-list__meta">
        <span>{total} campagne(s)</span>
      </div>

      <div className="campaign-list__box">
        {loading ? (
          <div className="campaign-empty">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <p>Chargement des campagnes...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="campaign-empty">
            <div className="campaign-empty__icon">
              <FileEdit className="h-7 w-7" />
            </div>
            <h3>Aucune campagne</h3>
            <p>Créez votre première campagne pour commencer.</p>
            <button type="button" onClick={onNew} className="primary-btn">
              <Send className="h-4 w-4" />
              Nouvelle campagne
            </button>
          </div>
        ) : (
          <div className="campaign-rows">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                isSending={sendingId === campaign.id}
                onEdit={() => onEdit(campaign)}
                onDelete={() => {
                  if (confirm(`Supprimer "${campaign.name}" ?`)) {
                    deleteCampaign(campaign.id).then(refetch);
                  }
                }}
                onDuplicate={() => duplicateCampaign(campaign.id).then(refetch)}
                onSend={() => handleSend(campaign)}
                onPreview={() => setPreviewCampaign(campaign)}
                onStats={() =>
                  setStatsId(statsId === campaign.id ? null : campaign.id)
                }
                showStats={statsId === campaign.id}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <p>
            Page {page} sur {totalPages}
          </p>

          <div className="pagination__actions">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="page-btn"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="page-btn"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {previewCampaign && (
        <div className="preview-backdrop">
          <div className="preview-modal">
            <div className="preview-header">
              <div>
                <h3>{previewCampaign.name}</h3>
                <p>Sujet : {previewCampaign.subject}</p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewCampaign(null)}
                className="icon-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <iframe
              srcDoc={previewCampaign.htmlContent}
              className="preview-frame"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .campaign-list {
          padding: 18px;
          background: #ffffff;
        }

        .campaign-list__meta {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
        }

        .campaign-list__box {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          overflow: hidden;
        }

        .campaign-rows {
          display: flex;
          flex-direction: column;
        }

        .campaign-empty {
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .campaign-empty__icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef9f27;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.22);
        }

        .campaign-empty h3 {
          margin: 4px 0 0;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }

        .campaign-empty p {
          margin: 0;
          font-size: 13px;
        }

        .primary-btn {
          margin-top: 8px;
          height: 38px;
          padding: 0 15px;
          border: 1px solid rgba(239, 159, 39, 0.28);
          border-radius: 10px;
          background: #ef9f27;
          color: #1a0d00;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 14px;
        }

        .pagination p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          font-weight: 600;
        }

        .pagination__actions {
          display: flex;
          gap: 6px;
        }

        .page-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #374151;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .page-btn:hover:not(:disabled) {
          background: #f9fafb;
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .preview-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          padding: 24px;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-modal {
          width: min(900px, 100%);
          height: min(720px, calc(100vh - 48px));
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          min-height: 70px;
          padding: 15px 18px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .preview-header h3 {
          margin: 0;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
        }

        .preview-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .preview-frame {
          flex: 1;
          width: 100%;
          border: 0;
          background: #ffffff;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-btn:hover {
          background: #f9fafb;
          color: #111827;
        }
      `}</style>
    </div>
  );
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
}: {
  campaign: Campaign;
  isSending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSend: () => void;
  onPreview: () => void;
  onStats: () => void;
  showStats: boolean;
}) {
  const isActivelySending = isSending || campaign.status === "SENDING";
  const status = useCampaignStatus(campaign.id, isActivelySending);
  const progress = status?.progress ?? 0;

  const statusConfig: Record<
    string,
    {
      label: string;
      icon: React.ReactNode;
      className: string;
    }
  > = {
    DRAFT: {
      label: "Brouillon",
      icon: <FileEdit className="h-3.5 w-3.5" />,
      className: "status status--draft",
    },
    SENDING: {
      label: "En cours",
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: "status status--sending",
    },
    SENT: {
      label: "Envoyée",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      className: "status status--sent",
    },
    FAILED: {
      label: "Échouée",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      className: "status status--failed",
    },
    SCHEDULED: {
      label: "Planifiée",
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "status status--scheduled",
    },
  };

  const displayStatus = isActivelySending && status ? "SENDING" : campaign.status;
  const displayConfig = statusConfig[displayStatus] || statusConfig.DRAFT;

  return (
    <div className="campaign-row-wrap">
      <div className="campaign-row">
        <div className="campaign-main">
          <div className="campaign-icon">
            <Mail className="h-4 w-4" />
          </div>

          <div className="campaign-title">
            <h3>{campaign.name}</h3>
            <p>{campaign.subject}</p>
          </div>
        </div>

        <div className="campaign-group">
          {campaign.group ? (
            <span>{campaign.group.name}</span>
          ) : (
            <span className="muted">—</span>
          )}
        </div>

        <div className="campaign-status">
          <span className={displayConfig.className}>
            {displayConfig.icon}
            {displayConfig.label}
          </span>

          {isActivelySending && status && (
            <div className="progress">
              <div className="progress-bar">
                <div style={{ width: `${progress}%` }} />
              </div>
              <small>{progress}%</small>
            </div>
          )}
        </div>

        <div className="campaign-results">
          {campaign.status === "SENT" || campaign.status === "SENDING" ? (
            <>
              <strong>{status?.sentCount ?? campaign.sentCount}</strong>
              <span>envoyés</span>
              {(status?.failedCount ?? campaign.failedCount) > 0 && (
                <small>
                  {status?.failedCount ?? campaign.failedCount} échec(s)
                </small>
              )}
            </>
          ) : (
            <span className="muted">—</span>
          )}
        </div>

        <div className="campaign-date">
          {campaign.sentAt
            ? new Date(campaign.sentAt).toLocaleDateString("fr-FR")
            : new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
        </div>

        <div className="campaign-actions">
          <button type="button" onClick={onPreview} title="Prévisualiser">
            <Eye className="h-4 w-4" />
          </button>

          {campaign.status === "SENT" && (
            <button type="button" onClick={onStats} title="Statistiques">
              <BarChart2 className="h-4 w-4" />
            </button>
          )}

          {(campaign.status === "DRAFT" || campaign.status === "FAILED") && (
            <>
              <button type="button" onClick={onEdit} title="Modifier">
                <FileEdit className="h-4 w-4" />
              </button>

              <button type="button" onClick={onSend} title="Envoyer">
                <Send className="h-4 w-4" />
              </button>
            </>
          )}

          <button type="button" onClick={onDuplicate} title="Dupliquer">
            <Copy className="h-4 w-4" />
          </button>

          {campaign.status !== "SENDING" && (
            <button
              type="button"
              onClick={onDelete}
              title="Supprimer"
              className="danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showStats && campaign.status === "SENT" && (
        <div className="stats-row">
          <CampaignStats campaignId={campaign.id} />
        </div>
      )}

      <style jsx>{`
        .campaign-row-wrap {
          border-bottom: 1px solid #f1f5f9;
        }

        .campaign-row-wrap:last-child {
          border-bottom: none;
        }

        .campaign-row {
          display: grid;
          grid-template-columns: minmax(260px, 1.8fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(110px, 0.7fr) 100px auto;
          gap: 16px;
          align-items: center;
          padding: 16px 18px;
          background: #ffffff;
          transition: background 0.15s ease;
        }

        .campaign-row:hover {
          background: #fafafa;
        }

        .campaign-main {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .campaign-icon {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ef9f27;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.2);
        }

        .campaign-title {
          min-width: 0;
        }

        .campaign-title h3 {
          margin: 0;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .campaign-title p {
          margin: 3px 0 0;
          color: #6b7280;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .campaign-group span {
          display: inline-flex;
          max-width: 140px;
          padding: 5px 9px;
          border-radius: 999px;
          color: #374151;
          background: #f3f4f6;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .muted {
          color: #9ca3af !important;
          background: transparent !important;
          padding: 0 !important;
          font-size: 13px !important;
        }

        .campaign-status {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
        }

        :global(.status) {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        :global(.status--draft) {
          color: #475569;
          background: #f1f5f9;
        }

        :global(.status--sending) {
          color: #2563eb;
          background: #dbeafe;
        }

        :global(.status--sent) {
          color: #16a34a;
          background: #dcfce7;
        }

        :global(.status--failed) {
          color: #dc2626;
          background: #fee2e2;
        }

        :global(.status--scheduled) {
          color: #b45309;
          background: #fef3c7;
        }

        .progress {
          width: 110px;
        }

        .progress-bar {
          height: 5px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .progress-bar div {
          height: 100%;
          border-radius: inherit;
          background: #2563eb;
          transition: width 0.35s ease;
        }

        .progress small {
          display: block;
          margin-top: 2px;
          color: #6b7280;
          font-size: 11px;
        }

        .campaign-results {
          color: #6b7280;
          font-size: 12px;
        }

        .campaign-results strong {
          display: block;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
        }

        .campaign-results span {
          display: block;
        }

        .campaign-results small {
          display: block;
          margin-top: 2px;
          color: #dc2626;
        }

        .campaign-date {
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .campaign-actions {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
        }

        .campaign-actions button {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid transparent;
          background: transparent;
          color: #9ca3af;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .campaign-actions button:hover {
          color: #111827;
          background: #f3f4f6;
          border-color: #e5e7eb;
        }

        .campaign-actions button.danger:hover {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .stats-row {
          padding: 16px 18px;
          background: #f9fafb;
          border-top: 1px solid #f1f5f9;
        }

        @media (max-width: 1100px) {
          .campaign-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .campaign-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

function CampaignStats({ campaignId }: { campaignId: string }) {
  const [logs, setLogs] = useState<
    { email: string; status: string; message?: string; createdAt: string }[]
  >([]);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoaded(true);
      });
  }, [campaignId]);

  if (!loaded) {
    return <div className="stats-loading">Chargement des logs...</div>;
  }

  return (
    <div className="stats">
      <h4>Journal d&apos;envoi</h4>

      <div className="stats-list">
        {logs.length === 0 ? (
          <p>Aucun log</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="stats-item">
              <span
                className={
                  log.status === "sent" ? "status-dot sent" : "status-dot failed"
                }
              />

              <span className="email">{log.email}</span>

              <span className={log.status === "sent" ? "sent-text" : "fail-text"}>
                {log.status}
              </span>

              {log.message && <span className="message">{log.message}</span>}

              <span className="time">
                {new Date(log.createdAt).toLocaleTimeString("fr-FR")}
              </span>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .stats h4 {
          margin: 0 0 10px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .stats-loading {
          color: #9ca3af;
          font-size: 12px;
        }

        .stats-list {
          max-height: 190px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stats-list p {
          margin: 0;
          color: #9ca3af;
          font-size: 12px;
        }

        .stats-item {
          display: grid;
          grid-template-columns: 10px minmax(160px, 1fr) 80px minmax(120px, 1fr) auto;
          gap: 10px;
          align-items: center;
          color: #6b7280;
          font-size: 12px;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
        }

        .status-dot.sent {
          background: #22c55e;
        }

        .status-dot.failed {
          background: #ef4444;
        }

        .email {
          color: #374151;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sent-text {
          color: #16a34a;
          font-weight: 700;
        }

        .fail-text {
          color: #dc2626;
          font-weight: 700;
        }

        .message {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .time {
          color: #9ca3af;
          white-space: nowrap;
        }

        @media (max-width: 800px) {
          .stats-item {
            grid-template-columns: 10px 1fr;
          }

          .time,
          .message {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}