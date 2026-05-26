import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Link2,
  MousePointerClick,
  Send,
  Megaphone,
  Sparkles,
} from "lucide-react";

import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { prisma } from "@/app/lib/prisma";
import {
  createCrmMarketingCampaign,
  updateCrmPublicationStatus,
} from "./actions";
import PublicationAssistant from "./PublicationAssistant";
import styles from "./CampaignChannels.module.css";

export const dynamic = "force-dynamic";

/* ─── Types ─────────────────────────────────────────────────── */

type CampaignRow = {
  id: string;
  name: string;
  objective: string | null;
  audience: string | null;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  emailCampaign: { id: string; name: string; status: string } | null;
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

type EmailCampaignOption = { id: string; name: string; status: string };

type CampaignData =
  | { ready: true; campaigns: CampaignRow[]; emailCampaigns: EmailCampaignOption[] }
  | { ready: false; campaigns: []; emailCampaigns: []; error: string };

/* ─── Channel config ─────────────────────────────────────────── */

const CHANNELS = [
  { value: "LINKEDIN", label: "LinkedIn", className: styles.linkedin },
  { value: "FACEBOOK", label: "Facebook", className: styles.facebook },
  { value: "INDEED",   label: "Indeed",   className: styles.indeed   },
  { value: "EMAIL",    label: "Email",    className: styles.email    },
  { value: "WEBSITE",  label: "Site web", className: styles.website  },
  { value: "OTHER",    label: "Autre",    className: ""              },
];

/* ─── Data loading ───────────────────────────────────────────── */

async function loadCampaignData(userId: string): Promise<CampaignData> {
  try {
    const [campaigns, emailCampaigns] = await Promise.all([
      prisma.crmMarketingCampaign.findMany({
        where: { userId },
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          emailCampaign: { select: { id: true, name: true, status: true } },
          publications: {
            orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
            include: {
              trackedLink: {
                select: { slug: true, clickCount: true, destinationUrl: true },
              },
            },
          },
          trackedLinks: {
            select: { id: true, slug: true, clickCount: true, destinationUrl: true },
          },
        },
      }),
      prisma.campaign.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, status: true },
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

/* ─── Formatters ─────────────────────────────────────────────── */

function formatDateTime(value: Date | null) {
  if (!value) return "Non planifié";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", READY: "Prêt", SCHEDULED: "Planifié",
  PUBLISHED: "Publié", FAILED: "Erreur", CANCELLED: "Annulé",
  ACTIVE: "Actif", PAUSED: "En pause", COMPLETED: "Terminée", ARCHIVED: "Archivée",
};

function formatStatus(value: string) {
  return STATUS_LABELS[value] ?? value;
}

function formatChannel(value: string) {
  return CHANNELS.find((c) => c.value === value)?.label ?? value;
}

function getStatusVariant(value: string): "green" | "blue" | "red" | "default" {
  if (["PUBLISHED", "ACTIVE", "COMPLETED"].includes(value)) return "green";
  if (["SCHEDULED", "READY"].includes(value))               return "blue";
  if (["FAILED", "CANCELLED"].includes(value))              return "red";
  return "default";
}

/* ─── Helpers ────────────────────────────────────────────────── */

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/* ─── Sub-components ─────────────────────────────────────────── */

function StatusPill({ status }: { status: string }) {
  const variant = getStatusVariant(status);
  const variantClass =
    variant === "green" ? "crm-pill-green"
    : variant === "blue" ? "crm-pill-blue"
    : variant === "red"  ? "crm-pill-red"
    : "crm-pill-default";

  return (
    <span className={`crm-status-pill ${variantClass}`}>
      {formatStatus(status)}
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

function CampaignSetupNotice({ error }: { error: string }) {
  return (
    <section className="crm-marketing-setup">
      <h2>Module à initialiser</h2>
      <p>
        La page est prête, mais la base doit recevoir la migration{" "}
        <code>add_crm_marketing_campaigns</code> avant de charger les campagnes.
      </p>
      <code className="crm-error-code">{error}</code>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default async function CrmCampaignsPage() {
  const userId = await getCrmOwnerUserId();
  const origin = await getRequestOrigin();
  const data = await loadCampaignData(userId);

  const campaigns = data.campaigns;
  const publications = campaigns.flatMap((c) => c.publications);

  const scheduledCount = publications.filter((p) => p.status === "SCHEDULED").length;
  const publishedCount = publications.filter((p) => p.status === "PUBLISHED").length;
  const clickCount = campaigns.reduce(
    (sum, c) => sum + c.trackedLinks.reduce((s, l) => s + l.clickCount, 0),
    0,
  );

  return (
    <div className="crm-marketing-page">

      {/* ── Header ── */}
      <header className="crm-page-header crm-marketing-header">
        <div>
          <p className="crm-eyebrow">Automation marketing</p>
          <h1 className="crm-title">Campagnes CRM</h1>
          <p className="crm-subtitle">
            Préparez les publications LinkedIn, Facebook, Indeed ou email,
            générez des liens suivis et rattachez les clics à votre CRM.
          </p>
        </div>
        <div className="crm-marketing-header-badge">
          <Sparkles size={14} aria-hidden />
          <span>Socle multi-canal</span>
        </div>
      </header>

      {!data.ready ? (
        <CampaignSetupNotice error={data.error} />
      ) : (
        <>
          {/* ── Stats ── */}
          <section className="crm-marketing-stats">
            <div className="crm-marketing-stat">
              <Megaphone size={18} aria-hidden />
              <span>Campagnes</span>
              <strong>{campaigns.length.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="crm-marketing-stat">
              <CalendarClock size={18} aria-hidden />
              <span>Planifiées</span>
              <strong>{scheduledCount.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="crm-marketing-stat">
              <CheckCircle2 size={18} aria-hidden />
              <span>Publiées</span>
              <strong>{publishedCount.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="crm-marketing-stat">
              <MousePointerClick size={18} aria-hidden />
              <span>Clics suivis</span>
              <strong>{clickCount.toLocaleString("fr-FR")}</strong>
            </div>
          </section>

          {/* ── Grid ── */}
          <section className="crm-marketing-grid">

            {/* ── Creation form ── */}
            <form
              action={createCrmMarketingCampaign}
              className="crm-marketing-panel crm-marketing-form"
            >
              <div className="crm-marketing-panel-head">
                <div>
                  <p className="crm-panel-eyebrow">Créer</p>
                  <h2>Nouvelle campagne</h2>
                </div>
                <Send size={17} aria-hidden />
              </div>

              <label className="crm-marketing-field" htmlFor="name">
                <span>Nom de campagne</span>
                <input id="name" name="name" required placeholder="Relance SARA LinkedIn" />
              </label>

              <label className="crm-marketing-field" htmlFor="audience">
                <span>Audience</span>
                <input id="audience" name="audience" placeholder="DG, DAF, responsables opérationnels" />
              </label>

              <label className="crm-marketing-field" htmlFor="objective">
                <span>Objectif</span>
                <textarea id="objective" name="objective" rows={3} placeholder="Générer des demandes de démo qualifiées." />
              </label>

              {/* Channel pills */}
              <fieldset className={`${styles.channelField} crm-marketing-field`}>
                <legend className={styles.channelLegend}>Canaux de publication</legend>
                <div className={styles.channelCheckboxes}>
                  {CHANNELS.filter((ch) => ch.value !== "OTHER").map((ch) => (
                    <label
                      key={ch.value}
                      className={`${styles.channelCheckbox} ${ch.className}`}
                    >
                      <input
                        type="checkbox"
                        name="channels"
                        value={ch.value}
                        defaultChecked={ch.value === "LINKEDIN"}
                      />
                      <span className={styles.channelName}>{ch.label}</span>
                    </label>
                  ))}
                </div>
                <p className={styles.channelHelp}>
                  Une publication et un lien suivi seront créés pour chaque canal sélectionné.
                </p>
              </fieldset>

              <label className="crm-marketing-field" htmlFor="scheduledAt">
                <span>Planification</span>
                <input id="scheduledAt" name="scheduledAt" type="datetime-local" />
              </label>

              <label className="crm-marketing-field" htmlFor="publicationTitle">
                <span>Titre de publication</span>
                <input id="publicationTitle" name="publicationTitle" required placeholder="Modernisez votre suivi terrain" />
              </label>

              <label className="crm-marketing-field" htmlFor="content">
                <span>Contenu</span>
                <textarea id="content" name="content" required rows={5} placeholder="Votre texte de publication prêt à être validé puis publié." />
              </label>

              <div className="crm-marketing-field-row">
                <label className="crm-marketing-field" htmlFor="destinationUrl">
                  <span>Lien cible</span>
                  <input id="destinationUrl" name="destinationUrl" required defaultValue="/contact-commercial" />
                </label>
                <label className="crm-marketing-field" htmlFor="ctaLabel">
                  <span>CTA</span>
                  <input id="ctaLabel" name="ctaLabel" placeholder="Demander une démo" />
                </label>
              </div>

              <label className="crm-marketing-field" htmlFor="emailCampaignId">
                <span>Campagne email liée</span>
                <select id="emailCampaignId" name="emailCampaignId" defaultValue="">
                  <option value="">Aucune</option>
                  {data.emailCampaigns.map((ec) => (
                    <option key={ec.id} value={ec.id}>
                      {ec.name} — {formatStatus(ec.status)}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="crm-marketing-submit">
                <Send size={15} aria-hidden />
                Créer la campagne
              </button>
            </form>

            {/* ── Publication queue ── */}
            <section className="crm-marketing-panel crm-marketing-queue">
              <div className="crm-marketing-panel-head">
                <div>
                  <p className="crm-panel-eyebrow">File de publication</p>
                  <h2>Actions à valider</h2>
                </div>
                <BarChart3 size={17} aria-hidden />
              </div>

              {campaigns.length === 0 ? (
                <div className="crm-empty">Aucune campagne CRM pour le moment.</div>
              ) : (
                <div className="crm-marketing-campaign-list">
                  {campaigns.map((campaign) => (
                    <article key={campaign.id} className="crm-marketing-campaign">

                      {/* Campaign header */}
                      <div className="crm-marketing-campaign-head">
                        <div className="crm-marketing-campaign-info">
                          <StatusPill status={campaign.status} />
                          <h3>{campaign.name}</h3>
                          <p>
                            {campaign.objective ?? campaign.audience ?? "Campagne multi-canal préparée dans le CRM."}
                          </p>
                        </div>
                        {campaign.emailCampaign && (
                          <span className="crm-marketing-email-chip">
                            Email&nbsp;: {campaign.emailCampaign.name}
                          </span>
                        )}
                      </div>

                      {/* Publications */}
                      <div className="crm-marketing-publications">
                        {campaign.publications.map((pub) => (
                          <div key={pub.id} className="crm-marketing-publication">

                            <div className="crm-marketing-publication-main">
                              {/* Channel + title row */}
                              <div className="crm-marketing-publication-title">
                                <span className="crm-channel-badge">
                                  {formatChannel(pub.channel)}
                                </span>
                                <strong>{pub.title}</strong>
                              </div>

                              <p>{pub.content}</p>

                              <div className="crm-marketing-meta">
                                <StatusPill status={pub.status} />

                                <span>{formatDateTime(pub.scheduledAt)}</span>

                                {pub.trackedLink && (
                                  <Link
                                    href={`/r/${pub.trackedLink.slug}`}
                                    target="_blank"
                                    className="crm-marketing-link"
                                  >
                                    <Link2 size={12} aria-hidden />
                                    /r/{pub.trackedLink.slug}
                                    <ExternalLink size={11} aria-hidden />
                                  </Link>
                                )}

                                {pub.trackedLink && (
                                  <span>
                                    {pub.trackedLink.clickCount.toLocaleString("fr-FR")} clics
                                  </span>
                                )}
                              </div>

                              <PublicationAssistant
                                channel={pub.channel}
                                title={pub.title}
                                content={pub.content}
                                ctaLabel={pub.ctaLabel}
                                destinationUrl={pub.trackedLink?.destinationUrl ?? null}
                                trackedUrl={
                                  pub.trackedLink
                                    ? `${origin}/r/${pub.trackedLink.slug}`
                                    : null
                                }
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="crm-marketing-actions">
                              <StatusAction publicationId={pub.id} status="READY">
                                Prêt
                              </StatusAction>
                              <StatusAction publicationId={pub.id} status="PUBLISHED" variant="primary">
                                Publié
                              </StatusAction>
                              <StatusAction publicationId={pub.id} status="CANCELLED" variant="danger">
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