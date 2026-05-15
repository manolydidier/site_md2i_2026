// app/api/contacts/[id]/route.ts
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

function cleanString(value?: string | null) {
  const cleaned = String(value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

function getTriggerFromCrmStatus(status: string | null | undefined) {
  if (status === "NEW") return "CONTACT_STATUS_NEW";
  if (status === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
  if (status === "HOT_PROSPECT") return "CONTACT_STATUS_HOT_PROSPECT";
  if (status === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
  if (status === "INACTIVE") return "CONTACT_STATUS_INACTIVE";

  return null;
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
        crmStatus: true,
        unsubscribed: true,
        isActive: true,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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

    const hasOptedOut =
      updatedContact.unsubscribed === true || updatedContact.isActive === false;

    if (hasOptedOut) {
      await cancelActiveAutomationsForContact({
        userId: session.user.id,
        contactId: id,
      });

      return NextResponse.json(updatedContact);
    }

    const statusChanged = existingContact.crmStatus !== updatedContact.crmStatus;
    const nextTrigger = getTriggerFromCrmStatus(updatedContact.crmStatus);

    if (statusChanged && nextTrigger) {
      if (
        updatedContact.crmStatus === "CUSTOMER" ||
        updatedContact.crmStatus === "INACTIVE"
      ) {
        await cancelActiveAutomationsForContact({
          userId: session.user.id,
          contactId: id,
        });
      }

      await startContactAutomation({
        userId: session.user.id,
        contactId: id,
        trigger: nextTrigger,
      });
    }

    return NextResponse.json(updatedContact);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cet email existe déjà" },
        { status: 409 }
      );
    }

    if (err instanceof Error) {
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