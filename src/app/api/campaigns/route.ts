// src/app/api/campaigns/route.ts
// GET liste + POST créer une campagne
// Compatible ancien groupId + nouveau multi-groupes CampaignGroup

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { campaignSchema } from "@/app/lib/email/schemas";

type CampaignWithOptionalGroups = Awaited<
  ReturnType<typeof prisma.campaign.findMany>
>[number] & {
  campaignGroups?: unknown[];
};

async function attachCampaignGroups<T extends { id: string }>(
  campaigns: T[]
): Promise<Array<T & { campaignGroups: any[] }>> {
  if (campaigns.length === 0) {
    return campaigns.map((campaign) => ({
      ...campaign,
      campaignGroups: [],
    }));
  }

  const db = prisma as any;

  // Si Prisma Client n'est pas encore régénéré, campaignGroup peut être undefined.
  if (!db.campaignGroup?.findMany) {
    console.warn(
      "[/api/campaigns] prisma.campaignGroup indisponible. Lancez npx prisma generate."
    );

    return campaigns.map((campaign) => ({
      ...campaign,
      campaignGroups: [],
    }));
  }

  try {
    const campaignIds = campaigns.map((campaign) => campaign.id);

    const links = await db.campaignGroup.findMany({
      where: {
        campaignId: {
          in: campaignIds,
        },
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

    const byCampaignId = new Map<string, any[]>();

    for (const link of links) {
      const current = byCampaignId.get(link.campaignId) || [];
      current.push(link);
      byCampaignId.set(link.campaignId, current);
    }

    return campaigns.map((campaign) => ({
      ...campaign,
      campaignGroups: byCampaignId.get(campaign.id) || [],
    }));
  } catch (error) {
    console.error("[/api/campaigns] attachCampaignGroups error:", error);

    return campaigns.map((campaign) => ({
      ...campaign,
      campaignGroups: [],
    }));
  }
}

export async function GET(req: NextRequest) {
  try {
    const guard = await withPermission(req, { resource: "campaigns", action: "canList" });
    if (!guard.ok) return guard.response;
    const session = guard.session;

    const { searchParams } = req.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") || 10));

    const [baseCampaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      prisma.campaign.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    const campaigns = await attachCampaignGroups(baseCampaigns);

    return NextResponse.json({
      data: campaigns,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/campaigns] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant le chargement des campagnes",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await withPermission(req, { resource: "campaigns", action: "canCreate" });
    if (!guard.ok) return guard.response;
    const session = guard.session;

    const body = await req.json();

    const parsed = campaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { groupIds = [], groupId, ...campaignData } = parsed.data;

    const requestedGroupIds = Array.from(
      new Set(
        [
          ...(Array.isArray(groupIds) ? groupIds : []),
          ...(groupId ? [groupId] : []),
        ]
          .filter(Boolean)
          .map((id) => id.trim())
      )
    );

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

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        userId: session.user.id,
        groupId: primaryGroupId,
        status: "DRAFT",
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

    const db = prisma as any;

    if (validGroupIds.length > 0 && db.campaignGroup?.createMany) {
      await db.campaignGroup.createMany({
        data: validGroupIds.map((targetGroupId: string) => ({
          campaignId: campaign.id,
          groupId: targetGroupId,
        })),
        skipDuplicates: true,
      });
    } else if (validGroupIds.length > 0) {
      console.warn(
        "[POST /api/campaigns] campaignGroup indisponible. Lancez npx prisma generate."
      );
    }

    const [campaignWithGroups] = await attachCampaignGroups([campaign]);

    return NextResponse.json(campaignWithGroups, { status: 201 });
  } catch (error) {
    console.error("[POST /api/campaigns] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur pendant la création de la campagne",
      },
      { status: 500 }
    );
  }
}