// src/app/api/contacts/route.ts
// CRUD contacts
// GET    /api/contacts
// POST   /api/contacts
// DELETE /api/contacts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { contactSchema } from "@/app/lib/email/schemas";
import {
  cancelActiveAutomationsForContacts,
  processPendingAutomationEmails,
  startContactAutomation,
} from "@/app/lib/email/automation-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LegacyAutomationTrigger =
  | "CONTACT_CREATED"
  | "CONTACT_STATUS_NEW"
  | "CONTACT_STATUS_PROSPECT"
  | "CONTACT_STATUS_HOT_PROSPECT"
  | "CONTACT_STATUS_CUSTOMER"
  | "CONTACT_STATUS_INACTIVE"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type DynamicTriggerEvent =
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "EMAIL_OPENED"
  | "EMAIL_CLICKED"
  | "MANUAL_START";

type LegacyCrmStatus =
  | "NEW"
  | "PROSPECT"
  | "HOT_PROSPECT"
  | "CUSTOMER"
  | "PARTNER"
  | "INACTIVE"
  | "LOST";

type ContactAutomationSnapshot = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  groupId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  country: string | null;
  city: string | null;

  /**
   * Important :
   * Pour les automatisations dynamiques, crmStatus contient la clé technique
   * du statut dynamique si elle existe.
   * Exemple : DEVIS_ENVOYE, HOT_PROSPECT, CUSTOMER.
   */
  crmStatus: string | null;
  crmStatusOptionId: string | null;
  crmStatusOptionKey: string | null;

  crmSource: string | null;
  isActive: boolean;
  unsubscribed: boolean;
};

const LEGACY_CRM_STATUSES = new Set<string>([
  "NEW",
  "PROSPECT",
  "HOT_PROSPECT",
  "CUSTOMER",
  "PARTNER",
  "INACTIVE",
  "LOST",
]);

function cleanString(value?: string | null) {
  const cleaned = String(value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function maskEmail(email?: string | null) {
  if (!email) return null;

  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  return `${name.slice(0, 2)}***@${domain}`;
}

function logInfo(label: string, data?: Record<string, unknown>) {
  console.log(`[contacts-api][${label}]`, data || {});
}

function logError(label: string, data?: Record<string, unknown>) {
  console.error(`[contacts-api][${label}]`, data || {});
}

function getContactInclude() {
  return {
    group: {
      select: {
        id: true,
        name: true,
      },
    },
    crmCompany: {
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        city: true,
      },
    },
    crmStatusOption: {
      select: {
        id: true,
        key: true,
        label: true,
        color: true,
        description: true,
        sortOrder: true,
        isDefault: true,
        isActive: true,
      },
    },
  };
}

function getAutomationStatusKey(contact: {
  crmStatus: unknown;
  crmStatusOption?: {
    key: string;
  } | null;
}) {
  if (contact.crmStatusOption?.key) {
    return contact.crmStatusOption.key;
  }

  return contact.crmStatus ? String(contact.crmStatus) : null;
}

function getCompatibleLegacyCrmStatus(
  requestedStatus: unknown,
  dynamicStatusKey?: string | null
): LegacyCrmStatus {
  if (dynamicStatusKey && LEGACY_CRM_STATUSES.has(dynamicStatusKey)) {
    return dynamicStatusKey as LegacyCrmStatus;
  }

  if (
    typeof requestedStatus === "string" &&
    LEGACY_CRM_STATUSES.has(requestedStatus)
  ) {
    return requestedStatus as LegacyCrmStatus;
  }

  return "NEW";
}

function toContactSnapshot(contact: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  groupId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  country: string | null;
  city: string | null;
  crmStatus: unknown;
  crmStatusOptionId?: string | null;
  crmStatusOption?: {
    key: string;
  } | null;
  crmSource: unknown;
  isActive: boolean;
  unsubscribed: boolean;
}): ContactAutomationSnapshot {
  const crmStatusKey = getAutomationStatusKey(contact);

  return {
    id: contact.id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    groupId: contact.groupId,
    jobTitle: contact.jobTitle,
    companyName: contact.companyName,
    country: contact.country,
    city: contact.city,
    crmStatus: crmStatusKey,
    crmStatusOptionId: contact.crmStatusOptionId || null,
    crmStatusOptionKey: contact.crmStatusOption?.key || null,
    crmSource: contact.crmSource ? String(contact.crmSource) : null,
    isActive: contact.isActive,
    unsubscribed: contact.unsubscribed,
  };
}

function getTriggerFromCrmStatus(
  status: string | null | undefined
): LegacyAutomationTrigger | null {
  if (status === "NEW") return "CONTACT_STATUS_NEW";
  if (status === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
  if (status === "HOT_PROSPECT") return "CONTACT_STATUS_HOT_PROSPECT";
  if (status === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
  if (status === "INACTIVE") return "CONTACT_STATUS_INACTIVE";

  return null;
}

async function startContactAutomationCompat(payload: {
  userId: string;
  contactId: string;
  trigger: LegacyAutomationTrigger;
  triggerEvent: DynamicTriggerEvent;
  previousContact?: ContactAutomationSnapshot | null;
  currentContact?: ContactAutomationSnapshot | null;
}) {
  logInfo("START_AUTOMATION_COMPAT", {
    userId: payload.userId,
    contactId: payload.contactId,
    trigger: payload.trigger,
    triggerEvent: payload.triggerEvent,
    previousCrmStatus: payload.previousContact?.crmStatus || null,
    currentCrmStatus: payload.currentContact?.crmStatus || null,
    previousCrmStatusOptionId:
      payload.previousContact?.crmStatusOptionId || null,
    currentCrmStatusOptionId: payload.currentContact?.crmStatusOptionId || null,
    previousCrmSource: payload.previousContact?.crmSource || null,
    currentCrmSource: payload.currentContact?.crmSource || null,
  });

  await startContactAutomation(payload as any);
}

async function ensureGroupBelongsToUser(groupId: string | null, userId: string) {
  if (!groupId) {
    logInfo("GROUP_SKIPPED", {
      reason: "Aucun groupId fourni",
    });

    return null;
  }

  logInfo("GROUP_CHECK_START", {
    groupId,
    userId,
  });

  const group = await prisma.contactGroup.findFirst({
    where: {
      id: groupId,
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!group) {
    logError("GROUP_CHECK_FAILED", {
      groupId,
      userId,
      reason: "Groupe introuvable ou non autorisé",
    });

    throw new Error("Groupe introuvable ou non autorisé.");
  }

  logInfo("GROUP_CHECK_SUCCESS", {
    groupId: group.id,
    groupName: group.name,
  });

  return group.id;
}

async function ensureCrmStatusOptionBelongsToUser(
  crmStatusOptionId: string | null,
  userId: string
) {
  if (!crmStatusOptionId) {
    return null;
  }

  const status = await prisma.crmStatusOption.findFirst({
    where: {
      id: crmStatusOptionId,
      userId,
      isActive: true,
    },
    select: {
      id: true,
      key: true,
      label: true,
      color: true,
      isActive: true,
    },
  });

  if (!status) {
    throw new Error("Statut CRM introuvable ou non autorisé.");
  }

  return status;
}

async function logAutomationDiagnostic(userId: string, contactId?: string) {
  const automations = await prisma.emailAutomation.findMany({
    where: {
      userId,
    },
    include: {
      steps: {
        orderBy: {
          position: "asc",
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
              subject: true,
              fromName: true,
              fromEmail: true,
              replyTo: true,
            },
          },
        },
      },
    },
  });

  const pendingForContact = contactId
    ? await prisma.emailAutomationEmail.count({
        where: {
          contactId,
          status: "PENDING",
        },
      })
    : null;

  const duePendingForContact = contactId
    ? await prisma.emailAutomationEmail.count({
        where: {
          contactId,
          status: "PENDING",
          scheduledAt: {
            lte: new Date(),
          },
        },
      })
    : null;

  logInfo("AUTOMATION_DIAGNOSTIC", {
    userId,
    contactId: contactId || null,
    automationCount: automations.length,
    activeAutomationCount: automations.filter((a) => a.isActive).length,
    pendingForContact,
    duePendingForContact,
    automations: automations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      trigger: automation.trigger,
      triggerEvent: automation.triggerEvent,
      conditionField: automation.conditionField,
      conditionOperator: automation.conditionOperator,
      conditionValue: automation.conditionValue,
      isActive: automation.isActive,
      stepCount: automation.steps.length,
      activeStepCount: automation.steps.filter((step) => step.isActive).length,
      steps: automation.steps.map((step) => ({
        id: step.id,
        position: step.position,
        isActive: step.isActive,
        delayValue: step.delayValue,
        delayUnit: step.delayUnit,
        campaignId: step.campaignId,
        campaignName: step.campaign?.name || null,
        campaignStatus: step.campaign?.status || null,
        campaignSubject: step.campaign?.subject || null,
        campaignFromName: step.campaign?.fromName || null,
        campaignFromEmail: step.campaign?.fromEmail || null,
        campaignReplyTo: step.campaign?.replyTo || null,
      })),
    })),
  });
}

// ─── GET /api/contacts ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  logInfo("GET_START", {
    url: req.nextUrl.toString(),
  });

  const guard = await withPermission(req, { resource: "contacts", action: "canList" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20));
  const search = searchParams.get("search") || "";
  const groupId = searchParams.get("groupId") || undefined;
  const crmStatus = searchParams.get("crmStatus") || undefined;
  const crmStatusOptionId =
    searchParams.get("crmStatusOptionId") || undefined;
  const crmSource = searchParams.get("crmSource") || undefined;

  logInfo("GET_FILTERS", {
    userId: session.user.id,
    page,
    pageSize,
    search,
    groupId: groupId || null,
    crmStatus: crmStatus || null,
    crmStatusOptionId: crmStatusOptionId || null,
    crmSource: crmSource || null,
  });

  const where = {
    userId: session.user.id,

    ...(groupId ? { groupId } : {}),

    ...(crmStatus
      ? {
          crmStatus: crmStatus as any,
        }
      : {}),

    ...(crmStatusOptionId
      ? {
          crmStatusOptionId,
        }
      : {}),

    ...(crmSource
      ? {
          crmSource: crmSource as any,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              firstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              jobTitle: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              companyName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              country: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              city: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              crmCompany: {
                is: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              crmStatusOption: {
                is: {
                  label: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              crmStatusOption: {
                is: {
                  key: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: getContactInclude(),
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),

    prisma.contact.count({
      where,
    }),
  ]);

  logInfo("GET_SUCCESS", {
    returned: contacts.length,
    total,
    page,
    pageSize,
  });

  return NextResponse.json({
    data: contacts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// ─── POST /api/contacts ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  logInfo("POST_START", {
    url: req.nextUrl.toString(),
    method: req.method,
  });

  const guard = await withPermission(req, { resource: "contacts", action: "canCreate" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  let body: unknown;

  try {
    body = await req.json();
  } catch (error) {
    logError("POST_BODY_JSON_ERROR", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Body JSON invalide." },
      { status: 400 }
    );
  }

  logInfo("POST_BODY_RECEIVED", {
    userId: session.user.id,
    bodyKeys:
      typeof body === "object" && body !== null ? Object.keys(body) : [],
    email:
      typeof body === "object" && body !== null && "email" in body
        ? maskEmail(String((body as { email?: unknown }).email || ""))
        : null,
  });

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    logError("POST_SCHEMA_VALIDATION_FAILED", {
      error: parsed.error.flatten(),
    });

    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;

    logInfo("POST_SCHEMA_VALIDATION_SUCCESS", {
      email: maskEmail(data.email),
      crmStatus: data.crmStatus || "NEW",
      crmStatusOptionId: data.crmStatusOptionId || null,
      crmSource: data.crmSource || "MANUAL",
      groupId: data.groupId || null,
      isActive: data.isActive ?? true,
      unsubscribed: data.unsubscribed ?? false,
    });

    const groupId = await ensureGroupBelongsToUser(
      cleanString(data.groupId),
      session.user.id
    );

    const crmStatusOption = await ensureCrmStatusOptionBelongsToUser(
      cleanString(data.crmStatusOptionId),
      session.user.id
    );

    const legacyCrmStatus = getCompatibleLegacyCrmStatus(
      data.crmStatus,
      crmStatusOption?.key
    );

    logInfo("POST_CONTACT_CREATE_START", {
      userId: session.user.id,
      email: maskEmail(data.email),
      groupId,
      crmStatusOptionId: crmStatusOption?.id || null,
      crmStatusOptionKey: crmStatusOption?.key || null,
      legacyCrmStatus,
    });

    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
        data: {
          email: normalizeEmail(data.email),
          firstName: cleanString(data.firstName),
          lastName: cleanString(data.lastName),
          phone: cleanString(data.phone),
          groupId,

          jobTitle: cleanString(data.jobTitle),
          companyName: cleanString(data.companyName),
          country: cleanString(data.country),
          city: cleanString(data.city),
          notes: cleanString(data.notes),

          crmStatus: legacyCrmStatus as any,
          crmStatusOptionId: crmStatusOption?.id || null,
          crmSource: data.crmSource || "MANUAL",

          isActive: data.isActive ?? true,
          unsubscribed: data.unsubscribed ?? false,

          userId: session.user.id,
        },
        include: getContactInclude(),
      });

      if (groupId) {
        await tx.contactGroupMember.upsert({
          where: {
            contactId_groupId: {
              contactId: created.id,
              groupId,
            },
          },
          update: {},
          create: {
            contactId: created.id,
            groupId,
          },
        });
      }

      return created;
    });

    const currentSnapshot = toContactSnapshot(contact);

    logInfo("POST_CONTACT_CREATED", {
      contactId: contact.id,
      email: maskEmail(contact.email),
      crmStatus: currentSnapshot.crmStatus,
      crmStatusOptionId: currentSnapshot.crmStatusOptionId,
      crmStatusOptionKey: currentSnapshot.crmStatusOptionKey,
      crmSource: currentSnapshot.crmSource,
      isActive: contact.isActive,
      unsubscribed: contact.unsubscribed,
      groupId: contact.groupId || null,
    });

    await logAutomationDiagnostic(session.user.id, contact.id);

    const canStartAutomation =
      contact.isActive === true && contact.unsubscribed === false;

    logInfo("POST_AUTOMATION_ELIGIBILITY", {
      contactId: contact.id,
      canStartAutomation,
      isActive: contact.isActive,
      unsubscribed: contact.unsubscribed,
    });

    if (canStartAutomation) {
      logInfo("POST_START_CONTACT_CREATED_AUTOMATION_BEFORE", {
        contactId: contact.id,
        trigger: "CONTACT_CREATED",
        triggerEvent: "CONTACT_CREATED",
      });

      await startContactAutomationCompat({
        userId: session.user.id,
        contactId: contact.id,
        trigger: "CONTACT_CREATED",
        triggerEvent: "CONTACT_CREATED",
        previousContact: null,
        currentContact: currentSnapshot,
      });

      logInfo("POST_START_CONTACT_CREATED_AUTOMATION_AFTER", {
        contactId: contact.id,
        trigger: "CONTACT_CREATED",
        triggerEvent: "CONTACT_CREATED",
      });

      const statusTrigger = getTriggerFromCrmStatus(
        currentSnapshot.crmStatus || undefined
      );

      logInfo("POST_STATUS_TRIGGER_RESOLVED", {
        contactId: contact.id,
        crmStatus: currentSnapshot.crmStatus,
        crmStatusOptionId: currentSnapshot.crmStatusOptionId,
        statusTrigger,
      });

      if (statusTrigger) {
        logInfo("POST_START_STATUS_AUTOMATION_BEFORE", {
          contactId: contact.id,
          trigger: statusTrigger,
          triggerEvent: "CONTACT_UPDATED",
          previousCrmStatus: null,
          currentCrmStatus: currentSnapshot.crmStatus,
        });

        await startContactAutomationCompat({
          userId: session.user.id,
          contactId: contact.id,
          trigger: statusTrigger,
          triggerEvent: "CONTACT_UPDATED",
          previousContact: null,
          currentContact: currentSnapshot,
        });

        logInfo("POST_START_STATUS_AUTOMATION_AFTER", {
          contactId: contact.id,
          trigger: statusTrigger,
          triggerEvent: "CONTACT_UPDATED",
        });
      }

      await logAutomationDiagnostic(session.user.id, contact.id);

      const pendingBeforeSend = await prisma.emailAutomationEmail.findMany({
        where: {
          contactId: contact.id,
        },
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          id: true,
          status: true,
          subject: true,
          scheduledAt: true,
          sentAt: true,
          failedAt: true,
          error: true,
          run: {
            select: {
              id: true,
              status: true,
              trigger: true,
              triggerEvent: true,
            },
          },
          step: {
            select: {
              id: true,
              delayValue: true,
              delayUnit: true,
              campaignId: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      logInfo("POST_EMAILS_FOR_CONTACT_BEFORE_PROCESS", {
        contactId: contact.id,
        count: pendingBeforeSend.length,
        emails: pendingBeforeSend.map((email) => ({
          id: email.id,
          status: email.status,
          subject: email.subject,
          scheduledAt: email.scheduledAt.toISOString(),
          sentAt: email.sentAt?.toISOString() || null,
          failedAt: email.failedAt?.toISOString() || null,
          error: email.error || null,
          runId: email.run.id,
          runStatus: email.run.status,
          runTrigger: email.run.trigger,
          runTriggerEvent: email.run.triggerEvent,
          stepId: email.step.id,
          delayValue: email.step.delayValue,
          delayUnit: email.step.delayUnit,
          campaignId: email.step.campaignId,
          campaignName: email.step.campaign?.name || null,
          campaignStatus: email.step.campaign?.status || null,
        })),
      });

      try {
        logInfo("POST_PROCESS_PENDING_EMAILS_START", {
          contactId: contact.id,
          limit: 10,
        });

        const automationResult = await processPendingAutomationEmails({
          limit: 10,
        });

        logInfo("POST_PROCESS_PENDING_EMAILS_RESULT", {
          contactId: contact.id,
          email: maskEmail(contact.email),
          automationResult,
        });
      } catch (automationError) {
        logError("POST_PROCESS_PENDING_EMAILS_ERROR", {
          contactId: contact.id,
          email: maskEmail(contact.email),
          error:
            automationError instanceof Error
              ? automationError.message
              : String(automationError),
        });
      }

      const emailsAfterSend = await prisma.emailAutomationEmail.findMany({
        where: {
          contactId: contact.id,
        },
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          id: true,
          status: true,
          subject: true,
          scheduledAt: true,
          sentAt: true,
          failedAt: true,
          error: true,
          run: {
            select: {
              id: true,
              status: true,
              trigger: true,
              triggerEvent: true,
            },
          },
          step: {
            select: {
              id: true,
              delayValue: true,
              delayUnit: true,
              campaignId: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      logInfo("POST_EMAILS_FOR_CONTACT_AFTER_PROCESS", {
        contactId: contact.id,
        count: emailsAfterSend.length,
        emails: emailsAfterSend.map((email) => ({
          id: email.id,
          status: email.status,
          subject: email.subject,
          scheduledAt: email.scheduledAt.toISOString(),
          sentAt: email.sentAt?.toISOString() || null,
          failedAt: email.failedAt?.toISOString() || null,
          error: email.error || null,
          runId: email.run.id,
          runStatus: email.run.status,
          runTrigger: email.run.trigger,
          runTriggerEvent: email.run.triggerEvent,
          stepId: email.step.id,
          delayValue: email.step.delayValue,
          delayUnit: email.step.delayUnit,
          campaignId: email.step.campaignId,
          campaignName: email.step.campaign?.name || null,
          campaignStatus: email.step.campaign?.status || null,
        })),
      });
    } else {
      logInfo("POST_AUTOMATION_SKIPPED", {
        contactId: contact.id,
        reason: "Contact inactif ou désabonné",
        isActive: contact.isActive,
        unsubscribed: contact.unsubscribed,
      });
    }

    logInfo("POST_SUCCESS", {
      contactId: contact.id,
      email: maskEmail(contact.email),
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      logError("POST_DUPLICATE_EMAIL", {
        code: "P2002",
        error: err instanceof Error ? err.message : String(err),
      });

      return NextResponse.json(
        { error: "Cet email existe déjà" },
        { status: 409 }
      );
    }

    if (err instanceof Error) {
      logError("POST_ERROR", {
        error: err.message,
      });

      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logError("POST_UNKNOWN_ERROR", {
      error: String(err),
    });

    throw err;
  }
}

// ─── DELETE /api/contacts ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  logInfo("DELETE_START", {
    url: req.nextUrl.toString(),
  });

  const guard = await withPermission(req, { resource: "contacts", action: "canDelete" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  let body: { ids?: string[] };

  try {
    body = (await req.json()) as { ids?: string[] };
  } catch (error) {
    logError("DELETE_BODY_JSON_ERROR", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Body JSON invalide." },
      { status: 400 }
    );
  }

  const ids = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    logError("DELETE_IDS_INVALID", {
      ids,
    });

    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  logInfo("DELETE_CANCEL_AUTOMATIONS_START", {
    userId: session.user.id,
    count: ids.length,
    ids,
  });

  await cancelActiveAutomationsForContacts({
    userId: session.user.id,
    contactIds: ids,
  });

  logInfo("DELETE_CONTACTS_START", {
    userId: session.user.id,
    count: ids.length,
  });

  const { count } = await prisma.contact.deleteMany({
    where: {
      id: {
        in: ids,
      },
      userId: session.user.id,
    },
  });

  logInfo("DELETE_SUCCESS", {
    deleted: count,
  });

  return NextResponse.json({ deleted: count });
}