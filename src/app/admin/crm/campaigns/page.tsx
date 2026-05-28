import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Link2,
  Megaphone,
  MousePointerClick,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";
import { getCrmPublicationPublisherReadiness } from "@/app/lib/crm-publication-publisher";
import {
  createCrmMarketingCampaign,
  deleteCrmMarketingCampaign,
  deleteSelectedCrmMarketingCampaigns,
  publishCrmPublicationNow,
  updateCrmPublicationStatus,
} from "./actions";
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
  if (!value) return "Non planifie";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

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
        Publier maintenant
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
        Supprimer
      </button>
    </form>
  );
}

function CampaignSetupNotice({ error }: { error: string }) {
  return (
    <section className="crm-marketing-setup">
      <h2>Module a initialiser</h2>
      <p>
        La page est prete, mais la base doit recevoir la migration
        `add_crm_marketing_campaigns` avant de charger les campagnes.
      </p>
      <code>{error}</code>
    </section>
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
  const readiness = getCrmPublicationPublisherReadiness();
  const readyChannels = readiness.filter((channel) => channel.ready).length;

  return (
    <div className="crm-marketing-page">
      <header className="crm-page-header crm-marketing-header">
        <div>
          <p className="crm-eyebrow">Automation marketing</p>
          <h1 className="crm-title">Campagnes CRM</h1>
          <p className="crm-subtitle">
            Preparez les publications LinkedIn, Facebook, Indeed ou email,
            generez des liens suivis et rattachez les clics a votre CRM.
          </p>
        </div>

        <div className="crm-marketing-header-badge">
          <Sparkles size={16} />
          <span>Socle multi-canal</span>
        </div>
      </header>

      {!data.ready ? (
        <CampaignSetupNotice error={data.error} />
      ) : (
        <>
          <section className="crm-marketing-stats">
            <div className="crm-marketing-stat">
              <Megaphone size={20} />
              <span>Campagnes</span>
              <strong>{campaigns.length.toLocaleString("fr-FR")}</strong>
            </div>

            <div className="crm-marketing-stat">
              <CalendarClock size={20} />
              <span>Planifiees</span>
              <strong>{scheduledCount.toLocaleString("fr-FR")}</strong>
            </div>

            <div className="crm-marketing-stat">
              <CheckCircle2 size={20} />
              <span>Publiees</span>
              <strong>{publishedCount.toLocaleString("fr-FR")}</strong>
            </div>

            <div className="crm-marketing-stat">
              <MousePointerClick size={20} />
              <span>Clics suivis</span>
              <strong>{clickCount.toLocaleString("fr-FR")}</strong>
            </div>
          </section>

          <section className="crm-marketing-panel crm-publisher-readiness">
            <div className="crm-marketing-panel-head">
              <div>
                <p>Configuration envoi</p>
                <h2>Canaux prets a publier</h2>
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

          <section className="crm-marketing-panel crm-publication-calendar">
            <div className="crm-marketing-panel-head">
              <div>
                <p>Calendrier</p>
                <h2>{currentMonth}</h2>
              </div>
              <CalendarClock size={18} />
            </div>

            <div className="crm-calendar-weekdays" aria-hidden="true">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                (day) => (
                  <span key={day}>{day}</span>
                )
              )}
            </div>

            <div className="crm-calendar-grid">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  className={
                    day.date
                      ? "crm-calendar-day"
                      : "crm-calendar-day crm-calendar-day-empty"
                  }
                >
                  {day.date ? (
                    <>
                      <time dateTime={day.date.toISOString()}>
                        {day.date.getDate()}
                      </time>

                      <div className="crm-calendar-events">
                        {day.publications.length === 0 ? (
                          <span className="crm-calendar-none">-</span>
                        ) : (
                          day.publications.slice(0, 3).map((publication) => (
                            <span
                              key={publication.id}
                              className="crm-calendar-event"
                              title={`${publication.campaignName} - ${publication.title}`}
                            >
                              <strong>
                                {formatChannel(publication.channel)}
                              </strong>
                              {publication.title}
                            </span>
                          ))
                        )}

                        {day.publications.length > 3 ? (
                          <span className="crm-calendar-more">
                            +{day.publications.length - 3}
                          </span>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            {unscheduledCount > 0 ? (
              <div className="crm-calendar-unscheduled">
                <AlertTriangle size={16} />
                <span>
                  {unscheduledCount} publication(s) sans date de planification.
                </span>
              </div>
            ) : null}
          </section>

          <section className="crm-marketing-grid">
            <form
              action={createCrmMarketingCampaign}
              className="crm-marketing-panel crm-marketing-form"
            >
              <div className="crm-marketing-panel-head">
                <div>
                  <p>Nouvelle campagne</p>
                  <h2>Publication + lien suivi</h2>
                </div>
                <Send size={18} />
              </div>

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

              <fieldset className={`${styles.channelField} crm-marketing-field`}>
                <legend className={styles.channelLegend}>
                  Canaux de publication
                </legend>

                <div className={styles.channelCheckboxes}>
                  {CHANNELS.filter((channel) => channel.value !== "OTHER").map(
                    (channel) => (
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
                    )
                  )}
                </div>

                <p className={styles.channelHelp}>
                  Une publication et un lien suivi seront crees pour chaque
                  canal selectionne.
                </p>
              </fieldset>

              <label className="crm-marketing-field" htmlFor="scheduledAt">
                <span>Planification</span>
                <input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                />
              </label>

              <label className="crm-marketing-field" htmlFor="publicationTitle">
                <span>Titre de publication</span>
                <input
                  id="publicationTitle"
                  name="publicationTitle"
                  required
                  placeholder="Modernisez votre suivi terrain"
                />
              </label>

              <label className="crm-marketing-field" htmlFor="content">
                <span>Contenu</span>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={5}
                  placeholder="Votre texte de publication pret a etre valide puis publie."
                />
              </label>

              <div className="crm-marketing-field-row">
                <label className="crm-marketing-field" htmlFor="destinationUrl">
                  <span>Lien cible</span>
                  <input
                    id="destinationUrl"
                    name="destinationUrl"
                    required
                    defaultValue="/contact-commercial"
                  />
                </label>

                <label className="crm-marketing-field" htmlFor="ctaLabel">
                  <span>CTA</span>
                  <input
                    id="ctaLabel"
                    name="ctaLabel"
                    placeholder="Demander une demo"
                  />
                </label>
              </div>

              <label className="crm-marketing-field" htmlFor="emailCampaignId">
                <span>Campagne email liee</span>
                <select
                  id="emailCampaignId"
                  name="emailCampaignId"
                  defaultValue=""
                >
                  <option value="">Aucune</option>
                  {data.emailCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} - {formatStatus(campaign.status)}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="crm-marketing-submit">
                <Send size={16} />
                Creer la campagne
              </button>
            </form>

            <section className="crm-marketing-panel crm-marketing-queue">
              <div className="crm-marketing-panel-head">
                <div>
                  <p>File de publication</p>
                  <h2>Actions a valider</h2>
                </div>

                <div className="crm-marketing-actions">
                  {campaigns.length > 0 ? (
                    <button
                      type="submit"
                      form="crm-bulk-delete-campaigns"
                      className="crm-marketing-action crm-marketing-action-danger"
                    >
                      Supprimer selection
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
                <div className="crm-empty">
                  Aucune campagne CRM pour le moment.
                </div>
              ) : (
                <div className="crm-marketing-campaign-list">
                  {campaigns.map((campaign) => (
                    <article
                      key={campaign.id}
                      className="crm-marketing-campaign"
                    >
                      <div className="crm-marketing-campaign-head">
                        <div>
                          <label className="crm-campaign-select">
                            <input
                              type="checkbox"
                              name="campaignIds"
                              value={campaign.id}
                              form="crm-bulk-delete-campaigns"
                            />
                            <span>Selectionner</span>
                          </label>

                          <span className={getStatusClass(campaign.status)}>
                            {formatStatus(campaign.status)}
                          </span>

                          <h3>{campaign.name}</h3>

                          <p>
                            {campaign.objective ||
                              campaign.audience ||
                              "Campagne multi-canal preparee dans le CRM."}
                          </p>
                        </div>

                        <div className="crm-marketing-actions">
                          {campaign.emailCampaign ? (
                            <span className="crm-marketing-email-chip">
                              Email: {campaign.emailCampaign.name}
                            </span>
                          ) : null}

                          <DeleteCampaignAction campaignId={campaign.id} />
                        </div>
                      </div>

                      <div className="crm-marketing-publications">
                        {campaign.publications.map((publication) => (
                          <div
                            key={publication.id}
                            className="crm-marketing-publication"
                          >
                            <div className="crm-marketing-publication-main">
                              <div className="crm-marketing-publication-title">
                                <span>{formatChannel(publication.channel)}</span>
                                <strong>{publication.title}</strong>
                              </div>

                              <p>{publication.content}</p>

                              <div className="crm-marketing-meta">
                                <span
                                  className={getStatusClass(publication.status)}
                                >
                                  {formatStatus(publication.status)}
                                </span>

                                <span>
                                  {formatDateTime(publication.scheduledAt)}
                                </span>

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
                                    {publication.trackedLink.clickCount.toLocaleString(
                                      "fr-FR"
                                    )}{" "}
                                    clics
                                  </span>
                                ) : null}
                              </div>

                              <PublicationAssistant
                                channel={publication.channel}
                                title={publication.title}
                                content={publication.content}
                                ctaLabel={publication.ctaLabel}
                                destinationUrl={
                                  publication.trackedLink?.destinationUrl ||
                                  null
                                }
                                trackedUrl={
                                  publication.trackedLink
                                    ? `${origin}/r/${publication.trackedLink.slug}`
                                    : null
                                }
                              />
                            </div>

                            <div className="crm-marketing-actions">
                              <StatusAction
                                publicationId={publication.id}
                                status="READY"
                              >
                                Pret
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
                                  Publie
                                </StatusAction>
                              )}

                              <StatusAction
                                publicationId={publication.id}
                                status="CANCELLED"
                                variant="danger"
                              >
                                Annuler
                              </StatusAction>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </>
      )}
    </div>
  );
}
