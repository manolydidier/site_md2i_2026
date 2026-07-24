import { prisma } from "@/app/lib/prisma";

// Étapes historiques du pipeline (anciennement l'enum CrmOpportunityStage),
// désormais gérables sans code depuis /admin/crm/opportunities.
export const DEFAULT_OPPORTUNITY_STAGES = [
  { key: "NEW", label: "Nouvelle", color: "#64748b", sortOrder: 1, isDefault: true },
  { key: "CONTACTED", label: "Contacté", color: "#0ea5e9", sortOrder: 2, isDefault: false },
  { key: "QUALIFIED", label: "Qualifiée", color: "#8b5cf6", sortOrder: 3, isDefault: false },
  { key: "DEMO_SCHEDULED", label: "Démo planifiée", color: "#6366f1", sortOrder: 4, isDefault: false },
  { key: "QUOTE_SENT", label: "Devis envoyé", color: "#f97316", sortOrder: 5, isDefault: false },
  { key: "NEGOTIATION", label: "Négociation", color: "#eab308", sortOrder: 6, isDefault: false },
  { key: "WON", label: "Gagnée", color: "#22c55e", sortOrder: 7, isDefault: false },
  { key: "LOST", label: "Perdue", color: "#ef4444", sortOrder: 8, isDefault: false },
] as const;

export async function ensureDefaultOpportunityStages(userId: string) {
  const count = await prisma.crmOpportunityStageOption.count({ where: { userId } });

  if (count > 0) return;

  for (const stage of DEFAULT_OPPORTUNITY_STAGES) {
    await prisma.crmOpportunityStageOption.upsert({
      where: { userId_key: { userId, key: stage.key } },
      update: {
        label: stage.label,
        color: stage.color,
        sortOrder: stage.sortOrder,
        isDefault: stage.isDefault,
        isActive: true,
      },
      create: {
        userId,
        key: stage.key,
        label: stage.label,
        color: stage.color,
        sortOrder: stage.sortOrder,
        isDefault: stage.isDefault,
        isActive: true,
      },
    });
  }
}

export async function getActiveOpportunityStages(userId: string) {
  await ensureDefaultOpportunityStages(userId);

  return prisma.crmOpportunityStageOption.findMany({
    where: { userId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
