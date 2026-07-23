import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { ensureCampaignRecipients } from "@/app/lib/email-marketing/campaign-recipients";
import { sendResendCampaignEmail } from "@/app/lib/email-marketing/resend-campaign-sender";

type Body = {
  limit?: number;
  retryFailed?: boolean;
};

type RouteParams = Promise<{
  campaignId?: string;
  id?: string;
}>;

type RuntimeCampaignStatus =
  | "DRAFT"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "SCHEDULED"
  | "CANCELLED";

type RuntimeCampaignState = {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  status: RuntimeCampaignStatus;
  sentAt: Date | null;
};

async function getCampaignId(params: RouteParams) {
  const resolvedParams = await params;

  const campaignId = resolvedParams.campaignId || resolvedParams.id;

  if (!campaignId) {
    throw new Error(
      "campaignId est manquant. Verifie que le dossier de route s'appelle bien [campaignId] ou [id]."
    );
  }

  return campaignId;
}

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

async function getCampaignRuntimeState(
  campaignId: string
): Promise<RuntimeCampaignState> {
  if (!campaignId) {
    throw new Error(
      "[getCampaignRuntimeState] campaignId est undefined. Impossible de mettre a jour la campagne."
    );
  }

  const [campaign, totalRecipients, sentCount, failedCount, pendingCount] =
    await Promise.all([
      prisma.campaign.findUnique({
        where: {
          id: campaignId,
        },
        select: {
          status: true,
          sentAt: true,
        },
      }),

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

      prisma.campaignRecipient.count({
        where: {
          campaignId,
          sent: false,
          error: null,
        },
      }),
    ]);

  if (!campaign) {
    throw new Error(
      "[getCampaignRuntimeState] Campagne introuvable pendant la mise a jour."
    );
  }

  let status: RuntimeCampaignStatus = campaign.status;

  if (campaign.status === "CANCELLED" && pendingCount > 0) {
    status = "CANCELLED";
  } else if (pendingCount > 0) {
    status = "SENDING";
  } else if (sentCount > 0) {
    status = "SENT";
  } else if (failedCount > 0) {
    status = "FAILED";
  } else if (campaign.status === "CANCELLED") {
    status = "CANCELLED";
  } else if (campaign.status === "SENDING") {
    status = "DRAFT";
  }

  const sentAt =
    status === "SENT" ? campaign.sentAt ?? new Date() : campaign.sentAt;

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      totalRecipients,
      sentCount,
      failedCount,
      status,
      sentAt,
    },
  });

  return {
    totalRecipients,
    sentCount,
    failedCount,
    pendingCount,
    status,
    sentAt,
  };
}

async function getLatestCampaignStatus(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    select: {
      status: true,
    },
  });

  return campaign?.status ?? null;
}

async function buildSendResponse(params: {
  success: boolean;
  campaignId: string;
  sent: number;
  failed: number;
  cancelled?: boolean;
  message?: string;
}) {
  const runtime = await getCampaignRuntimeState(params.campaignId);
  const cancelled = runtime.status === "CANCELLED";

  return {
    success: params.success,
    cancelled,
    message: cancelled || !params.cancelled ? params.message : undefined,
    status: runtime.status,
    sent: params.sent,
    failed: params.failed,
    remaining: runtime.pendingCount,
    counters: {
      totalRecipients: runtime.totalRecipients,
      sentCount: runtime.sentCount,
      failedCount: runtime.failedCount,
    },
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  const startedAt = new Date();

  try {
    const guard = await withPermission(req, { resource: "campaigns", action: "canExecute" });
    if (!guard.ok) return guard.response;
    const session = guard.session;

    const userId = session.user.id;
    const campaignId = await getCampaignId(params);

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
      console.warn("[campaign-send][CAMPAIGN_NOT_FOUND]", {
        campaignId,
        userId,
      });

      return NextResponse.json(
        { success: false, error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    if (campaign.status === "SENT") {
      return NextResponse.json(
        {
          success: false,
          error: "Cette campagne est deja envoyee.",
        },
        { status: 409 }
      );
    }

    if (campaign.status === "CANCELLED") {
      const response = await buildSendResponse({
        success: true,
        campaignId: campaign.id,
        sent: 0,
        failed: 0,
        cancelled: true,
        message:
          "L'envoi est annule. Dupliquez ou reouvrez la campagne si vous souhaitez la relancer.",
      });

      return NextResponse.json(response);
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
          error: "L'adresse d'expediteur de la campagne est vide.",
        },
        { status: 400 }
      );
    }

    const prepared = await ensureCampaignRecipients({
      id: campaign.id,
      userId: campaign.userId,
      groupId: campaign.groupId,
      campaignGroups: campaign.campaignGroups,
    });

    console.log("[campaign-send][RECIPIENTS_PREPARED]", {
      campaignId: campaign.id,
      created: prepared.created,
      totalRecipients: prepared.totalRecipients,
    });

    if (prepared.totalRecipients <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aucun destinataire valide n'a ete trouve pour cette campagne.",
        },
        { status: 400 }
      );
    }

    const statusBeforeSending = await getLatestCampaignStatus(campaign.id);

    if (statusBeforeSending === "CANCELLED") {
      const response = await buildSendResponse({
        success: true,
        campaignId: campaign.id,
        sent: 0,
        failed: 0,
        cancelled: true,
        message:
          "L'envoi a ete annule avant le lancement du prochain lot.",
      });

      return NextResponse.json(response);
    }

    if (statusBeforeSending !== "SENDING") {
      await prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: "SENDING",
        },
      });
    }

    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
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
      const response = await buildSendResponse({
        success: true,
        campaignId: campaign.id,
        sent: 0,
        failed: 0,
        message: "Aucun destinataire restant a envoyer pour ce lot.",
      });

      console.log("[campaign-send][NO_RECIPIENTS_TO_SEND]", {
        campaignId: campaign.id,
        remaining: response.remaining,
        counters: response.counters,
        status: response.status,
      });

      return NextResponse.json(response);
    }

    let sent = 0;
    let failed = 0;
    let cancelled = false;

    for (const recipient of recipients) {
      const liveStatus = await getLatestCampaignStatus(campaign.id);

      if (liveStatus === "CANCELLED") {
        cancelled = true;

        console.warn("[campaign-send][CANCELLED_DURING_BATCH]", {
          campaignId: campaign.id,
          recipientId: recipient.id,
        });

        break;
      }

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
          campaignId: campaign.id,
          recipientId: recipient.id,
          contactId: recipient.contactId,
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
          campaignId: campaign.id,
          recipientId: recipient.id,
          contactId: recipient.contactId,
          email: recipient.email,
          error: message,
        });
      }
    }

    const response = await buildSendResponse({
      success: true,
      campaignId: campaign.id,
      sent,
      failed,
      cancelled,
      message: cancelled
        ? "L'envoi a ete annule. Les emails deja transmis restent envoyes."
        : undefined,
    });

    console.log("[campaign-send][DONE]", {
      campaignId: campaign.id,
      sent,
      failed,
      remaining: response.remaining,
      counters: response.counters,
      status: response.status,
      cancelled,
      finishedAt: new Date().toISOString(),
    });

    return NextResponse.json(response);
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
