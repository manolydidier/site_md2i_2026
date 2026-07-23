"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  Loader2,
  Mail,
  Package,
  Pencil,
  Phone,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

type StageOption = {
  value: string;
  label: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  requestType: string | null;
  stage: string;
  source: string;
  amount: string;
  currency: string;
  probability: number;
  createdAt: string;
  nextFollowUpAt: string | null;
  contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
  product: {
    id: string;
    name: string;
    slug: string;
  } | null;
  offer: {
    id: string;
    title: string;
  } | null;
};

type OpportunitiesTableProps = {
  opportunities: OpportunityRow[];
  stageOptions: StageOption[];
  canUpdate: boolean;
};

type ModalForm = {
  stage: string;
  amount: string;
  probability: number;
  nextFollowUpAt: string;
  lostReason: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatAmount(amount: string, currency: string | null) {
  if (!amount) return "—";

  const value = Number(amount);

  if (Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getContactName(contact: OpportunityRow["contact"]) {
  if (!contact) return "—";

  const name = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || contact.email;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value.trim()) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function getStageLabel(stageOptions: StageOption[], stage: string) {
  return stageOptions.find((item) => item.value === stage)?.label || stage;
}

function findStageValue(stageOptions: StageOption[], candidates: string[]) {
  return (
    candidates.find((candidate) =>
      stageOptions.some((stage) => stage.value === candidate)
    ) || null
  );
}

function getStageStyle(stage: string): CSSProperties {
  if (["WON", "CLOSED_WON"].includes(stage)) {
    return {
      background: "#DCFCE7",
      color: "#166534",
      border: "1px solid #BBF7D0",
    };
  }

  if (["LOST", "CLOSED_LOST"].includes(stage)) {
    return {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FECACA",
    };
  }

  if (
    [
      "PROPOSAL",
      "PROPOSAL_SENT",
      "QUOTE_SENT",
      "OFFER_SENT",
      "NEGOTIATION",
      "IN_NEGOTIATION",
    ].includes(stage)
  ) {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
      border: "1px solid #FED7AA",
    };
  }

  if (["QUALIFIED", "QUALIFICATION"].includes(stage)) {
    return {
      background: "#EFF6FF",
      color: "#1E3A8A",
      border: "1px solid #BFDBFE",
    };
  }

  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
}

function getSourceLabel(source: string) {
  const labels: Record<string, string> = {
    WEBSITE: "Site web",
    FACEBOOK: "Facebook",
    LINKEDIN: "LinkedIn",
    EMAIL_CAMPAIGN: "Email",
    GOOGLE: "Google",
    DIRECT: "Direct",
    TENDER: "Appel d’offre",
    REFERRAL: "Recommandation",
    MANUAL: "Manuel",
    OTHER: "Autre",
  };

  return labels[source] || source;
}

function isLostStage(stage: string) {
  return ["LOST", "CLOSED_LOST"].includes(stage);
}

function isWonStage(stage: string) {
  return ["WON", "CLOSED_WON"].includes(stage);
}

function isHotStage(stage: string) {
  return [
    "PROPOSAL",
    "PROPOSAL_SENT",
    "QUOTE_SENT",
    "OFFER_SENT",
    "NEGOTIATION",
    "IN_NEGOTIATION",
  ].includes(stage);
}

function clampProbability(value: number) {
  return Math.min(Math.max(value || 0, 0), 100);
}

export default function OpportunitiesTable({
  opportunities,
  stageOptions,
  canUpdate,
}: OpportunitiesTableProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<OpportunityRow | null>(null);
  const [form, setForm] = useState<ModalForm | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const quickStages = useMemo(() => {
    return {
      contacted: findStageValue(stageOptions, [
        "CONTACTED",
        "CONTACT_MADE",
        "IN_CONTACT",
      ]),
      qualified: findStageValue(stageOptions, [
        "QUALIFIED",
        "QUALIFICATION",
      ]),
      proposal: findStageValue(stageOptions, [
        "PROPOSAL",
        "PROPOSAL_SENT",
        "QUOTE_SENT",
        "OFFER_SENT",
      ]),
      negotiation: findStageValue(stageOptions, [
        "NEGOTIATION",
        "IN_NEGOTIATION",
      ]),
      won: findStageValue(stageOptions, ["WON", "CLOSED_WON"]),
      lost: findStageValue(stageOptions, ["LOST", "CLOSED_LOST"]),
    };
  }, [stageOptions]);

  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      const aWonLost = isWonStage(a.stage) || isLostStage(a.stage) ? 1 : 0;
      const bWonLost = isWonStage(b.stage) || isLostStage(b.stage) ? 1 : 0;

      if (aWonLost !== bWonLost) return aWonLost - bWonLost;

      const aHot = isHotStage(a.stage) ? 0 : 1;
      const bHot = isHotStage(b.stage) ? 0 : 1;

      if (aHot !== bHot) return aHot - bHot;

      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [opportunities]);

  function openModal(opportunity: OpportunityRow) {
    setSelected(opportunity);
    setNotice(null);

    setForm({
      stage: opportunity.stage,
      amount: opportunity.amount,
      probability: opportunity.probability ?? 0,
      nextFollowUpAt: toDateTimeLocal(opportunity.nextFollowUpAt),
      lostReason: "",
    });
  }

  function closeModal() {
    if (loadingId) return;

    setSelected(null);
    setForm(null);
  }

  function updateForm<K extends keyof ModalForm>(key: K, value: ModalForm[K]) {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [key]: value,
      };
    });
  }

  function applyQuickStage(stage: string | null, probability: number) {
    if (!stage) return;

    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        stage,
        probability,
      };
    });
  }

  async function patchOpportunity(
    id: string,
    body: {
      stage?: string;
      amount?: string;
      probability?: number;
      lostReason?: string | null;
      nextFollowUpAt?: string | null;
    }
  ) {
    setLoadingId(id);
    setNotice(null);

    try {
      const response = await fetch(`/api/crm/opportunities/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erreur pendant la mise à jour.");
      }

      setNotice({
        type: "success",
        message: data.message || "Opportunité mise à jour.",
      });

      setSelected(null);
      setForm(null);
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l’opportunité.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  function submitModal() {
    if (!selected || !form) return;

    patchOpportunity(selected.id, {
      stage: form.stage,
      amount: form.amount,
      probability: Number(form.probability),
      nextFollowUpAt: fromDateTimeLocal(form.nextFollowUpAt),
      lostReason: form.lostReason.trim() || null,
    });
  }

  return (
    <div style={s.wrapper}>
      {notice && !selected && (
        <div
          style={{
            ...s.notice,
            ...(notice.type === "success" ? s.noticeSuccess : s.noticeError),
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          <span>{notice.message}</span>
        </div>
      )}

      <section style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <div style={s.sectionTitleRow}>
              <span style={s.sectionIcon}>
                <Target size={18} />
              </span>

              <h2 style={s.sectionTitle}>Pipeline commercial</h2>
            </div>

            <p style={s.sectionSubtitle}>
              Consultez les opportunités. Cliquez sur “Gérer” pour modifier
              l’étape, le montant, la probabilité ou la prochaine relance.
            </p>
          </div>
        </div>

        {sortedOpportunities.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>
              <Sparkles size={20} />
            </div>

            <p>Aucune opportunité pour le moment.</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Opportunité</th>
                  <th style={s.th}>Produit</th>
                  <th style={s.th}>Contact</th>
                  <th style={s.th}>Entreprise</th>
                  <th style={s.th}>Étape</th>
                  <th style={s.th}>Source</th>
                  <th style={s.th}>Montant</th>
                  <th style={s.th}>Probabilité</th>
                  <th style={s.th}>Créée le</th>
                  <th style={s.thRight}>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedOpportunities.map((opportunity) => {
                  const probability = clampProbability(
                    opportunity.probability || 0
                  );

                  return (
                    <tr
                      key={opportunity.id}
                      style={{
                        ...s.tr,
                        ...(isHotStage(opportunity.stage) ? s.trHot : {}),
                        ...(isWonStage(opportunity.stage) ? s.trSuccess : {}),
                        ...(isLostStage(opportunity.stage) ? s.trLost : {}),
                      }}
                    >
                      <td style={s.td}>
                        <div style={s.mainCell}>
                          <span style={s.name}>{opportunity.title}</span>

                          <div style={s.pillRow}>
                            {opportunity.requestType && (
                              <span style={s.requestBadge}>
                                {opportunity.requestType}
                              </span>
                            )}

                            {opportunity.offer?.title && (
                              <span style={s.offerBadge}>
                                {opportunity.offer.title}
                              </span>
                            )}
                          </div>

                          {opportunity.description && (
                            <span style={s.muted}>
                              {opportunity.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={s.td}>
                        {opportunity.product ? (
                          <div style={s.mainCell}>
                            <span style={s.inlineIconText}>
                              <Package size={14} />
                              {opportunity.product.name}
                            </span>

                            <span style={s.muted}>
                              {opportunity.product.slug}
                            </span>
                          </div>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        {opportunity.contact ? (
                          <div style={s.mainCell}>
                            <span style={s.inlineIconText}>
                              <UserRound size={14} />
                              {getContactName(opportunity.contact)}
                            </span>

                            <span style={s.inlineMutedText}>
                              <Mail size={13} />
                              {opportunity.contact.email}
                            </span>

                            {opportunity.contact.phone && (
                              <span style={s.inlineMutedText}>
                                <Phone size={13} />
                                {opportunity.contact.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        {opportunity.company?.name ? (
                          <span style={s.inlineIconText}>
                            <Building2 size={14} />
                            {opportunity.company.name}
                          </span>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            ...getStageStyle(opportunity.stage),
                          }}
                        >
                          {getStageLabel(stageOptions, opportunity.stage)}
                        </span>
                      </td>

                      <td style={s.td}>
                        <span style={s.sourceBadge}>
                          {getSourceLabel(opportunity.source)}
                        </span>
                      </td>

                      <td style={s.td}>
                        <div style={s.amountCell}>
                          <CircleDollarSign size={15} />
                          <strong>
                            {formatAmount(
                              opportunity.amount,
                              opportunity.currency
                            )}
                          </strong>
                        </div>
                      </td>

                      <td style={s.td}>
                        <div style={s.probabilityCell}>
                          <div style={s.progress}>
                            <span
                              style={{
                                ...s.progressFill,
                                width: `${probability}%`,
                              }}
                            />
                          </div>

                          <span style={s.probabilityText}>{probability}%</span>
                        </div>
                      </td>

                      <td style={s.td}>{formatDate(opportunity.createdAt)}</td>

                      <td style={s.tdRight}>
                        {canUpdate && (
                          <button
                            type="button"
                            style={s.manageButton}
                            onClick={() => openModal(opportunity)}
                          >
                            <Pencil size={14} />
                            Gérer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && form && (
        <div style={s.modalBackdrop} onMouseDown={closeModal}>
          <div
            style={s.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-opportunity-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <div>
                <p style={s.modalEyebrow}>Gestion opportunité</p>

                <h2 id="crm-opportunity-modal-title" style={s.modalTitle}>
                  {selected.title}
                </h2>

                <p style={s.modalSubtitle}>
                  Modifiez les informations commerciales dans cette fenêtre,
                  puis validez.
                </p>
              </div>

              <button
                type="button"
                style={s.modalClose}
                onClick={closeModal}
                disabled={Boolean(loadingId)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={s.modalSummary}>
                <SummaryItem label="Produit" value={selected.product?.name || "—"} />

                <SummaryItem
                  label="Contact"
                  value={
                    selected.contact ? getContactName(selected.contact) : "—"
                  }
                />

                <SummaryItem
                  label="Entreprise"
                  value={selected.company?.name || "—"}
                />

                <SummaryItem label="Source" value={getSourceLabel(selected.source)} />
              </div>

              <div style={s.quickActions}>
                {quickStages.contacted && (
                  <button
                    type="button"
                    style={s.quickButton}
                    onClick={() => applyQuickStage(quickStages.contacted, 25)}
                  >
                    Contacté
                  </button>
                )}

                {quickStages.qualified && (
                  <button
                    type="button"
                    style={s.quickButton}
                    onClick={() => applyQuickStage(quickStages.qualified, 50)}
                  >
                    Qualifier
                  </button>
                )}

                {quickStages.proposal && (
                  <button
                    type="button"
                    style={s.quickButtonOrange}
                    onClick={() => applyQuickStage(quickStages.proposal, 75)}
                  >
                    Proposition envoyée
                  </button>
                )}

                {quickStages.negotiation && (
                  <button
                    type="button"
                    style={s.quickButtonOrange}
                    onClick={() => applyQuickStage(quickStages.negotiation, 85)}
                  >
                    Négociation
                  </button>
                )}

                {quickStages.won && (
                  <button
                    type="button"
                    style={s.quickButtonSuccess}
                    onClick={() => applyQuickStage(quickStages.won, 100)}
                  >
                    Gagné
                  </button>
                )}

                {quickStages.lost && (
                  <button
                    type="button"
                    style={s.quickButtonDanger}
                    onClick={() => applyQuickStage(quickStages.lost, 0)}
                  >
                    Perdu
                  </button>
                )}
              </div>

              <div style={s.formGrid}>
                <label style={s.field}>
                  <span>Étape du pipeline</span>

                  <select
                    style={s.control}
                    value={form.stage}
                    onChange={(event) =>
                      updateForm("stage", event.target.value)
                    }
                  >
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={s.field}>
                  <span>Montant estimé</span>

                  <input
                    style={s.control}
                    type="number"
                    min="0"
                    step="1"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm("amount", event.target.value)
                    }
                    placeholder="Ex : 2500000"
                  />
                </label>

                <label style={s.field}>
                  <span>Probabilité</span>

                  <select
                    style={s.control}
                    value={form.probability}
                    onChange={(event) =>
                      updateForm("probability", Number(event.target.value))
                    }
                  >
                    {[0, 10, 25, 50, 75, 90, 100].map((value) => (
                      <option key={value} value={value}>
                        {value}%
                      </option>
                    ))}
                  </select>
                </label>

                <label style={s.field}>
                  <span>Prochaine relance</span>

                  <input
                    style={s.control}
                    type="datetime-local"
                    value={form.nextFollowUpAt}
                    onChange={(event) =>
                      updateForm("nextFollowUpAt", event.target.value)
                    }
                  />
                </label>
              </div>

              <div style={s.modalProgressBox}>
                <div style={s.modalProgressHead}>
                  <span>Probabilité actuelle</span>
                  <strong>{clampProbability(Number(form.probability))}%</strong>
                </div>

                <div style={s.progress}>
                  <span
                    style={{
                      ...s.progressFill,
                      width: `${clampProbability(Number(form.probability))}%`,
                    }}
                  />
                </div>
              </div>

              {isLostStage(form.stage) && (
                <label style={s.field}>
                  <span>Raison de perte</span>

                  <textarea
                    style={{
                      ...s.control,
                      ...s.textarea,
                    }}
                    value={form.lostReason}
                    onChange={(event) =>
                      updateForm("lostReason", event.target.value)
                    }
                    placeholder="Ex : budget insuffisant, pas de besoin immédiat, concurrent choisi..."
                  />
                </label>
              )}

              {notice?.type === "error" && (
                <div style={{ ...s.notice, ...s.noticeError }}>
                  <AlertTriangle size={17} />
                  <span>{notice.message}</span>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button
                type="button"
                style={s.cancelButton}
                onClick={closeModal}
                disabled={Boolean(loadingId)}
              >
                Annuler
              </button>

              <button
                type="button"
                style={{
                  ...s.submitButton,
                  opacity: loadingId === selected.id ? 0.6 : 1,
                }}
                onClick={submitModal}
                disabled={loadingId === selected.id}
              >
                {loadingId === selected.id ? (
                  <>
                    <Loader2 size={16} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.summaryItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_DARK = "#92400E";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT = "#9CA3AF";
const BORDER = "#E5E7EB";

const s: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 16,
  },

  notice: {
    padding: "12px 14px",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
  },

  noticeSuccess: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },

  noticeError: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
  },

  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  sectionTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  sectionSubtitle: {
    margin: "6px 0 0 43px",
    color: MUTED,
    fontSize: 13,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
  },

  table: {
    width: "100%",
    minWidth: 1180,
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    padding: "13px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  thRight: {
    padding: "13px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tr: {
    background: "#FFFFFF",
  },

  trHot: {
    background: "#FFFCF7",
  },

  trSuccess: {
    background: "#FBFFFC",
  },

  trLost: {
    background: "#FFFBFB",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
  },

  tdRight: {
    padding: "14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
    textAlign: "right",
  },

  mainCell: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  name: {
    color: TEXT,
    fontWeight: 900,
  },

  muted: {
    color: SOFT,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.4,
  },

  inlineIconText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: TEXT,
    fontWeight: 800,
  },

  inlineMutedText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: SOFT,
    fontSize: 12,
    fontWeight: 600,
  },

  pillRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  badge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  requestBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: 999,
    color: "#475569",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  offerBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: 999,
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  sourceBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#475569",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  amountCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: TEXT,
  },

  probabilityCell: {
    display: "grid",
    gap: 6,
    minWidth: 120,
  },

  progress: {
    height: 9,
    width: "100%",
    borderRadius: 999,
    background: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    display: "block",
    height: "100%",
    borderRadius: 999,
    background: ORANGE,
  },

  probabilityText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 900,
  },

  manageButton: {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  empty: {
    minHeight: 230,
    borderRadius: 18,
    background: "#F9FAFB",
    border: `1px dashed ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: MUTED,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    padding: 24,
    background: "rgba(15, 23, 42, 0.48)",
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    width: "min(960px, 100%)",
    background: "#F8FAFC",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
    border: "1px solid rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    background:
      "linear-gradient(135deg, #111827 0%, #1F2937 58%, #2B1804 100%)",
  },

  modalEyebrow: {
    margin: "0 0 6px",
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  modalTitle: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  modalSubtitle: {
    margin: "8px 0 0",
    maxWidth: 620,
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 1.6,
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  modalBody: {
    padding: 22,
    display: "grid",
    gap: 16,
  },

  modalSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  summaryItem: {
    padding: 14,
    borderRadius: 16,
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  quickActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  quickButton: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonOrange: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #FED7AA",
    background: "#FFF7ED",
    color: "#9A3412",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonSuccess: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #BBF7D0",
    background: "#DCFCE7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonDanger: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#991B1B",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  control: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    minHeight: 92,
    padding: 12,
    resize: "vertical",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  modalProgressBox: {
    padding: 14,
    borderRadius: 16,
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    display: "grid",
    gap: 10,
  },

  modalProgressHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  modalFooter: {
    padding: 22,
    borderTop: `1px solid ${BORDER}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    background: "#FFFFFF",
  },

  cancelButton: {
    height: 42,
    padding: "0 15px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  submitButton: {
    height: 42,
    padding: "0 15px",
    borderRadius: 12,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
};