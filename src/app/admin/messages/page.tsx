import { ContactStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import {
  Inbox,
  Mail,
  MailOpen,
  Clock,
  CornerUpLeft,
  Archive,
  CheckCircle2,
  Circle,
  MailX,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";
import MessageActions from "./MessageActions";
import MailColumnLayout from "./MailColumnLayout";
import MailList from "./MailList";
import MessageNotes from "./MessageNotes";
import SearchToolbar from "./SearchToolbar";
import NewMessagesBanner from "./NewMessagesBanner";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ToastStack from "./ToastStack";
import { MailActionsProvider } from "./actions-context";
import styles from "./login/admin-messages.module.css";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
  selected?: string;
  sort?: string;
};

const SORT_OPTIONS = ["date_desc", "date_asc", "unread_first"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SPAM_IP_THRESHOLD = 3;

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

const STATUS_ICONS: Record<string, LucideIcon> = {
  NEW: Circle,
  READ: MailOpen,
  IN_PROGRESS: Clock,
  REPLIED: CornerUpLeft,
  ARCHIVED: Archive,
  CLOSED: CheckCircle2,
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
  return STATUS_ICONS[String(status)] || Circle;
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

function getValidSort(value?: string): SortOption {
  const sort = cleanParam(value);
  return (SORT_OPTIONS as readonly string[]).includes(sort) ? (sort as SortOption) : "date_desc";
}

function buildHref(params: {
  q?: string;
  status?: string;
  page?: number;
  selected?: string;
  sort?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.selected) search.set("selected", params.selected);
  if (params.sort && params.sort !== "date_desc") search.set("sort", params.sort);

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
  const sort = getValidSort(params.sort);
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

  const orderBy: Prisma.ContactMessageOrderByWithRelationInput[] =
    sort === "date_asc"
      ? [{ createdAt: "asc" }]
      : sort === "unread_first"
        ? [{ status: "asc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [messages, filteredTotal, allTotal, groupedStatus] =
    await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy,
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
        include: { notes: { orderBy: { createdAt: "desc" } } },
      })
    : messages[0]
      ? await prisma.contactMessage.findUnique({
          where: { id: messages[0].id },
          include: { notes: { orderBy: { createdAt: "desc" } } },
        })
      : null;

  const senderMessageCount = selectedMessage?.ipAddress
    ? await prisma.contactMessage.count({ where: { ipAddress: selectedMessage.ipAddress } })
    : 0;
  const isLikelySpam = senderMessageCount >= SPAM_IP_THRESHOLD;

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const countsByStatus = groupedStatus.reduce<Record<string, number>>(
    (acc, item) => {
      acc[String(item.status)] = item._count.status;
      return acc;
    },
    {}
  );

  const newCount = countsByStatus.NEW || 0;

  const mailListItems = messages.map((message) => ({
    id: message.id,
    href: buildHref({
      q,
      status: selectedStatus,
      page: currentPage,
      selected: message.id,
      sort,
    }),
    active: selectedMessage?.id === message.id,
    unread: String(message.status) === "NEW",
    initials: getInitials(message.name),
    name: message.name,
    dateLabel: formatInboxDate(message.createdAt),
    subject: message.subject || "Sans objet",
    status: String(message.status),
    statusClass: statusClass(message.status),
    badgeLabel: labelStatus(message.status),
    excerpt: excerpt(message.message),
    email: message.email,
    phone: message.phone,
  }));

  const currentReturnTo = buildHref({
    q,
    status: selectedStatus,
    page: currentPage,
    selected: selectedMessage?.id,
    sort,
  });

  const listOnlyHref = buildHref({
    q,
    status: selectedStatus,
    page: currentPage,
    sort,
  });

  const title = selectedStatus
    ? labelFolder(selectedStatus)
    : "Boîte de réception";

  const noteItems = (selectedMessage?.notes || []).map((note) => ({
    id: note.id,
    authorName: note.authorName,
    type: note.type,
    body: note.body,
    dateLabel: formatFullDate(note.createdAt),
  }));

  const replyHref = selectedMessage ? getMailtoHref(selectedMessage) : undefined;

  return (
    <MailColumnLayout>
      <MailActionsProvider canUpdate={canUpdate} canDelete={canDelete}>
        <KeyboardShortcuts
          items={mailListItems.map((item) => ({ id: item.id, href: item.href }))}
          selectedId={selectedMessage?.id}
          replyHref={replyHref}
        />
        <ToastStack />

      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.logoMark}>M</div>

          <div>
            <span>MD2I</span>
            <strong>Messages</strong>
          </div>
        </div>

        <Link href="/admin/messages" className={styles.inboxButton}>
          <Inbox size={16} />
          Boîte de réception
        </Link>

        <nav className={styles.folderList} aria-label="Filtres de messages">
          <Link
            href={buildHref({ q, sort })}
            className={`${styles.folderLink} ${
              !selectedStatus ? styles.folderLinkActive : ""
            }`}
          >
            <span className={styles.folderIcon}>
              <Mail size={14} />
            </span>
            <span>Tous les messages</span>
            <strong>{allTotal}</strong>
          </Link>

          {STATUS_OPTIONS.map((status) => {
            const active = selectedStatus === status;
            const count = countsByStatus[String(status)] || 0;
            const Icon = statusIcon(status);

            return (
              <Link
                key={status}
                href={buildHref({ q, status, sort })}
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
                  <Icon size={14} />
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

        <SearchToolbar
          q={q}
          status={selectedStatus}
          sort={sort}
          statusOptions={STATUS_OPTIONS.map((status) => ({
            value: String(status),
            label: labelStatus(status),
          }))}
        />

        <NewMessagesBanner initialNewCount={newCount} />

        <div className={styles.inboxMetaBar}>
          <span>
            {filteredTotal === 0
              ? "0 message"
              : `${skip + 1}–${Math.min(skip + PAGE_SIZE, filteredTotal)} sur ${filteredTotal}`}
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
                sort,
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
                sort,
              })}
            >
              ›
            </Link>
          </div>
        </div>

        <MailList items={mailListItems} searchTerm={q} />
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

                {isLikelySpam && (
                  <span className={styles.spamFlag} title={`${senderMessageCount} messages depuis cette IP`}>
                    <ShieldAlert size={11} />
                    Possible spam
                  </span>
                )}

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
                <CornerUpLeft size={13} />
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

            <MessageNotes
              messageId={selectedMessage.id}
              notes={noteItems}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />

            <MessageActions
              messageId={selectedMessage.id}
              currentStatus={String(selectedMessage.status)}
              email={selectedMessage.email}
              subject={selectedMessage.subject}
              listHref={buildHref({
                q,
                status: selectedStatus,
                page: currentPage,
                sort,
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
            <div>
              <MailX size={26} />
            </div>
            <strong>Aucun message sélectionné</strong>
            <p>Sélectionnez un message dans la liste pour le lire ici.</p>
          </div>
        )}
      </section>
      </MailActionsProvider>
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