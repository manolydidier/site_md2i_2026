"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useContacts,
  useCrmStatuses,
  useGroups,
} from "@/app/hooks/useEmailMarketing";
import type { Contact } from "@/app/types/email-marketing";
import { ContactModal } from "./ContactModal";
import styles from "./ContactsTable.module.css";

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

function formatDate(value?: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getContactName(contact: Contact) {
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  return fullName || contact.email;
}

function getStatusLabel(
  contact: Contact,
  statuses: { id: string; key: string; label: string }[]
) {
  if (contact.crmStatusOption?.label) {
    return contact.crmStatusOption.label;
  }

  if (contact.crmStatusOptionId) {
    const status = statuses.find((item) => item.id === contact.crmStatusOptionId);

    if (status) return status.label;
  }

  if (contact.crmStatus) {
    const status = statuses.find((item) => item.key === contact.crmStatus);

    return status?.label || contact.crmStatus;
  }

  return "—";
}

function getStatusColor(
  contact: Contact,
  statuses: { id: string; key: string; color: string }[]
) {
  if (contact.crmStatusOption?.color) {
    return contact.crmStatusOption.color;
  }

  if (contact.crmStatusOptionId) {
    const status = statuses.find((item) => item.id === contact.crmStatusOptionId);

    if (status) return status.color;
  }

  if (contact.crmStatus) {
    const status = statuses.find((item) => item.key === contact.crmStatus);

    if (status) return status.color;
  }

  return "#64748b";
}

function getSourceLabel(value?: string | null) {
  return CRM_SOURCES.find((source) => source.value === value)?.label || value || "—";
}

export function ContactsTable() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { groups } = useGroups();
  const { statuses, loading: statusesLoading } = useCrmStatuses();

  const [groupId, setGroupId] = useState("");
  const [crmStatusOptionId, setCrmStatusOptionId] = useState("");
  const [crmSource, setCrmSource] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    refetch,
    deleteContact,
    deleteMany,
    updateContact,
  } = useContacts({
    pageSize: 20,
    groupId: groupId || undefined,
    crmStatusOptionId: crmStatusOptionId || undefined,
    crmSource: crmSource || undefined,
  });

  const activeStatuses = useMemo(
    () => statuses.filter((status) => status.isActive),
    [statuses]
  );

  const allCurrentPageSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.includes(contact.id));

  const hasFilters = Boolean(search || groupId || crmStatusOptionId || crmSource);

  const openCreateModal = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingContact(null);
  };

  const handleSaved = () => {
    closeModal();
    refetch();
  };

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !contacts.some((contact) => contact.id === id))
      );
      return;
    }

    setSelectedIds((current) =>
      Array.from(new Set([...current, ...contacts.map((contact) => contact.id)]))
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleDeleteOne = async (contact: Contact) => {
    const confirmed = window.confirm(
      `Supprimer le contact ${contact.email} ? Cette action est définitive.`
    );

    if (!confirmed) return;

    await deleteContact(contact.id);
    setSelectedIds((current) => current.filter((id) => id !== contact.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Supprimer ${selectedIds.length} contact(s) sélectionné(s) ?`
    );

    if (!confirmed) return;

    await deleteMany(selectedIds);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setSearch("");
    setGroupId("");
    setCrmStatusOptionId("");
    setCrmSource("");
    setPage(1);
  };

  const handleQuickStatusChange = async (contact: Contact, statusId: string) => {
    await updateContact(contact.id, {
      email: contact.email,
      firstName: contact.firstName || null,
      lastName: contact.lastName || null,
      phone: contact.phone || null,
      groupId: contact.groupId || null,

      jobTitle: contact.jobTitle || null,
      companyName: contact.companyName || null,
      country: contact.country || null,
      city: contact.city || null,
      notes: contact.notes || null,

      crmStatus: contact.crmStatus || "NEW",
      crmStatusOptionId: statusId || null,
      crmSource: contact.crmSource || "MANUAL",

      isActive: contact.isActive,
      unsubscribed: contact.unsubscribed,
    });

    await refetch();
  };

  const buildExportUrl = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams();

    params.set("format", format);

    if (groupId) {
      params.set("groupId", groupId);
    }

    if (crmStatusOptionId) {
      params.set("crmStatusOptionId", crmStatusOptionId);
    }

    if (crmSource) {
      params.set("crmSource", crmSource);
    }

    return `/api/contacts/export?${params.toString()}`;
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      setExporting(true);
      setActionError(null);
      setActionMessage(null);

      const response = await fetch(buildExportUrl(format), {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Export impossible.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const today = new Date().toISOString().split("T")[0];
      const extension = format === "xlsx" ? "xlsx" : "csv";

      const link = document.createElement("a");
      link.href = url;
      link.download = `contacts-${today}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setActionMessage(
        format === "xlsx"
          ? "Export Excel téléchargé avec succès."
          : "Export CSV téléchargé avec succès."
      );
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Erreur pendant l’export."
      );
    } finally {
      setExporting(false);
    }
  };

  const openImportPicker = () => {
    setActionError(null);
    setActionMessage(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    try {
      setImporting(true);
      setActionError(null);
      setActionMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      if (groupId) {
        formData.append("groupId", groupId);
      }

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Import impossible.");
      }

      await refetch();

      const imported =
        data?.created ??
        data?.imported ??
        data?.success ??
        data?.inserted ??
        0;

      const updated = data?.updated ?? 0;
      const skipped = data?.skipped ?? data?.duplicates ?? 0;

      setActionMessage(
        `Import terminé. Ajoutés : ${imported}. Mis à jour : ${updated}. Ignorés : ${skipped}.`
      );
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Erreur pendant l’import."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className={styles.contactsTable}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />

      <header className={styles.contactsHead}>
        <div>
          <div className={styles.sectionLabel}>Contacts</div>
          <p>
            {total} contact{total > 1 ? "s" : ""} dans votre base email
            marketing.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={openImportPicker}
            disabled={importing}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            {importing ? <Loader2 size={15} /> : <Upload size={15} />}
            {importing ? "Import..." : "Importer"}
          </button>

          <div className={styles.exportWrap}>
            <button
              type="button"
              disabled={exporting}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              {exporting ? <Loader2 size={15} /> : <Download size={15} />}
              {exporting ? "Export..." : "Exporter"}
            </button>

            <div className={styles.exportMenu}>
              <button
                type="button"
                disabled={exporting}
                onClick={() => handleExport("csv")}
              >
                CSV
              </button>

              <button
                type="button"
                disabled={exporting}
                onClick={() => handleExport("xlsx")}
              >
                Excel
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={15} />
            Ajouter
          </button>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.inputIcon} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par email, nom, entreprise..."
          />
        </div>

        <div className={styles.selectBox}>
          <Users size={16} className={styles.inputIcon} />
          <select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Tous les groupes</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBox}>
          <Filter size={16} className={styles.inputIcon} />
          <select
            value={crmStatusOptionId}
            onChange={(event) => setCrmStatusOptionId(event.target.value)}
            disabled={statusesLoading}
          >
            <option value="">
              {statusesLoading ? "Chargement..." : "Tous les statuts"}
            </option>

            {activeStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBox}>
          <Mail size={16} className={styles.inputIcon} />
          <select
            value={crmSource}
            onChange={(event) => setCrmSource(event.target.value)}
          >
            <option value="">Toutes les sources</option>

            {CRM_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          className={`${styles.btn} ${styles.btnSecondary} ${styles.resetBtn}`}
        >
          <X size={15} />
          Réinitialiser
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedIds.length} contact(s) sélectionné(s)</span>

          <button type="button" onClick={handleDeleteSelected}>
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      )}

      {actionMessage && (
        <div className={styles.selectionBar}>
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className={`${styles.selectionBar} ${styles.errorBar}`}>
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className={`${styles.selectionBar} ${styles.errorBar}`}>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <p>Chargement des contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <UserRound size={24} />
            </div>

            <h3>Aucun contact trouvé</h3>
            <p>Ajoutez un contact ou modifiez vos filtres.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className={styles.checkCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Contact</th>
                <th>Entreprise</th>
                <th>Localisation</th>
                <th>Statut CRM</th>
                <th>Groupe</th>
                <th>Préférences</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {contacts.map((contact) => {
                const statusColor = getStatusColor(contact, activeStatuses);
                const statusLabel = getStatusLabel(contact, activeStatuses);

                return (
                  <tr key={contact.id}>
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
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
                      <div className={styles.companyBlock}>
                        <span>{contact.companyName || "—"}</span>
                        {contact.crmCompany?.name && (
                          <span className={styles.muted}>
                            CRM : {contact.crmCompany.name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className={styles.locationBlock}>
                        <span>{contact.city || "—"}</span>
                        <span className={styles.muted}>
                          {contact.country || "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.crmMeta}>
                        <span
                          className={styles.status}
                          style={{
                            color: statusColor,
                            background: `${statusColor}18`,
                          }}
                        >
                          {statusLabel}
                        </span>

                        <div className={styles.quickStatusWrap}>
                          <select
                            value={
                              contact.crmStatusOptionId ||
                              contact.crmStatusOption?.id ||
                              ""
                            }
                            className={styles.quickStatusSelect}
                            onChange={(event) =>
                              handleQuickStatusChange(contact, event.target.value)
                            }
                            disabled={statusesLoading}
                          >
                            <option value="">Changer</option>

                            {activeStatuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.label}
                              </option>
                            ))}
                          </select>

                          {statusesLoading && (
                            <Loader2
                              size={14}
                              className={styles.quickStatusLoader}
                            />
                          )}
                        </div>

                        <span className={styles.sourcePill}>
                          {getSourceLabel(contact.crmSource)}
                        </span>
                      </div>
                    </td>

                    <td>
                      {contact.group?.name ? (
                        <span className={styles.groupPill}>
                          {contact.group.name}
                        </span>
                      ) : (
                        <span className={styles.muted}>Sans groupe</span>
                      )}
                    </td>

                    <td>
                      <div className={styles.crmMeta}>
                        <span
                          className={`${styles.status} ${
                            contact.isActive
                              ? styles.statusGreen
                              : styles.statusGray
                          }`}
                        >
                          {contact.isActive ? "Actif" : "Inactif"}
                        </span>

                        <span
                          className={`${styles.status} ${
                            contact.unsubscribed
                              ? styles.statusRed
                              : styles.statusBlue
                          }`}
                        >
                          {contact.unsubscribed ? "Désabonné" : "Abonné"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={styles.date}>
                        {formatDate(contact.createdAt)}
                      </span>
                    </td>

                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          onClick={() => openEditModal(contact)}
                          title="Modifier"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOne(contact)}
                          title="Supprimer"
                          className={styles.danger}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <footer className={styles.pagination}>
          <p>
            Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
          </p>

          <div className={styles.paginationActions}>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className={styles.pageBtn}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }).slice(0, 7).map((_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`${styles.pageNumber} ${
                    page === pageNumber ? styles.active : ""
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className={styles.pageBtn}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      )}

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={closeModal}
          onSave={handleSaved}
        />
      )}
    </section>
  );
}