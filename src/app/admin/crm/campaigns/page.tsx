import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CopyCheck,
  ExternalLink,
  Globe2,
  Link2,
  Mail,
  Megaphone,
  MousePointerClick,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";
import { getCrmPublicationPublisherReadiness } from "@/app/lib/crm-publication-publisher";
import {
  deleteCrmMarketingCampaign,
  deleteSelectedCrmMarketingCampaigns,
  publishCrmPublicationNow,
  updateCrmPublicationStatus,
} from "./actions";
import CampaignCalendarModal from "./CampaignCalendarModal";
import CampaignCreateModal from "./CampaignCreateModal";
import CampaignPublishToast from "./CampaignPublishToast";
import PublicationAssistant from "./PublicationAssistant";
import styles from "./CampaignChannels.module.css";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  name: string;
  objective: string | null;
  audience: string | null;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  emailCampaign: {
    id: string;
    name: string;
    status: string;
  } | null;
  publications: Array<{
    id: string;
    channel: string;
    title: string;
    content: string;
    ctaLabel: string | null;
    status: string;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    providerPostId: string | null;
    providerUrl: string | null;
    failureReason: string | null;
    trackedLink: {
      slug: string;
      clickCount: number;
      destinationUrl: string;
    } | null;
  }>;
  trackedLinks: Array<{
    id: string;
    slug: string;
    clickCount: number;
    destinationUrl: string;
  }>;
};

type EmailCampaignOption = {
  id: string;
  name: string;
  status: string;
};

type CampaignData =
  | {
      ready: true;
      campaigns: CampaignRow[];
      emailCampaigns: EmailCampaignOption[];
    }
  | {
      ready: false;
      campaigns: [];
      emailCampaigns: [];
      error: string;
    };

type CalendarPublication = CampaignRow["publications"][number] & {
  campaignName: string;
};

const CHANNELS = [
  {
    value: "LINKEDIN",
    label: "LinkedIn",
    className: styles.linkedin,
  },
  {
    value: "FACEBOOK",
    label: "Facebook",
    className: styles.facebook,
  },
  {
    value: "INDEED",
    label: "Indeed",
    className: styles.indeed,
  },
  {
    value: "EMAIL",
    label: "Email",
    className: styles.email,
  },
  {
    value: "WEBSITE",
    label: "Site web",
    className: styles.website,
  },
  {
    value: "OTHER",
    label: "Autre",
    className: "",
  },
];

async function loadCampaignData(userId: string): Promise<CampaignData> {
  try {
    const [campaigns, emailCampaigns] = await Promise.all([
      prisma.crmMarketingCampaign.findMany({
        where: {
          userId,
        },
        take: 40,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          emailCampaign: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          publications: {
            orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
            include: {
              trackedLink: {
                select: {
                  slug: true,
                  clickCount: true,
                  destinationUrl: true,
                },
              },
            },
          },
          trackedLinks: {
            select: {
              id: true,
              slug: true,
              clickCount: true,
              destinationUrl: true,
            },
          },
        },
      }),

      prisma.campaign.findMany({
        where: {
          userId,
        },
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),
    ]);

    return {
      ready: true,
      campaigns: campaigns as CampaignRow[],
      emailCampaigns: emailCampaigns as EmailCampaignOption[],
    };
  } catch (error) {
    console.error("[CRM campaigns] load error:", error);

    return {
      ready: false,
      campaigns: [],
      emailCampaigns: [],
      error:
        error instanceof Error
          ? error.message
          : "Les tables de campagnes CRM ne sont pas encore disponibles.",
    };
  }
}

function formatDateTime(value: Date | null) {
  if (!value) return "Non planifié";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "Non planifié";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    READY: "Prêt",
    SCHEDULED: "Planifié",
    PUBLISHED: "Publié",
    FAILED: "Erreur",
    CANCELLED: "Annulé",
    ACTIVE: "Active",
    PAUSED: "En pause",
    COMPLETED: "Terminée",
    ARCHIVED: "Archivée",
  };

  return labels[value] || value;
}

function formatChannel(value: string) {
  return CHANNELS.find((channel) => channel.value === value)?.label || value;
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function isSameDay(a: Date | null, b: Date) {
  if (!a) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(publications: CalendarPublication[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlankDays = (firstDay.getDay() + 6) % 7;

  const calendar: Array<{
    key: string;
    date: Date | null;
    publications: CalendarPublication[];
  }> = [];

  for (let index = 0; index < leadingBlankDays; index += 1) {
    calendar.push({
      key: `blank-${index}`,
      date: null,
      publications: [],
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);

    calendar.push({
      key: date.toISOString(),
      date,
      publications: publications.filter((publication) =>
        isSameDay(publication.scheduledAt, date)
      ),
    });
  }

  return calendar;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function richContentToPlainText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(
        /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
        (_match, href, text) => {
          const label = String(text).replace(/<[^>]*>/g, "").trim();

          return label ? `${label}: ${href}` : href;
        }
      )
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
        return `\nImage: ${src}\n`;
      })
      .replace(/<\/(p|div|h1|h2|h3|h4|li|figure)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function getStatusClass(value: string) {
  if (value === "PUBLISHED" || value === "ACTIVE" || value === "COMPLETED") {
    return "crm-status-pill crm-status-pill-green";
  }

  if (value === "SCHEDULED" || value === "READY") {
    return "crm-status-pill crm-status-pill-blue";
  }

  if (value === "FAILED" || value === "CANCELLED") {
    return "crm-status-pill crm-status-pill-red";
  }

  return "crm-status-pill";
}

function getCampaignAccentClass(status: string) {
  if (status === "ACTIVE") return "crm-campaign-accent-active";
  if (status === "COMPLETED") return "crm-campaign-accent-success";
  if (status === "ARCHIVED" || status === "PAUSED") {
    return "crm-campaign-accent-muted";
  }

  return "crm-campaign-accent-draft";
}

function getPublicationStateClass(status: string) {
  if (status === "PUBLISHED") return "crm-publication-state-published";
  if (status === "FAILED") return "crm-publication-state-failed";
  if (status === "SCHEDULED") return "crm-publication-state-scheduled";
  if (status === "CANCELLED") return "crm-publication-state-cancelled";

  return "crm-publication-state-draft";
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "EMAIL") return <Mail size={14} />;
  if (channel === "WEBSITE") return <Globe2 size={14} />;
  if (channel === "INDEED") return <Briefcase size={14} />;
  if (channel === "LINKEDIN" || channel === "FACEBOOK") {
    return <Share2 size={14} />;
  }

  return <Megaphone size={14} />;
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className={`crm-channel-badge crm-channel-badge-${channel.toLowerCase()}`}
    >
      <ChannelIcon channel={channel} />
      {formatChannel(channel)}
    </span>
  );
}

function PublicationPlatformMark({
  publication,
}: {
  publication: CampaignRow["publications"][number];
}) {
  const channelLabel = formatChannel(publication.channel);

  if (publication.status === "PUBLISHED" && publication.providerUrl) {
    return (
      <Link
        href={publication.providerUrl}
        target="_blank"
        className="crm-platform-mark crm-platform-mark-success"
      >
        <BadgeCheck size={14} />
        Publié sur {channelLabel}
        <ExternalLink size={12} />
      </Link>
    );
  }

  if (publication.status === "PUBLISHED") {
    return (
      <span className="crm-platform-mark crm-platform-mark-success">
        <BadgeCheck size={14} />
        Publié sur {channelLabel}
      </span>
    );
  }

  if (publication.status === "FAILED") {
    return (
      <span className="crm-platform-mark crm-platform-mark-error">
        <CircleAlert size={14} />
        Échec {channelLabel}
      </span>
    );
  }

  if (publication.status === "SCHEDULED") {
    return (
      <span className="crm-platform-mark crm-platform-mark-waiting">
        <Clock3 size={14} />
        Planifié pour {channelLabel}
      </span>
    );
  }

  return (
    <span className="crm-platform-mark crm-platform-mark-muted">
      <Clock3 size={14} />
      En attente {channelLabel}
    </span>
  );
}

function StatusAction({
  publicationId,
  status,
  children,
  variant = "secondary",
}: {
  publicationId: string;
  status: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <form action={updateCrmPublicationStatus}>
      <input type="hidden" name="publicationId" value={publicationId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`crm-marketing-action crm-marketing-action-${variant}`}
      >
        {children}
      </button>
    </form>
  );
}

function PublishNowAction({ publicationId }: { publicationId: string }) {
  return (
    <form action={publishCrmPublicationNow}>
      <input type="hidden" name="publicationId" value={publicationId} />
      <button
        type="submit"
        className="crm-marketing-action crm-marketing-action-primary"
      >
        <Send size={14} />
        Publier
      </button>
    </form>
  );
}

function DeleteCampaignAction({ campaignId }: { campaignId: string }) {
  return (
    <form action={deleteCrmMarketingCampaign}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <button
        type="submit"
        className="crm-marketing-action crm-marketing-action-danger"
      >
        <Trash2 size={14} />
        Supprimer
      </button>
    </form>
  );
}

function CampaignSetupNotice({ error }: { error: string }) {
  return (
    <section className="crm-marketing-setup">
      <h2>Module à initialiser</h2>
      <p>
        La page est prête, mais la base doit recevoir la migration
        `add_crm_marketing_campaigns` avant de charger les campagnes.
      </p>
      <code>{error}</code>
    </section>
  );
}

function CampaignSummaryStats({ campaign }: { campaign: CampaignRow }) {
  const totalClicks = campaign.trackedLinks.reduce(
    (sum, link) => sum + link.clickCount,
    0
  );

  const publishedCount = campaign.publications.filter(
    (publication) => publication.status === "PUBLISHED"
  ).length;

  const failedCount = campaign.publications.filter(
    (publication) => publication.status === "FAILED"
  ).length;

  return (
    <span className="crm-campaign-summary-badges">
      <span className={getStatusClass(campaign.status)}>
        {formatStatus(campaign.status)}
      </span>

      <span className="crm-summary-chip">
        <Megaphone size={13} />
        {campaign.publications.length} publication(s)
      </span>

      <span className="crm-summary-chip">
        <BadgeCheck size={13} />
        {publishedCount} publiée(s)
      </span>

      {failedCount > 0 ? (
        <span className="crm-summary-chip crm-summary-chip-danger">
          <CircleAlert size={13} />
          {failedCount} erreur(s)
        </span>
      ) : null}

      <span className="crm-summary-chip">
        <MousePointerClick size={13} />
        {totalClicks.toLocaleString("fr-FR")} clic(s)
      </span>
    </span>
  );
}

export default async function CrmCampaignsPage() {
  const userId = await getCrmOwnerUserId();
  const origin = await getRequestOrigin();
  const data = await loadCampaignData(userId);

  const campaigns = data.campaigns;
  const publications = campaigns.flatMap((campaign) => campaign.publications);

  const scheduledCount = publications.filter(
    (publication) => publication.status === "SCHEDULED"
  ).length;

  const publishedCount = publications.filter(
    (publication) => publication.status === "PUBLISHED"
  ).length;

  const clickCount = campaigns.reduce(
    (sum, campaign) =>
      sum +
      campaign.trackedLinks.reduce(
        (linkSum, link) => linkSum + link.clickCount,
        0
      ),
    0
  );

  const calendarPublications = campaigns.flatMap((campaign) =>
    campaign.publications.map((publication) => ({
      ...publication,
      campaignName: campaign.name,
    }))
  );

  const calendarDays = buildCalendarDays(calendarPublications);
  const currentMonth = formatMonth(new Date());

  const unscheduledCount = calendarPublications.filter(
    (publication) => !publication.scheduledAt
  ).length;

  const calendarModalDays = calendarDays.map((day) => ({
    key: day.key,
    dateIso: day.date ? day.date.toISOString() : null,
    dayNumber: day.date ? day.date.getDate() : null,
    publications: day.publications.map((publication) => ({
      id: publication.id,
      campaignName: publication.campaignName,
      title: publication.title,
      channelLabel: formatChannel(publication.channel),
    })),
  }));

  const readiness = getCrmPublicationPublisherReadiness();
  const readyChannels = readiness.filter((channel) => channel.ready).length;

  return (
    <div className="crm-marketing-page">
      <CampaignPublishToast />

      <header className="crm-page-header crm-marketing-header">
        <div>
          <p className="crm-eyebrow">Automation marketing</p>
          <h1 className="crm-title">Campagnes CRM</h1>
          <p className="crm-subtitle">
            Préparez vos publications multi-canaux, suivez les liens, mesurez
            les clics et gardez une trace claire des posts publiés.
          </p>
        </div>

        <div className="crm-marketing-header-badge">
          <Sparkles size={16} />
          <span>Publication assistée</span>
        </div>
      </header>

      {!data.ready ? (
        <CampaignSetupNotice error={data.error} />
      ) : (
        <>
          <section className="crm-marketing-stats">
            <div className="crm-marketing-stat">
              <div>
                <span>Campagnes</span>
                <strong>{campaigns.length.toLocaleString("fr-FR")}</strong>
              </div>
              <Megaphone size={21} />
            </div>

            <div className="crm-marketing-stat">
              <div>
                <span>Planifiées</span>
                <strong>{scheduledCount.toLocaleString("fr-FR")}</strong>
              </div>
              <CalendarClock size={21} />
            </div>

            <div className="crm-marketing-stat">
              <div>
                <span>Publiées</span>
                <strong>{publishedCount.toLocaleString("fr-FR")}</strong>
              </div>
              <CheckCircle2 size={21} />
            </div>

            <div className="crm-marketing-stat">
              <div>
                <span>Clics suivis</span>
                <strong>{clickCount.toLocaleString("fr-FR")}</strong>
              </div>
              <MousePointerClick size={21} />
            </div>
          </section>

          <section className="crm-marketing-toolbar-panel">
            <div>
              <p>Actions rapides</p>
              <h2>Piloter les campagnes</h2>
            </div>

            <div className="crm-marketing-toolbar-actions">
              <CampaignCreateModal
                emailCampaigns={data.emailCampaigns}
                channels={CHANNELS}
              />

              <CampaignCalendarModal
                currentMonth={currentMonth}
                calendarDays={calendarModalDays}
                unscheduledCount={unscheduledCount}
              />
            </div>
          </section>

          <section className="crm-marketing-panel crm-publisher-readiness">
            <div className="crm-marketing-panel-head">
              <div>
                <p>Configuration envoi</p>
                <h2>Canaux prêts à publier</h2>
              </div>
              <Settings2 size={18} />
            </div>

            <div className="crm-readiness-grid">
              {readiness.map((channel) => (
                <div
                  key={channel.channel}
                  className={
                    channel.ready
                      ? "crm-readiness-card crm-readiness-card-ready"
                      : "crm-readiness-card"
                  }
                >
                  <div className="crm-readiness-top">
                    <strong>{channel.label}</strong>
                    <span>{channel.mode}</span>
                  </div>

                  <p>{channel.message}</p>

                  {channel.missingEnv.length > 0 ? (
                    <code>{channel.missingEnv.join(", ")}</code>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="crm-readiness-summary">
              <CheckCircle2 size={16} />
              <span>
                {readyChannels.toLocaleString("fr-FR")} canal(aux) en
                autopublication.
              </span>
            </div>
          </section>

          <section className="crm-marketing-panel crm-marketing-queue">
            <div className="crm-marketing-panel-head">
              <div>
                <p>File de publication</p>
                <h2>Campagnes et posts</h2>
              </div>

              <div className="crm-marketing-actions">
                {campaigns.length > 0 ? (
                  <button
                    type="submit"
                    form="crm-bulk-delete-campaigns"
                    className="crm-marketing-action crm-marketing-action-danger"
                  >
                    <Trash2 size={14} />
                    Supprimer sélection
                  </button>
                ) : null}

                <BarChart3 size={18} />
              </div>
            </div>

            <form
              id="crm-bulk-delete-campaigns"
              action={deleteSelectedCrmMarketingCampaigns}
            />

            {campaigns.length === 0 ? (
              <div className="crm-empty">Aucune campagne CRM pour le moment.</div>
            ) : (
              <div className="crm-campaign-accordion-list">
                {campaigns.map((campaign, campaignIndex) => (
                  <details
                    key={campaign.id}
                    className={`crm-campaign-accordion ${getCampaignAccentClass(
                      campaign.status
                    )}`}
                    open={campaignIndex === 0}
                  >
                    <summary className="crm-campaign-accordion-summary">
                      <span className="crm-accordion-chevron" aria-hidden="true">
                        ▾
                      </span>

                      <span className="crm-campaign-icon">
                        <Megaphone size={18} />
                      </span>

                      <span className="crm-campaign-summary-main">
                        <span className="crm-campaign-summary-title">
                          {campaign.name}
                        </span>

                        <span className="crm-campaign-summary-description">
                          {campaign.objective ||
                            campaign.audience ||
                            "Campagne multi-canal préparée dans le CRM."}
                        </span>
                      </span>

                      <CampaignSummaryStats campaign={campaign} />
                    </summary>

                    <div className="crm-campaign-accordion-body">
                      <div className="crm-campaign-accordion-toolbar">
                        <label className="crm-campaign-select">
                          <input
                            type="checkbox"
                            name="campaignIds"
                            value={campaign.id}
                            form="crm-bulk-delete-campaigns"
                          />
                          <span>Sélectionner cette campagne</span>
                        </label>

                        <div className="crm-campaign-toolbar-actions">
                          {campaign.emailCampaign ? (
                            <span className="crm-marketing-email-chip">
                              <Mail size={13} />
                              {campaign.emailCampaign.name}
                            </span>
                          ) : null}

                          <DeleteCampaignAction campaignId={campaign.id} />
                        </div>
                      </div>

                      <div className="crm-publication-accordion-list">
                        {campaign.publications.map(
                          (publication, publicationIndex) => {
                            const plainContent = richContentToPlainText(
                              publication.content
                            );

                            return (
                              <details
                                key={publication.id}
                                className={`crm-publication-accordion ${getPublicationStateClass(
                                  publication.status
                                )}`}
                                open={publicationIndex === 0}
                              >
                                <summary className="crm-publication-accordion-summary">
                                  <span
                                    className="crm-accordion-chevron"
                                    aria-hidden="true"
                                  >
                                    ▾
                                  </span>

                                  <span className="crm-publication-summary-main">
                                    <ChannelBadge
                                      channel={publication.channel}
                                    />

                                    <span className="crm-publication-summary-title">
                                      {publication.title}
                                    </span>
                                  </span>

                                  <span className="crm-publication-summary-meta">
                                    <span
                                      className={getStatusClass(
                                        publication.status
                                      )}
                                    >
                                      {formatStatus(publication.status)}
                                    </span>

                                    <span className="crm-summary-chip">
                                      <CalendarClock size={13} />
                                      {formatDate(publication.scheduledAt)}
                                    </span>

                                    {publication.trackedLink ? (
                                      <span className="crm-summary-chip">
                                        <MousePointerClick size={13} />
                                        {publication.trackedLink.clickCount.toLocaleString(
                                          "fr-FR"
                                        )}{" "}
                                        clic(s)
                                      </span>
                                    ) : null}

                                    <PublicationPlatformMark
                                      publication={publication}
                                    />
                                  </span>
                                </summary>

                                <div className="crm-publication-accordion-body">
                                  <div
                                    className="crm-publication-rich-preview crm-publication-preview-card"
                                    dangerouslySetInnerHTML={{
                                      __html: publication.content,
                                    }}
                                  />

                                  <div className="crm-publication-meta-row">
                                    {publication.trackedLink ? (
                                      <Link
                                        href={`/r/${publication.trackedLink.slug}`}
                                        target="_blank"
                                        className="crm-marketing-link"
                                      >
                                        <Link2 size={13} />
                                        /r/{publication.trackedLink.slug}
                                        <ExternalLink size={12} />
                                      </Link>
                                    ) : null}

                                    {publication.trackedLink ? (
                                      <span>
                                        <MousePointerClick size={13} />
                                        {publication.trackedLink.clickCount.toLocaleString(
                                          "fr-FR"
                                        )}{" "}
                                        clics
                                      </span>
                                    ) : null}

                                    {publication.providerUrl ? (
                                      <Link
                                        href={publication.providerUrl}
                                        target="_blank"
                                        className="crm-marketing-link crm-provider-link"
                                      >
                                        <ExternalLink size={13} />
                                        Ouvrir le post
                                      </Link>
                                    ) : null}

                                    {publication.publishedAt ? (
                                      <span>
                                        <BadgeCheck size={13} />
                                        Publié le{" "}
                                        {formatDateTime(
                                          publication.publishedAt
                                        )}
                                      </span>
                                    ) : null}
                                  </div>

                                  {publication.failureReason ? (
                                    <div className="crm-publication-failure">
                                      <CircleAlert size={14} />
                                      <code>
                                        {publication.failureReason}
                                      </code>
                                    </div>
                                  ) : null}

                                  <details className="crm-publication-details">
                                    <summary>
                                      <CopyCheck size={14} />
                                      Assistant de publication
                                    </summary>

                                    <PublicationAssistant
                                      channel={publication.channel}
                                      title={publication.title}
                                      content={plainContent}
                                      ctaLabel={publication.ctaLabel}
                                      destinationUrl={
                                        publication.trackedLink
                                          ?.destinationUrl || null
                                      }
                                      trackedUrl={
                                        publication.trackedLink
                                          ? `${origin}/r/${publication.trackedLink.slug}`
                                          : null
                                      }
                                    />
                                  </details>

                                  <footer className="crm-publication-actions">
                                    <StatusAction
                                      publicationId={publication.id}
                                      status="READY"
                                    >
                                      Prêt
                                    </StatusAction>

                                    {publication.channel === "LINKEDIN" ||
                                    publication.channel === "FACEBOOK" ? (
                                      <PublishNowAction
                                        publicationId={publication.id}
                                      />
                                    ) : (
                                      <StatusAction
                                        publicationId={publication.id}
                                        status="PUBLISHED"
                                        variant="primary"
                                      >
                                        Publié
                                      </StatusAction>
                                    )}

                                    <StatusAction
                                      publicationId={publication.id}
                                      status="CANCELLED"
                                      variant="danger"
                                    >
                                      Annuler
                                    </StatusAction>
                                  </footer>
                                </div>
                              </details>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}