// app/api/contacts/route.ts
// CRUD contacts
// GET    /api/contacts          → liste paginée avec recherche
// POST   /api/contacts          → créer un contact
// DELETE /api/contacts          → suppression en masse (body: { ids: [] })

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { contactSchema } from "@/app/lib/email/schemas";

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

  const where = {
    userId: session.user.id,
    ...(groupId ? { groupId } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
    const contact = await prisma.contact.create({
      data: {
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
        userId: session.user.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cet email existe déjà" },
        { status: 409 }
      );
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