// app/api/groups/route.ts
// CRUD groupes de contacts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { groupSchema } from "@/app/lib/email/schemas";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.contactGroup.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          contacts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = groupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const group = await prisma.contactGroup.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          contacts: true,
        },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}