// src/app/lib/email-marketing/resend-campaign-sender.ts

import { Resend } from "resend";
import { sendResendEmail } from "@/app/lib/email/send-with-retry";

type SendCampaignEmailParams = {
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  to: string;
  subject: string;
  html: string;
  campaignId: string;
  recipientId: string;
  contactId: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`${name} est manquant.`);
  }

  return value.trim();
}

function getResend() {
  return new Resend(getRequiredEnv("RESEND_API_KEY"));
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmail(value: string) {
  const clean = value.trim();

  const match = clean.match(/<([^>]+)>/);

  if (match?.[1]) {
    return match[1].trim();
  }

  return clean;
}

function buildFrom({
  fromName,
  fromEmail,
}: {
  fromName?: string | null;
  fromEmail?: string | null;
}) {
  /**
   * Priorité :
   * 1. EMAIL_FROM si tu l’utilises déjà pour l’ancien envoi qui marche.
   * 2. RESEND_FROM_EMAIL si tu l’as configuré.
   * 3. campaign.fromEmail si elle existe.
   * 4. MAIL_FROM_ADDRESS en dernier fallback.
   */
  const envFrom =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "";

  const rawFrom = envFrom || fromEmail?.trim() || process.env.MAIL_FROM_ADDRESS?.trim() || "";

  if (!rawFrom) {
    throw new Error(
      "Aucun expéditeur trouvé. Configure EMAIL_FROM ou RESEND_FROM_EMAIL dans .env."
    );
  }

  /**
   * Si la valeur est déjà au format :
   * MD2I <noreply@send.md2i.eu>
   * on la garde telle quelle.
   */
  if (rawFrom.includes("<") && rawFrom.includes(">")) {
    return rawFrom;
  }

  const cleanEmail = extractEmail(rawFrom);
  const cleanName =
    fromName?.trim() ||
    process.env.MAIL_FROM_NAME?.trim() ||
    "MD2I";

  return `${cleanName} <${cleanEmail}>`;
}

function sanitizeTagValue(value: string) {
  /**
   * Resend accepte les tags avec lettres ASCII, chiffres, _ et -.
   * Les IDs cuid/uuid passent normalement, mais on sécurise quand même.
   */
  return value
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 256);
}

export async function sendResendCampaignEmail({
  fromName,
  fromEmail,
  replyTo,
  to,
  subject,
  html,
  campaignId,
  recipientId,
  contactId,
}: SendCampaignEmailParams) {
  const resend = getResend();

  const from = buildFrom({
    fromName,
    fromEmail,
  });

  const cleanTo = to.trim().toLowerCase();
  const cleanSubject = subject?.trim() || "Message de MD2I";

  if (!cleanTo) {
    throw new Error("Email destinataire manquant.");
  }

  if (!html?.trim()) {
    throw new Error("HTML de campagne vide.");
  }

  console.log("[resend-campaign-sender][SEND_ATTEMPT]", {
    from,
    to: cleanTo,
    subject: cleanSubject,
    campaignId,
    recipientId,
    contactId,
  });

  const { data, error } = await sendResendEmail(resend, {
    from,
    to: [cleanTo],
    subject: cleanSubject,
    html,
    text: htmlToText(html),

    /**
     * Si replyTo est vide, on ne l’envoie pas à Resend.
     */
    replyTo: replyTo?.trim() || undefined,

    /**
     * Les tags ne servent pas à envoyer.
     * Ils servent au webhook pour retrouver CampaignRecipient.
     */
    tags: [
      {
        name: "campaign_id",
        value: sanitizeTagValue(campaignId),
      },
      {
        name: "recipient_id",
        value: sanitizeTagValue(recipientId),
      },
      {
        name: "contact_id",
        value: sanitizeTagValue(contactId),
      },
    ],
  });

  if (error) {
    console.error("[resend-campaign-sender][RESEND_ERROR]", {
      from,
      to: cleanTo,
      subject: cleanSubject,
      error,
    });

    throw new Error(error.message || JSON.stringify(error));
  }

  if (!data?.id) {
    console.error("[resend-campaign-sender][NO_ID]", {
      from,
      to: cleanTo,
      subject: cleanSubject,
      data,
    });

    throw new Error("Resend n'a pas retourné d'identifiant email.");
  }

  console.log("[resend-campaign-sender][SEND_SUCCESS]", {
    from,
    to: cleanTo,
    resendEmailId: data.id,
  });

  return data;
}