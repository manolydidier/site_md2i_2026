// src/app/lib/crm-publication-cron.ts

import { randomUUID } from "node:crypto";

import { prisma } from "@/app/lib/prisma";
import { publishCrmPublication } from "@/app/lib/crm-publication-publisher";
import {
  createCrmPublicationLog,
  getErrorMessage,
  getErrorPayload,
} from "./crm-publication-log";

const AUTO_CHANNELS = new Set(["LINKEDIN", "FACEBOOK"]);

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function calculateNextRetryAt(retryCount: number) {
  const minutesByAttempt = [5, 15, 60, 180, 720];
  const minutes =
    minutesByAttempt[Math.min(retryCount - 1, minutesByAttempt.length - 1)] ||
    720;

  return new Date(Date.now() + minutes * 60 * 1000);
}

function isAutomaticChannel(channel: string) {
  return AUTO_CHANNELS.has(channel);
}

export async function processDueCrmPublications({
  limit = 20,
  userId,
}: {
  limit?: number;
  userId?: string;
} = {}) {
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - 15 * 60 * 1000);

  const publications = await prisma.crmPublication.findMany({
    where: {
      ...(userId ? { userId } : {}),
      OR: [
        {
          status: "SCHEDULED",
          scheduledAt: {
            lte: now,
          },
        },
        {
          status: "FAILED",
          nextRetryAt: {
            lte: now,
          },
        },
        {
          status: "PUBLISHING",
          lockedAt: {
            lt: staleLockBefore,
          },
        },
      ],
    },
    take: limit,
    orderBy: [
      {
        scheduledAt: "asc",
      },
      {
        nextRetryAt: "asc",
      },
    ],
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
    const attempt = publication.retryCount + 1;

    if (publication.status === "PUBLISHING") {
      const expiredLockUpdate = await prisma.crmPublication.updateMany({
        where: {
          id: publication.id,
          status: "PUBLISHING",
          lockedAt: {
            lt: staleLockBefore,
          },
        },
        data: {
          status: "FAILED",
          failureReason:
            "Publication interrompue pendant un envoi. Vérifiez la plateforme avant de réessayer pour éviter un doublon.",
          nextRetryAt: null,
          lockedAt: null,
          lockToken: null,
        },
      });

      if (expiredLockUpdate.count === 0) {
        result.skipped += 1;
        continue;
      }

      result.failed += 1;

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "LOCK_EXPIRED",
        status: "FAILED",
        attempt,
        message:
          "Verrou d'envoi expiré. Réessai automatique bloqué pour éviter une double publication.",
      });

      continue;
    }

    if (
      publication.status === "FAILED" &&
      publication.retryCount >= publication.maxRetries
    ) {
      result.skipped += 1;

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "RETRY_SKIPPED",
        status: "SKIPPED",
        attempt,
        message: "Nombre maximum de tentatives atteint.",
        metadata: {
          retryCount: publication.retryCount,
          maxRetries: publication.maxRetries,
        },
      });

      continue;
    }

    if (!publication.trackedLink) {
      const failedUpdate = await prisma.crmPublication.updateMany({
        where: {
          id: publication.id,
          status: {
            in: ["SCHEDULED", "FAILED", "PUBLISHING"],
          },
        },
        data: {
          status: "FAILED",
          failureReason: "Lien suivi introuvable pour cette publication.",
          retryCount: {
            increment: 1,
          },
          nextRetryAt: null,
          lockedAt: null,
          lockToken: null,
        },
      });

      if (failedUpdate.count === 0) {
        result.skipped += 1;
      } else {
        result.failed += 1;

        await createCrmPublicationLog({
          publicationId: publication.id,
          campaignId: publication.campaignId,
          userId: publication.userId,
          channel: publication.channel,
          action: "PUBLISH_FAILED",
          status: "FAILED",
          attempt,
          error: "Lien suivi introuvable pour cette publication.",
        });
      }

      continue;
    }

    const trackedUrl = `${getSiteUrl()}/r/${publication.trackedLink.slug}`;

    if (!isAutomaticChannel(publication.channel)) {
      const readyUpdate = await prisma.crmPublication.updateMany({
        where: {
          id: publication.id,
          status: {
            in: ["SCHEDULED", "FAILED", "PUBLISHING"],
          },
        },
        data: {
          status: "READY",
          failureReason:
            "Publication arrivée à échéance : canal à publier manuellement.",
          lockedAt: null,
          lockToken: null,
          nextRetryAt: null,
        },
      });

      if (readyUpdate.count === 0) {
        result.skipped += 1;
        continue;
      }

      result.manualReady += 1;

      await prisma.crmActivity.create({
        data: {
          type: "CAMPAIGN",
          title: `Publication ${publication.channel.toLowerCase()} prête`,
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

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "MANUAL_READY",
        status: "READY",
        attempt,
        message: "Canal non automatisé. Publication passée en prêt manuel.",
        metadata: {
          trackedUrl,
        },
      });

      continue;
    }

    const lockToken = randomUUID();

    const reserved = await prisma.crmPublication.updateMany({
      where: {
        id: publication.id,
        status: {
          in: ["SCHEDULED", "FAILED", "PUBLISHING"],
        },
        OR: [
          {
            lockedAt: null,
          },
          {
            lockedAt: {
              lt: staleLockBefore,
            },
          },
        ],
      },
      data: {
        status: "PUBLISHING",
        lockedAt: now,
        lockToken,
        lastAttemptAt: now,
        failureReason: null,
      },
    });

    if (reserved.count === 0) {
      result.skipped += 1;

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "LOCK_SKIPPED",
        status: "SKIPPED",
        attempt,
        message: "Publication déjà verrouillée ou déjà traitée.",
      });

      continue;
    }

    await createCrmPublicationLog({
      publicationId: publication.id,
      campaignId: publication.campaignId,
      userId: publication.userId,
      channel: publication.channel,
      action: "PUBLISH_START",
      status: "PUBLISHING",
      attempt,
      requestPayload: {
        publicationId: publication.id,
        channel: publication.channel,
        title: publication.title,
        trackedUrl,
      },
    });

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
        await tx.crmPublication.updateMany({
          where: {
            id: publication.id,
            status: "PUBLISHING",
            lockToken,
          },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            providerPostId: publishResult.externalId || null,
            providerUrl: publishResult.externalUrl || null,
            failureReason: null,
            nextRetryAt: null,
            lockedAt: null,
            lockToken: null,
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
            title: `Publication ${publication.channel.toLowerCase()} publiée automatiquement`,
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

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "PUBLISH_SUCCESS",
        status: "PUBLISHED",
        attempt,
        message: "Publication envoyée avec succès.",
        providerResponse: {
          externalId: publishResult.externalId || null,
          externalUrl: publishResult.externalUrl || null,
        },
      });

      result.published += 1;
    } catch (error) {
      result.failed += 1;

      const message = getErrorMessage(error);
      const nextRetryCount = publication.retryCount + 1;
      const shouldRetry = nextRetryCount < publication.maxRetries;
      const nextRetryAt = shouldRetry
        ? calculateNextRetryAt(nextRetryCount)
        : null;

      await prisma.$transaction(async (tx) => {
        await tx.crmPublication.updateMany({
          where: {
            id: publication.id,
            status: "PUBLISHING",
            lockToken,
          },
          data: {
            status: "FAILED",
            failureReason: message,
            retryCount: {
              increment: 1,
            },
            nextRetryAt,
            lockedAt: null,
            lockToken: null,
          },
        });

        await tx.crmActivity.create({
          data: {
            type: "CAMPAIGN",
            title: `Échec publication automatique ${publication.channel.toLowerCase()}`,
            description: message,
            metadata: {
              publicationId: publication.id,
              campaignId: publication.campaignId,
              channel: publication.channel,
              retryCount: nextRetryCount,
              maxRetries: publication.maxRetries,
              nextRetryAt: nextRetryAt?.toISOString() || null,
            },
            userId: publication.userId,
          },
        });
      });

      await createCrmPublicationLog({
        publicationId: publication.id,
        campaignId: publication.campaignId,
        userId: publication.userId,
        channel: publication.channel,
        action: "PUBLISH_FAILED",
        status: "FAILED",
        attempt,
        error: message,
        providerResponse: getErrorPayload(error),
        metadata: {
          retryCount: nextRetryCount,
          maxRetries: publication.maxRetries,
          nextRetryAt: nextRetryAt?.toISOString() || null,
          willRetry: shouldRetry,
        },
      });
    }
  }

  return result;
}
