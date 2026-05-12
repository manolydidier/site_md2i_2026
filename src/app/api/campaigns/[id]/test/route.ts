// app/api/campaigns/[id]/test/route.ts
// POST → envoyer un email de test à une adresse spécifique

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { sendTestEmail } from "@/app/lib/email/sender";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { testEmail } = (await req.json()) as { testEmail: string };

  if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    return NextResponse.json(
      { error: "Email de test invalide" },
      { status: 400 }
    );
  }

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

  const result = await sendTestEmail({
    to: testEmail,
    subject: `[TEST] ${campaign.subject}`,
    html: campaign.htmlContent,
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Email de test envoyé à ${testEmail}`,
  });
}