// src/app/lib/email/sender.ts

import { Resend } from "resend";
import { prisma } from "@/app/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendTestEmailParams = {
  to: string;
  subject: string;
  html: string;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
};

type NormalizedRecipient = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  contactId?: string | null;
};

function getVerifiedFrom(fromName?: string | null) {
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (!emailFrom) {
    throw new Error("EMAIL_FROM manquant dans .env");
  }

  // Si EMAIL_FROM contient déjà : "MD2I <newsletter@domaine.com>"
  if (emailFrom.includes("<") && emailFrom.includes(">")) {
    return emailFrom;
  }

  const safeName = fromName?.trim() || process.env.EMAIL_FROM_NAME?.trim();

  if (!safeName) {
    return emailFrom;
  }

  return `${safeName} <${emailFrom}>`;
}

function getReplyTo(replyTo?: string | null, fromEmail?: string | null) {
  const value = replyTo?.trim() || fromEmail?.trim() || "";

  if (!value) return undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return undefined;
  }

  return value;
}

function replaceVariables(
  html: string,
  recipient: NormalizedRecipient
) {
  const firstName = recipient.firstName || "";
  const lastName = recipient.lastName || "";
  const email = recipient.email || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return html
    .replaceAll("{{firstName}}", firstName)
    .replaceAll("{{lastName}}", lastName)
    .replaceAll("{{email}}", email)
    .replaceAll("{{fullName}}", fullName);
}

async function writeCampaignLog(params: {
  campaignId: string;
  email: string;
  status: "sent" | "failed";
  message?: string;
}) {
  const db = prisma as any;

  const delegate =
    db.campaignLog ||
    db.campaignEmailLog ||
    db.emailLog ||
    db.campaignSendLog;

  if (!delegate?.create) {
    return;
  }

  const payloads = [
    {
      campaignId: params.campaignId,
      email: params.email,
      status: params.status,
      message: params.message || null,
    },
    {
      campaignId: params.campaignId,
      recipientEmail: params.email,
      status: params.status,
      error: params.message || null,
    },
  ];

  for (const data of payloads) {
    try {
      await delegate.create({ data });
      return;
    } catch {
      // On tente l'autre forme si ton modèle de log utilise d'autres noms de champs.
    }
  }
}

export async function sendTestEmail({
  to,
  subject,
  html,
  fromName,
  fromEmail,
  replyTo,
}: SendTestEmailParams) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: "RESEND_API_KEY manquant dans .env",
      };
    }

    const verifiedFrom = getVerifiedFrom(fromName);
    const safeReplyTo = getReplyTo(replyTo, fromEmail);

    const { data, error } = await resend.emails.send({
      from: verifiedFrom,
      to: [to],
      subject,
      html,
      ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
    });

    if (error) {
      console.error("[sendTestEmail] Resend error:", error);

      return {
        success: false,
        error:
          typeof error === "object" && "message" in error
            ? String(error.message)
            : JSON.stringify(error),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[sendTestEmail] Fatal error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant l'envoi du test",
    };
  }
}

async function getCampaignRecipients(campaign: {
  id: string;
  userId: string;
  groupId: string | null;
}) {
  if (campaign.groupId) {
    const contacts = await prisma.contact.findMany({
      where: {
        groupId: campaign.groupId,
        userId: campaign.userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return contacts
      .filter((contact) => Boolean(contact.email))
      .map((contact) => ({
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        contactId: contact.id,
      })) as NormalizedRecipient[];
  }

  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      campaignId: campaign.id,
    },
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return recipients
    .map((recipient: any) => {
      const contact = recipient.contact;

      return {
        email: recipient.email || contact?.email || "",
        firstName: recipient.firstName || contact?.firstName || "",
        lastName: recipient.lastName || contact?.lastName || "",
        contactId: recipient.contactId || contact?.id || null,
      };
    })
    .filter((recipient) => Boolean(recipient.email)) as NormalizedRecipient[];
}

export async function sendCampaign(campaignId: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY manquant dans .env");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM manquant dans .env");
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
  });

  if (!campaign) {
    throw new Error("Campagne introuvable");
  }

  const recipients = await getCampaignRecipients({
    id: campaign.id,
    userId: campaign.userId,
    groupId: campaign.groupId,
  });

  if (recipients.length === 0) {
    throw new Error("Aucun destinataire trouvé pour cette campagne");
  }

  const verifiedFrom = getVerifiedFrom(campaign.fromName);
  const safeReplyTo = getReplyTo(campaign.replyTo, campaign.fromEmail);

  await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: "SENDING",
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
    },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      const html = replaceVariables(campaign.htmlContent, recipient);

      const { error } = await resend.emails.send({
        from: verifiedFrom,
        to: [recipient.email],
        subject: campaign.subject,
        html,
        ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
      });

      if (error) {
        failedCount += 1;

        const errorMessage =
          typeof error === "object" && "message" in error
            ? String(error.message)
            : JSON.stringify(error);

        await writeCampaignLog({
          campaignId: campaign.id,
          email: recipient.email,
          status: "failed",
          message: errorMessage,
        });
      } else {
        sentCount += 1;

        await writeCampaignLog({
          campaignId: campaign.id,
          email: recipient.email,
          status: "sent",
          message: "Email envoyé",
        });
      }
    } catch (error) {
      failedCount += 1;

      await writeCampaignLog({
        campaignId: campaign.id,
        email: recipient.email,
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant l'envoi",
      });
    }

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        sentCount,
        failedCount,
      },
    });
  }

  const finalStatus = sentCount > 0 ? "SENT" : "FAILED";

  const updatedCampaign = await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      sentAt: new Date(),
    },
  });

  return {
    success: finalStatus === "SENT",
    campaign: updatedCampaign,
    sentCount,
    failedCount,
    totalRecipients: recipients.length,
  };
}