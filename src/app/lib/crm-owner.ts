import { prisma } from "@/app/lib/prisma";

export async function getCrmOwnerUserId() {
  const configured = process.env.CRM_DEFAULT_USER_ID?.trim();

  if (configured) {
    return configured;
  }

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!user) {
    throw new Error(
      "Aucun utilisateur CRM trouve. Definis CRM_DEFAULT_USER_ID dans .env."
    );
  }

  return user.id;
}
