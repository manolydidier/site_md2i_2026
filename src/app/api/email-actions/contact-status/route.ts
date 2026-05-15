// src/app/api/email-actions/contact-status/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import {
  ContactStatusAction,
  getAppBaseUrl,
  verifyContactStatusAction,
} from "@/app/lib/email/action-links";
import {
  processPendingAutomationEmails,
  startContactAutomation,
} from "@/app/lib/email/automation-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getTriggerFromStatus(status: ContactStatusAction) {
  if (status === "NEW") return "CONTACT_STATUS_NEW";
  if (status === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
  if (status === "HOT_PROSPECT") return "CONTACT_STATUS_HOT_PROSPECT";
  if (status === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
  if (status === "INACTIVE") return "CONTACT_STATUS_INACTIVE";

  return null;
}

function normalizeStatus(value: string | null): ContactStatusAction | null {
  if (value === "NEW") return "NEW";
  if (value === "PROSPECT") return "PROSPECT";
  if (value === "HOT_PROSPECT") return "HOT_PROSPECT";
  if (value === "CUSTOMER") return "CUSTOMER";
  if (value === "INACTIVE") return "INACTIVE";

  return null;
}

function safeRedirect(url: string | null) {
  if (!url) {
    return `${getAppBaseUrl()}/merci`;
  }

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return `${getAppBaseUrl()}/merci`;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const contactId = searchParams.get("contactId") || "";
  const statusRaw = searchParams.get("status");
  const redirectUrl = searchParams.get("redirect") || "";
  const expires = searchParams.get("expires") || "";
  const signature = searchParams.get("signature") || "";

  console.log("[email-action][contact-status][HIT]", {
    contactId,
    statusRaw,
    redirectUrl,
    hasSignature: Boolean(signature),
  });

  const status = normalizeStatus(statusRaw);

  if (!status) {
    console.error("[email-action][contact-status][INVALID_STATUS]", {
      statusRaw,
    });

    return NextResponse.redirect(
      `${getAppBaseUrl()}/merci?status=invalid_status`
    );
  }

  const verification = verifyContactStatusAction({
    contactId,
    status,
    redirectUrl,
    expires,
    signature,
  });

  if (!verification.valid) {
    console.error("[email-action][contact-status][INVALID_LINK]", {
      contactId,
      status,
      reason: verification.reason,
    });

    return NextResponse.redirect(
      `${getAppBaseUrl()}/merci?status=invalid_link`
    );
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
    console.error("[email-action][contact-status][CONTACT_NOT_FOUND]", {
      contactId,
    });

    return NextResponse.redirect(
      `${getAppBaseUrl()}/merci?status=contact_not_found`
    );
  }

  console.log("[email-action][contact-status][CONTACT_FOUND]", {
    contactId: contact.id,
    email: contact.email,
    previousStatus: contact.crmStatus,
    nextStatus: status,
    isActive: contact.isActive,
    unsubscribed: contact.unsubscribed,
  });

  const updatedContact = await prisma.contact.update({
    where: {
      id: contact.id,
    },
    data: {
      crmStatus: status,
      crmSource: contact.crmStatus === status ? undefined : "EMAIL",
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

  console.log("[email-action][contact-status][CONTACT_UPDATED]", {
    contactId: updatedContact.id,
    email: updatedContact.email,
    crmStatus: updatedContact.crmStatus,
  });

  const trigger = getTriggerFromStatus(status);

  if (trigger && updatedContact.isActive && !updatedContact.unsubscribed) {
    console.log("[email-action][contact-status][START_AUTOMATION]", {
      contactId: updatedContact.id,
      trigger,
    });

    await startContactAutomation({
      userId: updatedContact.userId,
      contactId: updatedContact.id,
      trigger,
    });

    const result = await processPendingAutomationEmails({
      limit: 10,
    });

    console.log("[email-action][contact-status][PROCESS_RESULT]", {
      contactId: updatedContact.id,
      result,
    });
  } else {
    console.log("[email-action][contact-status][AUTOMATION_SKIPPED]", {
      contactId: updatedContact.id,
      trigger,
      isActive: updatedContact.isActive,
      unsubscribed: updatedContact.unsubscribed,
    });
  }

  return NextResponse.redirect(safeRedirect(redirectUrl));
}