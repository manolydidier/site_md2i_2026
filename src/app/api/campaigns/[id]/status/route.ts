// app/api/campaigns/[id]/status/route.ts
// GET → progression de l'envoi pour polling

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const progress =
    campaign.totalRecipients > 0
      ? Math.round(
          ((campaign.sentCount + campaign.failedCount) /
            campaign.totalRecipients) *
            100
        )
      : 0;

  return NextResponse.json({
    ...campaign,
    progress,
  });
}