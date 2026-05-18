// scripts/backfill-email-automation-dynamic-triggers.ts

import "dotenv/config";

function assertDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL est manquant. Lance le script avec : npx dotenv -e .env -- tsx scripts/backfill-email-automation-dynamic-triggers.ts"
    );
  }

  try {
    const parsed = new URL(databaseUrl);

    if (!parsed.password) {
      throw new Error(
        "DATABASE_URL ne contient pas de mot de passe PostgreSQL."
      );
    }

    console.log("[backfill-email-automation-dynamic-triggers][ENV_OK]", {
      host: parsed.hostname,
      port: parsed.port,
      database: parsed.pathname.replace("/", ""),
      user: parsed.username,
      hasPassword: Boolean(parsed.password),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`DATABASE_URL invalide : ${error.message}`);
    }

    throw error;
  }
}

function mapLegacyTrigger(trigger: string) {
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

async function main() {
  console.log("[backfill-email-automation-dynamic-triggers][START]");

  assertDatabaseUrl();

  // Import dynamique important :
  // on charge Prisma seulement après avoir chargé et vérifié .env.
  const { prisma } = await import("../src/app/lib/prisma");

  const automations = await prisma.emailAutomation.findMany({
    select: {
      id: true,
      name: true,
      trigger: true,
      triggerEvent: true,
      conditionField: true,
      conditionOperator: true,
      conditionValue: true,
    },
  });

  console.log("[backfill-email-automation-dynamic-triggers][FOUND]", {
    count: automations.length,
  });

  for (const automation of automations) {
    const mapped = mapLegacyTrigger(automation.trigger);

    await prisma.emailAutomation.update({
      where: {
        id: automation.id,
      },
      data: mapped as any,
    });

    console.log("[backfill-email-automation-dynamic-triggers][UPDATED]", {
      id: automation.id,
      name: automation.name,
      oldTrigger: automation.trigger,
      newTriggerEvent: mapped.triggerEvent,
      newConditionField: mapped.conditionField,
      newConditionOperator: mapped.conditionOperator,
      newConditionValue: mapped.conditionValue,
    });
  }

  console.log("[backfill-email-automation-dynamic-triggers][DONE]");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[backfill-email-automation-dynamic-triggers][ERROR]", error);

  try {
    const { prisma } = await import("../src/app/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // ignore
  }

  process.exit(1);
});