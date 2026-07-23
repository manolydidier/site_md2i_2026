// app/api/campaigns/[id]/status/route.ts
// GET → progression de l'envoi pour polling

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "campaigns", action: "canRead" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

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