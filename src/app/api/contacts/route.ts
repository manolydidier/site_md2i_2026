// app/api/contacts/route.ts
// CRUD contacts
// GET    /api/contacts
// POST   /api/contacts
// DELETE /api/contacts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { contactSchema } from "@/app/lib/email/schemas";

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

async function syncPrimaryGroupMembership(contactId: string, groupId: string | null) {
  await prisma.contactGroupMember.deleteMany({
    where: {
      contactId,
    },
  });

  if (!groupId) return;

  await prisma.contactGroupMember.upsert({
    where: {
      contactId_groupId: {
        contactId,
        groupId,
      },
    },
    update: {},
    create: {
      contactId,
      groupId,
    },
  });
}

// ─── GET /api/contacts ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20));
  const search = searchParams.get("search") || "";
  const groupId = searchParams.get("groupId") || undefined;
  const crmStatus = searchParams.get("crmStatus") || undefined;
  const crmSource = searchParams.get("crmSource") || undefined;

  const where = {
    userId: session.user.id,
    ...(groupId ? { groupId } : {}),
    ...(crmStatus ? { crmStatus: crmStatus as any } : {}),
    ...(crmSource ? { crmSource: crmSource as any } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { jobTitle: { contains: search, mode: "insensitive" as const } },
            { companyName: { contains: search, mode: "insensitive" as const } },
            { country: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
            {
              crmCompany: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: getContactInclude(),
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),

    prisma.contact.count({
      where,
    }),
  ]);

  return NextResponse.json({
    data: contacts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// ─── POST /api/contacts ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;
    const groupId = await ensureGroupBelongsToUser(
      cleanString(data.groupId),
      session.user.id
    );

    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
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

          userId: session.user.id,
        },
        include: getContactInclude(),
      });

      if (groupId) {
        await tx.contactGroupMember.upsert({
          where: {
            contactId_groupId: {
              contactId: created.id,
              groupId,
            },
          },
          update: {},
          create: {
            contactId: created.id,
            groupId,
          },
        });
      }

      return created;
    });

    return NextResponse.json(contact, { status: 201 });
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

// ─── DELETE /api/contacts ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { ids?: string[] };
  const ids = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  const { count } = await prisma.contact.deleteMany({
    where: {
      id: {
        in: ids,
      },
      userId: session.user.id,
    },
  });

  return NextResponse.json({ deleted: count });
}