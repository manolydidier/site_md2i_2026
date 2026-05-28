"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Send, X } from "lucide-react";

import { createCrmMarketingCampaign } from "./actions";
import CampaignRichTextField from "./CampaignRichTextField";
import styles from "./CampaignChannels.module.css";

type EmailCampaignOption = {
  id: string;
  name: string;
  status: string;
};

type ChannelOption = {
  value: string;
  label: string;
  className: string;
};

type CampaignCreateModalProps = {
  emailCampaigns: EmailCampaignOption[];
  channels: ChannelOption[];
};

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    READY: "Pret",
    SCHEDULED: "Planifie",
    PUBLISHED: "Publie",
    FAILED: "Erreur",
    CANCELLED: "Annule",
    ACTIVE: "Active",
    PAUSED: "En pause",
    COMPLETED: "Terminee",
    ARCHIVED: "Archivee",
  };

  return labels[value] || value;
}

export default function CampaignCreateModal({
  emailCampaigns,
  channels,
}: CampaignCreateModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="crm-marketing-submit crm-marketing-modal-trigger"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        Nouvelle campagne
      </button>

      {mounted && open
        ? createPortal(
            <>
              <div
                className="crm-custom-modal-backdrop"
                onClick={closeModal}
                aria-hidden="true"
              />

              <div
                className="crm-custom-modal-shell"
                role="dialog"
                aria-modal="true"
                aria-labelledby="crm-create-campaign-title"
              >
                <div
                  ref={modalRef}
                  className="crm-custom-modal-card crm-custom-modal-card-large"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="crm-modal-head">
                    <div>
                      <p>Nouvelle campagne</p>
                      <h2 id="crm-create-campaign-title">
                        Publication + lien suivi
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="crm-modal-close"
                      onClick={closeModal}
                      aria-label="Fermer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form
                    action={createCrmMarketingCampaign}
                    className="crm-modal-form"
                  >
                    <label className="crm-marketing-field" htmlFor="name">
                      <span>Nom de campagne</span>
                      <input
                        id="name"
                        name="name"
                        required
                        placeholder="Relance SARA LinkedIn"
                      />
                    </label>

                    <label className="crm-marketing-field" htmlFor="audience">
                      <span>Audience</span>
                      <input
                        id="audience"
                        name="audience"
                        placeholder="DG, DAF, responsables operationnels"
                      />
                    </label>

                    <label className="crm-marketing-field" htmlFor="objective">
                      <span>Objectif</span>
                      <textarea
                        id="objective"
                        name="objective"
                        rows={3}
                        placeholder="Generer des demandes de demo qualifiees."
                      />
                    </label>

                    <fieldset
                      className={`${styles.channelField} crm-marketing-field`}
                    >
                      <legend className={styles.channelLegend}>
                        Canaux de publication
                      </legend>

                      <div className={styles.channelCheckboxes}>
                        {channels
                          .filter((channel) => channel.value !== "OTHER")
                          .map((channel) => (
                            <label
                              key={channel.value}
                              className={`${styles.channelCheckbox} ${channel.className}`}
                            >
                              <input
                                type="checkbox"
                                name="channels"
                                value={channel.value}
                                defaultChecked={channel.value === "LINKEDIN"}
                              />

                              <span className={styles.channelName}>
                                {channel.label}
                              </span>
                            </label>
                          ))}
                      </div>

                      <p className={styles.channelHelp}>
                        Une publication et un lien suivi seront crees pour
                        chaque canal selectionne.
                      </p>
                    </fieldset>

                    <label
                      className="crm-marketing-field"
                      htmlFor="scheduledAt"
                    >
                      <span>Planification</span>
                      <input
                        id="scheduledAt"
                        name="scheduledAt"
                        type="datetime-local"
                      />
                    </label>

                    <label
                      className="crm-marketing-field"
                      htmlFor="publicationTitle"
                    >
                      <span>Titre de publication</span>
                      <input
                        id="publicationTitle"
                        name="publicationTitle"
                        required
                        placeholder="Modernisez votre suivi terrain"
                      />
                    </label>

                    <CampaignRichTextField
                      name="content"
                      label="Contenu"
                      placeholder="Rédigez votre publication, ajoutez une image ou une mise en forme."
                      minHeight={220}
                    />

                    <div className="crm-marketing-field-row">
                      <label
                        className="crm-marketing-field"
                        htmlFor="destinationUrl"
                      >
                        <span>Lien cible</span>
                        <input
                          id="destinationUrl"
                          name="destinationUrl"
                          required
                          defaultValue="/contact-commercial"
                        />
                      </label>

                      <label
                        className="crm-marketing-field"
                        htmlFor="ctaLabel"
                      >
                        <span>CTA</span>
                        <input
                          id="ctaLabel"
                          name="ctaLabel"
                          placeholder="Demander une demo"
                        />
                      </label>
                    </div>

                    <label
                      className="crm-marketing-field"
                      htmlFor="emailCampaignId"
                    >
                      <span>Campagne email liee</span>
                      <select
                        id="emailCampaignId"
                        name="emailCampaignId"
                        defaultValue=""
                      >
                        <option value="">Aucune</option>
                        {emailCampaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name} - {formatStatus(campaign.status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="crm-modal-actions">
                      <button
                        type="button"
                        className="crm-marketing-action"
                        onClick={closeModal}
                      >
                        Annuler
                      </button>

                      <button type="submit" className="crm-marketing-submit">
                        <Send size={16} />
                        Creer la campagne
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}