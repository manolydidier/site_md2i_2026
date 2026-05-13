import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import OpportunitiesTable from "./OpportunitiesTable";
import { CrmOpportunityStage } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function formatStageLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
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

  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Pipeline commercial</p>

          <h1 className="crm-title">Opportunités</h1>

          <p className="crm-subtitle">
            Chaque demande de démo, devis, rappel, support, maintenance ou appel
            d’offre devient une opportunité commerciale. Les actions se font
            maintenant dans une fenêtre dédiée pour éviter les modifications
            accidentelles.
          </p>
        </div>
      </header>

      <OpportunitiesTable
        opportunities={rows}
        stageOptions={stageOptions}
      />
    </>
  );
}