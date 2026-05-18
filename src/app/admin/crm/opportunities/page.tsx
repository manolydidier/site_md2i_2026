// src/app/(backoffice)/crm/opportunities/page.tsx
// ou le chemin exact de ta page Opportunités CRM

import type { CSSProperties, ReactNode } from "react";
import {
  BadgeEuro,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import OpportunitiesTable from "./OpportunitiesTable";
import { CrmOpportunityStage } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function formatStageLabel(value: string) {
  const labels: Record<string, string> = {
    NEW: "Nouvelle",
    CONTACTED: "Contacté",
    CONTACT_MADE: "Contact établi",
    IN_CONTACT: "En contact",
    QUALIFIED: "Qualifiée",
    QUALIFICATION: "Qualification",
    PROPOSAL: "Proposition",
    PROPOSAL_SENT: "Proposition envoyée",
    QUOTE_SENT: "Devis envoyé",
    OFFER_SENT: "Offre envoyée",
    NEGOTIATION: "Négociation",
    IN_NEGOTIATION: "En négociation",
    WON: "Gagnée",
    CLOSED_WON: "Gagnée",
    LOST: "Perdue",
    CLOSED_LOST: "Perdue",
  };

  return (
    labels[value] ||
    value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

function isWonStage(stage: string) {
  return ["WON", "CLOSED_WON"].includes(stage);
}

function isLostStage(stage: string) {
  return ["LOST", "CLOSED_LOST"].includes(stage);
}

function isHotStage(stage: string) {
  return [
    "PROPOSAL",
    "PROPOSAL_SENT",
    "QUOTE_SENT",
    "OFFER_SENT",
    "NEGOTIATION",
    "IN_NEGOTIATION",
  ].includes(stage);
}

function parseAmount(value: unknown) {
  if (!value) return 0;

  const parsed = Number(String(value));

  if (Number.isNaN(parsed)) return 0;

  return parsed;
}

export default async function CrmOpportunitiesPage() {
  const userId = await getCrmOwnerUserId();

  const opportunities = await prisma.crmOpportunity.findMany({
    where: {
      userId,
    },
    take: 100,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      offer: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  const stageOptions = Object.values(CrmOpportunityStage).map((value) => ({
    value,
    label: formatStageLabel(value),
  }));

  const rows = opportunities.map((opportunity) => ({
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    requestType: opportunity.requestType,
    stage: opportunity.stage,
    source: opportunity.source,
    amount: opportunity.amount ? String(opportunity.amount) : "",
    currency: opportunity.currency || "EUR",
    probability: opportunity.probability ?? 0,
    createdAt: opportunity.createdAt.toISOString(),
    nextFollowUpAt: opportunity.nextFollowUpAt
      ? opportunity.nextFollowUpAt.toISOString()
      : null,
    contact: opportunity.contact
      ? {
          id: opportunity.contact.id,
          email: opportunity.contact.email,
          firstName: opportunity.contact.firstName,
          lastName: opportunity.contact.lastName,
          phone: opportunity.contact.phone,
        }
      : null,
    company: opportunity.company
      ? {
          id: opportunity.company.id,
          name: opportunity.company.name,
        }
      : null,
    product: opportunity.product
      ? {
          id: opportunity.product.id,
          name: opportunity.product.name,
          slug: opportunity.product.slug,
        }
      : null,
    offer: opportunity.offer
      ? {
          id: opportunity.offer.id,
          title: opportunity.offer.title,
        }
      : null,
  }));

  const totalOpportunities = opportunities.length;
  const wonOpportunities = opportunities.filter((opportunity) =>
    isWonStage(String(opportunity.stage))
  ).length;
  const lostOpportunities = opportunities.filter((opportunity) =>
    isLostStage(String(opportunity.stage))
  ).length;
  const hotOpportunities = opportunities.filter((opportunity) =>
    isHotStage(String(opportunity.stage))
  ).length;

  const totalPipelineAmount = opportunities
    .filter((opportunity) => !isLostStage(String(opportunity.stage)))
    .reduce((sum, opportunity) => sum + parseAmount(opportunity.amount), 0);

  const weightedAmount = opportunities
    .filter((opportunity) => !isLostStage(String(opportunity.stage)))
    .reduce((sum, opportunity) => {
      const amount = parseAmount(opportunity.amount);
      const probability = Number(opportunity.probability || 0);

      return sum + amount * (probability / 100);
    }, 0);

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

              <p style={s.eyebrow}>Pipeline commercial</p>
            </div>

            <h1 style={s.title}>Opportunités</h1>

            <p style={s.subtitle}>
              Chaque demande de démo, devis, rappel, support, maintenance ou
              appel d’offre devient une opportunité commerciale. Suivez votre
              pipeline, les montants, les probabilités et les prochaines
              relances depuis une interface dédiée.
            </p>
          </div>

          <div style={s.heroBadge}>
            <TrendingUp size={17} />
            <span>Pipeline MD2I</span>
          </div>
        </div>
      </header>

      <section style={s.statsGrid}>
        <StatCard
          icon={<Target size={22} />}
          label="Opportunités"
          value={totalOpportunities}
          subtitle="Total"
        />

        <StatCard
          icon={<Flame size={22} />}
          label="À fort potentiel"
          value={hotOpportunities}
          subtitle="Proposition / négociation"
          highlight
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Gagnées"
          value={wonOpportunities}
          subtitle="Succès"
          success
        />

        <StatCard
          icon={<BadgeEuro size={22} />}
          label="Pipeline"
          value={totalPipelineAmount}
          subtitle="Montant estimé"
          currency
        />

        <StatCard
          icon={<CircleDollarSign size={22} />}
          label="Pondéré"
          value={weightedAmount}
          subtitle="Montant probabilisé"
          currency
          highlight
        />
      </section>

      <OpportunitiesTable opportunities={rows} stageOptions={stageOptions} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  highlight = false,
  success = false,
  currency = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  subtitle: string;
  highlight?: boolean;
  success?: boolean;
  currency?: boolean;
}) {
  return (
    <div
      style={{
        ...s.statCard,
        ...(highlight ? s.statCardHighlight : {}),
        ...(success ? s.statCardSuccess : {}),
      }}
    >
      <div style={s.statTop}>
        <div
          style={{
            ...s.statIcon,
            ...(highlight ? s.statIconHot : {}),
            ...(success ? s.statIconSuccess : {}),
          }}
        >
          {icon}
        </div>

        <span style={s.statChip}>{subtitle}</span>
      </div>

      <p style={s.statLabel}>{label}</p>

      <p style={s.statValue}>
        {currency
          ? new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(value)
          : value.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
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
    maxWidth: 860,
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
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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

  statCardSuccess: {
    border: "1px solid rgba(22, 163, 74, 0.22)",
    background:
      "linear-gradient(180deg, rgba(22,163,74,0.08), #FFFFFF 62%)",
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

  statIconSuccess: {
    color: "#166534",
    background: "#DCFCE7",
    border: "1px solid #BBF7D0",
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
    fontSize: 29,
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
};