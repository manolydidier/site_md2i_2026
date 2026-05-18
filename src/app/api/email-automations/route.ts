// src/app/api/email-automations/route.ts
// GET  /api/email-automations
// POST /api/email-automations
//
// Version dynamique :
// - ancien trigger conservé pour compatibilité
// - nouveau système : triggerEvent + conditionField + conditionOperator + conditionValue

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LEGACY_TRIGGERS = [
  "CONTACT_CREATED",
  "CONTACT_STATUS_NEW",
  "CONTACT_STATUS_PROSPECT",
  "CONTACT_STATUS_HOT_PROSPECT",
  "CONTACT_STATUS_CUSTOMER",
  "CONTACT_STATUS_INACTIVE",
  "EMAIL_OPENED",
  "EMAIL_CLICKED",
  "MANUAL_START",
] as const;

const TRIGGER_EVENTS = [
  "CONTACT_CREATED",
  "CONTACT_UPDATED",
  "EMAIL_OPENED",
  "EMAIL_CLICKED",
  "MANUAL_START",
] as const;

const CONDITION_FIELDS = [
  "NONE",
  "EMAIL",
  "FIRST_NAME",
  "LAST_NAME",
  "PHONE",
  "GROUP_ID",
  "CRM_STATUS",
  "CRM_SOURCE",
  "COMPANY_NAME",
  "COUNTRY",
  "CITY",
  "IS_ACTIVE",
  "UNSUBSCRIBED",
] as const;

const CONDITION_OPERATORS = [
  "ALWAYS",
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "EXISTS",
  "NOT_EXISTS",
  "CHANGED",
  "CHANGED_TO",
  "CHANGED_FROM",
] as const;

const DELAY_UNITS = ["MINUTES", "HOURS", "DAYS"] as const;

type LegacyTrigger = (typeof LEGACY_TRIGGERS)[number];
type TriggerEvent = (typeof TRIGGER_EVENTS)[number];
type ConditionField = (typeof CONDITION_FIELDS)[number];
type ConditionOperator = (typeof CONDITION_OPERATORS)[number];
type DelayUnit = (typeof DELAY_UNITS)[number];

const DEFAULT_SUBJECT = "Nouvel email automatique";
const DEFAULT_CONTENT =
  "<p>Bonjour {{contactName}},</p><p>Merci pour votre intérêt.</p>";

function cleanString(value: unknown) {
  const cleaned = String(value || "").trim();
  return cleaned.length > 0 ? cleaned : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeLegacyTrigger(value: unknown): LegacyTrigger {
  if (LEGACY_TRIGGERS.includes(value as LegacyTrigger)) {
    return value as LegacyTrigger;
  }

  return "CONTACT_CREATED";
}

function normalizeTriggerEvent(value: unknown): TriggerEvent {
  if (TRIGGER_EVENTS.includes(value as TriggerEvent)) {
    return value as TriggerEvent;
  }

  return "CONTACT_CREATED";
}

function normalizeConditionField(value: unknown): ConditionField {
  if (CONDITION_FIELDS.includes(value as ConditionField)) {
    return value as ConditionField;
  }

  return "NONE";
}

function normalizeConditionOperator(value: unknown): ConditionOperator {
  if (CONDITION_OPERATORS.includes(value as ConditionOperator)) {
    return value as ConditionOperator;
  }

  return "ALWAYS";
}

function normalizeDelayUnit(value: unknown): DelayUnit {
  if (DELAY_UNITS.includes(value as DelayUnit)) {
    return value as DelayUnit;
  }

  return "MINUTES";
}

function normalizeDelayValue(value: unknown) {
  const parsed = Number(value || 0);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function getCampaignSelect() {
  return {
    id: true,
    name: true,
    subject: true,
    htmlContent: true,
    fromName: true,
    fromEmail: true,
    replyTo: true,
    status: true,
    updatedAt: true,
  };
}

function getAutomationInclude() {
  return {
    steps: {
      orderBy: {
        position: "asc" as const,
      },
      include: {
        campaign: {
          select: getCampaignSelect(),
        },
      },
    },
  };
}

function mapLegacyTriggerToDynamic(trigger: LegacyTrigger): {
  triggerEvent: TriggerEvent;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string | null;
} {
  if (trigger === "CONTACT_CREATED") {
    return {
      triggerEvent: "CONTACT_CREATED",
      conditionField: "NONE",
      conditionOperator: "ALWAYS",
      conditionValue: null,
    };
  }

  if (trigger === "CONTACT_STATUS_NEW") {
    return {
      triggerEvent: "CONTACT_UPDATED",
      conditionField: "CRM_STATUS",
      conditionOperator: "CHANGED_TO",
      conditionValue: "NEW",
    };
  }

  if (trigger === "CONTACT_STATUS_PROSPECT") {
    return {
      triggerEvent: "CONTACT_UPDATED",
      conditionField: "CRM_STATUS",
      conditionOperator: "CHANGED_TO",
      conditionValue: "PROSPECT",
    };
  }

  if (trigger === "CONTACT_STATUS_HOT_PROSPECT") {
    return {
      triggerEvent: "CONTACT_UPDATED",
      conditionField: "CRM_STATUS",
      conditionOperator: "CHANGED_TO",
      conditionValue: "HOT_PROSPECT",
    };
  }

  if (trigger === "CONTACT_STATUS_CUSTOMER") {
    return {
      triggerEvent: "CONTACT_UPDATED",
      conditionField: "CRM_STATUS",
      conditionOperator: "CHANGED_TO",
      conditionValue: "CUSTOMER",
    };
  }

  if (trigger === "CONTACT_STATUS_INACTIVE") {
    return {
      triggerEvent: "CONTACT_UPDATED",
      conditionField: "CRM_STATUS",
      conditionOperator: "CHANGED_TO",
      conditionValue: "INACTIVE",
    };
  }

  if (trigger === "EMAIL_OPENED") {
    return {
      triggerEvent: "EMAIL_OPENED",
      conditionField: "NONE",
      conditionOperator: "ALWAYS",
      conditionValue: null,
    };
  }

  if (trigger === "EMAIL_CLICKED") {
    return {
      triggerEvent: "EMAIL_CLICKED",
      conditionField: "NONE",
      conditionOperator: "ALWAYS",
      conditionValue: null,
    };
  }

  if (trigger === "MANUAL_START") {
    return {
      triggerEvent: "MANUAL_START",
      conditionField: "NONE",
      conditionOperator: "ALWAYS",
      conditionValue: null,
    };
  }

  return {
    triggerEvent: "CONTACT_CREATED",
    conditionField: "NONE",
    conditionOperator: "ALWAYS",
    conditionValue: null,
  };
}

function mapDynamicToLegacyTrigger({
  triggerEvent,
  conditionField,
  conditionOperator,
  conditionValue,
}: {
  triggerEvent: TriggerEvent;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string | null;
}): LegacyTrigger {
  if (triggerEvent === "CONTACT_CREATED") {
    return "CONTACT_CREATED";
  }

  if (triggerEvent === "EMAIL_OPENED") {
    return "EMAIL_OPENED";
  }

  if (triggerEvent === "EMAIL_CLICKED") {
    return "EMAIL_CLICKED";
  }

  if (triggerEvent === "MANUAL_START") {
    return "MANUAL_START";
  }

  if (
    triggerEvent === "CONTACT_UPDATED" &&
    conditionField === "CRM_STATUS" &&
    conditionOperator === "CHANGED_TO"
  ) {
    if (conditionValue === "NEW") return "CONTACT_STATUS_NEW";
    if (conditionValue === "PROSPECT") return "CONTACT_STATUS_PROSPECT";
    if (conditionValue === "HOT_PROSPECT")
      return "CONTACT_STATUS_HOT_PROSPECT";
    if (conditionValue === "CUSTOMER") return "CONTACT_STATUS_CUSTOMER";
    if (conditionValue === "INACTIVE") return "CONTACT_STATUS_INACTIVE";
  }

  return "CONTACT_CREATED";
}

function normalizeDynamicTriggerFromBody(body: any) {
  const hasDynamicFields =
    body.triggerEvent ||
    body.conditionField ||
    body.conditionOperator ||
    body.conditionValue;

  if (!hasDynamicFields && body.trigger) {
    const legacyTrigger = normalizeLegacyTrigger(body.trigger);
    const dynamic = mapLegacyTriggerToDynamic(legacyTrigger);

    return {
      legacyTrigger,
      ...dynamic,
    };
  }

  const triggerEvent = normalizeTriggerEvent(body.triggerEvent);
  let conditionField = normalizeConditionField(body.conditionField);
  let conditionOperator = normalizeConditionOperator(body.conditionOperator);
  let conditionValue = cleanNullableString(body.conditionValue);

  if (triggerEvent !== "CONTACT_UPDATED") {
    conditionField = "NONE";
    conditionOperator = "ALWAYS";
    conditionValue = null;
  }

  if (conditionOperator === "ALWAYS") {
    conditionField = "NONE";
    conditionValue = null;
  }

  if (conditionField === "NONE") {
    conditionOperator = "ALWAYS";
    conditionValue = null;
  }

  const legacyTrigger = mapDynamicToLegacyTrigger({
    triggerEvent,
    conditionField,
    conditionOperator,
    conditionValue,
  });

  return {
    legacyTrigger,
    triggerEvent,
    conditionField,
    conditionOperator,
    conditionValue,
  };
}

function validateDynamicCondition({
  triggerEvent,
  conditionField,
  conditionOperator,
  conditionValue,
}: {
  triggerEvent: TriggerEvent;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string | null;
}) {
  if (triggerEvent !== "CONTACT_UPDATED") {
    return null;
  }

  if (conditionOperator === "ALWAYS") {
    return null;
  }

  if (conditionField === "NONE") {
    return "Choisissez un champ de condition.";
  }

  const operatorsWithoutValue: ConditionOperator[] = [
    "EXISTS",
    "NOT_EXISTS",
    "CHANGED",
  ];

  if (!operatorsWithoutValue.includes(conditionOperator) && !conditionValue) {
    return "Renseignez une valeur de condition.";
  }

  return null;
}

function serializeAutomation(automation: any) {
  const firstStep =
    automation.steps?.find((step: any) => step.isActive) ||
    automation.steps?.[0] ||
    null;

  return {
    id: automation.id,
    name: automation.name,
    description: automation.description || "",

    // Ancien champ conservé.
    trigger: automation.trigger,

    // Nouveaux champs dynamiques.
    triggerEvent: automation.triggerEvent || "CONTACT_CREATED",
    conditionField: automation.conditionField || "NONE",
    conditionOperator: automation.conditionOperator || "ALWAYS",
    conditionValue: automation.conditionValue || "",
    conditionValueJson: automation.conditionValueJson || null,

    isActive: automation.isActive,
    createdAt: automation.createdAt,
    updatedAt: automation.updatedAt,

    stepId: firstStep?.id || null,
    delayValue: firstStep?.delayValue ?? 0,
    delayUnit: firstStep?.delayUnit || "MINUTES",
    selectedCampaignId: firstStep?.campaignId || null,
    selectedCampaign: firstStep?.campaign || null,
    stepCount: automation.steps?.length || 0,
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [automations, draftCampaigns] = await Promise.all([
    prisma.emailAutomation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: getAutomationInclude(),
    }),

    prisma.campaign.findMany({
      where: {
        userId,
        status: "DRAFT",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: getCampaignSelect(),
    }),
  ]);

  return NextResponse.json({
    automations: automations.map(serializeAutomation),
    draftCampaigns,

    // Anciennes options conservées pour l’ancien front.
    triggerOptions: LEGACY_TRIGGERS,

    // Nouvelles options dynamiques pour le nouveau front.
    triggerEventOptions: TRIGGER_EVENTS,
    conditionFieldOptions: CONDITION_FIELDS,
    conditionOperatorOptions: CONDITION_OPERATORS,

    delayUnitOptions: DELAY_UNITS,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  const name = cleanString(body.name);
  const description = cleanString(body.description);
  const campaignId = body.campaignId ? String(body.campaignId) : null;
  const delayValue = normalizeDelayValue(body.delayValue);
  const delayUnit = normalizeDelayUnit(body.delayUnit);
  const isActive = Boolean(body.isActive);

  const {
    legacyTrigger,
    triggerEvent,
    conditionField,
    conditionOperator,
    conditionValue,
  } = normalizeDynamicTriggerFromBody(body);

  if (!name) {
    return NextResponse.json(
      { error: "Le nom de l’automatisation est requis." },
      { status: 400 }
    );
  }

  const conditionError = validateDynamicCondition({
    triggerEvent,
    conditionField,
    conditionOperator,
    conditionValue,
  });

  if (conditionError) {
    return NextResponse.json({ error: conditionError }, { status: 400 });
  }

  if (isActive && !campaignId) {
    return NextResponse.json(
      {
        error:
          "Choisissez une campagne brouillon avant d’activer l’automatisation.",
      },
      { status: 400 }
    );
  }

  let selectedCampaign:
    | {
        id: string;
        name: string;
        subject: string;
        htmlContent: string;
        fromName: string;
        fromEmail: string;
        replyTo: string | null;
        status: string;
        updatedAt: Date;
      }
    | null = null;

  if (campaignId) {
    selectedCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId,
        status: "DRAFT",
      },
      select: getCampaignSelect(),
    });

    if (!selectedCampaign) {
      return NextResponse.json(
        {
          error:
            "Campagne introuvable. Seules les campagnes brouillon peuvent être utilisées.",
        },
        { status: 404 }
      );
    }
  }

  const automation = await prisma.emailAutomation.create({
    data: {
      userId,
      name,
      description,

      // Compatibilité ancien moteur.
      trigger: legacyTrigger,

      // Nouveau système dynamique.
      triggerEvent,
      conditionField,
      conditionOperator,
      conditionValue,

      isActive,

      steps: {
        create: {
          position: 1,
          delayValue,
          delayUnit,
          isActive: true,
          campaignId: selectedCampaign?.id || null,
          subject: selectedCampaign?.subject || DEFAULT_SUBJECT,
          content: selectedCampaign?.htmlContent || DEFAULT_CONTENT,
        },
      },
    },
    include: getAutomationInclude(),
  });

  return NextResponse.json(
    {
      success: true,
      automation: serializeAutomation(automation),
    },
    { status: 201 }
  );
}