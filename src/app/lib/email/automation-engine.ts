// src/app/lib/email/automation-engine.ts

import { prisma } from "@/app/lib/prisma";
import { sendAutomationEmail } from "@/app/lib/email/sender";

type EmailAutomationTrigger =
  | "CONTACT_CREATED"
  | "CONTACT_STATUS_NEW"
  | "CONTACT_STATUS_PROSPECT"
  | "CONTACT_STATUS_HOT_PROSPECT"
  | "CONTACT_STATUS_CUSTOMER"
  | "CONTACT_STATUS_INACTIVE"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type DelayUnit = "MINUTES" | "HOURS" | "DAYS";

type StartContactAutomationInput = {
  userId: string;
  contactId: string;
  trigger: EmailAutomationTrigger;
};

type CancelContactAutomationInput = {
  userId: string;
  contactId: string;
};

type CancelManyContactAutomationsInput = {
  userId: string;
  contactIds: string[];
};

type ProcessPendingOptions = {
  limit?: number;
};

function addDelay(date: Date, value: number, unit: DelayUnit) {
  const next = new Date(date);

  if (unit === "MINUTES") {
    next.setMinutes(next.getMinutes() + value);
  }

  if (unit === "HOURS") {
    next.setHours(next.getHours() + value);
  }

  if (unit === "DAYS") {
    next.setDate(next.getDate() + value);
  }

  return next;
}

function cleanEmailHtml(html: string) {
  return html
    .replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/@import[^;]+;/gi, "");
}

function getContactName(contact: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || contact.email;
}

function renderTemplate(
  template: string,
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    companyName: string | null;
    city: string | null;
    country: string | null;
  }
) {
  const firstName = contact.firstName || "";
  const lastName = contact.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const contactName = getContactName(contact);

  const values: Record<string, string> = {
    firstName,
    lastName,
    fullName,
    contactName,
    email: contact.email,
    phone: contact.phone || "",
    companyName: contact.companyName || "",
    city: contact.city || "",
    country: contact.country || "",
  };

  return template.replace(/\{\{\s*(\w+)\s*\}\}|\{(\w+)\}/g, (_, key1, key2) => {
    const key = key1 || key2;
    return values[key] ?? "";
  });
}

function isDebugEnabled() {
  return process.env.EMAIL_DEBUG === "true";
}

function debugLog(label: string, data?: Record<string, unknown>) {
  if (!isDebugEnabled()) return;

  console.log(`[automation-engine][${label}]`, data || {});
}

function errorLog(label: string, data?: Record<string, unknown>) {
  console.error(`[automation-engine][${label}]`, data || {});
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  return `${name.slice(0, 2)}***@${domain}`;
}

export async function startContactAutomation({
  userId,
  contactId,
  trigger,
}: StartContactAutomationInput) {
  debugLog("START_CONTACT_AUTOMATION", {
    userId,
    contactId,
    trigger,
  });

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      userId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      companyName: true,
      city: true,
      country: true,
      unsubscribed: true,
      isActive: true,
    },
  });

  if (!contact) {
    debugLog("CONTACT_NOT_FOUND", {
      userId,
      contactId,
    });

    return;
  }

  if (contact.unsubscribed) {
    debugLog("CONTACT_UNSUBSCRIBED_SKIP", {
      contactId,
      email: maskEmail(contact.email),
    });

    return;
  }

  if (!contact.isActive) {
    debugLog("CONTACT_INACTIVE_SKIP", {
      contactId,
      email: maskEmail(contact.email),
    });

    return;
  }

  const automations = await prisma.emailAutomation.findMany({
    where: {
      userId,
      trigger,
      isActive: true,
    },
    include: {
      steps: {
        where: {
          isActive: true,
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              subject: true,
              htmlContent: true,
              fromName: true,
              fromEmail: true,
              replyTo: true,
              status: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  debugLog("AUTOMATIONS_FOUND", {
    count: automations.length,
    trigger,
  });

  if (automations.length === 0) return;

  const now = new Date();

  for (const automation of automations) {
    if (automation.steps.length === 0) {
      debugLog("AUTOMATION_NO_ACTIVE_STEPS_SKIP", {
        automationId: automation.id,
        automationName: automation.name,
      });

      continue;
    }

    const existingActiveRun = await prisma.emailAutomationRun.findFirst({
      where: {
        userId,
        contactId,
        automationId: automation.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (existingActiveRun) {
      debugLog("EXISTING_ACTIVE_RUN_SKIP", {
        automationId: automation.id,
        runId: existingActiveRun.id,
        contactId,
      });

      continue;
    }

    await prisma.$transaction(async (tx) => {
      const run = await tx.emailAutomationRun.create({
        data: {
          userId,
          contactId,
          automationId: automation.id,
          trigger,
          status: "ACTIVE",
        },
      });

      debugLog("RUN_CREATED", {
        runId: run.id,
        automationId: automation.id,
        contactId,
      });

      const emailRows = automation.steps.flatMap((step) => {
        if (step.campaignId && !step.campaign) {
          debugLog("STEP_HAS_MISSING_CAMPAIGN_SKIP", {
            automationId: automation.id,
            stepId: step.id,
            campaignId: step.campaignId,
          });

          return [];
        }

        if (step.campaign && step.campaign.status !== "DRAFT") {
          debugLog("CAMPAIGN_NOT_DRAFT_SKIP", {
            automationId: automation.id,
            stepId: step.id,
            campaignId: step.campaign.id,
            campaignStatus: step.campaign.status,
          });

          return [];
        }

        const subjectTemplate = step.campaign?.subject || step.subject;
        const contentTemplate = step.campaign?.htmlContent || step.content;

        const subject = renderTemplate(subjectTemplate, contact);
        const content = renderTemplate(contentTemplate, contact);

        const scheduledAt = addDelay(
          now,
          step.delayValue,
          step.delayUnit as DelayUnit
        );

        debugLog("EMAIL_ROW_PREPARED", {
          automationId: automation.id,
          stepId: step.id,
          campaignId: step.campaign?.id || null,
          contactId,
          to: maskEmail(contact.email),
          subject,
          scheduledAt: scheduledAt.toISOString(),
        });

        return [
          {
            userId,
            runId: run.id,
            stepId: step.id,
            contactId,
            subject,
            content,
            status: "PENDING" as const,
            scheduledAt,
          },
        ];
      });

      if (emailRows.length === 0) {
        await tx.emailAutomationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });

        debugLog("RUN_CANCELLED_NO_EMAIL_ROWS", {
          runId: run.id,
          automationId: automation.id,
        });

        return;
      }

      await tx.emailAutomationEmail.createMany({
        data: emailRows,
      });

      debugLog("EMAIL_ROWS_CREATED", {
        runId: run.id,
        count: emailRows.length,
      });
    });
  }
}

export async function cancelActiveAutomationsForContact({
  userId,
  contactId,
}: CancelContactAutomationInput) {
  debugLog("CANCEL_ACTIVE_AUTOMATIONS_FOR_CONTACT_START", {
    userId,
    contactId,
  });

  const activeRuns = await prisma.emailAutomationRun.findMany({
    where: {
      userId,
      contactId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (activeRuns.length === 0) {
    debugLog("NO_ACTIVE_RUNS_TO_CANCEL", {
      userId,
      contactId,
    });

    return;
  }

  const runIds = activeRuns.map((run) => run.id);

  await prisma.$transaction([
    prisma.emailAutomationRun.updateMany({
      where: {
        userId,
        id: {
          in: runIds,
        },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    }),

    prisma.emailAutomationEmail.updateMany({
      where: {
        userId,
        runId: {
          in: runIds,
        },
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    }),
  ]);

  debugLog("ACTIVE_AUTOMATIONS_CANCELLED_FOR_CONTACT", {
    userId,
    contactId,
    runIds,
  });
}

export async function cancelActiveAutomationsForContacts({
  userId,
  contactIds,
}: CancelManyContactAutomationsInput) {
  debugLog("CANCEL_ACTIVE_AUTOMATIONS_FOR_CONTACTS_START", {
    userId,
    contactCount: contactIds.length,
  });

  if (contactIds.length === 0) return;

  const activeRuns = await prisma.emailAutomationRun.findMany({
    where: {
      userId,
      contactId: {
        in: contactIds,
      },
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (activeRuns.length === 0) {
    debugLog("NO_ACTIVE_RUNS_TO_CANCEL_FOR_CONTACTS", {
      userId,
      contactCount: contactIds.length,
    });

    return;
  }

  const runIds = activeRuns.map((run) => run.id);

  await prisma.$transaction([
    prisma.emailAutomationRun.updateMany({
      where: {
        userId,
        id: {
          in: runIds,
        },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    }),

    prisma.emailAutomationEmail.updateMany({
      where: {
        userId,
        runId: {
          in: runIds,
        },
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    }),
  ]);

  debugLog("ACTIVE_AUTOMATIONS_CANCELLED_FOR_CONTACTS", {
    userId,
    runIds,
  });
}

export async function processPendingAutomationEmails({
  limit = 50,
}: ProcessPendingOptions = {}) {
  const now = new Date();

  console.log("[automation-engine][CRON_START]", {
    limit,
    now: now.toISOString(),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    emailFrom: process.env.EMAIL_FROM || null,
    emailFromName: process.env.EMAIL_FROM_NAME || null,
  });

  const pendingCount = await prisma.emailAutomationEmail.count({
    where: {
      status: "PENDING",
      scheduledAt: {
        lte: now,
      },
    },
  });

  console.log("[automation-engine][PENDING_COUNT]", {
    pendingCount,
  });

  const pendingEmails = await prisma.emailAutomationEmail.findMany({
    where: {
      status: "PENDING",
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: limit,
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          unsubscribed: true,
          isActive: true,
        },
      },
      run: {
        select: {
          id: true,
          userId: true,
          status: true,
        },
      },
      step: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              fromName: true,
              fromEmail: true,
              replyTo: true,
              status: true,
            },
          },
        },
      },
    },
  });

  console.log("[automation-engine][PENDING_EMAILS_LOADED]", {
    loaded: pendingEmails.length,
    ids: pendingEmails.map((email) => email.id),
  });

  let sent = 0;
  let failed = 0;
  let cancelled = 0;

  for (const email of pendingEmails) {
    console.log("[automation-engine][EMAIL_PROCESS_START]", {
      emailAutomationEmailId: email.id,
      runId: email.runId,
      contactId: email.contactId,
      to: maskEmail(email.contact.email),
      subject: email.subject,
      scheduledAt: email.scheduledAt.toISOString(),
      runStatus: email.run.status,
      contactIsActive: email.contact.isActive,
      contactUnsubscribed: email.contact.unsubscribed,
      campaignId: email.step?.campaign?.id || null,
      campaignName: email.step?.campaign?.name || null,
      campaignStatus: email.step?.campaign?.status || null,
    });

    if (email.run.status !== "ACTIVE") {
      console.log("[automation-engine][EMAIL_CANCELLED_RUN_NOT_ACTIVE]", {
        emailAutomationEmailId: email.id,
        runStatus: email.run.status,
      });

      await prisma.emailAutomationEmail.update({
        where: {
          id: email.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      cancelled++;
      continue;
    }

    if (email.contact.unsubscribed || !email.contact.isActive) {
      console.log("[automation-engine][EMAIL_CANCELLED_CONTACT_NOT_SENDABLE]", {
        emailAutomationEmailId: email.id,
        unsubscribed: email.contact.unsubscribed,
        isActive: email.contact.isActive,
      });

      await prisma.emailAutomationEmail.update({
        where: {
          id: email.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      cancelled++;
      continue;
    }

    try {
      const cleanHtml = cleanEmailHtml(email.content);

      console.log("[automation-engine][BEFORE_SEND_AUTOMATION_EMAIL]", {
        emailAutomationEmailId: email.id,
        to: maskEmail(email.contact.email),
        subject: email.subject,
        htmlLength: cleanHtml.length,
        campaignId: email.step?.campaign?.id || null,
        fromName: email.step?.campaign?.fromName || null,
        fromEmail: email.step?.campaign?.fromEmail || null,
        replyTo: email.step?.campaign?.replyTo || null,
      });

      const sendResult = await sendAutomationEmail({
        to: email.contact.email,
        subject: email.subject,
        html: cleanHtml,
        fromName: email.step?.campaign?.fromName || null,
        fromEmail: email.step?.campaign?.fromEmail || null,
        replyTo: email.step?.campaign?.replyTo || null,
      });

      console.log("[automation-engine][SEND_AUTOMATION_EMAIL_RESULT]", {
        emailAutomationEmailId: email.id,
        sendResult,
      });

      if (!sendResult.success) {
        throw new Error(
          sendResult.error || "Erreur inconnue pendant l'envoi automatique"
        );
      }

      await prisma.emailAutomationEmail.update({
        where: {
          id: email.id,
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          error: null,
        },
      });

      console.log("[automation-engine][EMAIL_MARKED_SENT]", {
        emailAutomationEmailId: email.id,
      });

      sent++;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";

      errorLog("EMAIL_SEND_FAILED", {
        emailAutomationEmailId: email.id,
        to: maskEmail(email.contact.email),
        subject: email.subject,
        error: errorMessage,
      });

      await prisma.emailAutomationEmail.update({
        where: {
          id: email.id,
        },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          error: errorMessage,
        },
      });

      failed++;
    }

    const remainingPending = await prisma.emailAutomationEmail.count({
      where: {
        runId: email.runId,
        status: "PENDING",
      },
    });

    console.log("[automation-engine][RUN_PENDING_REMAINING]", {
      runId: email.runId,
      remainingPending,
    });

    if (remainingPending === 0) {
      await prisma.emailAutomationRun.update({
        where: {
          id: email.runId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      console.log("[automation-engine][RUN_MARKED_COMPLETED]", {
        runId: email.runId,
      });
    }
  }

  const result = {
    processed: pendingEmails.length,
    sent,
    failed,
    cancelled,
  };

  console.log("[automation-engine][CRON_END]", result);

  return result;
}