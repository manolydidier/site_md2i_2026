// src/app/api/email-marketing/campaigns/[campaignId]/stats/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.campaignId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    const [
      total,
      sent,
      pending,
      delivered,
      opened,
      clicked,
      failed,
    ] = await Promise.all([
      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          sent: true,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          sent: false,
          error: null,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          delivered: true,
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          openedAt: {
            not: null,
          },
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          clickedAt: {
            not: null,
          },
        },
      }),

      prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          error: {
            not: null,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      campaign,
      stats: {
        total,
        sent,
        pending,
        delivered,
        opened,
        clicked,
        failed,
        sentRate: total > 0 ? Math.round((sent / total) * 100) : 0,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        clickRate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("[campaign-stats][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}