import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import type { CrmTaskPriority, CrmTaskStatus } from "@/generated/prisma/client";

const ALLOWED_STATUS = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
const ALLOWED_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCrmOwnerUserId();
    const { id } = await params;
    const body = await request.json();

    const data: {
      status?: CrmTaskStatus;
      priority?: CrmTaskPriority;
      dueDate?: Date | null;
    } = {};

    if (body.status) {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Statut de tâche invalide." },
          { status: 400 }
        );
      }

      data.status = body.status as CrmTaskStatus;
    }

    if (body.priority) {
      if (!ALLOWED_PRIORITY.includes(body.priority)) {
        return NextResponse.json(
          { success: false, error: "Priorité invalide." },
          { status: 400 }
        );
      }

      data.priority = body.priority as CrmTaskPriority;
    }

    if ("dueDate" in body) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const updated = await prisma.crmTask.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, error: "Tâche introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tâche mise à jour.",
    });
  } catch (error) {
    console.error("[CRM_TASK_PATCH]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la mise à jour de la tâche.",
      },
      { status: 500 }
    );
  }
}
