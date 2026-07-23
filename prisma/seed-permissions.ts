// prisma/seed-permissions.ts
// Idempotent seeder for the permission catalog (PermissionResource) and the
// SUPER_ADMIN role (FULL_ACCESS on every resource). Safe to re-run — every
// write is an upsert. Run with: npm run seed:permissions

import { prisma } from '../src/app/lib/prisma'

// ─── Modules/tables de l'application ───────────────────────────────────────
// Ajouter un module ici (ou via l'UI /admin/permissions) suffit à le rendre
// disponible dans la matrice de permissions de chaque rôle — aucune autre
// modification de code n'est nécessaire.
const RESOURCES = [
  // Contenu
  { name: 'Articles',              code: 'posts',              category: 'Contenu' },
  { name: 'Références',            code: 'references',         category: 'Contenu' },
  { name: 'Pages',                 code: 'pages',               category: 'Contenu' },
  { name: 'Portfolio',             code: 'projects',            category: 'Contenu' },
  { name: 'Catégories',            code: 'categories',          category: 'Contenu' },
  { name: 'Tags',                  code: 'tags',                category: 'Contenu' },
  // Catalogue
  { name: 'Produits',              code: 'products',            category: 'Catalogue' },
  { name: 'Catégories produits',   code: 'product_categories',  category: 'Catalogue' },
  // CRM
  { name: 'Contacts',              code: 'contacts',             category: 'CRM' },
  { name: 'CRM — Opportunités',    code: 'crm_opportunities',    category: 'CRM' },
  { name: 'CRM — Tâches',          code: 'crm_tasks',            category: 'CRM' },
  { name: 'CRM — Campagnes',       code: 'crm_campaigns',        category: 'CRM' },
  { name: 'CRM — Statuts',         code: 'crm_statuses',         category: 'CRM' },
  // Marketing
  { name: 'Email marketing',       code: 'email_marketing',      category: 'Marketing' },
  { name: 'Campagnes email',       code: 'campaigns',            category: 'Marketing' },
  { name: 'Groupes de contacts',   code: 'groups',               category: 'Marketing' },
  { name: 'Automatisations email', code: 'email_automations',    category: 'Marketing' },
  { name: 'Contacts commerciaux',  code: 'contact_commercial',   category: 'Marketing' },
  // Administration
  { name: 'Utilisateurs',          code: 'users',                category: 'Administration' },
  { name: 'Rôles',                 code: 'roles',                category: 'Administration' },
  { name: 'Permissions',           code: 'permissions',          category: 'Administration' },
  { name: 'Messages',              code: 'messages',             category: 'Administration' },
  { name: 'Audit',                 code: 'audit_logs',           category: 'Administration' },
] as const

async function main() {
  console.log('🌱 Seed des permissions…\n')

  const resourceIds: string[] = []

  for (const res of RESOURCES) {
    const resource = await prisma.permissionResource.upsert({
      where:  { code: res.code },
      update: { name: res.name, category: res.category, isActive: true },
      create: { name: res.name, code: res.code, category: res.category, isActive: true },
    })
    resourceIds.push(resource.id)
    console.log(`   📦 Ressource : ${res.code} (${res.category})`)
  }

  // Un rôle "Super Admin" (ou de code SUPER_ADMIN) peut déjà exister
  // (créé manuellement avant ce script) — on le réutilise plutôt que de
  // risquer un conflit sur la contrainte unique du nom ou du code.
  let superAdmin =
    (await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } })) ??
    (await prisma.role.findUnique({ where: { name: 'Super Admin' } }))

  if (superAdmin) {
    superAdmin = await prisma.role.update({
      where: { id: superAdmin.id },
      data:  { isSystem: true },
    })
  } else {
    superAdmin = await prisma.role.create({
      data: {
        name:        'Super Admin',
        code:        'SUPER_ADMIN',
        description: 'Accès total à toutes les fonctionnalités',
        isSystem:    true,
      },
    })
  }
  console.log(`\n✅ Rôle : ${superAdmin.name} — code ${superAdmin.code} (${superAdmin.id})`)

  for (const resourceId of resourceIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: superAdmin.id, resourceId } },
      update: { specialPermission: 'FULL_ACCESS' },
      create: { roleId: superAdmin.id, resourceId, specialPermission: 'FULL_ACCESS' },
    })
  }
  console.log(`🔑 FULL_ACCESS assigné sur ${resourceIds.length} ressource(s) à Super Admin`)

  console.log('\n────────────────────────────────────')
  console.log('🎉 Seed des permissions terminé.')
  console.log(`📦 Ressources     : ${RESOURCES.length}`)
  console.log('────────────────────────────────────\n')
}

main()
  .catch(e => {
    console.error('❌ Erreur seed permissions :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
