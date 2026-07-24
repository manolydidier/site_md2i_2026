// src/app/api/crm/opportunity-stages/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

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

async function getStageOr404(id: string, userId: string) {
  return prisma.crmOpportunityStageOption.findFirst({ where: { id, userId } });
}

async function unsetOtherDefaultStages(userId: string, exceptId: string) {
  await prisma.crmOpportunityStageOption.updateMany({
    where: { userId, id: { not: exceptId } },
    data: { isDefault: false },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: RouteParams }) {
  const guard = await withPermission(req, { resource: "crm_opportunities", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const userId = await getCrmOwnerUserId();
    const { id } = await params;
    const body = await req.json();

    const existing = await getStageOr404(id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Étape introuvable." }, { status: 404 });
    }

    if (body.isDefault === true) {
      await unsetOtherDefaultStages(userId, id);
    }

    const updated = await prisma.crmOpportunityStageOption.update({
      where: { id },
      data: {
        label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : existing.label,
        key: typeof body.key === "string" && body.key.trim() ? slugifyKey(body.key) : existing.key,
        color: typeof body.color === "string" && body.color.trim() ? body.color.trim() : existing.color,
        description:
          body.description === undefined
            ? existing.description
            : typeof body.description === "string"
              ? body.description.trim() || null
              : null,
        sortOrder: body.sortOrder === undefined ? existing.sortOrder : Number(body.sortOrder),
        isDefault: body.isDefault === undefined ? existing.isDefault : Boolean(body.isDefault),
        isActive: body.isActive === undefined ? existing.isActive : Boolean(body.isActive),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[crm-opportunity-stages][PATCH_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur pendant la modification de l'étape." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: RouteParams }) {
  const guard = await withPermission(req, { resource: "crm_opportunities", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const userId = await getCrmOwnerUserId();
    const { id } = await params;

    const existing = await getStageOr404(id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Étape introuvable." }, { status: 404 });
    }

    // Désactivation (soft) — jamais de suppression dure, une opportunité
    // peut déjà référencer cette clé de stage dans son champ `stage`.
    const updated = await prisma.crmOpportunityStageOption.update({
      where: { id },
      data: { isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, stage: updated });
  } catch (error) {
    console.error("[crm-opportunity-stages][DELETE_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur pendant la désactivation de l'étape." },
      { status: 500 }
    );
  }
}
