import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const delayUnitSchema = z.enum(["MINUTES", "HOURS", "DAYS"]);

const triggerSchema = z.enum([
  "CONTACT_CREATED",
  "CONTACT_STATUS_NEW",
  "CONTACT_STATUS_PROSPECT",
  "CONTACT_STATUS_HOT_PROSPECT",
  "CONTACT_STATUS_CUSTOMER",
  "CONTACT_STATUS_INACTIVE",
  "EMAIL_OPENED",
  "EMAIL_CLICKED",
  "MANUAL_START",
]);

const automationStepSchema = z.object({
  position: z.number().int().min(1),
  delayValue: z.number().int().min(0),
  delayUnit: delayUnitSchema,
  subject: z.string().min(1),
  content: z.string().min(1),
});

const updateAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  trigger: triggerSchema,
  isActive: z.boolean(),
  steps: z.array(automationStepSchema).min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const automation = await prisma.emailAutomation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      steps: {
        orderBy: {
          position: "asc",
        },
      },
      runs: {
        orderBy: {
          startedAt: "desc",
        },
        take: 20,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          emails: {
            orderBy: {
              scheduledAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!automation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(automation);
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
  const body = await req.json();

  const parsed = updateAutomationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.emailAutomation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          runs: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing._count.runs > 0) {
    return NextResponse.json(
      {
        error:
          "Cette automatisation a déjà un historique. Pour modifier les étapes, créez une nouvelle automatisation ou dupliquez-la.",
      },
      { status: 409 }
    );
  }

  const data = parsed.data;

  const automation = await prisma.$transaction(async (tx) => {
    await tx.emailAutomationStep.deleteMany({
      where: {
        automationId: id,
      },
    });

    return tx.emailAutomation.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        description: data.description || null,
        trigger: data.trigger,
        isActive: data.isActive,
        steps: {
          create: data.steps
            .sort((a, b) => a.position - b.position)
            .map((step) => ({
              position: step.position,
              delayValue: step.delayValue,
              delayUnit: step.delayUnit,
              subject: step.subject,
              content: step.content,
            })),
        },
      },
      include: {
        steps: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });
  });

  return NextResponse.json(automation);
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

  const deleted = await prisma.emailAutomation.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}