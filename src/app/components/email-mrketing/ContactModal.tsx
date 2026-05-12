// components/email-marketing/ContactModal.tsx
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
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phone: contact.phone || "",
        groupId: contact.groupId || "",
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
                  ? "Mettez à jour les informations du contact."
                  : "Ajoutez un nouveau destinataire à votre liste."}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
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
              <input
                type="text"
                {...register("firstName")}
                placeholder="Jean"
              />
            </div>

            <div className="field-group">
              <label>Nom</label>
              <input
                type="text"
                {...register("lastName")}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Téléphone</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+33 6 00 00 00 00"
            />
          </div>

          <div className="field-group">
            <label>Groupe</label>

            <select {...register("groupId")}>
              <option value="">Sans groupe</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
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
          max-width: 460px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
          overflow: hidden;
        }

        .modal-header {
          min-height: 76px;
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
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
          display: flex;
          flex-direction: column;
          gap: 14px;
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
        .field-group select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border-radius: 11px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          outline: none;
          font-size: 14px;
          transition: 0.15s ease;
        }

        .field-group input::placeholder {
          color: #9ca3af;
        }

        .field-group input:focus,
        .field-group select:focus {
          border-color: rgba(239, 159, 39, 0.55);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.1);
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

        @media (max-width: 520px) {
          .contact-backdrop {
            align-items: flex-end;
            padding: 12px;
          }

          .contact-modal {
            max-width: none;
            border-radius: 18px;
          }

          .field-grid,
          .modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}