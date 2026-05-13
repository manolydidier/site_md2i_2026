"use client";

import { useState } from "react";
import { useContacts, useGroups } from "@/app/hooks/useEmailMarketing";
import { ContactModal } from "./ContactModal";
import { ImportContactsModal } from "./ImportContactsmodal";
import type { Contact } from "@/app/types/email-marketing";
import {
  Search,
  Plus,
  Trash2,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Users,
  Filter,
} from "lucide-react";

import styles from "./ContactsTable.module.css";

function getContactName(contact: Contact) {
  const name = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Sans nom";
}

function getCrmStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    NEW: "Nouveau",
    PROSPECT: "Prospect",
    HOT_PROSPECT: "Chaud",
    CUSTOMER: "Client",
    PARTNER: "Partenaire",
    INACTIVE: "Inactif",
    LOST: "Perdu",
  };

  return labels[status || ""] || status || "—";
}

function getCrmSourceLabel(source?: string | null) {
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

  return labels[source || ""] || source || "—";
}

export function ContactsTable() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string>("");

  const { groups } = useGroups();

  const {
    contacts,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    loading,
    deleteContact,
    deleteMany,
    refetch,
  } = useContacts({ groupId: filterGroupId || undefined });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((contact) => contact.id)));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} contact(s) ?`)) return;

    await deleteMany([...selectedIds]);
    setSelectedIds(new Set());
    refetch();
  };

  const handleDeleteOne = async (contact: Contact) => {
    if (!confirm(`Supprimer "${contact.email}" ?`)) return;

    await deleteContact(contact.id);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(contact.id);
      return next;
    });

    refetch();
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({
      format,
      ...(filterGroupId ? { groupId: filterGroupId } : {}),
    });

    window.open(`/api/contacts/export?${params}`);
  };

  const startPage = Math.max(
    1,
    Math.min(page - 2, Math.max(1, totalPages - 4))
  );

  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => startPage + i
  ).filter((p) => p <= totalPages);

  return (
    <div className={styles.contactsTable}>
      <div className={styles.contactsHead}>
        <div>
          <div className={styles.sectionLabel}>Contacts CRM</div>
          <p>{total.toLocaleString("fr-FR")} contact(s) au total</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            <Upload size={16} />
            Importer
          </button>

          <div className={styles.exportWrap}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              <Download size={16} />
              Exporter
            </button>

            <div className={styles.exportMenu}>
              <button type="button" onClick={() => handleExport("csv")}>
                CSV
              </button>
              <button type="button" onClick={() => handleExport("xlsx")}>
                Excel (.xlsx)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.inputIcon} />
          <input
            type="text"
            placeholder="Rechercher par email, prénom, nom, entreprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.selectBox}>
          <Filter size={16} className={styles.inputIcon} />
          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
          >
            <option value="">Tous les groupes</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group._count?.contacts ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedIds.size} sélectionné(s)</span>

          <button type="button" onClick={handleDeleteMany}>
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th className={styles.checkCell}>
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === contacts.length && contacts.length > 0
                  }
                  onChange={toggleAll}
                  className={styles.checkbox}
                />
              </th>
              <th>Contact</th>
              <th>Entreprise</th>
              <th>Localisation</th>
              <th>CRM</th>
              <th>Groupe</th>
              <th>Emailing</th>
              <th>Ajouté le</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <div className={styles.emptyState}>
                    <div className={styles.spinner} />
                    <p>Chargement des contacts...</p>
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <Users size={28} />
                    </div>
                    <h3>Aucun contact trouvé</h3>
                    <p>Ajoutez ou importez vos premiers contacts.</p>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className={styles.checkCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className={styles.checkbox}
                    />
                  </td>

                  <td>
                    <div className={styles.contactBlock}>
                      <span className={styles.contactName}>
                        {getContactName(contact)}
                      </span>

                      <span className={styles.email}>{contact.email}</span>

                      {contact.phone && (
                        <span className={styles.muted}>{contact.phone}</span>
                      )}

                      {contact.jobTitle && (
                        <span className={styles.jobTitle}>
                          {contact.jobTitle}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    {contact.companyName ? (
                      <div className={styles.companyBlock}>
                        <span>{contact.companyName}</span>
                      </div>
                    ) : contact.crmCompany?.name ? (
                      <div className={styles.companyBlock}>
                        <span>{contact.crmCompany.name}</span>
                      </div>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>

                  <td>
                    {contact.city || contact.country ? (
                      <div className={styles.locationBlock}>
                        {contact.city && <span>{contact.city}</span>}
                        {contact.country && (
                          <span className={styles.muted}>{contact.country}</span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>

                  <td>
                    <div className={styles.crmMeta}>
                      <span className={`${styles.status} ${styles.statusBlue}`}>
                        {getCrmStatusLabel(contact.crmStatus)}
                      </span>

                      <span className={styles.sourcePill}>
                        {getCrmSourceLabel(contact.crmSource)}
                      </span>
                    </div>
                  </td>

                  <td>
                    {contact.group ? (
                      <span className={styles.groupPill}>
                        {contact.group.name}
                      </span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>

                  <td>
                    {contact.unsubscribed ? (
                      <span className={`${styles.status} ${styles.statusRed}`}>
                        Désabonné
                      </span>
                    ) : contact.isActive ? (
                      <span
                        className={`${styles.status} ${styles.statusGreen}`}
                      >
                        Actif
                      </span>
                    ) : (
                      <span className={`${styles.status} ${styles.statusGray}`}>
                        Inactif
                      </span>
                    )}
                  </td>

                  <td>
                    <span className={styles.date}>
                      {new Date(contact.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </td>

                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        onClick={() => setEditingContact(contact)}
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOne(contact)}
                        title="Supprimer"
                        className={styles.danger}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <p>
            Page {page} sur {totalPages} ·{" "}
            {total.toLocaleString("fr-FR")} contacts
          </p>

          <div className={styles.paginationActions}>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={styles.pageBtn}
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`${styles.pageNumber} ${
                  p === page ? styles.active : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={styles.pageBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {(showAddModal || editingContact) && (
        <ContactModal
          contact={editingContact}
          onClose={() => {
            setShowAddModal(false);
            setEditingContact(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingContact(null);
            refetch();
          }}
        />
      )}

      {showImportModal && (
        <ImportContactsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}