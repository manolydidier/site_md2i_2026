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

const createAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  trigger: triggerSchema,
  isActive: z.boolean().optional(),
  steps: z.array(automationStepSchema).min(1),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const automations = await prisma.emailAutomation.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      steps: {
        orderBy: {
          position: "asc",
        },
      },
      _count: {
        select: {
          runs: true,
        },
      },
    },
  });

  return NextResponse.json(automations);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createAutomationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const automation = await prisma.emailAutomation.create({
    data: {
      userId: session.user.id,
      name: data.name,
      description: data.description || null,
      trigger: data.trigger,
      isActive: data.isActive ?? true,
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

  return NextResponse.json(automation, { status: 201 });
}