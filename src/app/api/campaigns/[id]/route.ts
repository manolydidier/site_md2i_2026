// app/api/campaigns/[id]/route.ts
// GET, PUT, DELETE + duplication

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { campaignSchema } from "@/app/lib/email/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      group: true,
      recipients: {
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 100,
      },
      logs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(campaign);
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

  const existing = await prisma.campaign.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "SENDING") {
    return NextResponse.json(
      { error: "Impossible d'éditer une campagne en cours d'envoi" },
      { status: 409 }
    );
  }

  const body = await req.json();

  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.campaign.update({
    where: {
      id,
    },
    data: parsed.data,
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
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

  await prisma.campaign.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}

// POST /api/campaigns/[id]?action=duplicate
// Appel : fetch(`/api/campaigns/${id}?action=duplicate`, { method: "POST" })
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { searchParams } = req.nextUrl;

  if (searchParams.get("action") !== "duplicate") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const original = await prisma.campaign.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    sentAt: _sentAt,
    sentCount: _sentCount,
    failedCount: _failedCount,
    totalRecipients: _totalRecipients,
    ...rest
  } = original;

  const duplicate = await prisma.campaign.create({
    data: {
      ...rest,
      name: `${original.name} (copie)`,
      status: "DRAFT",
      sentAt: null,
      scheduledAt: null,
      sentCount: 0,
      failedCount: 0,
      totalRecipients: 0,
      userId: session.user.id,
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}