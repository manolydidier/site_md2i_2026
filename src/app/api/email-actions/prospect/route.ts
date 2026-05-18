// src/app/api/email-actions/prospect/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import {
  processPendingAutomationEmails,
  startContactAutomation,
} from "@/app/lib/email/automation-engine";
import { verifyContactActionSignature } from "@/app/lib/email/contact-action-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function redirectTo(path: string) {
  return NextResponse.redirect(`${getBaseUrl()}${path}`);
}

function maskEmail(email?: string | null) {
  if (!email) return null;

  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  return `${name.slice(0, 2)}***@${domain}`;
}

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get("contactId");
  const signature = req.nextUrl.searchParams.get("sig");

  console.log("[email-action][prospect][START]", {
    contactId,
    hasSignature: Boolean(signature),
    url: req.nextUrl.toString(),
  });

  if (!contactId || !signature) {
    console.error("[email-action][prospect][MISSING_PARAMS]", {
      contactId,
      hasSignature: Boolean(signature),
    });

    return redirectTo("/?emailAction=invalid");
  }

  const isValid = verifyContactActionSignature({
    contactId,
    action: "PROSPECT",
    signature,
  });

  if (!isValid) {
    console.error("[email-action][prospect][INVALID_SIGNATURE]", {
      contactId,
    });

    return redirectTo("/?emailAction=invalid-signature");
  }

  const contact = await prisma.contact.findUnique({
    where: {
      id: contactId,
    },
    select: {
      id: true,
      userId: true,
      email: true,
      crmStatus: true,
      isActive: true,
      unsubscribed: true,
    },
  });

  if (!contact) {
    console.error("[email-action][prospect][CONTACT_NOT_FOUND]", {
      contactId,
    });

    return redirectTo("/?emailAction=contact-not-found");
  }

  console.log("[email-action][prospect][CONTACT_FOUND]", {
    contactId: contact.id,
    email: maskEmail(contact.email),
    currentStatus: contact.crmStatus,
    isActive: contact.isActive,
    unsubscribed: contact.unsubscribed,
  });

  if (contact.unsubscribed) {
    console.log("[email-action][prospect][CONTACT_UNSUBSCRIBED_SKIP]", {
      contactId: contact.id,
      email: maskEmail(contact.email),
    });

    return redirectTo("/?emailAction=unsubscribed");
  }

  const shouldKeepCurrentStatus =
    contact.crmStatus === "CUSTOMER" || contact.crmStatus === "HOT_PROSPECT";

  const nextStatus = shouldKeepCurrentStatus ? contact.crmStatus : "PROSPECT";

  const updatedContact = await prisma.contact.update({
    where: {
      id: contact.id,
    },
    data: {
      crmStatus: nextStatus,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      userId: true,
      crmStatus: true,
      isActive: true,
      unsubscribed: true,
    },
  });

  console.log("[email-action][prospect][CONTACT_UPDATED]", {
    contactId: updatedContact.id,
    email: maskEmail(updatedContact.email),
    previousStatus: contact.crmStatus,
    nextStatus: updatedContact.crmStatus,
  });

  if (
    updatedContact.crmStatus === "PROSPECT" &&
    updatedContact.unsubscribed === false
  ) {
    try {
      console.log("[email-action][prospect][START_PROSPECT_AUTOMATION]", {
        contactId: updatedContact.id,
      });

      await startContactAutomation({
        userId: updatedContact.userId,
        contactId: updatedContact.id,
        trigger: "CONTACT_STATUS_PROSPECT",
      });

      const result = await processPendingAutomationEmails({
        limit: 10,
      });

      console.log("[email-action][prospect][PROCESS_RESULT]", {
        contactId: updatedContact.id,
        result,
      });
    } catch (error) {
      console.error("[email-action][prospect][AUTOMATION_ERROR]", {
        contactId: updatedContact.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    console.log("[email-action][prospect][AUTOMATION_SKIPPED]", {
      contactId: updatedContact.id,
      crmStatus: updatedContact.crmStatus,
      unsubscribed: updatedContact.unsubscribed,
    });
  }

  return redirectTo("/?emailAction=prospect");
}