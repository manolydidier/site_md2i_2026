// src/app/api/crm/opportunity-stages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { ensureDefaultOpportunityStages } from "@/app/lib/crm-opportunity-stages";

export const dynamic = "force-dynamic";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function slugifyKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function unsetOtherDefaultStages(userId: string, exceptId?: string) {
  await prisma.crmOpportunityStageOption.updateMany({
    where: { userId, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "crm_opportunities", action: "canList" });
  if (!guard.ok) return guard.response;

  try {
    const userId = await getCrmOwnerUserId();
    const includeInactive =
      req.nextUrl.searchParams.get("includeInactive") === "1" ||
      req.nextUrl.searchParams.get("includeInactive") === "true";

    await ensureDefaultOpportunityStages(userId);

    const stages = await prisma.crmOpportunityStageOption.findMany({
      where: { userId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("[crm-opportunity-stages][GET_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur pendant le chargement des étapes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "crm_opportunities", action: "canCreate" });
  if (!guard.ok) return guard.response;

  try {
    const userId = await getCrmOwnerUserId();
    const body = await req.json();

    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      return NextResponse.json({ error: "Le libellé de l'étape est obligatoire." }, { status: 400 });
    }

    const key = slugifyKey(typeof body.key === "string" && body.key.trim() ? body.key : label);
    if (!key) {
      return NextResponse.json({ error: "La clé technique de l'étape est obligatoire." }, { status: 400 });
    }

    if (body.isDefault) {
      await unsetOtherDefaultStages(userId);
    }

    const stage = await prisma.crmOpportunityStageOption.create({
      data: {
        userId,
        key,
        label,
        color: typeof body.color === "string" && body.color.trim() ? body.color.trim() : "#f97316",
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        sortOrder: Number(body.sortOrder || 0),
        isDefault: Boolean(body.isDefault),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error("[crm-opportunity-stages][POST_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur pendant la création de l'étape." },
      { status: 500 }
    );
  }
}
