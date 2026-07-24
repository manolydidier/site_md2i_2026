import { ContactStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";
import MessageActions from "./MessageActions";
import MailColumnLayout from "./MailColumnLayout";
import styles from "./login/admin-messages.module.css";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
  selected?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const PAGE_SIZE = 16;

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  READ: "Lu",
  IN_PROGRESS: "En cours",
  REPLIED: "Répondu",
  ARCHIVED: "Archivé",
  CLOSED: "Fermé",
};

const STATUS_FOLDER_LABELS: Record<string, string> = {
  NEW: "Nouveaux",
  READ: "Lus",
  IN_PROGRESS: "En cours",
  REPLIED: "Répondus",
  ARCHIVED: "Archivés",
  CLOSED: "Fermés",
};

const STATUS_ICONS: Record<string, string> = {
  NEW: "●",
  READ: "○",
  IN_PROGRESS: "◐",
  REPLIED: "↩",
  ARCHIVED: "▣",
  CLOSED: "✓",
};

const STATUS_OPTIONS = Object.values(ContactStatus) as ContactStatus[];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function labelStatus(status: ContactStatus) {
  return STATUS_LABELS[String(status)] || String(status);
}

function labelFolder(status: ContactStatus) {
  return STATUS_FOLDER_LABELS[String(status)] || String(status);
}

function statusIcon(status: ContactStatus) {
  return STATUS_ICONS[String(status)] || "●";
}

function statusClass(status: ContactStatus) {
  return String(status).toLowerCase().replaceAll("_", "-");
}

function cleanParam(value?: string) {
  return String(value || "").trim();
}

function getValidStatus(value?: string) {
  const status = cleanParam(value);

  if (!status) return "";

  if (!Object.values(ContactStatus).includes(status as ContactStatus)) {
    return "";
  }

  return status as ContactStatus;
}

function buildHref(params: {
  q?: string;
  status?: string;
  page?: number;
  selected?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.selected) search.set("selected", params.selected);

  const query = search.toString();

  return query ? `/admin/messages?${query}` : "/admin/messages";
}

function excerpt(value: string, length = 150) {
  const text = value.replace(/\s+/g, " ").trim();

  if (text.length <= length) return text;

  return `${text.slice(0, length)}…`;
}

function formatInboxDate(date: Date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getMailtoHref(message: {
  email: string;
  subject: string | null;
}) {
  return `mailto:${message.email}?subject=${encodeURIComponent(
    `Re: ${message.subject || "Votre message"}`
  )}`;
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const access = await checkPermission("messages", "canRead");

  if (!access.ok) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(17,17,17,.56)", fontSize: 13 }}>
          Vous n&apos;avez pas la permission de consulter les messages.
        </p>
      </div>
    );
  }

  const canUpdate = await checkPermission("messages", "canUpdate").then((r) => r.ok);
  const canDelete = await checkPermission("messages", "canDelete").then((r) => r.ok);

  const params = searchParams ? await searchParams : {};

  const q = cleanParam(params.q);
  const selectedStatus = getValidStatus(params.status);
  const selectedId =
    params.selected && UUID_RE.test(params.selected) ? params.selected : "";

  const currentPage = Math.max(1, Number(params.page || 1) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where: Prisma.ContactMessageWhereInput = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [messages, filteredTotal, allTotal, groupedStatus] =
    await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count(),
      prisma.contactMessage.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
    ]);

  const selectedMessage = selectedId
    ? await prisma.contactMessage.findUnique({
        where: { id: selectedId },
      })
    : messages[0] || null;

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const countsByStatus = groupedStatus.reduce<Record<string, number>>(
    (acc, item) => {
      acc[String(item.status)] = item._count.status;
      return acc;
    },
    {}
  );

  const newCount = countsByStatus.NEW || 0;

  const currentReturnTo = buildHref({
    q,
    status: selectedStatus,
    page: currentPage,
    selected: selectedMessage?.id,
  });

  const listOnlyHref = buildHref({
    q,
    status: selectedStatus,
    page: currentPage,
  });

  const title = selectedStatus
    ? labelFolder(selectedStatus)
    : "Boîte de réception";

  return (
    <MailColumnLayout>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.logoMark}>M</div>

          <div>
            <span>MD2I</span>
            <strong>Messages</strong>
          </div>
        </div>

        <Link href="/admin/messages" className={styles.inboxButton}>
          <span>✉</span>
          Boîte de réception
        </Link>

        <nav className={styles.folderList} aria-label="Filtres de messages">
          <Link
            href={buildHref({ q })}
            className={`${styles.folderLink} ${
              !selectedStatus ? styles.folderLinkActive : ""
            }`}
          >
            <span className={styles.folderIcon}>📥</span>
            <span>Tous les messages</span>
            <strong>{allTotal}</strong>
          </Link>

          {STATUS_OPTIONS.map((status) => {
            const active = selectedStatus === status;
            const count = countsByStatus[String(status)] || 0;

            return (
              <Link
                key={status}
                href={buildHref({ q, status })}
                className={`${styles.folderLink} ${
                  active ? styles.folderLinkActive : ""
                }`}
              >
                <span
                  className={`${styles.statusSymbol} ${
                    styles[`statusSymbol_${statusClass(status)}`] ||
                    styles.statusSymbol_default
                  }`}
                >
                  {statusIcon(status)}
                </span>

                <span>{labelFolder(status)}</span>

                <strong>{count}</strong>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarCards}>
          <div className={styles.sidebarCard}>
            <span>Total</span>
            <strong>{allTotal}</strong>
          </div>

          <div className={styles.sidebarCard}>
            <span>Nouveaux</span>
            <strong>{newCount}</strong>
          </div>
        </div>

        {canUpdate && (
          <div className={styles.sidebarBottom}>
            <form action="/api/messages/read-all" method="post">
              <input type="hidden" name="returnTo" value={currentReturnTo} />

              <button type="submit" className={styles.sidebarSoftButton}>
                Tout marquer comme lu
              </button>
            </form>
          </div>
        )}
      </aside>

      <section className={styles.inboxPane}>
        <header className={styles.topBar}>
          <div className={styles.topTitle}>
            <p>Backoffice</p>
            <h1>{title}</h1>
          </div>

          <div className={styles.topCounter}>
            {filteredTotal} message{filteredTotal > 1 ? "s" : ""}
          </div>
        </header>

        <form className={styles.searchToolbar} method="get">
          <div className={styles.gmailSearch}>
            <span>⌕</span>

            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher dans les messages"
            />
          </div>

          <select name="status" defaultValue={selectedStatus}>
            <option value="">Tous</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {labelStatus(status)}
              </option>
            ))}
          </select>

          <button type="submit">Rechercher</button>

          {(q || selectedStatus) && (
            <Link href="/admin/messages" className={styles.clearFilter}>
              Effacer
            </Link>
          )}
        </form>

        <div className={styles.inboxMetaBar}>
          <span>
            Page {currentPage} sur {totalPages}
          </span>

          <div className={styles.pageControls}>
            <Link
              aria-disabled={currentPage <= 1}
              className={`${styles.pageArrow} ${
                currentPage <= 1 ? styles.pageArrowDisabled : ""
              }`}
              href={buildHref({
                q,
                status: selectedStatus,
                page: Math.max(1, currentPage - 1),
                selected: selectedId,
              })}
            >
              ‹
            </Link>

            <Link
              aria-disabled={currentPage >= totalPages}
              className={`${styles.pageArrow} ${
                currentPage >= totalPages ? styles.pageArrowDisabled : ""
              }`}
              href={buildHref({
                q,
                status: selectedStatus,
                page: Math.min(totalPages, currentPage + 1),
                selected: selectedId,
              })}
            >
              ›
            </Link>
          </div>
        </div>

        <div className={styles.mailList}>
          {messages.length === 0 ? (
            <div className={styles.emptyList}>
              <div>📭</div>
              <strong>Aucun message</strong>
              <p>Aucun message ne correspond à vos filtres actuels.</p>
            </div>
          ) : (
            messages.map((message) => {
              const active = selectedMessage?.id === message.id;
              const unread = String(message.status) === "NEW";

              return (
                <Link
                  key={message.id}
                  href={buildHref({
                    q,
                    status: selectedStatus,
                    page: currentPage,
                    selected: message.id,
                  })}
                  className={`${styles.mailItem} ${
                    active ? styles.mailItemActive : ""
                  } ${unread ? styles.mailItemUnread : ""}`}
                >
                  <div className={styles.mailAvatar}>
                    {getInitials(message.name)}
                  </div>

                  <div className={styles.mailPreview}>
                    <div className={styles.mailPreviewTop}>
                      <strong>{message.name}</strong>
                      <time>{formatInboxDate(message.createdAt)}</time>
                    </div>

                    <div className={styles.mailSubjectLine}>
                      <span>{message.subject || "Sans objet"}</span>

                      <em
                        className={`${styles.badge} ${
                          styles[`badge_${statusClass(message.status)}`] ||
                          styles.badge_default
                        }`}
                      >
                        {labelStatus(message.status)}
                      </em>
                    </div>

                    <p>{excerpt(message.message)}</p>

                    <div className={styles.mailPreviewMeta}>
                      <span>{message.email}</span>
                      {message.phone ? <span>{message.phone}</span> : null}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.readerPane}>
        {selectedMessage ? (
          <>
            <header className={styles.readerTop}>
              <div className={styles.readerStatusLine}>
                <span
                  className={`${styles.badgeLarge} ${
                    styles[`badge_${statusClass(selectedMessage.status)}`] ||
                    styles.badge_default
                  }`}
                >
                  {labelStatus(selectedMessage.status)}
                </span>

                <time>{formatFullDate(selectedMessage.createdAt)}</time>
              </div>

              <div className={styles.readerTitleRow}>
                <h2>{selectedMessage.subject || "Sans objet"}</h2>

                <Link href={listOnlyHref} className={styles.readerClose}>
                  ×
                </Link>
              </div>
            </header>

            <section className={styles.senderBlock}>
              <div className={styles.readerAvatar}>
                {getInitials(selectedMessage.name)}
              </div>

              <div className={styles.senderIdentity}>
                <strong>{selectedMessage.name}</strong>
                <a href={`mailto:${selectedMessage.email}`}>
                  {selectedMessage.email}
                </a>
              </div>

              <a
                href={getMailtoHref(selectedMessage)}
                className={styles.replyMini}
              >
                Répondre
              </a>
            </section>

            <section className={styles.readerDetails}>
              <Info
                label="Téléphone"
                value={selectedMessage.phone || "Non renseigné"}
              />

              <Info
                label="Adresse IP"
                value={selectedMessage.ipAddress || "Non disponible"}
              />

              <Info
                label="Créé le"
                value={formatFullDate(selectedMessage.createdAt)}
              />

              <Info
                label="Mis à jour"
                value={formatFullDate(selectedMessage.updatedAt)}
              />
            </section>

            <article className={styles.messageBody}>
              <p>{selectedMessage.message}</p>
            </article>

            <MessageActions
              messageId={selectedMessage.id}
              currentStatus={String(selectedMessage.status)}
              email={selectedMessage.email}
              subject={selectedMessage.subject}
              listHref={buildHref({
                q,
                status: selectedStatus,
                page: currentPage,
              })}
              statuses={STATUS_OPTIONS.map((status) => ({
                value: String(status),
                label: labelStatus(status),
              }))}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          </>
        ) : (
          <div className={styles.emptyReader}>
            <div>✉</div>
            <strong>Aucun message sélectionné</strong>
            <p>Sélectionnez un message dans la liste pour le lire ici.</p>
          </div>
        )}
      </section>
    </MailColumnLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}