// src/app/api/email-automations/prospect/route.ts
// Paramétrage de l'automatisation "Email de prospection"
// Déclencheur : CONTACT_STATUS_PROSPECT

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROSPECT_AUTOMATION_NAME = "Automatisation email de prospection";
const PROSPECT_AUTOMATION_DESCRIPTION =
  "Automatisation envoyée automatiquement quand un contact devient prospect.";

const DEFAULT_SUBJECT = "Découvrons ensemble vos besoins";
const DEFAULT_CONTENT =
  "<p>Bonjour {{contactName}},</p><p>Merci pour votre intérêt pour MD2I. Nous serions ravis d’échanger avec vous sur vos besoins.</p>";

function normalizeDelayUnit(value: unknown) {
  if (value === "MINUTES" || value === "HOURS" || value === "DAYS") {
    return value;
  }

  return "MINUTES";
}

function normalizeDelayValue(value: unknown) {
  const parsed = Number(value || 0);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function getCampaignSelect() {
  return {
    id: true,
    name: true,
    subject: true,
    htmlContent: true,
    fromName: true,
    fromEmail: true,
    replyTo: true,
    status: true,
    updatedAt: true,
  };
}

async function getOrCreateProspectAutomation(userId: string) {
  const existing = await prisma.emailAutomation.findFirst({
    where: {
      userId,
      trigger: "CONTACT_STATUS_PROSPECT",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      steps: {
        include: {
          campaign: {
            select: getCampaignSelect(),
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.emailAutomation.create({
    data: {
      userId,
      name: PROSPECT_AUTOMATION_NAME,
      description: PROSPECT_AUTOMATION_DESCRIPTION,
      trigger: "CONTACT_STATUS_PROSPECT",
      isActive: false,
      steps: {
        create: {
          position: 1,
          delayValue: 0,
          delayUnit: "MINUTES",
          subject: DEFAULT_SUBJECT,
          content: DEFAULT_CONTENT,
          isActive: true,
        },
      },
    },
    include: {
      steps: {
        include: {
          campaign: {
            select: getCampaignSelect(),
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });
}

function serializeAutomation(
  automation: Awaited<ReturnType<typeof getOrCreateProspectAutomation>>
) {
  const firstStep =
    automation.steps.find((step) => step.isActive) || automation.steps[0];

  return {
    id: automation.id,
    name: automation.name,
    description: automation.description,
    trigger: automation.trigger,
    isActive: automation.isActive,
    delayValue: firstStep?.delayValue ?? 0,
    delayUnit: firstStep?.delayUnit || "MINUTES",
    selectedCampaignId: firstStep?.campaignId || null,
    selectedCampaign: firstStep?.campaign || null,
    updatedAt: automation.updatedAt,
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [automation, draftCampaigns] = await Promise.all([
    getOrCreateProspectAutomation(userId),

    prisma.campaign.findMany({
      where: {
        userId,
        status: "DRAFT",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: getCampaignSelect(),
    }),
  ]);

  return NextResponse.json({
    automation: serializeAutomation(automation),
    draftCampaigns,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  const campaignId = body.campaignId ? String(body.campaignId) : null;
  const delayValue = normalizeDelayValue(body.delayValue);
  const delayUnit = normalizeDelayUnit(body.delayUnit);
  const isActive = Boolean(body.isActive);

  if (isActive && !campaignId) {
    return NextResponse.json(
      {
        error:
          "Choisissez une campagne brouillon avant d'activer l'automatisation de prospection.",
      },
      { status: 400 }
    );
  }

  let selectedCampaign:
    | {
        id: string;
        name: string;
        subject: string;
        htmlContent: string;
        fromName: string;
        fromEmail: string;
        replyTo: string | null;
        status: string;
        updatedAt: Date;
      }
    | null = null;

  if (campaignId) {
    selectedCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId,
        status: "DRAFT",
      },
      select: getCampaignSelect(),
    });

    if (!selectedCampaign) {
      return NextResponse.json(
        {
          error:
            "Campagne introuvable. Seules les campagnes brouillon peuvent être utilisées comme email de prospection.",
        },
        { status: 404 }
      );
    }
  }

  const automation = await getOrCreateProspectAutomation(userId);
  const firstStep =
    automation.steps.find((step) => step.isActive) || automation.steps[0];

  const updatedAutomation = await prisma.$transaction(async (tx) => {
    const updated = await tx.emailAutomation.update({
      where: {
        id: automation.id,
      },
      data: {
        name: PROSPECT_AUTOMATION_NAME,
        description: PROSPECT_AUTOMATION_DESCRIPTION,
        trigger: "CONTACT_STATUS_PROSPECT",
        isActive,
      },
    });

    if (firstStep) {
      await tx.emailAutomationStep.update({
        where: {
          id: firstStep.id,
        },
        data: {
          position: 1,
          delayValue,
          delayUnit,
          isActive: true,
          campaignId: selectedCampaign?.id || null,
          subject: selectedCampaign?.subject || DEFAULT_SUBJECT,
          content: selectedCampaign?.htmlContent || DEFAULT_CONTENT,
        },
      });

      await tx.emailAutomationStep.updateMany({
        where: {
          automationId: automation.id,
          id: {
            not: firstStep.id,
          },
        },
        data: {
          isActive: false,
        },
      });
    } else {
      await tx.emailAutomationStep.create({
        data: {
          automationId: automation.id,
          position: 1,
          delayValue,
          delayUnit,
          isActive: true,
          campaignId: selectedCampaign?.id || null,
          subject: selectedCampaign?.subject || DEFAULT_SUBJECT,
          content: selectedCampaign?.htmlContent || DEFAULT_CONTENT,
        },
      });
    }

    await tx.emailAutomation.updateMany({
      where: {
        userId,
        trigger: "CONTACT_STATUS_PROSPECT",
        id: {
          not: automation.id,
        },
      },
      data: {
        isActive: false,
      },
    });

    return updated;
  });

  const reloaded = await prisma.emailAutomation.findUnique({
    where: {
      id: updatedAutomation.id,
    },
    include: {
      steps: {
        include: {
          campaign: {
            select: getCampaignSelect(),
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!reloaded) {
    return NextResponse.json(
      { error: "Automatisation introuvable après sauvegarde." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    automation: serializeAutomation(reloaded),
  });
}