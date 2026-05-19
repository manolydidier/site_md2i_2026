// src/app/api/crm/statuses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { crmStatusOptionSchema } from "@/app/lib/email/schemas";

export const dynamic = "force-dynamic";

const DEFAULT_STATUSES = [
  {
    key: "NEW",
    label: "Nouveau",
    color: "#64748b",
    sortOrder: 1,
    isDefault: true,
  },
  {
    key: "PROSPECT",
    label: "Prospect",
    color: "#0ea5e9",
    sortOrder: 2,
    isDefault: false,
  },
  {
    key: "HOT_PROSPECT",
    label: "Prospect chaud",
    color: "#f97316",
    sortOrder: 3,
    isDefault: false,
  },
  {
    key: "CUSTOMER",
    label: "Client",
    color: "#22c55e",
    sortOrder: 4,
    isDefault: false,
  },
  {
    key: "PARTNER",
    label: "Partenaire",
    color: "#8b5cf6",
    sortOrder: 5,
    isDefault: false,
  },
  {
    key: "INACTIVE",
    label: "Inactif",
    color: "#94a3b8",
    sortOrder: 6,
    isDefault: false,
  },
  {
    key: "LOST",
    label: "Perdu",
    color: "#ef4444",
    sortOrder: 7,
    isDefault: false,
  },
];

function slugifyKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function ensureDefaultStatuses(userId: string) {
  const count = await prisma.crmStatusOption.count({
    where: {
      userId,
    },
  });

  if (count > 0) {
    return;
  }

  console.log("[crm-statuses][SEED_DEFAULTS_START]", {
    userId,
  });

  for (const status of DEFAULT_STATUSES) {
    await prisma.crmStatusOption.upsert({
      where: {
        userId_key: {
          userId,
          key: status.key,
        },
      },
      update: {
        label: status.label,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isActive: true,
      },
      create: {
        userId,
        key: status.key,
        label: status.label,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isActive: true,
      },
    });
  }

  console.log("[crm-statuses][SEED_DEFAULTS_DONE]", {
    userId,
  });
}

async function unsetOtherDefaultStatuses(userId: string, exceptId?: string) {
  await prisma.crmStatusOption.updateMany({
    where: {
      userId,
      ...(exceptId
        ? {
            id: {
              not: exceptId,
            },
          }
        : {}),
    },
    data: {
      isDefault: false,
    },
  });
}

export async function GET(req: NextRequest) {
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
    const includeInactive =
      req.nextUrl.searchParams.get("includeInactive") === "1" ||
      req.nextUrl.searchParams.get("includeInactive") === "true";

    console.log("[crm-statuses][GET_START]", {
      userId,
      includeInactive,
    });

    await ensureDefaultStatuses(userId);

    const statuses = await prisma.crmStatusOption.findMany({
      where: {
        userId,
        ...(includeInactive
          ? {}
          : {
              isActive: true,
            }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    console.log("[crm-statuses][GET_DONE]", {
      userId,
      count: statuses.length,
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("[crm-statuses][GET_ERROR]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant le chargement des statuts CRM.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();

    const parsed = crmStatusOptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const key = parsed.data.key
      ? slugifyKey(parsed.data.key)
      : slugifyKey(parsed.data.label);

    if (!key) {
      return NextResponse.json(
        {
          error: "La clé technique du statut est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault) {
      await unsetOtherDefaultStatuses(userId);
    }

    const status = await prisma.crmStatusOption.create({
      data: {
        userId,
        key,
        label: parsed.data.label,
        color: parsed.data.color || "#EF9F27",
        description: parsed.data.description || null,
        sortOrder: Number(parsed.data.sortOrder || 0),
        isDefault: Boolean(parsed.data.isDefault),
        isActive: Boolean(parsed.data.isActive),
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    console.log("[crm-statuses][POST_DONE]", {
      userId,
      id: status.id,
      key: status.key,
      label: status.label,
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error("[crm-statuses][POST_ERROR]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la création du statut CRM.",
      },
      { status: 500 }
    );
  }
}