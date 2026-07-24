import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { getActiveOpportunityStages } from "@/app/lib/crm-opportunity-stages";

function findStage(stageValues: string[], candidates: string[]) {
  return candidates.find((candidate) => stageValues.includes(candidate)) || null;
}

function resolveStage(stageValues: string[], value: unknown) {
  const raw = String(value || "").trim().toUpperCase();

  if (stageValues.includes(raw)) {
    return raw;
  }

  const aliases: Record<string, string[]> = {
    NEW: ["NEW"],
    CONTACTED: ["CONTACTED", "CONTACT_MADE", "IN_CONTACT"],
    QUALIFIED: ["QUALIFIED", "QUALIFICATION"],
    PROPOSAL: ["PROPOSAL", "PROPOSAL_SENT", "QUOTE_SENT", "OFFER_SENT"],
    NEGOTIATION: ["NEGOTIATION", "IN_NEGOTIATION"],
    WON: ["WON", "CLOSED_WON"],
    LOST: ["LOST", "CLOSED_LOST"],
  };

  return findStage(stageValues, aliases[raw] || []);
}

function getWonStage(stageValues: string[]) {
  return findStage(stageValues, ["WON", "CLOSED_WON"]);
}

function getLostStage(stageValues: string[]) {
  return findStage(stageValues, ["LOST", "CLOSED_LOST"]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await withPermission(request, { resource: "crm_opportunities", action: "canUpdate" });
    if (!guard.ok) return guard.response;

    const userId = await getCrmOwnerUserId();
    const { id } = await params;
    const body = await request.json();

    const data: Prisma.CrmOpportunityUpdateManyMutationInput = {};

    if (body.stage) {
      const stageOptions = await getActiveOpportunityStages(userId);
      const stageValues = stageOptions.map((option) => option.key);
      const stage = resolveStage(stageValues, body.stage);

      if (!stage) {
        return NextResponse.json(
          {
            success: false,
            error: `Étape invalide. Valeurs acceptées : ${stageValues.join(", ")}`,
          },
          { status: 400 }
        );
      }

      data.stage = stage;

      if (stage === getWonStage(stageValues)) {
        data.probability = 100;
      }

      if (stage === getLostStage(stageValues)) {
        data.probability = 0;
      }
    }

    if ("amount" in body) {
      const amount = Number(body.amount);
      data.amount = Number.isFinite(amount) && amount > 0 ? amount : null;
    }

    if ("probability" in body) {
      const probability = Number(body.probability);

      if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
        return NextResponse.json(
          { success: false, error: "Probabilité invalide." },
          { status: 400 }
        );
      }

      data.probability = probability;
    }

    if ("lostReason" in body) {
      data.lostReason =
        typeof body.lostReason === "string" && body.lostReason.trim()
          ? body.lostReason.trim()
          : null;
    }

    if ("nextFollowUpAt" in body) {
      data.nextFollowUpAt = body.nextFollowUpAt
        ? new Date(body.nextFollowUpAt)
        : null;
    }

    const updated = await prisma.crmOpportunity.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, error: "Opportunité introuvable." },
        { status: 404 }
      );
    }

    await logAudit({
      actorId: guard.session.user.id,
      action: "update",
      entity: "crm_opportunity",
      entityId: id,
      metadata: data,
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Opportunité mise à jour.",
    });
  } catch (error) {
    console.error("[CRM_OPPORTUNITY_PATCH]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la mise à jour de l’opportunité.",
      },
      { status: 500 }
    );
  }
}