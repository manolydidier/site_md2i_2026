// src/app/lib/email/action-links.ts

import crypto from "crypto";

export type ContactStatusAction =
  | "NEW"
  | "PROSPECT"
  | "HOT_PROSPECT"
  | "CUSTOMER"
  | "INACTIVE";

type CreateContactStatusActionUrlInput = {
  contactId: string;
  status: ContactStatusAction;
  redirectUrl?: string | null;
  expiresInHours?: number;
};

type VerifyContactStatusActionInput = {
  contactId: string;
  status: string;
  redirectUrl: string;
  expires: string;
  signature: string;
};

function getActionLinkSecret() {
  const secret = process.env.ACTION_LINK_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("ACTION_LINK_SECRET ou AUTH_SECRET est manquant.");
  }

  return secret;
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getActionLinkSecret())
    .update(payload)
    .digest("hex");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function createPayload({
  contactId,
  status,
  redirectUrl,
  expires,
}: {
  contactId: string;
  status: string;
  redirectUrl: string;
  expires: string;
}) {
  return `${contactId}.${status}.${redirectUrl}.${expires}`;
}

export function createContactStatusActionUrl({
  contactId,
  status,
  redirectUrl,
  expiresInHours = 24 * 30,
}: CreateContactStatusActionUrlInput) {
  const baseUrl = getAppBaseUrl();
  const finalRedirectUrl = redirectUrl || "https://md2i.eu";
  const expires = String(Date.now() + expiresInHours * 60 * 60 * 1000);

  const payload = createPayload({
    contactId,
    status,
    redirectUrl: finalRedirectUrl,
    expires,
  });

  const signature = signPayload(payload);

  const url = new URL("/api/email-actions/contact-status", baseUrl);

  url.searchParams.set("contactId", contactId);
  url.searchParams.set("status", status);
  url.searchParams.set("redirect", finalRedirectUrl);
  url.searchParams.set("expires", expires);
  url.searchParams.set("signature", signature);

  return url.toString();
}

export function verifyContactStatusAction({
  contactId,
  status,
  redirectUrl,
  expires,
  signature,
}: VerifyContactStatusActionInput) {
  if (!contactId || !status || !redirectUrl || !expires || !signature) {
    return {
      valid: false,
      reason: "Paramètres manquants.",
    };
  }

  const expiresNumber = Number(expires);

  if (!Number.isFinite(expiresNumber)) {
    return {
      valid: false,
      reason: "Date d'expiration invalide.",
    };
  }

  if (Date.now() > expiresNumber) {
    return {
      valid: false,
      reason: "Lien expiré.",
    };
  }

  const payload = createPayload({
    contactId,
    status,
    redirectUrl,
    expires,
  });

  const expectedSignature = signPayload(payload);

  if (!safeCompare(expectedSignature, signature)) {
    return {
      valid: false,
      reason: "Signature invalide.",
    };
  }

  return {
    valid: true,
    reason: null,
  };
}