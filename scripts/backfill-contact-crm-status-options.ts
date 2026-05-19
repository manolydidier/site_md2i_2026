// scripts/backfill-contact-crm-status-options.ts

import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";

async function main() {
  const userId = process.env.CRM_DEFAULT_USER_ID;

  if (!userId) {
    throw new Error("CRM_DEFAULT_USER_ID est manquant dans .env");
  }

  console.log("[backfill-contact-crm-status-options][START]", {
    userId,
  });

  const statuses = await prisma.crmStatusOption.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      key: true,
    },
  });

  const statusByKey = new Map(statuses.map((status) => [status.key, status.id]));

  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      crmStatusOptionId: null,
    },
    select: {
      id: true,
      email: true,
      crmStatus: true,
    },
  });

  console.log("[backfill-contact-crm-status-options][FOUND]", {
    count: contacts.length,
  });

  let updated = 0;
  let skipped = 0;

  for (const contact of contacts) {
    const statusId = statusByKey.get(contact.crmStatus);

    if (!statusId) {
      skipped += 1;

      console.warn("[backfill-contact-crm-status-options][SKIPPED]", {
        contactId: contact.id,
        email: contact.email,
        crmStatus: contact.crmStatus,
      });

      continue;
    }

    await prisma.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        crmStatusOptionId: statusId,
      },
    });

    updated += 1;

    console.log("[backfill-contact-crm-status-options][UPDATED]", {
      contactId: contact.id,
      email: contact.email,
      crmStatus: contact.crmStatus,
      crmStatusOptionId: statusId,
    });
  }

  console.log("[backfill-contact-crm-status-options][DONE]", {
    updated,
    skipped,
  });
}

main()
  .catch((error) => {
    console.error("[backfill-contact-crm-status-options][ERROR]", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });