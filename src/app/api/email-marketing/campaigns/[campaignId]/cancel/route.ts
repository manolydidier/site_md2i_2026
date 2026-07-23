import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

type RouteParams = Promise<{
  campaignId?: string;
  id?: string;
}>;

async function getCampaignId(params: RouteParams) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.campaignId || resolvedParams.id;

  if (!campaignId) {
    throw new Error("campaignId est manquant.");
  }

  return campaignId;
}

export async function POST(
  req: Request,
  { params }: { params: RouteParams }
) {
  try {
    const guard = await withPermission(req, { resource: "campaigns", action: "canCancel" });
    if (!guard.ok) return guard.response;
    const session = guard.session;

    const campaignId = await getCampaignId(params);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    if (campaign.status === "SENT") {
      return NextResponse.json(
        {
          success: false,
          error: "Cette campagne est deja envoyee, elle ne peut plus etre annulee.",
        },
        { status: 400 }
      );
    }

    if (campaign.status === "CANCELLED") {
      return NextResponse.json({
        success: true,
        message: "Cette campagne est deja annulee.",
      });
    }

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    console.log("[campaign-cancel][DONE]", {
      campaignId: campaign.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Envoi annule.",
    });
  } catch (error) {
    console.error("[campaign-cancel][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
