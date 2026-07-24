// src/app/(backoffice)/crm/page.tsx
// ou le chemin exact de ta page Dashboard CRM

import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  Bell,
  Building2,
  Clock3,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { getActiveOpportunityStages } from "@/app/lib/crm-opportunity-stages";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function getContactName(contact?: {
  firstName: string | null;
  lastName: string | null;
  email: string;
} | null) {
  if (!contact) return "—";

  const name = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || contact.email;
}

function getDueDateState(date: Date | null) {
  if (!date) return "neutral";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  if (due < today) return "late";
  if (due.getTime() === today.getTime()) return "today";

  return "upcoming";
}

function getPriorityStyle(priority: string): CSSProperties {
  if (priority === "HIGH" || priority === "URGENT") {
    return {
      background: "#FEF2F2",
      color: "#991B1B",
      border: "1px solid #FECACA",
    };
  }

  if (priority === "MEDIUM") {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
      border: "1px solid #FED7AA",
    };
  }

  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
}

function getStageLabel(stage: string) {
  const labels: Record<string, string> = {
    NEW: "Nouvelle",
    QUALIFIED: "Qualifiée",
    PROPOSAL: "Proposition",
    NEGOTIATION: "Négociation",
    WON: "Gagnée",
    LOST: "Perdue",
  };

  return labels[stage] || stage;
}

function getSourceLabel(source: string) {
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

  return labels[source] || source;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeDate(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "à l’instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays} j`;

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  crm_opportunity: "Opportunité",
  crm_task: "Tâche",
  crm_campaign: "Campagne",
  crm_publication: "Publication",
  crm_publication_queue: "File de publication",
  contact: "Contact",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "créée",
  update: "mise à jour",
  delete: "supprimée",
  bulk_delete: "supprimés (lot)",
  publish: "publiée",
  publish_failed: "échec de publication",
  execute: "exécutée",
  status_change: "changement de statut",
};

function describeAuditEntry(entity: string, action: string) {
  const entityLabel = AUDIT_ENTITY_LABELS[entity] || entity;
  const actionLabel = AUDIT_ACTION_LABELS[action] || action;
  return `${entityLabel} ${actionLabel}`;
}

function getActorName(actor?: {
  firstName: string | null;
  lastName: string | null;
  email: string;
} | null) {
  if (!actor) return "Système";

  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
  return name || actor.email;
}

export default async function CrmDashboardPage() {
  const userId = await getCrmOwnerUserId();

  const [
    contactsCount,
    companiesCount,
    opportunitiesCount,
    tasksToDoCount,
    recentOpportunities,
    urgentTasks,
    stageOptions,
    pipelineByStage,
    recentActivity,
  ] = await Promise.all([
    prisma.contact.count({
      where: {
        userId,
      },
    }),

    prisma.crmCompany.count({
      where: {
        userId,
      },
    }),

    prisma.crmOpportunity.count({
      where: {
        userId,
      },
    }),

    prisma.crmTask.count({
      where: {
        userId,
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
      },
    }),

    prisma.crmOpportunity.findMany({
      where: {
        userId,
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        contact: true,
        company: true,
        product: true,
      },
    }),

    prisma.crmTask.findMany({
      where: {
        userId,
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
      },
      take: 6,
      orderBy: {
        dueDate: "asc",
      },
      include: {
        contact: true,
        opportunity: true,
      },
    }),

    getActiveOpportunityStages(userId),

    prisma.crmOpportunity.groupBy({
      by: ["stage"],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    }),

    prisma.auditLog.findMany({
      where: {
        entity: { in: Object.keys(AUDIT_ENTITY_LABELS) },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const pipeline = stageOptions
    .map((option) => {
      const bucket = pipelineByStage.find((row) => row.stage === option.key);

      return {
        key: option.key,
        label: option.label || option.key,
        color: option.color,
        count: bucket?._count._all ?? 0,
        amount: Number(bucket?._sum.amount ?? 0),
      };
    })
    .filter((row) => row.count > 0);

  const pipelineMax = Math.max(1, ...pipeline.map((row) => row.amount));

  return (
    <div style={s.page}>
      <header style={s.hero}>
        <div style={s.heroGlow} />

        <div style={s.heroContent}>
          <div>
            <div style={s.eyebrowRow}>
              <span style={s.eyebrowIcon}>
                <Sparkles size={14} />
              </span>
              <p style={s.eyebrow}>Vue générale</p>
            </div>

            <h1 style={s.title}>Dashboard CRM</h1>

            <p style={s.subtitle}>
              Suivi des contacts, opportunités commerciales, relances et
              demandes issues du site, des campagnes email et des réseaux
              sociaux.
            </p>
          </div>

          <div style={s.heroBadge}>
            <TrendingUp size={17} />
            <span>CRM MD2I</span>
          </div>
        </div>
      </header>

      <section style={s.statsGrid}>
        <StatCard
          icon={<Users size={22} />}
          label="Contacts"
          value={contactsCount}
          subtitle="Base commerciale"
        />

        <StatCard
          icon={<Building2 size={22} />}
          label="Entreprises"
          value={companiesCount}
          subtitle="Comptes suivis"
        />

        <StatCard
          icon={<Target size={22} />}
          label="Opportunités"
          value={opportunitiesCount}
          subtitle="Pipeline commercial"
        />

        <StatCard
          icon={<Bell size={22} />}
          label="Relances à faire"
          value={tasksToDoCount}
          subtitle="Actions prioritaires"
          highlight
        />
      </section>

      <section style={s.contentGrid}>
        <PremiumSection
          title="Opportunités récentes"
          subtitle="Dernières opportunités créées dans le CRM"
          icon={<Target size={18} />}
        >
          {recentOpportunities.length === 0 ? (
            <EmptyState text="Aucune opportunité pour le moment." />
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Titre</th>
                    <th style={s.th}>Produit</th>
                    <th style={s.th}>Contact</th>
                    <th style={s.th}>Étape</th>
                    <th style={s.th}>Source</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOpportunities.map((opportunity) => (
                    <tr key={opportunity.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.mainCell}>
                          <span style={s.name}>{opportunity.title}</span>

                          {opportunity.company?.name && (
                            <span style={s.muted}>
                              {opportunity.company.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={s.td}>
                        {opportunity.product?.name ? (
                          <span style={s.productPill}>
                            {opportunity.product.name}
                          </span>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        <div style={s.mainCell}>
                          <span>{getContactName(opportunity.contact)}</span>

                          {opportunity.contact?.email && (
                            <span style={s.muted}>
                              {opportunity.contact.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={s.td}>
                        <span style={s.stageBadge}>
                          {getStageLabel(String(opportunity.stage))}
                        </span>
                      </td>

                      <td style={s.td}>
                        <span style={s.sourceBadge}>
                          {getSourceLabel(String(opportunity.source))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumSection>

        <PremiumSection
          title="Relances prioritaires"
          subtitle="Tâches en attente ou en cours"
          icon={<Clock3 size={18} />}
        >
          {urgentTasks.length === 0 ? (
            <EmptyState text="Aucune relance en attente." />
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Tâche</th>
                    <th style={s.th}>Contact</th>
                    <th style={s.th}>Échéance</th>
                    <th style={s.th}>Priorité</th>
                  </tr>
                </thead>

                <tbody>
                  {urgentTasks.map((task) => {
                    const dueState = getDueDateState(task.dueDate);

                    return (
                      <tr key={task.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.mainCell}>
                            <span style={s.name}>{task.title}</span>

                            {task.opportunity?.title && (
                              <span style={s.muted}>
                                {task.opportunity.title}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={s.td}>
                          {task.contact ? (
                            <div style={s.mainCell}>
                              <span>{getContactName(task.contact)}</span>
                              <span style={s.muted}>
                                {task.contact.email}
                              </span>
                            </div>
                          ) : (
                            <span style={s.muted}>—</span>
                          )}
                        </td>

                        <td style={s.td}>
                          <span
                            style={{
                              ...s.dueBadge,
                              ...(dueState === "late" ? s.dueLate : {}),
                              ...(dueState === "today" ? s.dueToday : {}),
                            }}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        </td>

                        <td style={s.td}>
                          <span
                            style={{
                              ...s.priorityBadge,
                              ...getPriorityStyle(String(task.priority)),
                            }}
                          >
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PremiumSection>
      </section>

      <section style={s.contentGrid}>
        <PremiumSection
          title="Pipeline par étape"
          subtitle="Valeur et nombre d’opportunités par étape active"
          icon={<TrendingUp size={18} />}
        >
          {pipeline.length === 0 ? (
            <EmptyState text="Aucune opportunité chiffrée pour le moment." />
          ) : (
            <div style={s.pipelineList}>
              {pipeline.map((row) => (
                <div key={row.key} style={s.pipelineRow}>
                  <div style={s.pipelineRowHeader}>
                    <span style={s.pipelineLabel}>
                      <span
                        style={{ ...s.pipelineDot, background: row.color }}
                      />
                      {row.label}
                    </span>
                    <span style={s.pipelineMeta}>
                      {row.count} · {formatAmount(row.amount)}
                    </span>
                  </div>
                  <div style={s.pipelineBarTrack}>
                    <div
                      style={{
                        ...s.pipelineBarFill,
                        width: `${Math.max(4, (row.amount / pipelineMax) * 100)}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumSection>

        <PremiumSection
          title="Activité récente"
          subtitle="Dernières actions journalisées (CRM)"
          icon={<Activity size={18} />}
        >
          {recentActivity.length === 0 ? (
            <EmptyState text="Aucune activité récente." />
          ) : (
            <ul style={s.activityList}>
              {recentActivity.map((entry) => (
                <li key={entry.id} style={s.activityItem}>
                  <div style={s.activityDot} />
                  <div style={s.activityBody}>
                    <span style={s.activityText}>
                      {describeAuditEntry(entry.entity, entry.action)}
                    </span>
                    <span style={s.muted}>
                      {getActorName(entry.actor)} · {formatRelativeDate(entry.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PremiumSection>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...s.statCard, ...(highlight ? s.statCardHighlight : {}) }}>
      <div style={s.statTop}>
        <div style={{ ...s.statIcon, ...(highlight ? s.statIconHot : {}) }}>
          {icon}
        </div>

        <span style={s.statChip}>{subtitle}</span>
      </div>

      <p style={s.statLabel}>{label}</p>
      <p style={s.statValue}>{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}

function PremiumSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <div>
          <div style={s.sectionTitleRow}>
            <span style={s.sectionIcon}>{icon}</span>
            <h2 style={s.sectionTitle}>{title}</h2>
          </div>

          <p style={s.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>
        <Sparkles size={20} />
      </div>
      <p>{text}</p>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_DARK = "#92400E";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT = "#9CA3AF";
const BORDER = "#E5E7EB";

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 32,
    background:
      "radial-gradient(circle at top left, rgba(239,159,39,0.13), transparent 34%), #F8FAFC",
    color: TEXT,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    marginBottom: 22,
    padding: 28,
    borderRadius: 24,
    background:
      "linear-gradient(135deg, #111827 0%, #1F2937 52%, #2B1804 100%)",
    border: `1px solid ${ORANGE_BORDER}`,
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.16)",
  },

  heroGlow: {
    position: "absolute",
    right: -80,
    top: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    background: "rgba(239,159,39,0.22)",
    filter: "blur(12px)",
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
  },

  eyebrowRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  eyebrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(239,159,39,0.16)",
    color: ORANGE,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  eyebrow: {
    margin: 0,
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.11em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    maxWidth: 780,
    margin: "12px 0 0",
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 1.7,
  },

  heroBadge: {
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.14)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 18,
  },

  statCard: {
    padding: 18,
    borderRadius: 20,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
  },

  statCardHighlight: {
    border: `1px solid ${ORANGE_BORDER}`,
    background:
      "linear-gradient(180deg, rgba(239,159,39,0.12), #FFFFFF 62%)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  statIconHot: {
    color: "#FFFFFF",
    background: ORANGE,
  },

  statChip: {
    padding: "5px 9px",
    borderRadius: 999,
    background: "#F8FAFC",
    color: MUTED,
    fontSize: 11,
    fontWeight: 800,
  },

  statLabel: {
    margin: 0,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  statValue: {
    margin: "4px 0 0",
    color: TEXT,
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
    gap: 18,
    alignItems: "start",
  },

  sectionCard: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  sectionTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 17,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  sectionSubtitle: {
    margin: "6px 0 0 43px",
    color: MUTED,
    fontSize: 13,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    padding: "13px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tr: {
    background: "#FFFFFF",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
  },

  mainCell: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  name: {
    color: TEXT,
    fontWeight: 900,
  },

  muted: {
    color: SOFT,
    fontSize: 12,
    fontWeight: 600,
  },

  productPill: {
    display: "inline-flex",
    width: "fit-content",
    maxWidth: 180,
    padding: "5px 9px",
    borderRadius: 999,
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  stageBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#1E3A8A",
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  sourceBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#475569",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  dueBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#475569",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  dueLate: {
    color: "#991B1B",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
  },

  dueToday: {
    color: ORANGE_DARK,
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
  },

  priorityBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  pipelineList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  pipelineRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  pipelineRowHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  pipelineLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: TEXT,
    fontSize: 13,
    fontWeight: 800,
  },

  pipelineDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    flexShrink: 0,
  },

  pipelineMeta: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  pipelineBarTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "#F1F5F9",
    overflow: "hidden",
  },

  pipelineBarFill: {
    height: "100%",
    borderRadius: 999,
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },

  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 4px",
    borderBottom: "1px solid #F1F5F9",
  },

  activityDot: {
    marginTop: 5,
    width: 7,
    height: 7,
    borderRadius: 999,
    background: ORANGE,
    flexShrink: 0,
  },

  activityBody: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  activityText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: 800,
  },

  empty: {
    minHeight: 220,
    borderRadius: 18,
    background: "#F9FAFB",
    border: `1px dashed ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: MUTED,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },
};