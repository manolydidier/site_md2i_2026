// app/lib/email/resend.ts

import { Resend } from "resend";

type SendMarketingEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
};

let resendClient: Resend | null = null;

function isEmailDebugEnabled() {
  return process.env.EMAIL_DEBUG === "true";
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  return `${name.slice(0, 2)}***@${domain}`;
}

function safeLog(label: string, data: Record<string, unknown>) {
  if (!isEmailDebugEnabled()) return;

  console.log(`[EMAIL_DEBUG][${label}]`, JSON.stringify(data, null, 2));
}

function safeErrorLog(label: string, error: unknown) {
  console.error(`[EMAIL_ERROR][${label}]`, {
    message: error instanceof Error ? error.message : String(error),
    error,
  });
}

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY est manquant.");
  }

  safeLog("RESEND_CLIENT_INIT", {
    hasApiKey: Boolean(apiKey),
    apiKeyPrefix: apiKey.slice(0, 6),
  });

  resendClient = new Resend(apiKey);

  return resendClient;
}

export async function sendMarketingEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendMarketingEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL;
  const defaultReplyTo = process.env.RESEND_REPLY_TO;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL est manquant.");
  }

  const resend = getResendClient();

  safeLog("SEND_ATTEMPT", {
    to: maskEmail(to),
    from,
    replyTo: replyTo || defaultReplyTo || null,
    subject,
    htmlLength: html.length,
    textLength: text?.length || 0,
  });

  const startedAt = Date.now();

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || defaultReplyTo || undefined,
    });

    const durationMs = Date.now() - startedAt;

    if (error) {
      safeErrorLog("RESEND_RETURNED_ERROR", error);

      throw new Error(
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Erreur Resend lors de l'envoi email."
      );
    }

    safeLog("SEND_SUCCESS", {
      to: maskEmail(to),
      subject,
      durationMs,
      resendMessageId: data?.id || null,
      data,
    });

    return data;
  } catch (err) {
    const durationMs = Date.now() - startedAt;

    safeErrorLog("SEND_FAILED", err);

    safeLog("SEND_FAILED_DETAILS", {
      to: maskEmail(to),
      subject,
      durationMs,
      from,
      replyTo: replyTo || defaultReplyTo || null,
    });

    throw err;
  }
}