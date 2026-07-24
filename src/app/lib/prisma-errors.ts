// Helpers partagés pour reconnaître les codes d'erreur Prisma courants,
// au lieu de les redéfinir localement dans chaque route.

function getPrismaErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  return (error as { code?: unknown }).code as string | undefined;
}

// P2025 — l'enregistrement ciblé par l'opération (update/delete) n'existe pas.
export function isPrismaNotFound(error: unknown) {
  return getPrismaErrorCode(error) === "P2025";
}

// P2002 — violation de contrainte d'unicité (slug/code/email déjà utilisé…).
export function isPrismaUniqueConstraintError(error: unknown) {
  return getPrismaErrorCode(error) === "P2002";
}
