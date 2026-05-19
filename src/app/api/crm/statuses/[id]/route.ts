// src/app/api/crm/statuses/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { crmStatusOptionUpdateSchema } from "@/app/lib/email/schemas";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{
  id: string;
}>;

function slugifyKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function getStatusOr404(id: string, userId: string) {
  return prisma.crmStatusOption.findFirst({
    where: {
      id,
      userId,
    },
  });
}

async function unsetOtherDefaultStatuses(userId: string, exceptId: string) {
  await prisma.crmStatusOption.updateMany({
    where: {
      userId,
      id: {
        not: exceptId,
      },
    },
    data: {
      isDefault: false,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await req.json();

    const existing = await getStatusOr404(id, userId);

    if (!existing) {
      return NextResponse.json(
        {
          error: "Statut CRM introuvable.",
        },
        { status: 404 }
      );
    }

    const parsed = crmStatusOptionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault === true) {
      await unsetOtherDefaultStatuses(userId, id);
    }

    const updated = await prisma.crmStatusOption.update({
      where: {
        id,
      },
      data: {
        label: parsed.data.label ?? existing.label,

        key:
          parsed.data.key !== undefined
            ? slugifyKey(parsed.data.key)
            : existing.key,

        color: parsed.data.color ?? existing.color,

        description:
          parsed.data.description === undefined
            ? existing.description
            : parsed.data.description,

        sortOrder:
          parsed.data.sortOrder === undefined
            ? existing.sortOrder
            : Number(parsed.data.sortOrder),

        isDefault:
          parsed.data.isDefault === undefined
            ? existing.isDefault
            : Boolean(parsed.data.isDefault),

        isActive:
          parsed.data.isActive === undefined
            ? existing.isActive
            : Boolean(parsed.data.isActive),
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    console.log("[crm-statuses][PATCH_DONE]", {
      userId,
      id: updated.id,
      key: updated.key,
      label: updated.label,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[crm-statuses][PATCH_ERROR]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la modification du statut CRM.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    const existing = await getStatusOr404(id, userId);

    if (!existing) {
      return NextResponse.json(
        {
          error: "Statut CRM introuvable.",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.crmStatusOption.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        isDefault: false,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    console.log("[crm-statuses][DELETE_SOFT_DONE]", {
      userId,
      id: updated.id,
      key: updated.key,
      label: updated.label,
    });

    return NextResponse.json({
      success: true,
      status: updated,
    });
  } catch (error) {
    console.error("[crm-statuses][DELETE_ERROR]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la désactivation du statut CRM.",
      },
      { status: 500 }
    );
  }
}