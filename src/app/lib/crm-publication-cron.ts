import { prisma } from "@/app/lib/prisma";
import { publishCrmPublication } from "@/app/lib/crm-publication-publisher";

const AUTO_CHANNELS = new Set(["LINKEDIN", "FACEBOOK"]);

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue.";
}

export async function processDueCrmPublications({ limit = 20 } = {}) {
  const now = new Date();

  const publications = await prisma.crmPublication.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        lte: now,
      },
    },
    take: limit,
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      trackedLink: {
        select: {
          slug: true,
          destinationUrl: true,
        },
      },
    },
  });

  const result = {
    checked: publications.length,
    published: 0,
    manualReady: 0,
    failed: 0,
    skipped: 0,
  };

  for (const publication of publications) {
    if (!publication.trackedLink) {
      result.failed += 1;

      await prisma.crmPublication.update({
        where: {
          id: publication.id,
        },
        data: {
          status: "FAILED",
          failureReason: "Lien suivi introuvable pour cette publication.",
        },
      });

      continue;
    }

    const trackedUrl = `${getSiteUrl()}/r/${publication.trackedLink.slug}`;

    if (!AUTO_CHANNELS.has(publication.channel)) {
      result.manualReady += 1;

      await prisma.$transaction(async (tx) => {
        await tx.crmPublication.update({
          where: {
            id: publication.id,
          },
          data: {
            status: "READY",
            failureReason:
              "Publication arrivee a echeance: canal a publier manuellement.",
          },
        });

        await tx.crmActivity.create({
          data: {
            type: "CAMPAIGN",
            title: `Publication ${publication.channel.toLowerCase()} prete`,
            description: publication.title,
            metadata: {
              publicationId: publication.id,
              campaignId: publication.campaignId,
              channel: publication.channel,
              trackedUrl,
              reason: "manual_channel_due",
            },
            userId: publication.userId,
          },
        });
      });

      continue;
    }

    try {
      const publishResult = await publishCrmPublication({
        publicationId: publication.id,
        channel: publication.channel,
        title: publication.title,
        content: publication.content,
        ctaLabel: publication.ctaLabel,
        trackedUrl,
        userId: publication.userId,
      });

      await prisma.$transaction(async (tx) => {
        await tx.crmPublication.update({
          where: {
            id: publication.id,
          },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            providerPostId: publishResult.externalId || null,
            providerUrl: publishResult.externalUrl || null,
            failureReason: null,
          },
        });

        await tx.crmMarketingCampaign.update({
          where: {
            id: publication.campaignId,
          },
          data: {
            status: "ACTIVE",
          },
        });

        await tx.crmActivity.create({
          data: {
            type: "CAMPAIGN",
            title: `Publication ${publication.channel.toLowerCase()} publiee automatiquement`,
            description: publication.title,
            metadata: {
              publicationId: publication.id,
              campaignId: publication.campaignId,
              channel: publication.channel,
              trackedUrl,
              externalId: publishResult.externalId || null,
              externalUrl: publishResult.externalUrl || null,
            },
            userId: publication.userId,
          },
        });
      });

      result.published += 1;
    } catch (error) {
      result.failed += 1;

      const message = getErrorMessage(error);

      await prisma.$transaction(async (tx) => {
        await tx.crmPublication.update({
          where: {
            id: publication.id,
          },
          data: {
            status: "FAILED",
            failureReason: message,
          },
        });

        await tx.crmActivity.create({
          data: {
            type: "CAMPAIGN",
            title: `Echec publication automatique ${publication.channel.toLowerCase()}`,
            description: message,
            metadata: {
              publicationId: publication.id,
              campaignId: publication.campaignId,
              channel: publication.channel,
            },
            userId: publication.userId,
          },
        });
      });
    }
  }

  return result;
}
