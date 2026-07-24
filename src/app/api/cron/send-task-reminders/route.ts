import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendMarketingEmail } from "@/app/lib/email/resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const secretParam = req.nextUrl.searchParams.get("secret");

  return (
    authHeader === `Bearer ${secret}` ||
    cronHeader === secret ||
    secretParam === secret
  );
}

function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 50))
  );

  try {
    const dueTasks = await prisma.crmTask.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { lte: new Date() },
        reminderSentAt: null,
      },
      take: limit,
      orderBy: { dueDate: "asc" },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const task of dueTasks) {
      if (!task.user.email || !task.dueDate) continue;

      try {
        await sendMarketingEmail({
          to: task.user.email,
          subject: `Tâche en retard : ${task.title}`,
          html: `
            <p>Bonjour ${task.user.firstName || ""},</p>
            <p>La tâche <strong>${task.title}</strong> avait pour échéance le ${formatDueDate(task.dueDate)} et n'est pas encore terminée.</p>
            <p><a href="${process.env.NEXTAUTH_URL || ""}/admin/crm/tasks">Voir mes tâches</a></p>
          `,
          text: `La tâche "${task.title}" avait pour échéance le ${formatDueDate(task.dueDate)} et n'est pas encore terminée.`,
        });

        await prisma.crmTask.update({
          where: { id: task.id },
          data: { reminderSentAt: new Date() },
        });

        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("[cron-send-task-reminders][SEND_ERROR]", {
          taskId: task.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ success: true, checked: dueTasks.length, sent, failed });
  } catch (error) {
    console.error("[cron-send-task-reminders][PROCESS_ERROR]", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}
