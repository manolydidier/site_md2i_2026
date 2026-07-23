// src/app/api/email-marketing/campaigns/[campaignId]/prepare-recipients/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { ensureCampaignRecipients } from "@/app/lib/email-marketing/campaign-recipients";

type RouteParams = Promise<{
  campaignId?: string;
  id?: string;
}>;

async function getCampaignId(params: RouteParams) {
  const resolvedParams = await params;

  const campaignId = resolvedParams.campaignId || resolvedParams.id;

  if (!campaignId) {
    throw new Error(
      "campaignId est manquant. Vérifie que le dossier de route s'appelle [campaignId] ou [id]."
    );
  }

  return campaignId;
}

export async function POST(
  req: Request,
  { params }: { params: RouteParams }
) {
  try {
    const guard = await withPermission(req, { resource: "campaigns", action: "canUpdate" });
    if (!guard.ok) return guard.response;
    const session = guard.session;

    const campaignId = await getCampaignId(params);

    console.log("[prepare-campaign-recipients][START]", {
      campaignId,
      userId: session.user.id,
    });

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
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
        {
          success: false,
          error: "Campagne introuvable.",
        },
        { status: 404 }
      );
    }

    const result = await ensureCampaignRecipients({
      id: campaign.id,
      userId: campaign.userId,
      groupId: campaign.groupId,
      campaignGroups: campaign.campaignGroups,
    });

    console.log("[prepare-campaign-recipients][DONE]", {
      campaignId: campaign.id,
      created: result.created,
      totalRecipients: result.totalRecipients,
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