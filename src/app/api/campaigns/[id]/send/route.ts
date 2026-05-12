// app/api/campaigns/[id]/send/route.ts
// POST → déclenche l'envoi de la campagne
// Le client peut poll /status pour suivre la progression

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { sendCampaign } from "@/app/lib/email/sender";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que la campagne appartient bien à l'utilisateur
  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campagne introuvable" },
      { status: 404 }
    );
  }

  if (campaign.status === "SENDING") {
    return NextResponse.json(
      { error: "Campagne déjà en cours d'envoi" },
      { status: 409 }
    );
  }

  if (campaign.status === "SENT") {
    return NextResponse.json(
      { error: "Campagne déjà envoyée" },
      { status: 409 }
    );
  }

  if (!campaign.groupId) {
    const count = await prisma.campaignRecipient.count({
      where: { campaignId: id },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: "Aucun destinataire : assignez un groupe ou des contacts" },
        { status: 400 }
      );
    }
  }

  sendCampaign(id).catch((err) => {
    console.error(`[API] Erreur envoi campagne ${id}:`, err);
  });

  return NextResponse.json(
    {
      message: "Envoi démarré",
      campaignId: id,
    },
    { status: 202 }
  );
}