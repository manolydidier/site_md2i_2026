// src/app/lib/email/contact-action-token.ts

import crypto from "crypto";

type ContactAction = "PROSPECT";

function getActionSecret() {
  const secret = process.env.CONTACT_ACTION_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "CONTACT_ACTION_SECRET ou AUTH_SECRET est manquant dans .env"
    );
  }

  return secret;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function createContactActionSignature({
  contactId,
  action,
}: {
  contactId: string;
  action: ContactAction;
}) {
  const payload = `${action}:${contactId}`;

  return crypto
    .createHmac("sha256", getActionSecret())
    .update(payload)
    .digest("hex");
}

export function verifyContactActionSignature({
  contactId,
  action,
  signature,
}: {
  contactId: string;
  action: ContactAction;
  signature: string;
}) {
  const expected = createContactActionSignature({
    contactId,
    action,
  });

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function buildProspectLink(contactId: string) {
  const signature = createContactActionSignature({
    contactId,
    action: "PROSPECT",
  });

  const baseUrl = getBaseUrl();

  return `${baseUrl}/api/email-actions/prospect?contactId=${encodeURIComponent(
    contactId
  )}&sig=${encodeURIComponent(signature)}`;
}