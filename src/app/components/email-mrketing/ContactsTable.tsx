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
  RotateCcw,
  Loader2,
} from "lucide-react";

import styles from "./ContactsTable.module.css";

type TableContact = Contact & {
  groupId?: string | null;
  notes?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  isActive?: boolean;
  unsubscribed?: boolean;
  crmStatus?: string | null;
  crmSource?: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
};

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

const CRM_STATUS_OPTIONS = [
  { value: "NEW", label: "Nouveau" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "HOT_PROSPECT", label: "Prospect chaud" },
  { value: "CUSTOMER", label: "Client" },
  { value: "PARTNER", label: "Partenaire" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "LOST", label: "Perdu" },
];

const CRM_SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "Site web" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "EMAIL_CAMPAIGN", label: "Email" },
  { value: "GOOGLE", label: "Google" },
  { value: "DIRECT", label: "Direct" },
  { value: "TENDER", label: "Appel d’offre" },
  { value: "REFERRAL", label: "Recommandation" },
  { value: "MANUAL", label: "Manuel" },
  { value: "OTHER", label: "Autre" },
];

function buildContactUpdatePayload(contact: TableContact, nextCrmStatus: string) {
  return {
    email: contact.email,
    firstName: contact.firstName || null,
    lastName: contact.lastName || null,
    phone: contact.phone || null,

    groupId: contact.group?.id || contact.groupId || null,

    jobTitle: contact.jobTitle || null,
    companyName: contact.companyName || null,
    country: contact.country || null,
    city: contact.city || null,
    notes: contact.notes || null,

    crmStatus: nextCrmStatus,
    crmSource: contact.crmSource || "MANUAL",

    isActive: contact.isActive ?? true,
    unsubscribed: contact.unsubscribed ?? false,
  };
}

export function ContactsTable() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filterGroupId, setFilterGroupId] = useState<string>("");
  const [filterCrmStatus, setFilterCrmStatus] = useState<string>("");
  const [filterCrmSource, setFilterCrmSource] = useState<string>("");

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);

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
    error,
    deleteContact,
    deleteMany,
    refetch,
  } = useContacts({
    groupId: filterGroupId || undefined,
    crmStatus: filterCrmStatus || undefined,
    crmSource: filterCrmSource || undefined,
  });

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filterGroupId) ||
    Boolean(filterCrmStatus) ||
    Boolean(filterCrmSource);

  const selectedVisibleCount = contacts.filter((contact) =>
    selectedIds.has(contact.id)
  ).length;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleGroupChange = (value: string) => {
    setFilterGroupId(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleStatusChange = (value: string) => {
    setFilterCrmStatus(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSourceChange = (value: string) => {
    setFilterCrmSource(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setSearch("");
    setFilterGroupId("");
    setFilterCrmStatus("");
    setFilterCrmSource("");
    setPage(1);
    setSelectedIds(new Set());
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSelectedIds(new Set());
  };

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
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (selectedVisibleCount === contacts.length && contacts.length > 0) {
        contacts.forEach((contact) => {
          next.delete(contact.id);
        });
      } else {
        contacts.forEach((contact) => {
          next.add(contact.id);
        });
      }

      return next;
    });
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

  const handleQuickStatusChange = async (
    contact: TableContact,
    nextCrmStatus: string
  ) => {
    if (!nextCrmStatus || nextCrmStatus === contact.crmStatus) return;

    setUpdatingStatusId(contact.id);
    setQuickActionError(null);

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildContactUpdatePayload(contact, nextCrmStatus)),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Impossible de changer le statut de ${contact.email}.`
        );
      }

      await refetch();
    } catch (err) {
      setQuickActionError(
        err instanceof Error
          ? err.message
          : "Erreur lors du changement de statut CRM."
      );

      await refetch();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({
      format,
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (filterGroupId) {
      params.set("groupId", filterGroupId);
    }

    if (filterCrmStatus) {
      params.set("crmStatus", filterCrmStatus);
    }

    if (filterCrmSource) {
      params.set("crmSource", filterCrmSource);
    }

    window.open(`/api/contacts/export?${params.toString()}`);
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

          <p>
            {hasActiveFilters
              ? `${total.toLocaleString("fr-FR")} contact(s) trouvé(s)`
              : `${total.toLocaleString("fr-FR")} contact(s) au total`}
          </p>
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.selectBox}>
          <Filter size={16} className={styles.inputIcon} />

          <select
            value={filterGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            <option value="">Tous les groupes</option>

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group._count?.contacts ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBox}>
          <Filter size={16} className={styles.inputIcon} />

          <select
            value={filterCrmStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Tous les statuts</option>

            {CRM_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBox}>
          <Filter size={16} className={styles.inputIcon} />

          <select
            value={filterCrmSource}
            onChange={(e) => handleSourceChange(e.target.value)}
          >
            <option value="">Toutes les sources</option>

            {CRM_SOURCE_OPTIONS.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.resetBtn}`}
          >
            <RotateCcw size={15} />
            Réinitialiser
          </button>
        )}
      </div>

      {quickActionError && (
        <div className={`${styles.selectionBar} ${styles.errorBar}`}>
          <span>{quickActionError}</span>

          <button type="button" onClick={() => setQuickActionError(null)}>
            Fermer
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedIds.size} sélectionné(s)</span>

          <button type="button" onClick={handleDeleteMany}>
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      )}

      {error && (
        <div className={`${styles.selectionBar} ${styles.errorBar}`}>
          <span>{error}</span>
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
                    selectedVisibleCount === contacts.length &&
                    contacts.length > 0
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

                    <p>
                      {hasActiveFilters
                        ? "Aucun contact ne correspond aux filtres sélectionnés."
                        : "Ajoutez ou importez vos premiers contacts."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => {
                const tableContact = contact as TableContact;
                const isUpdatingStatus = updatingStatusId === contact.id;

                return (
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

                        {tableContact.phone && (
                          <span className={styles.muted}>
                            {tableContact.phone}
                          </span>
                        )}

                        {tableContact.jobTitle && (
                          <span className={styles.jobTitle}>
                            {tableContact.jobTitle}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {tableContact.companyName ? (
                        <div className={styles.companyBlock}>
                          <span>{tableContact.companyName}</span>
                        </div>
                      ) : tableContact.crmCompany?.name ? (
                        <div className={styles.companyBlock}>
                          <span>{tableContact.crmCompany.name}</span>
                        </div>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>

                    <td>
                      {tableContact.city || tableContact.country ? (
                        <div className={styles.locationBlock}>
                          {tableContact.city && (
                            <span>{tableContact.city}</span>
                          )}

                          {tableContact.country && (
                            <span className={styles.muted}>
                              {tableContact.country}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>

                    <td>
                      <div className={styles.crmMeta}>
                        <div className={styles.quickStatusWrap}>
                          <select
                            value={tableContact.crmStatus || "NEW"}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                tableContact,
                                e.target.value
                              )
                            }
                            disabled={isUpdatingStatus}
                            className={styles.quickStatusSelect}
                            title="Changer le statut CRM et déclencher les automatisations liées"
                          >
                            {CRM_STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>

                          {isUpdatingStatus && (
                            <Loader2
                              size={14}
                              className={styles.quickStatusLoader}
                            />
                          )}
                        </div>

                        <span className={styles.quickStatusHelp}>
                          {isUpdatingStatus
                            ? "Mise à jour..."
                            : `Actuel : ${getCrmStatusLabel(
                                tableContact.crmStatus
                              )}`}
                        </span>

                        <span className={styles.sourcePill}>
                          {getCrmSourceLabel(tableContact.crmSource)}
                        </span>
                      </div>
                    </td>

                    <td>
                      {tableContact.group ? (
                        <span className={styles.groupPill}>
                          {tableContact.group.name}
                        </span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>

                    <td>
                      {tableContact.unsubscribed ? (
                        <span
                          className={`${styles.status} ${styles.statusRed}`}
                        >
                          Désabonné
                        </span>
                      ) : tableContact.isActive ? (
                        <span
                          className={`${styles.status} ${styles.statusGreen}`}
                        >
                          Actif
                        </span>
                      ) : (
                        <span
                          className={`${styles.status} ${styles.statusGray}`}
                        >
                          Inactif
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={styles.date}>
                        {new Date(contact.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <p>
            Page {page} sur {totalPages} · {total.toLocaleString("fr-FR")}{" "}
            contacts
          </p>

          <div className={styles.paginationActions}>
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={styles.pageBtn}
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`${styles.pageNumber} ${
                  p === page ? styles.active : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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