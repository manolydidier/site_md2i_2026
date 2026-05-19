// scripts/seed-crm-status-options.ts

import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";

const defaultStatuses = [
  {
    key: "NEW",
    label: "Nouveau",
    color: "#64748b",
    sortOrder: 1,
    isDefault: true,
  },
  {
    key: "PROSPECT",
    label: "Prospect",
    color: "#0ea5e9",
    sortOrder: 2,
    isDefault: false,
  },
  {
    key: "HOT_PROSPECT",
    label: "Prospect chaud",
    color: "#f97316",
    sortOrder: 3,
    isDefault: false,
  },
  {
    key: "CUSTOMER",
    label: "Client",
    color: "#22c55e",
    sortOrder: 4,
    isDefault: false,
  },
  {
    key: "PARTNER",
    label: "Partenaire",
    color: "#8b5cf6",
    sortOrder: 5,
    isDefault: false,
  },
  {
    key: "INACTIVE",
    label: "Inactif",
    color: "#94a3b8",
    sortOrder: 6,
    isDefault: false,
  },
  {
    key: "LOST",
    label: "Perdu",
    color: "#ef4444",
    sortOrder: 7,
    isDefault: false,
  },
];

async function main() {
  const userId = process.env.CRM_DEFAULT_USER_ID;

  if (!userId) {
    throw new Error("CRM_DEFAULT_USER_ID est manquant dans .env");
  }

  console.log("[seed-crm-status-options][START]", {
    userId,
  });

  for (const status of defaultStatuses) {
    const result = await prisma.crmStatusOption.upsert({
      where: {
        userId_key: {
          userId,
          key: status.key,
        },
      },
      update: {
        label: status.label,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isActive: true,
      },
      create: {
        userId,
        key: status.key,
        label: status.label,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isActive: true,
      },
    });

    console.log("[seed-crm-status-options][UPSERTED]", {
      id: result.id,
      key: result.key,
      label: result.label,
    });
  }

  console.log("[seed-crm-status-options][DONE]");
}

main()
  .catch((error) => {
    console.error("[seed-crm-status-options][ERROR]", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });