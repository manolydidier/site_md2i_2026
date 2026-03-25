// src/lib/permissions.ts

import { auth } from '@/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import type { Session } from 'next-auth'

// ── Mapping route → resource_code ─────────────────────────────────────────────
const ROUTE_RESOURCE_MAP: Record<string, string> = {
  '/api/posts':      'posts',
  '/api/pages':      'pages',
  '/api/projects':   'projects',
  '/api/products':   'products',
  '/api/users':      'users',
  '/api/roles':      'roles',
  '/api/messages':   'messages',
  '/api/audit':      'audit_logs',
  '/api/categories': 'categories',
  '/api/tags':       'tags',
  '/api/roles/permissions':     'permissions',
'/api/permission-resources':  'permissions',
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
    if (rp.canApprove) actions.push(`${res}.canApprove`)
    if (rp.canManage)  actions.push(`${res}.canManage`)
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

  // 4. FULL_ACCESS → passe tout
  const hasFullAccess = permissions.some(p => p.endsWith('.FULL_ACCESS'))
  if (hasFullAccess) {
    // console.log('[withPermission] ✅ FULL_ACCESS — accès total')
    return { ok: true, session, permissions }
  }

  // 5. Trouver la ressource depuis la route
  const pathname = new URL(req.url).pathname
  const matchedRoute = Object.keys(ROUTE_RESOURCE_MAP)
    .filter(r => pathname.startsWith(r))
    .sort((a, b) => b.length - a.length)[0]

  const resource = options?.resource ?? (matchedRoute ? ROUTE_RESOURCE_MAP[matchedRoute] : null)
  const action   = options?.action   ?? METHOD_ACTION_MAP[req.method.toUpperCase()] ?? 'canRead'

  // console.log('[withPermission] resource  :', resource)
  // console.log('[withPermission] action    :', action)

  // Route non mappée → autoriser
  if (!resource) {
    // console.log('[withPermission] ✅ Route non mappée — accès autorisé')
    return { ok: true, session, permissions }
  }

  // 6. Vérifier la permission
  const required = `${resource}.${action}`
const hasPermission = permissions.includes(required) 
                   || permissions.includes(`${resource}.FULL_ACCESS`)  // ← ajouté

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

// ── Helpers côté client ───────────────────────────────────────────────────────
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