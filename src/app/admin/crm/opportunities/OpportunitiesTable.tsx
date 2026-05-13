"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

function getStageClass(stage: string) {
  if (["WON", "CLOSED_WON"].includes(stage)) return "crm-badge-green";
  if (["LOST", "CLOSED_LOST"].includes(stage)) return "crm-badge-red";

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
    return "crm-badge-orange";
  }

  if (["QUALIFIED", "QUALIFICATION"].includes(stage)) return "crm-badge-blue";

  return "";
}

function isLostStage(stage: string) {
  return ["LOST", "CLOSED_LOST"].includes(stage);
}

export default function OpportunitiesTable({
  opportunities,
  stageOptions,
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

  if (opportunities.length === 0) {
    return (
      <div className="crm-card crm-section">
        <div className="crm-empty">Aucune opportunité pour le moment.</div>
      </div>
    );
  }

  return (
    <div className="crm-grid">
      {notice && (
        <div
          className={
            notice.type === "success"
              ? "crm-notice crm-notice-success"
              : "crm-notice crm-notice-error"
          }
        >
          {notice.message}
        </div>
      )}

      <div className="crm-card crm-section">
        <div className="crm-section-head">
          <div>
            <h2 className="crm-section-title">Pipeline commercial</h2>
            <p className="crm-section-subtitle">
              Consultez les opportunités. Cliquez sur “Gérer” pour modifier
              l’étape, le montant, la probabilité ou la prochaine relance.
            </p>
          </div>
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Opportunité</th>
                <th>Produit</th>
                <th>Contact</th>
                <th>Entreprise</th>
                <th>Étape</th>
                <th>Source</th>
                <th>Montant</th>
                <th>Probabilité</th>
                <th>Créée le</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td>
                    <div className="crm-name">{opportunity.title}</div>

                    {opportunity.requestType && (
                      <div className="crm-muted">
                        Type : {opportunity.requestType}
                      </div>
                    )}

                    {opportunity.description && (
                      <div className="crm-muted crm-small-text">
                        {opportunity.description}
                      </div>
                    )}
                  </td>

                  <td>
                    {opportunity.product ? (
                      <>
                        <div className="crm-name">
                          {opportunity.product.name}
                        </div>
                        <div className="crm-muted">
                          {opportunity.product.slug}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {opportunity.contact ? (
                      <>
                        <div className="crm-name">
                          {getContactName(opportunity.contact)}
                        </div>
                        <div className="crm-muted">
                          {opportunity.contact.email}
                        </div>
                        {opportunity.contact.phone && (
                          <div className="crm-muted">
                            {opportunity.contact.phone}
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{opportunity.company?.name || "—"}</td>

                  <td>
                    <span
                      className={`crm-badge ${getStageClass(
                        opportunity.stage
                      )}`}
                    >
                      {getStageLabel(stageOptions, opportunity.stage)}
                    </span>
                  </td>

                  <td>{opportunity.source}</td>

                  <td>
                    <div className="crm-name">
                      {formatAmount(opportunity.amount, opportunity.currency)}
                    </div>
                  </td>

                  <td>
                    <div className="crm-action-stack">
                      <div className="crm-progress">
                        <span
                          style={{
                            width: `${Math.min(
                              Math.max(opportunity.probability || 0, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="crm-muted">
                        {opportunity.probability || 0}%
                      </div>
                    </div>
                  </td>

                  <td>{formatDate(opportunity.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className="crm-mini-button crm-mini-button-primary"
                      onClick={() => openModal(opportunity)}
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && form && (
        <div className="crm-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="crm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-opportunity-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="crm-modal-header">
              <div>
                <p className="crm-modal-eyebrow">Gestion opportunité</p>

                <h2 id="crm-opportunity-modal-title" className="crm-modal-title">
                  {selected.title}
                </h2>

                <p className="crm-modal-subtitle">
                  Modifiez les informations commerciales dans cette fenêtre,
                  puis validez.
                </p>
              </div>

              <button
                type="button"
                className="crm-modal-close"
                onClick={closeModal}
                disabled={Boolean(loadingId)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="crm-modal-body">
              <div className="crm-modal-summary">
                <div>
                  <span>Produit</span>
                  <strong>{selected.product?.name || "—"}</strong>
                </div>

                <div>
                  <span>Contact</span>
                  <strong>
                    {selected.contact
                      ? getContactName(selected.contact)
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Entreprise</span>
                  <strong>{selected.company?.name || "—"}</strong>
                </div>

                <div>
                  <span>Source</span>
                  <strong>{selected.source}</strong>
                </div>
              </div>

              <div className="crm-modal-quick-actions">
                {quickStages.contacted && (
                  <button
                    type="button"
                    className="crm-mini-button crm-mini-button-secondary"
                    onClick={() => applyQuickStage(quickStages.contacted, 25)}
                  >
                    Marquer contacté
                  </button>
                )}

                {quickStages.qualified && (
                  <button
                    type="button"
                    className="crm-mini-button crm-mini-button-secondary"
                    onClick={() => applyQuickStage(quickStages.qualified, 50)}
                  >
                    Qualifier
                  </button>
                )}

                {quickStages.proposal && (
                  <button
                    type="button"
                    className="crm-mini-button crm-mini-button-secondary"
                    onClick={() => applyQuickStage(quickStages.proposal, 75)}
                  >
                    Proposition envoyée
                  </button>
                )}

                {quickStages.negotiation && (
                  <button
                    type="button"
                    className="crm-mini-button crm-mini-button-secondary"
                    onClick={() => applyQuickStage(quickStages.negotiation, 85)}
                  >
                    Négociation
                  </button>
                )}

                {quickStages.won && (
                  <button
                    type="button"
                    className="crm-mini-button"
                    onClick={() => applyQuickStage(quickStages.won, 100)}
                  >
                    Gagné
                  </button>
                )}

                {quickStages.lost && (
                  <button
                    type="button"
                    className="crm-mini-button crm-mini-button-danger"
                    onClick={() => applyQuickStage(quickStages.lost, 0)}
                  >
                    Perdu
                  </button>
                )}
              </div>

              <div className="crm-modal-form-grid">
                <label className="crm-modal-field">
                  <span>Étape du pipeline</span>
                  <select
                    className="crm-control"
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

                <label className="crm-modal-field">
                  <span>Montant estimé</span>
                  <input
                    className="crm-control"
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

                <label className="crm-modal-field">
                  <span>Probabilité</span>
                  <select
                    className="crm-control"
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

                <label className="crm-modal-field">
                  <span>Prochaine relance</span>
                  <input
                    className="crm-control"
                    type="datetime-local"
                    value={form.nextFollowUpAt}
                    onChange={(event) =>
                      updateForm("nextFollowUpAt", event.target.value)
                    }
                  />
                </label>
              </div>

              {isLostStage(form.stage) && (
                <label className="crm-modal-field">
                  <span>Raison de perte</span>
                  <textarea
                    className="crm-control crm-modal-textarea"
                    value={form.lostReason}
                    onChange={(event) =>
                      updateForm("lostReason", event.target.value)
                    }
                    placeholder="Ex : budget insuffisant, pas de besoin immédiat, concurrent choisi..."
                  />
                </label>
              )}

              {notice?.type === "error" && (
                <div className="crm-notice crm-notice-error">
                  {notice.message}
                </div>
              )}
            </div>

            <div className="crm-modal-footer">
              <button
                type="button"
                className="crm-modal-cancel"
                onClick={closeModal}
                disabled={Boolean(loadingId)}
              >
                Annuler
              </button>

              <button
                type="button"
                className="crm-modal-submit"
                onClick={submitModal}
                disabled={loadingId === selected.id}
              >
                {loadingId === selected.id
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}