// app/api/campaigns/route.ts
// GET (liste) + POST (créer)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { campaignSchema } from "@/app/lib/email/schemas";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Number(searchParams.get("pageSize") || 10));

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),

    prisma.campaign.count({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    data: campaigns,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      status: "DRAFT",
    },
    include: {
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}