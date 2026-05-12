// src/app/api/campaigns/[id]/test/route.ts
// POST → envoyer un email de test pour une campagne sauvegardée.
// Le vrai "from" Resend est géré dans sender.ts avec process.env.EMAIL_FROM.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { sendTestEmail } from "@/app/lib/email/sender";

type TestEmailBody = {
  testEmail?: string;
  subject?: string;
  htmlContent?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as TestEmailBody;

    const testEmail = body.testEmail?.trim();

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

    const subject = body.subject?.trim() || campaign.subject;
    const html = body.htmlContent?.trim() || campaign.htmlContent;
    const fromName = body.fromName?.trim() || campaign.fromName;
    const fromEmail = body.fromEmail?.trim() || campaign.fromEmail;
    const replyTo = body.replyTo?.trim() || campaign.replyTo || undefined;

    if (!subject) {
      return NextResponse.json({ error: "Sujet requis" }, { status: 400 });
    }

    if (!html) {
      return NextResponse.json(
        { error: "Contenu HTML requis" },
        { status: 400 }
      );
    }

    if (!fromName) {
      return NextResponse.json(
        { error: "Nom expéditeur requis" },
        { status: 400 }
      );
    }

    if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
      return NextResponse.json(
        { error: "Email expéditeur invalide" },
        { status: 400 }
      );
    }

    console.log("[CAMPAIGN TEST EMAIL] payload", {
      campaignId: id,
      to: testEmail,
      subject,
      fromName,
      fromEmail,
      replyTo,
      htmlLength: html.length,
      realFrom: process.env.EMAIL_FROM,
    });

    const result = await sendTestEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html,
      fromName,
      fromEmail,
      replyTo,
    });

    console.log("[CAMPAIGN TEST EMAIL] result", result);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Erreur inconnue pendant l'envoi du test",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${testEmail}`,
    });
  } catch (error) {
    console.error("[CAMPAIGN TEST EMAIL] fatal error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant l'envoi du test",
      },
      { status: 500 }
    );
  }
}