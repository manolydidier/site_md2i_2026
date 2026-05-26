// app/api/cron/publish-scheduled/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { publishCrmPublication } from "@/app/lib/crm-publication-publisher";

export const dynamic = "force-dynamic";

function getTrackedUrl(slug: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${origin}/r/${slug}`;
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const duePublications = await prisma.crmPublication.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        lte: new Date(),
      },
    },
    take: 20,
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      trackedLink: true,
    },
  });

  const results = [];

  for (const publication of duePublications) {
    try {
      if (!publication.trackedLink) {
        throw new Error("Lien suivi manquant.");
      }

      // Verrou anti-double-publication.
      const lock = await prisma.crmPublication.updateMany({
        where: {
          id: publication.id,
          status: "SCHEDULED",
        },
        data: {
          status: "READY",
        },
      });

      if (lock.count === 0) continue;

      const result = await publishCrmPublication({
        publicationId: publication.id,
        channel: publication.channel,
        title: publication.title,
        content: publication.content,
        ctaLabel: publication.ctaLabel,
        trackedUrl: getTrackedUrl(publication.trackedLink.slug),
        userId: publication.userId,
      });

      await prisma.crmPublication.update({
        where: {
          id: publication.id,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          // Ajoutez ces champs dans Prisma si vous voulez les conserver :
          // externalPostId: result.externalId,
          // externalPostUrl: result.externalUrl,
        },
      });

      await prisma.crmActivity.create({
        data: {
          type: "CAMPAIGN",
          title: `Publication ${publication.channel.toLowerCase()} publiee automatiquement`,
          description: publication.title,
          metadata: {
            publicationId: publication.id,
            channel: publication.channel,
            externalId: result.externalId,
            externalUrl: result.externalUrl,
          },
          userId: publication.userId,
        },
      });

      results.push({
        id: publication.id,
        status: "PUBLISHED",
      });
    } catch (error) {
      await prisma.crmPublication.update({
        where: {
          id: publication.id,
        },
        data: {
          status: "FAILED",
          // Ajoutez idealement un champ lastError dans Prisma.
        },
      });

      results.push({
        id: publication.id,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}