// src/app/lib/email-marketing/resend-campaign-sender.ts

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendCampaignEmailParams = {
  fromName: string;
  fromEmail: string;
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

  if (!value) {
    throw new Error(`${name} est manquant.`);
  }

  return value;
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  getRequiredEnv("RESEND_API_KEY");

  const from = `${fromName || "MD2I"} <${fromEmail}>`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: htmlToText(html),
    replyTo: replyTo || undefined,

    // Important : ces tags permettent au webhook Resend
    // de retrouver la ligne CampaignRecipient.
    tags: [
      {
        name: "campaign_id",
        value: campaignId,
      },
      {
        name: "recipient_id",
        value: recipientId,
      },
      {
        name: "contact_id",
        value: contactId,
      },
    ],
  });

  if (error) {
    throw new Error(error.message || "Erreur Resend pendant l'envoi.");
  }

  if (!data?.id) {
    throw new Error("Resend n'a pas retourné d'identifiant email.");
  }

  return data;
}