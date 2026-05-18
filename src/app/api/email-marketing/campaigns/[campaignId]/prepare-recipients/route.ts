// src/app/api/email-marketing/campaigns/[campaignId]/prepare-recipients/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ensureCampaignRecipients } from "@/app/lib/email-marketing/campaign-recipients";

export async function POST(
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
      include: {
        campaignGroups: {
          select: {
            groupId: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    const result = await ensureCampaignRecipients({
      id: campaign.id,
      userId: campaign.userId,
      groupId: campaign.groupId,
      campaignGroups: campaign.campaignGroups,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[prepare-campaign-recipients][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}