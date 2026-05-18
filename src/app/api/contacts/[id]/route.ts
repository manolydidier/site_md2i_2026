// src/app/api/contacts/[id]/route.ts
// GET PUT DELETE pour un contact individuel

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { contactSchema } from "@/app/lib/email/schemas";
import {
  cancelActiveAutomationsForContact,
  startContactAutomation,
} from "@/app/lib/email/automation-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LegacyAutomationTrigger =
  | "CONTACT_CREATED"
  | "CONTACT_STATUS_NEW"
  | "CONTACT_STATUS_PROSPECT"
  | "CONTACT_STATUS_HOT_PROSPECT"
  | "CONTACT_STATUS_CUSTOMER"
  | "CONTACT_STATUS_INACTIVE"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type DynamicTriggerEvent =
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type ContactAutomationSnapshot = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  groupId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  country: string | null;
  city: string | null;
  crmStatus: string | null;
  crmSource: string | null;
  isActive: boolean;
  unsubscribed: boolean;
};

function cleanString(value?: string | null) {
  const cleaned = String(value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function logInfo(label: string, data?: Record<string, unknown>) {
  console.log(`[contact-id-api][${label}]`, data || {});
}

function logError(label: string, data?: Record<string, unknown>) {
  console.error(`[contact-id-api][${label}]`, data || {});
}

function getContactInclude() {
  return {
    group: {
      select: {
        id: true,
        name: true,
      },
    },
    crmCompany: {
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        city: true,
      },
    },
  };
}

function toContactSnapshot(contact: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  groupId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  country: string | null;
  city: string | null;
  crmStatus: unknown;
  crmSource: unknown;
  isActive: boolean;
  unsubscribed: boolean;
}): ContactAutomationSnapshot {
  return {
    id: contact.id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    groupId: contact.groupId,
    jobTitle: contact.jobTitle,
    companyName: contact.companyName,
    country: contact.country,
    city: contact.city,
    crmStatus: contact.crmStatus ? String(contact.crmStatus) : null,
    crmSource: contact.crmSource ? String(contact.crmSource) : null,
    isActive: contact.isActive,
    unsubscribed: contact.unsubscribed,
  };
}

function getTriggerFromCrmStatus(
  status: string | null | undefined
): LegacyAutomationTrigger | null {
  if (status === "NEW") return "CONTACT_STATUS_NEW";
  if (status === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
  if (status === "HOT_PROSPECT") return "CONTACT_STATUS_HOT_PROSPECT";
  if (status === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
  if (status === "INACTIVE") return "CONTACT_STATUS_INACTIVE";

  return null;
}

function hasRelevantContactChange(
  previousContact: ContactAutomationSnapshot,
  currentContact: ContactAutomationSnapshot
) {
  return (
    previousContact.email !== currentContact.email ||
    previousContact.firstName !== currentContact.firstName ||
    previousContact.lastName !== currentContact.lastName ||
    previousContact.phone !== currentContact.phone ||
    previousContact.groupId !== currentContact.groupId ||
    previousContact.jobTitle !== currentContact.jobTitle ||
    previousContact.companyName !== currentContact.companyName ||
    previousContact.country !== currentContact.country ||
    previousContact.city !== currentContact.city ||
    previousContact.crmStatus !== currentContact.crmStatus ||
    previousContact.crmSource !== currentContact.crmSource ||
    previousContact.isActive !== currentContact.isActive ||
    previousContact.unsubscribed !== currentContact.unsubscribed
  );
}

async function startContactAutomationCompat(payload: {
  userId: string;
  contactId: string;
  trigger: LegacyAutomationTrigger;
  triggerEvent: DynamicTriggerEvent;
  previousContact?: ContactAutomationSnapshot | null;
  currentContact?: ContactAutomationSnapshot | null;
}) {
  logInfo("START_AUTOMATION_COMPAT", {
    userId: payload.userId,
    contactId: payload.contactId,
    trigger: payload.trigger,
    triggerEvent: payload.triggerEvent,
    previousCrmStatus: payload.previousContact?.crmStatus || null,
    currentCrmStatus: payload.currentContact?.crmStatus || null,
    previousCrmSource: payload.previousContact?.crmSource || null,
    currentCrmSource: payload.currentContact?.crmSource || null,
  });

  await startContactAutomation(payload as any);
}

async function ensureGroupBelongsToUser(groupId: string | null, userId: string) {
  if (!groupId) return null;

  const group = await prisma.contactGroup.findFirst({
    where: {
      id: groupId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!group) {
    throw new Error("Groupe introuvable ou non autorisé.");
  }

  return group.id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: getContactInclude(),
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(contact);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        groupId: true,
        jobTitle: true,
        companyName: true,
        country: true,
        city: true,
        crmStatus: true,
        crmSource: true,
        unsubscribed: true,
        isActive: true,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const previousSnapshot = toContactSnapshot(existingContact);
    const data = parsed.data;

    const groupId = await ensureGroupBelongsToUser(
      cleanString(data.groupId),
      session.user.id
    );

    const updatedContact = await prisma.$transaction(async (tx) => {
      const updated = await tx.contact.update({
        where: {
          id,
        },
        data: {
          email: normalizeEmail(data.email),
          firstName: cleanString(data.firstName),
          lastName: cleanString(data.lastName),
          phone: cleanString(data.phone),
          groupId,

          jobTitle: cleanString(data.jobTitle),
          companyName: cleanString(data.companyName),
          country: cleanString(data.country),
          city: cleanString(data.city),
          notes: cleanString(data.notes),

          crmStatus: data.crmStatus || "NEW",
          crmSource: data.crmSource || "MANUAL",

          isActive: data.isActive ?? true,
          unsubscribed: data.unsubscribed ?? false,
        },
        include: getContactInclude(),
      });

      await tx.contactGroupMember.deleteMany({
        where: {
          contactId: id,
        },
      });

      if (groupId) {
        await tx.contactGroupMember.upsert({
          where: {
            contactId_groupId: {
              contactId: id,
              groupId,
            },
          },
          update: {},
          create: {
            contactId: id,
            groupId,
          },
        });
      }

      return updated;
    });

    const currentSnapshot = toContactSnapshot(updatedContact);

    const hasOptedOut =
      updatedContact.unsubscribed === true || updatedContact.isActive === false;

    if (hasOptedOut) {
      logInfo("PUT_CONTACT_OPTED_OUT_CANCEL_AUTOMATIONS", {
        contactId: id,
        isActive: updatedContact.isActive,
        unsubscribed: updatedContact.unsubscribed,
      });

      await cancelActiveAutomationsForContact({
        userId: session.user.id,
        contactId: id,
      });

      return NextResponse.json(updatedContact);
    }

    const statusChanged =
      previousSnapshot.crmStatus !== currentSnapshot.crmStatus;

    const contactChanged = hasRelevantContactChange(
      previousSnapshot,
      currentSnapshot
    );

    const nextStatusTrigger = getTriggerFromCrmStatus(
      currentSnapshot.crmStatus || undefined
    );

    logInfo("PUT_CONTACT_CHANGE_DETECTED", {
      contactId: id,
      contactChanged,
      statusChanged,
      previousCrmStatus: previousSnapshot.crmStatus,
      currentCrmStatus: currentSnapshot.crmStatus,
      previousCrmSource: previousSnapshot.crmSource,
      currentCrmSource: currentSnapshot.crmSource,
      nextStatusTrigger,
    });

    if (statusChanged && nextStatusTrigger) {
      if (
        currentSnapshot.crmStatus === "CUSTOMER" ||
        currentSnapshot.crmStatus === "INACTIVE"
      ) {
        logInfo("PUT_CANCEL_ACTIVE_AUTOMATIONS_FOR_FINAL_STATUS", {
          contactId: id,
          crmStatus: currentSnapshot.crmStatus,
        });

        await cancelActiveAutomationsForContact({
          userId: session.user.id,
          contactId: id,
        });
      }

      await startContactAutomationCompat({
        userId: session.user.id,
        contactId: id,
        trigger: nextStatusTrigger,
        triggerEvent: "CONTACT_UPDATED",
        previousContact: previousSnapshot,
        currentContact: currentSnapshot,
      });
    }

    // Sécurité transition :
    // Pour éviter de lancer par erreur une automatisation CONTACT_CREATED avec l'ancien moteur,
    // on ne déclenche ici que les changements de statut tant que automation-engine.ts n'est pas encore migré.
    //
    // Après migration complète de automation-engine.ts, on pourra remplacer le bloc ci-dessus
    // par un lancement CONTACT_UPDATED générique pour tous les changements :
    //
    // if (contactChanged) {
    //   await startContactAutomationCompat({
    //     userId: session.user.id,
    //     contactId: id,
    //     trigger: nextStatusTrigger || "MANUAL_START",
    //     triggerEvent: "CONTACT_UPDATED",
    //     previousContact: previousSnapshot,
    //     currentContact: currentSnapshot,
    //   });
    // }

    return NextResponse.json(updatedContact);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cet email existe déjà" },
        { status: 409 }
      );
    }

    if (err instanceof Error) {
      logError("PUT_ERROR", {
        contactId: id,
        error: err.message,
      });

      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await cancelActiveAutomationsForContact({
    userId: session.user.id,
    contactId: id,
  });

  const { count } = await prisma.contact.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}