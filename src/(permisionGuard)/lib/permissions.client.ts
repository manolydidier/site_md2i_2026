// src/(permisionGuard)/lib/permissions.client.ts
// Helpers de vérification de permission sûrs pour le navigateur : aucune
// dépendance serveur (Prisma, next-auth) — ce fichier ne doit importer que
// des fonctions pures. Séparé de permissions.ts pour éviter que le bundle
// client n'entraîne 'pg'/Prisma (utilisés par withPermission côté serveur).

export function can(
  permissions: string[] | undefined | null,
  resource: string,
  action: string
): boolean {
  if (!permissions?.length) return false
  if (permissions.includes(`${resource}.FULL_ACCESS`)) return true
  return permissions.includes(`${resource}.${action}`)
}

export function canAll(
  permissions: string[] | undefined | null,
  resource: string,
  actions: string[]
): boolean {
  return actions.every(a => can(permissions, resource, a))
}

export function canAny(
  permissions: string[] | undefined | null,
  resource: string,
  actions: string[]
): boolean {
  return actions.some(a => can(permissions, resource, a))
}
