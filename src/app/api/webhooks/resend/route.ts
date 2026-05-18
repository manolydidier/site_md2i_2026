// src/app/api/webhooks/resend/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/app/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    tags?: Record<string, string>;
    bounce?: {
      message?: string;
      type?: string;
      subType?: string;
    };
    click?: {
      link?: string;
    };
  };
};

function getEventDate(event: ResendWebhookEvent) {
  const value = event.created_at ? new Date(event.created_at) : new Date();

  if (Number.isNaN(value.getTime())) {
    return new Date();
  }

  return value;
}

function getRecipientId(event: ResendWebhookEvent) {
  return event.data?.tags?.recipient_id || null;
}

function getCampaignId(event: ResendWebhookEvent) {
  return event.data?.tags?.campaign_id || null;
}

function getEmail(event: ResendWebhookEvent) {
  return event.data?.to?.[0] || "";
}

function getMessage(event: ResendWebhookEvent) {
  if (event.data?.bounce?.message) {
    return event.data.bounce.message;
  }

  if (event.data?.click?.link) {
    return event.data.click.link;
  }

  if (event.data?.email_id) {
    return event.data.email_id;
  }

  return event.type;
}

async function updateCampaignCounters(campaignId: string) {
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

  await prisma.campaign.updateMany({
    where: {
      id: campaignId,
    },
    data: {
      totalRecipients,
      sentCount,
      failedCount,
    },
  });
}

async function handleEvent(event: ResendWebhookEvent) {
  const type = event.type;
  const eventDate = getEventDate(event);
  const recipientId = getRecipientId(event);
  const campaignId = getCampaignId(event);
  const email = getEmail(event);
  const message = getMessage(event);

  console.log("[resend-webhook][EVENT]", {
    type,
    recipientId,
    campaignId,
    email,
  });

  if (!recipientId) {
    console.warn("[resend-webhook][MISSING_RECIPIENT_ID]", {
      type,
      tags: event.data?.tags,
    });

    return;
  }

  const recipient = await prisma.campaignRecipient.findUnique({
    where: {
      id: recipientId,
    },
    select: {
      id: true,
      campaignId: true,
      email: true,
      sent: true,
      delivered: true,
      openedAt: true,
      clickedAt: true,
    },
  });

  if (!recipient) {
    console.warn("[resend-webhook][RECIPIENT_NOT_FOUND]", {
      recipientId,
      type,
    });

    return;
  }

  if (type === "email.sent") {
    await prisma.campaignRecipient.update({
      where: {
        id: recipientId,
      },
      data: {
        sent: true,
        sentAt: recipient.sent ? undefined : eventDate,
        error: null,
      },
    });
  }

  if (type === "email.delivered") {
    await prisma.campaignRecipient.update({
      where: {
        id: recipientId,
      },
      data: {
        sent: true,
        delivered: true,
        sentAt: recipient.sent ? undefined : eventDate,
        error: null,
      },
    });
  }

  if (type === "email.opened") {
    await prisma.campaignRecipient.update({
      where: {
        id: recipientId,
      },
      data: {
        openedAt: recipient.openedAt || eventDate,
      },
    });
  }

  if (type === "email.clicked") {
    await prisma.campaignRecipient.update({
      where: {
        id: recipientId,
      },
      data: {
        clickedAt: recipient.clickedAt || eventDate,
      },
    });
  }

  if (
    type === "email.bounced" ||
    type === "email.failed" ||
    type === "email.suppressed" ||
    type === "email.complained"
  ) {
    await prisma.campaignRecipient.update({
      where: {
        id: recipientId,
      },
      data: {
        error: message,
      },
    });
  }

  await prisma.emailLog.create({
    data: {
      campaignId: recipient.campaignId,
      email: email || recipient.email,
      status: type,
      provider: "resend-webhook",
      message,
    },
  });

  await updateCampaignCounters(recipient.campaignId);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    let event: ResendWebhookEvent;

    if (process.env.RESEND_WEBHOOK_SECRET) {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: req.headers.get("svix-id") || "",
          timestamp: req.headers.get("svix-timestamp") || "",
          signature: req.headers.get("svix-signature") || "",
        },
        webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
      }) as ResendWebhookEvent;
    } else {
      console.warn(
        "[resend-webhook][NO_SECRET] RESEND_WEBHOOK_SECRET manquant. Vérification désactivée."
      );

      event = JSON.parse(payload) as ResendWebhookEvent;
    }

    await handleEvent(event);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[resend-webhook][ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}