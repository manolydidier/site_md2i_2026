"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/app/lib/email/schemas";
import { useContacts, useGroups } from "@/app/hooks/useEmailMarketing";
import type { Contact, ContactFormData } from "@/app/types/email-marketing";
import { X, UserPlus } from "lucide-react";

interface ContactModalProps {
  contact?: Contact | null;
  onClose: () => void;
  onSave: () => void;
}

const CRM_STATUSES = [
  { value: "NEW", label: "Nouveau" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "HOT_PROSPECT", label: "Prospect chaud" },
  { value: "CUSTOMER", label: "Client" },
  { value: "PARTNER", label: "Partenaire" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "LOST", label: "Perdu" },
];

const CRM_SOURCES = [
  { value: "MANUAL", label: "Manuel" },
  { value: "WEBSITE", label: "Site web" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "EMAIL_CAMPAIGN", label: "Campagne email" },
  { value: "GOOGLE", label: "Google" },
  { value: "DIRECT", label: "Direct" },
  { value: "TENDER", label: "Appel d’offre" },
  { value: "REFERRAL", label: "Recommandation" },
  { value: "OTHER", label: "Autre" },
];

export function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const { groups } = useGroups();
  const { createContact, updateContact } = useContacts();
  const isEdit = Boolean(contact);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: contact?.email || "",
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      phone: contact?.phone || "",
      groupId: contact?.groupId || "",

      jobTitle: contact?.jobTitle || "",
      companyName: contact?.companyName || "",
      country: contact?.country || "",
      city: contact?.city || "",
      notes: contact?.notes || "",

      crmStatus: contact?.crmStatus || "NEW",
      crmSource: contact?.crmSource || "MANUAL",

      isActive: contact?.isActive ?? true,
      unsubscribed: contact?.unsubscribed ?? false,
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        email: contact.email || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phone: contact.phone || "",
        groupId: contact.groupId || "",

        jobTitle: contact.jobTitle || "",
        companyName: contact.companyName || "",
        country: contact.country || "",
        city: contact.city || "",
        notes: contact.notes || "",

        crmStatus: contact.crmStatus || "NEW",
        crmSource: contact.crmSource || "MANUAL",

        isActive: contact.isActive ?? true,
        unsubscribed: contact.unsubscribed ?? false,
      });
    }
  }, [contact, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (isEdit && contact) {
        await updateContact(contact.id, data);
      } else {
        await createContact(data);
      }

      onSave();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="contact-backdrop">
      <div className="contact-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon">
              <UserPlus className="h-4 w-4" />
            </div>

            <div>
              <h3>{isEdit ? "Modifier le contact" : "Ajouter un contact"}</h3>
              <p>
                {isEdit
                  ? "Mettez à jour les informations commerciales et CRM."
                  : "Ajoutez un contact avec ses informations CRM."}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-section">
            <p className="section-title">Identité</p>

            <div className="field-group">
              <label>
                Email <span>*</span>
              </label>

              <input
                type="email"
                {...register("email")}
                placeholder="contact@exemple.com"
              />

              {errors.email && <p className="error">{errors.email.message}</p>}
            </div>

            <div className="field-grid">
              <div className="field-group">
                <label>Prénom</label>
                <input type="text" {...register("firstName")} placeholder="Jean" />
              </div>

              <div className="field-group">
                <label>Nom</label>
                <input type="text" {...register("lastName")} placeholder="Dupont" />
              </div>
            </div>

            <div className="field-grid">
              <div className="field-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+261 34 00 000 00"
                />
              </div>

              <div className="field-group">
                <label>Fonction</label>
                <input
                  type="text"
                  {...register("jobTitle")}
                  placeholder="Responsable RH, DAF..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <p className="section-title">Entreprise & localisation</p>

            <div className="field-group">
              <label>Entreprise</label>
              <input
                type="text"
                {...register("companyName")}
                placeholder="Nom de l’entreprise"
              />
            </div>

            <div className="field-grid">
              <div className="field-group">
                <label>Pays</label>
                <input
                  type="text"
                  {...register("country")}
                  placeholder="Madagascar, France..."
                />
              </div>

              <div className="field-group">
                <label>Ville</label>
                <input
                  type="text"
                  {...register("city")}
                  placeholder="Antananarivo..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <p className="section-title">CRM & segmentation</p>

            <div className="field-grid">
              <div className="field-group">
                <label>Statut CRM</label>

                <select {...register("crmStatus")}>
                  {CRM_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Source</label>

                <select {...register("crmSource")}>
                  {CRM_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>Groupe email marketing</label>

              <select {...register("groupId")}>
                <option value="">Sans groupe</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <p className="section-title">Préférences email</p>

            <div className="checkbox-grid">
              <label className="check-row">
                <input type="checkbox" {...register("isActive")} />
                <span>Contact actif</span>
              </label>

              <label className="check-row">
                <input type="checkbox" {...register("unsubscribed")} />
                <span>Désabonné des emails</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <p className="section-title">Notes internes</p>

            <div className="field-group">
              <textarea
                {...register("notes")}
                placeholder="Informations commerciales, historique, contexte du contact..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Annuler
            </button>

            <button type="submit" disabled={isSubmitting} className="primary-btn">
              {isSubmitting
                ? "Enregistrement..."
                : isEdit
                  ? "Mettre à jour"
                  : "Ajouter"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .contact-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          padding: 20px;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .contact-modal {
          width: 100%;
          max-width: 760px;
          max-height: calc(100vh - 40px);
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          min-height: 76px;
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-shrink: 0;
        }

        .modal-title-row {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef9f27;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.22);
        }

        .modal-header h3 {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.35;
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
          transition: 0.15s ease;
        }

        .icon-btn:hover {
          color: #111827;
          background: #f9fafb;
        }

        .modal-form {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-section {
          padding: 16px;
          border: 1px solid #f1f5f9;
          background: #ffffff;
          border-radius: 14px;
        }

        .section-title {
          margin: 0 0 14px;
          color: #92400e;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 12px;
        }

        .field-group:last-child {
          margin-bottom: 0;
        }

        .field-group label {
          color: #374151;
          font-size: 12px;
          font-weight: 800;
        }

        .field-group label span {
          color: #ef4444;
        }

        .field-group input,
        .field-group select,
        .field-group textarea {
          width: 100%;
          border-radius: 11px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          outline: none;
          font-size: 14px;
          transition: 0.15s ease;
          font-family: Arial, Helvetica, sans-serif;
        }

        .field-group input,
        .field-group select {
          height: 42px;
          padding: 0 12px;
        }

        .field-group textarea {
          min-height: 96px;
          padding: 12px;
          resize: vertical;
        }

        .field-group input::placeholder,
        .field-group textarea::placeholder {
          color: #9ca3af;
        }

        .field-group input:focus,
        .field-group select:focus,
        .field-group textarea:focus {
          border-color: rgba(239, 159, 39, 0.55);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.1);
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .check-row {
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid #e5e7eb;
          border-radius: 11px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #374151;
          font-size: 13px;
          font-weight: 800;
        }

        .check-row input {
          width: 15px;
          height: 15px;
          accent-color: #ef9f27;
        }

        .error {
          margin: 0;
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding-top: 4px;
        }

        .secondary-btn,
        .primary-btn {
          height: 42px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .secondary-btn {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #374151;
        }

        .secondary-btn:hover {
          background: #f9fafb;
        }

        .primary-btn {
          border: 1px solid rgba(239, 159, 39, 0.28);
          background: #ef9f27;
          color: #1a0d00;
        }

        .primary-btn:hover {
          background: #e8911f;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .contact-backdrop {
            align-items: flex-end;
            padding: 12px;
          }

          .contact-modal {
            max-width: none;
            max-height: calc(100vh - 24px);
            border-radius: 18px;
          }

          .field-grid,
          .checkbox-grid,
          .modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}