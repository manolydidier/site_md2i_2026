// src/app/api/email-marketing/campaigns/[campaignId]/send/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ensureCampaignRecipients } from "@/app/lib/email-marketing/campaign-recipients";
import { sendResendCampaignEmail } from "@/app/lib/email-marketing/resend-campaign-sender";

type Body = {
  limit?: number;
  retryFailed?: boolean;
};

function replaceVariables(
  html: string,
  contact: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    companyName: string | null;
  }
) {
  return html
    .replaceAll("{{email}}", contact.email || "")
    .replaceAll("{{firstName}}", contact.firstName || "")
    .replaceAll("{{lastName}}", contact.lastName || "")
    .replaceAll("{{phone}}", contact.phone || "")
    .replaceAll("{{companyName}}", contact.companyName || "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function refreshCampaignCounters(campaignId: string) {
  const [totalRecipients, sentCount, failedCount] = await Promise.all([
    prisma.campaignRecipient.count({
      where: {
        campaignId,
      },
    }),

    prisma.campaignRecipient.count({
      where: {
        campaignId,
        sent: true,
      },
    }),

    prisma.campaignRecipient.count({
      where: {
        campaignId,
        error: {
          not: null,
        },
      },
    }),
  ]);

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      totalRecipients,
      sentCount,
      failedCount,
    },
  });

  return {
    totalRecipients,
    sentCount,
    failedCount,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const startedAt = new Date();

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const campaignId = params.campaignId;

    const body = (await req.json().catch(() => ({}))) as Body;

    const limit = Math.min(Math.max(Number(body.limit || 25), 1), 100);
    const retryFailed = Boolean(body.retryFailed);

    console.log("[campaign-send][START]", {
      campaignId,
      userId,
      limit,
      retryFailed,
      startedAt: startedAt.toISOString(),
    });

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId,
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

    if (!campaign.htmlContent?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le contenu HTML de la campagne est vide.",
        },
        { status: 400 }
      );
    }

    if (!campaign.fromEmail?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse d'expéditeur de la campagne est vide.",
        },
        { status: 400 }
      );
    }

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "SENDING",
      },
    });

    const prepared = await ensureCampaignRecipients({
      id: campaign.id,
      userId: campaign.userId,
      groupId: campaign.groupId,
      campaignGroups: campaign.campaignGroups,
    });

    console.log("[campaign-send][RECIPIENTS_PREPARED]", {
      campaignId,
      created: prepared.created,
      totalRecipients: prepared.totalRecipients,
    });

    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        sent: false,
        ...(retryFailed
          ? {}
          : {
              error: null,
            }),
      },
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
          },
        },
      },
    });

    if (recipients.length === 0) {
      const counters = await refreshCampaignCounters(campaignId);

      const remaining = await prisma.campaignRecipient.count({
        where: {
          campaignId,
          sent: false,
          error: null,
        },
      });

      await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          status: remaining === 0 ? "SENT" : "SENDING",
          sentAt: remaining === 0 && !campaign.sentAt ? new Date() : campaign.sentAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Aucun destinataire restant à envoyer.",
        sent: 0,
        failed: 0,
        remaining,
        counters,
      });
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const html = replaceVariables(campaign.htmlContent, {
          email: recipient.email,
          firstName: recipient.contact.firstName,
          lastName: recipient.contact.lastName,
          phone: recipient.contact.phone,
          companyName: recipient.contact.companyName,
        });

        const result = await sendResendCampaignEmail({
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
          replyTo: campaign.replyTo,
          to: recipient.email,
          subject: campaign.subject,
          html,
          campaignId: campaign.id,
          recipientId: recipient.id,
          contactId: recipient.contactId,
        });

        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            sent: true,
            sentAt: new Date(),
            error: null,
          },
        });

        await prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            email: recipient.email,
            status: "SENT",
            provider: "resend",
            message: result.id,
          },
        });

        sent += 1;

        console.log("[campaign-send][SENT]", {
          campaignId,
          recipientId: recipient.id,
          email: recipient.email,
          resendEmailId: result.id,
        });
      } catch (error) {
        const message = getErrorMessage(error);

        failed += 1;

        await prisma.campaignRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            error: message,
          },
        });

        await prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            email: recipient.email,
            status: "FAILED",
            provider: "resend",
            message,
          },
        });

        console.error("[campaign-send][FAILED]", {
          campaignId,
          recipientId: recipient.id,
          email: recipient.email,
          error: message,
        });
      }
    }

    const remaining = await prisma.campaignRecipient.count({
      where: {
        campaignId,
        sent: false,
        error: null,
      },
    });

    const counters = await refreshCampaignCounters(campaignId);

    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: remaining === 0 ? "SENT" : "SENDING",
        sentAt: remaining === 0 && !campaign.sentAt ? new Date() : campaign.sentAt,
      },
    });

    console.log("[campaign-send][DONE]", {
      campaignId,
      sent,
      failed,
      remaining,
      finishedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      remaining,
      counters,
    });
  } catch (error) {
    console.error("[campaign-send][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}