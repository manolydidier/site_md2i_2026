"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fragment, useTransition } from "react";
import { Archive, Inbox, Mail, MailOpen, RotateCw, Trash2, X } from "lucide-react";
import { useMailActions } from "./actions-context";
import styles from "./login/admin-messages.module.css";

export type MailListItem = {
  id: string;
  href: string;
  active: boolean;
  unread: boolean;
  initials: string;
  name: string;
  dateLabel: string;
  subject: string;
  status: string;
  statusClass: string;
  badgeLabel: string;
  excerpt: string;
  email: string;
  phone: string | null;
};

type Props = {
  items: MailListItem[];
  searchTerm?: string;
};

function highlight(text: string, term?: string) {
  if (!term || !term.trim()) return text;

  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    part.toLowerCase() === term.trim().toLowerCase() ? (
      <mark key={index} className={styles.searchMark}>
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

export default function MailList({ items, searchTerm }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    canUpdate,
    canDelete,
    selected,
    toggleOne,
    toggleAll,
    clearSelection,
    pendingRemoval,
    inFlight,
    markRead,
    markUnread,
    archive,
    remove,
    bulkMarkRead,
    bulkArchive,
    bulkRemove,
  } = useMailActions();

  const visibleItems = items.filter((item) => !pendingRemoval.has(item.id));
  const allIds = visibleItems.map((item) => item.id);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someChecked = [...selected].some((id) => allIds.includes(id)) && !allChecked;
  const selectionCount = [...selected].filter((id) => allIds.includes(id)).length;

  return (
    <div className={styles.mailListWrap}>
      <div
        className={`${styles.mailListHeader} ${
          selectionCount > 0 ? styles.mailListHeaderSelection : ""
        }`}
      >
        <label className={styles.mailHeaderCheckbox}>
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => {
              if (el) el.indeterminate = someChecked;
            }}
            onChange={() => toggleAll(allIds)}
            disabled={allIds.length === 0}
            aria-label="Tout sélectionner"
          />
        </label>

        {selectionCount > 0 ? (
          <>
            <span className={styles.mailHeaderSelectionLabel}>
              {selectionCount} sélectionné{selectionCount > 1 ? "s" : ""}
            </span>

            <div className={styles.mailHeaderActions}>
              {canUpdate && (
                <button
                  type="button"
                  className={styles.mailHeaderActionBtn}
                  onClick={() => bulkMarkRead([...selected])}
                  aria-label="Marquer comme lu"
                  title="Marquer comme lu"
                >
                  <MailOpen size={15} />
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  className={styles.mailHeaderActionBtn}
                  onClick={() => bulkArchive([...selected])}
                  aria-label="Archiver"
                  title="Archiver"
                >
                  <Archive size={15} />
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  className={`${styles.mailHeaderActionBtn} ${styles.mailHeaderActionBtnDanger}`}
                  onClick={() => bulkRemove([...selected])}
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              )}

              <button
                type="button"
                className={styles.mailHeaderActionBtn}
                onClick={clearSelection}
                aria-label="Annuler la sélection"
                title="Annuler la sélection"
              >
                <X size={15} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className={styles.mailHeaderActionBtn}
            onClick={refresh}
            disabled={isPending}
            aria-label="Actualiser"
            title="Actualiser"
          >
            <RotateCw size={15} className={isPending ? styles.spin : ""} />
          </button>
        )}
      </div>

      <div className={styles.mailList}>
        {visibleItems.length === 0 ? (
          <div className={styles.emptyList}>
            <div>
              <Inbox size={26} />
            </div>
            <strong>Aucun message</strong>
            <p>Aucun message ne correspond à vos filtres actuels.</p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const isChecked = selected.has(item.id);
            const isBusy = inFlight.has(item.id);

            return (
              <div
                key={item.id}
                data-mail-row={item.id}
                className={`${styles.mailItem} ${
                  item.active ? styles.mailItemActive : ""
                } ${item.unread ? styles.mailItemUnread : ""} ${
                  isChecked ? styles.mailItemChecked : ""
                }`}
              >
                <label
                  className={styles.mailRowCheckbox}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => toggleOne(item.id, event.target.checked)}
                    aria-label={`Sélectionner le message de ${item.name}`}
                  />
                </label>

                <Link href={item.href} className={styles.mailItemLink}>
                  <div className={styles.mailAvatar}>{item.initials}</div>

                  <div className={styles.mailPreview}>
                    <div className={styles.mailPreviewTop}>
                      <strong>{highlight(item.name, searchTerm)}</strong>

                      <span className={styles.mailTimeSlot}>
                        <time>{item.dateLabel}</time>

                        <span className={styles.mailRowActions}>
                          {canUpdate && (
                            <button
                              type="button"
                              className={styles.mailRowActionBtn}
                              disabled={isBusy}
                              aria-label={item.unread ? "Marquer comme lu" : "Marquer comme non lu"}
                              title={item.unread ? "Marquer comme lu" : "Marquer comme non lu"}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (item.unread) markRead(item.id);
                                else markUnread(item.id);
                              }}
                            >
                              {item.unread ? <MailOpen size={13} /> : <Mail size={13} />}
                            </button>
                          )}

                          {canUpdate && (
                            <button
                              type="button"
                              className={styles.mailRowActionBtn}
                              aria-label="Archiver"
                              title="Archiver"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                archive(item.id);
                              }}
                            >
                              <Archive size={13} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className={`${styles.mailRowActionBtn} ${styles.mailRowActionBtnDanger}`}
                              aria-label="Supprimer"
                              title="Supprimer"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                remove(item.id);
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </span>
                      </span>
                    </div>

                    <div className={styles.mailSubjectLine}>
                      <span>{highlight(item.subject, searchTerm)}</span>

                      <em
                        className={`${styles.badge} ${
                          styles[`badge_${item.statusClass}`] || styles.badge_default
                        }`}
                      >
                        {item.badgeLabel}
                      </em>
                    </div>

                    <p>{highlight(item.excerpt, searchTerm)}</p>

                    <div className={styles.mailPreviewMeta}>
                      <span>{highlight(item.email, searchTerm)}</span>
                      {item.phone ? <span>{item.phone}</span> : null}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
