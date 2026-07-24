// src/app/lib/email/sender.ts

import { Resend } from "resend";
import { prisma } from "@/app/lib/prisma";
import { sendResendEmail } from "./send-with-retry";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_BASE_CSS = `
/* MD2I_EMAIL_BASE */
body {
  margin: 0;
  padding: 0;
  background: #f5f7fa;
  color: #181818;
  font-family: Inter, Arial, sans-serif;
}

.email-shell {
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
}

.email-hero {
  padding: 42px 28px;
  background: linear-gradient(135deg, rgba(239,159,39,.14), rgba(239,159,39,.04));
  border-radius: 0 0 24px 24px;
}

.email-eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(239,159,39,.12);
  color: #ef9f27;
  border: 1px solid rgba(239,159,39,.22);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.email-title {
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.08;
  letter-spacing: -.04em;
}

.email-text {
  margin: 0;
  color: rgba(15,23,42,.68);
  font-size: 15px;
  line-height: 1.7;
}

.email-section {
  padding: 32px 28px;
}

.email-card {
  padding: 22px;
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15,23,42,.06);
}

.email-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 22px;
  padding: 0 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 800;
}

.email-divider {
  height: 1px;
  background: rgba(15,23,42,.10);
  margin: 24px 0;
}

.email-footer {
  padding: 24px 28px;
  color: rgba(15,23,42,.52);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
  background: #f8fafc;
}

@media (max-width: 620px) {
  .email-shell {
    width: 100% !important;
  }

  .email-section,
  .email-hero {
    padding: 26px 20px;
  }

  .email-title {
    font-size: 26px;
  }
}
`;

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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getVerifiedFrom(fromName?: string | null) {
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (!emailFrom) {
    throw new Error("EMAIL_FROM manquant dans .env");
  }

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

function replaceVariables(html: string, recipient: NormalizedRecipient) {
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

function hasStyleTag(html: string) {
  return /<style[\s>]/i.test(html);
}

function hasHtmlDocument(html: string) {
  return /<html[\s>]/i.test(html) || /<body[\s>]/i.test(html);
}

function ensureEmailHasCss(html: string) {
  const safeHtml = html || "";

  if (hasStyleTag(safeHtml)) {
    return safeHtml;
  }

  if (hasHtmlDocument(safeHtml)) {
    return safeHtml.replace(
      /<head[^>]*>/i,
      (headTag) => `${headTag}
<style data-md2i-email-css="fallback">
${EMAIL_BASE_CSS}
</style>`
    );
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style data-md2i-email-css="fallback">
${EMAIL_BASE_CSS}
  </style>
</head>
<body>
${safeHtml}
</body>
</html>`;
}

function prepareEmailHtml(html: string, recipient?: NormalizedRecipient) {
  const withVariables = recipient ? replaceVariables(html, recipient) : html;
  const finalHtml = ensureEmailHasCss(withVariables);

  return finalHtml;
}

async function writeCampaignLog(params: {
  campaignId: string;
  email: string;
  status: "sent" | "failed";
  message?: string;
  provider?: string;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        campaignId: params.campaignId,
        email: params.email,
        status: params.status,
        message: params.message || null,
        provider: params.provider || "resend",
      },
    });
  } catch (error) {
    console.error("[writeCampaignLog] error", error);
  }
}

function addRecipientToMap(
  map: Map<string, NormalizedRecipient>,
  recipient: NormalizedRecipient
) {
  const email = recipient.email.trim().toLowerCase();

  if (!email) return;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  if (!map.has(email)) {
    map.set(email, {
      ...recipient,
      email,
    });
  }
}

async function getCampaignGroupIds(campaignId: string) {
  const db = prisma as any;

  if (!db.campaignGroup?.findMany) {
    console.warn(
      "[getCampaignGroupIds] prisma.campaignGroup indisponible. Lancez npx prisma generate et vérifiez src/app/lib/prisma.ts."
    );

    return [] as string[];
  }

  try {
    const campaignGroups = await db.campaignGroup.findMany({
      where: {
        campaignId,
      },
      select: {
        groupId: true,
      },
    });

    return campaignGroups
      .map((item: { groupId?: string | null }) => item.groupId)
      .filter(Boolean) as string[];
  } catch (error) {
    console.error("[getCampaignGroupIds] error", error);
    return [];
  }
}

async function getCampaignRecipients(campaign: {
  id: string;
  userId: string;
  groupId: string | null;
}) {
  const uniqueRecipients = new Map<string, NormalizedRecipient>();

  const campaignGroupIds = await getCampaignGroupIds(campaign.id);

  const groupIds = Array.from(
    new Set([
      ...campaignGroupIds,
      ...(campaign.groupId ? [campaign.groupId] : []),
    ])
  );

  console.log("[sendCampaign] groupes ciblés", {
    campaignId: campaign.id,
    groupId: campaign.groupId,
    campaignGroupIds,
    finalGroupIds: groupIds,
  });

  if (groupIds.length > 0) {
    const contacts = await prisma.contact.findMany({
      where: {
        userId: campaign.userId,
        groupId: {
          in: groupIds,
        },
        isActive: true,
        unsubscribed: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    for (const contact of contacts) {
      addRecipientToMap(uniqueRecipients, {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        contactId: contact.id,
      });
    }
  }

  const manualRecipients = await prisma.campaignRecipient.findMany({
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
          isActive: true,
          unsubscribed: true,
        },
      },
    },
  });

  for (const recipient of manualRecipients) {
    const contact = recipient.contact;

    if (contact && (!contact.isActive || contact.unsubscribed)) {
      continue;
    }

    addRecipientToMap(uniqueRecipients, {
      email: recipient.email || contact?.email || "",
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      contactId: recipient.contactId || contact?.id || null,
    });
  }

  return Array.from(uniqueRecipients.values());
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
    const finalHtml = prepareEmailHtml(html);

    console.log("[sendTestEmail] html check", {
      to,
      htmlLength: finalHtml.length,
      hasStyle: hasStyleTag(finalHtml),
      hasBaseCss: finalHtml.includes("MD2I_EMAIL_BASE"),
    });

    const { data, error } = await sendResendEmail(resend, {
      from: verifiedFrom,
      to: [to],
      subject,
      html: finalHtml,
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

  console.log("[sendCampaign] campaign html before send", {
    campaignId: campaign.id,
    htmlLength: campaign.htmlContent?.length || 0,
    hasStyle: hasStyleTag(campaign.htmlContent || ""),
    hasBaseCss: campaign.htmlContent?.includes("MD2I_EMAIL_BASE"),
  });

  const recipients = await getCampaignRecipients({
    id: campaign.id,
    userId: campaign.userId,
    groupId: campaign.groupId,
  });

  if (recipients.length === 0) {
    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "FAILED",
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      },
    });

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
      const html = prepareEmailHtml(campaign.htmlContent, recipient);

      console.log("[sendCampaign] sending recipient", {
        campaignId: campaign.id,
        to: recipient.email,
        htmlLength: html.length,
        hasStyle: hasStyleTag(html),
        hasBaseCss: html.includes("MD2I_EMAIL_BASE"),
      });

      const { error } = await sendResendEmail(resend, {
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

    await wait(250);
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
export async function sendAutomationEmail({
  to,
  subject,
  html,
  fromName,
  fromEmail,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: "RESEND_API_KEY manquant dans .env",
      };
    }

    if (!process.env.EMAIL_FROM) {
      return {
        success: false,
        error: "EMAIL_FROM manquant dans .env",
      };
    }

    const verifiedFrom = getVerifiedFrom(fromName);
    const safeReplyTo = getReplyTo(replyTo, fromEmail);
    const finalHtml = prepareEmailHtml(html);

    console.log("[sendAutomationEmail] before send", {
      to,
      subject,
      from: verifiedFrom,
      replyTo: safeReplyTo || null,
      htmlLength: finalHtml.length,
      hasStyle: hasStyleTag(finalHtml),
      hasBaseCss: finalHtml.includes("MD2I_EMAIL_BASE"),
    });

    const { data, error } = await sendResendEmail(resend, {
      from: verifiedFrom,
      to: [to],
      subject,
      html: finalHtml,
      ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
    });

    if (error) {
      console.error("[sendAutomationEmail] Resend error:", error);

      return {
        success: false,
        error:
          typeof error === "object" && "message" in error
            ? String(error.message)
            : JSON.stringify(error),
      };
    }

    console.log("[sendAutomationEmail] success", {
      to,
      subject,
      data,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[sendAutomationEmail] Fatal error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant l'envoi automatique",
    };
  }
}