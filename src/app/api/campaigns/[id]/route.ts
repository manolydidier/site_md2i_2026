// src/app/api/campaigns/[id]/route.ts
// GET, PUT, DELETE + duplication
// Compatible ancien groupId + nouveau multi-groupes CampaignGroup

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { campaignSchema } from "@/app/lib/email/schemas";

async function attachCampaignGroups<T extends { id: string }>(
  campaign: T | null
): Promise<(T & { campaignGroups: any[] }) | null> {
  if (!campaign) return null;

  const db = prisma as any;

  if (!db.campaignGroup?.findMany) {
    console.warn(
      "[/api/campaigns/[id]] prisma.campaignGroup indisponible. Lancez npx prisma generate."
    );

    return {
      ...campaign,
      campaignGroups: [],
    };
  }

  try {
    const campaignGroups = await db.campaignGroup.findMany({
      where: {
        campaignId: campaign.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                contacts: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      ...campaign,
      campaignGroups,
    };
  } catch (error) {
    console.error("[attachCampaignGroups] error:", error);

    return {
      ...campaign,
      campaignGroups: [],
    };
  }
}

async function syncCampaignGroups(params: {
  campaignId: string;
  groupIds: string[];
}) {
  const db = prisma as any;

  if (!db.campaignGroup?.deleteMany || !db.campaignGroup?.createMany) {
    console.warn(
      "[syncCampaignGroups] prisma.campaignGroup indisponible. Lancez npx prisma generate."
    );
    return;
  }

  await db.campaignGroup.deleteMany({
    where: {
      campaignId: params.campaignId,
    },
  });

  if (params.groupIds.length === 0) return;

  await db.campaignGroup.createMany({
    data: params.groupIds.map((groupId) => ({
      campaignId: params.campaignId,
      groupId,
    })),
    skipDuplicates: true,
  });
}

function cleanIds(ids: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      ids
        .filter(Boolean)
        .map((id) => String(id).trim())
        .filter(Boolean)
    )
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
                id: true,
                email: true,
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
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const campaignWithGroups = await attachCampaignGroups(campaign);

    return NextResponse.json(campaignWithGroups);
  } catch (error) {
    console.error("[GET /api/campaigns/[id]] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant le chargement de la campagne",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { groupIds = [], groupId, ...campaignData } = parsed.data;

    const requestedGroupIds = cleanIds([
      ...(Array.isArray(groupIds) ? groupIds : []),
      groupId,
    ]);

    const validGroups =
      requestedGroupIds.length > 0
        ? await prisma.contactGroup.findMany({
            where: {
              id: {
                in: requestedGroupIds,
              },
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          })
        : [];

    const validGroupIds = validGroups.map((group) => group.id);

    if (requestedGroupIds.length !== validGroupIds.length) {
      return NextResponse.json(
        {
          error:
            "Un ou plusieurs groupes sont invalides ou n'appartiennent pas à cet utilisateur.",
        },
        { status: 400 }
      );
    }

    const primaryGroupId = validGroupIds[0] || null;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCampaign = await tx.campaign.update({
        where: {
          id,
        },
        data: {
          ...campaignData,

          // Ancien champ compatible
          groupId: primaryGroupId,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          recipients: {
            include: {
              contact: {
                select: {
                  id: true,
                  email: true,
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
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      });

      const db = tx as any;

      if (db.campaignGroup?.deleteMany && db.campaignGroup?.createMany) {
        await db.campaignGroup.deleteMany({
          where: {
            campaignId: id,
          },
        });

        if (validGroupIds.length > 0) {
          await db.campaignGroup.createMany({
            data: validGroupIds.map((targetGroupId: string) => ({
              campaignId: id,
              groupId: targetGroupId,
            })),
            skipDuplicates: true,
          });
        }
      } else {
        console.warn(
          "[PUT /api/campaigns/[id]] tx.campaignGroup indisponible. Lancez npx prisma generate."
        );
      }

      return updatedCampaign;
    });

    const updatedWithGroups = await attachCampaignGroups(updated);

    return NextResponse.json(updatedWithGroups);
  } catch (error) {
    console.error("[PUT /api/campaigns/[id]] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant la mise à jour de la campagne",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    console.error("[DELETE /api/campaigns/[id]] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant la suppression de la campagne",
      },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]?action=duplicate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const db = prisma as any;

    const originalCampaignGroups = db.campaignGroup?.findMany
      ? await db.campaignGroup.findMany({
          where: {
            campaignId: original.id,
          },
          select: {
            groupId: true,
          },
        })
      : [];

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
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });

    if (
      originalCampaignGroups.length > 0 &&
      db.campaignGroup?.createMany
    ) {
      await db.campaignGroup.createMany({
        data: originalCampaignGroups.map((item: { groupId: string }) => ({
          campaignId: duplicate.id,
          groupId: item.groupId,
        })),
        skipDuplicates: true,
      });
    }

    const duplicateWithGroups = await attachCampaignGroups(duplicate);

    return NextResponse.json(duplicateWithGroups, { status: 201 });
  } catch (error) {
    console.error("[POST /api/campaigns/[id]] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant la duplication de la campagne",
      },
      { status: 500 }
    );
  }
}