// src/lib/permissions.ts

import { auth } from '@/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import type { Session } from 'next-auth'

// ── Mapping route → resource_code (alias explicites uniquement) ────────────────
// Le cas général n'a pas besoin d'entrée ici : deriveResourceFromPath() dérive
// automatiquement le code de ressource depuis l'URL (premier segment après
// /api/). Cette table ne sert que pour les routes dont le code de ressource
// ne correspond pas au segment d'URL (alias, sous-routes partagées, etc.).
const ROUTE_RESOURCE_MAP: Record<string, string> = {
  '/api/audit':                    'audit_logs',
  '/api/product-categories':       'product_categories',
  '/api/crm/opportunities':        'crm_opportunities',
  '/api/crm/tasks':                'crm_tasks',
  '/api/crm/campaigns':            'crm_campaigns',
  '/api/crm/statuses':             'crm_statuses',
  '/api/email-automations':        'email_automations',
  // Plus spécifique que l'alias 'email_marketing' ci-dessous — les actions
  // d'envoi de campagne vivent sous /api/email-marketing/campaigns/* mais
  // relèvent de la même ressource que /api/campaigns (même entité Campaign).
  '/api/email-marketing/campaigns': 'campaigns',
  '/api/email-marketing':          'email_marketing',
  '/api/contact-commercial':       'contact_commercial',
  '/api/roles/permissions':        'permissions',
  '/api/permission-resources':     'permissions',
}

// ── Dérivation automatique du code de ressource depuis l'URL ───────────────────
// /api/references/bulk → 'references', /api/products/[id] → 'products'…
// Permet à un nouveau module d'être protégé sans toucher à ce fichier : il
// suffit d'appeler withPermission() dans ses routes et de créer la
// PermissionResource correspondante (code = premier segment après /api/).
function deriveResourceFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/([^/]+)/)
  return match ? match[1] : null
}

// ── Mapping méthode HTTP → action ─────────────────────────────────────────────
const METHOD_ACTION_MAP: Record<string, string> = {
  GET:    'canRead',
  POST:   'canCreate',
  PUT:    'canUpdate',
  PATCH:  'canUpdate',
  DELETE: 'canDelete',
}

// ── Types explicites ──────────────────────────────────────────────────────────
type GuardOk = {
  ok:          true
  session:     Session                 // ← type Session de next-auth, jamais null ici
  permissions: string[]
}
type GuardFail = {
  ok:       false
  response: Response
}
type GuardResult = GuardOk | GuardFail

// ── Charger les permissions depuis la DB ──────────────────────────────────────
async function loadPermissions(roleId: string): Promise<string[]> {
  console.log('[permissions] Chargement permissions pour roleId:', roleId)

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { resource: { select: { code: true, name: true } } },
  })

  console.log('[permissions] rolePermissions trouvés:', rolePermissions.length)
  console.log('[permissions] détail:', JSON.stringify(rolePermissions, null, 2))

  const result = rolePermissions.flatMap(rp => {
    const res     = rp.resource.code
    const actions: string[] = []
    if (rp.canRead)    actions.push(`${res}.canRead`)
    if (rp.canCreate)  actions.push(`${res}.canCreate`)
    if (rp.canUpdate)  actions.push(`${res}.canUpdate`)
    if (rp.canDelete)  actions.push(`${res}.canDelete`)
    if (rp.canList)    actions.push(`${res}.canList`)
    if (rp.canExport)  actions.push(`${res}.canExport`)
    if (rp.canApprove)  actions.push(`${res}.canApprove`)
    if (rp.canManage)   actions.push(`${res}.canManage`)
    if (rp.canImport)   actions.push(`${res}.canImport`)
    if (rp.canPrint)    actions.push(`${res}.canPrint`)
    if (rp.canValidate) actions.push(`${res}.canValidate`)
    if (rp.canCancel)   actions.push(`${res}.canCancel`)
    if (rp.canArchive)  actions.push(`${res}.canArchive`)
    if (rp.canRestore)  actions.push(`${res}.canRestore`)
    if (rp.canDownload) actions.push(`${res}.canDownload`)
    if (rp.canUpload)   actions.push(`${res}.canUpload`)
    if (rp.canExecute)  actions.push(`${res}.canExecute`)
    if (rp.specialPermission === 'FULL_ACCESS') actions.push(`${res}.FULL_ACCESS`)
    return actions
  })

  console.log('[permissions] permissions aplaties:', result)
  return result
}

// ── Guard principal ───────────────────────────────────────────────────────────
export async function withPermission(
  req: NextRequest | Request,
  options?: {
    resource?:     string
    action?:       string
    allowAnyAuth?: boolean
  }
): Promise<GuardResult> {

  // console.log('\n[withPermission] ─────────────────────────────────')
  // console.log('[withPermission] méthode :', req.method)
  // console.log('[withPermission] url     :', req.url)

  // 1. Vérifier la session
  const session = await auth()

  // console.log('[withPermission] session :', session
  //   ? { id: session.user?.id, role: session.user?.role, roleId: session.user?.roleId }
  //   : null
  // )

  if (!session || !session.user) {
    // console.log('[withPermission] ❌ Non authentifié')
    return {
      ok: false,
      response: Response.json(
        { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    }
  }

  // 2. allowAnyAuth → juste la session, pas de vérification de permission
  if (options?.allowAnyAuth) {
    // console.log('[withPermission] ✅ allowAnyAuth — session valide')
    return { ok: true, session, permissions: [] }
  }

  // 3. Charger les permissions
  const roleId = session.user.roleId ?? null
  // console.log('[withPermission] roleId :', roleId)

  const permissions = roleId ? await loadPermissions(roleId) : []

  // if (!roleId) {
  //   console.log('[withPermission] ⚠️  Aucun rôle assigné à cet utilisateur')
  // }

  // 4. Trouver la ressource depuis la route :
  //    override explicite > alias de ROUTE_RESOURCE_MAP > dérivation automatique
  //    depuis l'URL (premier segment après /api/).
  const pathname = new URL(req.url).pathname
  const matchedRoute = Object.keys(ROUTE_RESOURCE_MAP)
    .filter(r => pathname.startsWith(r))
    .sort((a, b) => b.length - a.length)[0]

  const resource = options?.resource
    ?? (matchedRoute ? ROUTE_RESOURCE_MAP[matchedRoute] : null)
    ?? deriveResourceFromPath(pathname)
  const action   = options?.action   ?? METHOD_ACTION_MAP[req.method.toUpperCase()] ?? 'canRead'

  // console.log('[withPermission] resource  :', resource)
  // console.log('[withPermission] action    :', action)

  // Ressource indéterminable (route hors /api/) → autoriser (rien à vérifier).
  if (!resource) {
    // console.log('[withPermission] ✅ Ressource indéterminable — accès autorisé')
    return { ok: true, session, permissions }
  }

  // 5. FULL_ACCESS — scopé à la ressource concernée, jamais global.
  if (permissions.includes(`${resource}.FULL_ACCESS`)) {
    // console.log('[withPermission] ✅ FULL_ACCESS sur', resource)
    return { ok: true, session, permissions }
  }

  // 6. Vérifier la permission (FULL_ACCESS déjà traité à l'étape 5)
  const required = `${resource}.${action}`
  const hasPermission = permissions.includes(required)

  // console.log('[withPermission] permission requise :', required)
  // console.log('[withPermission] permissions user   :', permissions)
  // console.log('[withPermission] résultat           :', hasPermission ? '✅ AUTORISÉ' : '❌ REFUSÉ')

  if (!hasPermission) {
    return {
      ok: false,
      response: Response.json(
        {
          error:    'Permission refusée',
          code:     'FORBIDDEN',
          required,
          role:     session.user.role ?? 'aucun rôle',
        },
        { status: 403 }
      ),
    }
  }

  return { ok: true, session, permissions }
}

// ── Helpers côté client ─────────────────────────────────────────────────────
// Définis dans permissions.client.ts (aucune dépendance serveur) et
// ré-exportés ici pour compatibilité — ne pas importer ce fichier
// (permissions.ts) depuis un composant client, importer permissions.client
// directement, sous peine d'embarquer Prisma/pg dans le bundle navigateur.
export { can, canAll, canAny } from './permissions.client'

// ── Guard pour Server Actions ("use server") ────────────────────────────────
// withPermission() attend un objet Request (dérivation d'URL) — inutilisable
// depuis une Server Action, appelée directement sans requête HTTP. Ces deux
// helpers couvrent ce cas avec la même logique de vérification (session,
// FULL_ACCESS scopé à la ressource, permission exacte).
export async function checkPermission(
  resource: string,
  action: string
): Promise<{ ok: true; session: Session } | { ok: false; reason: 'UNAUTHENTICATED' | 'FORBIDDEN' }> {
  const session = await auth()
  if (!session || !session.user) {
    return { ok: false, reason: 'UNAUTHENTICATED' }
  }

  const roleId = session.user.roleId ?? null
  const permissions = roleId ? await loadPermissions(roleId) : []

  if (permissions.includes(`${resource}.FULL_ACCESS`) || permissions.includes(`${resource}.${action}`)) {
    return { ok: true, session }
  }

  return { ok: false, reason: 'FORBIDDEN' }
}

// Lève une erreur si la permission est refusée — pratique en tête de Server
// Action, où il n'y a pas de Response à retourner.
export async function requirePermission(resource: string, action: string): Promise<Session> {
  const result = await checkPermission(resource, action)
  if (!result.ok) {
    throw new Error(`Permission refusée : ${resource}.${action} (${result.reason})`)
  }
  return result.session
}