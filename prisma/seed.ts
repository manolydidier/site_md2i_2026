import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma   = new PrismaClient({ adapter })

// ─── Ressources à créer (correspond aux codes dans permission_resources) ───────
const RESOURCES = [
  { name: 'Utilisateurs',  code: 'users' },
  { name: 'Rôles',         code: 'roles' },
  { name: 'Pages',         code: 'pages' },
  { name: 'Articles',      code: 'posts' },
  { name: 'Portfolio',     code: 'projects' },
  { name: 'Produits',      code: 'products' },
  { name: 'Messages',      code: 'messages' },
  { name: 'Catégories',    code: 'categories' },
  { name: 'Tags',          code: 'tags' },
  { name: 'Audit',         code: 'audit_logs' },
]

async function main() {
  console.log('🌱 Démarrage du seeder…\n')

  // ── 1. Hasher le mot de passe ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@2026!', 12)

  // ── 2. Créer / mettre à jour l'utilisateur admin ───────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: 'superadmin@md2i.com' },
    update: { status: 'ACTIVE', emailVerified: true },
    create: {
      email:         'superadmin@md2i.com',
      username:      'superadmin',
      passwordHash,
      firstName:     'Admin',
      lastName:      'MD2I',
      status:        'ACTIVE',
      emailVerified: true,
    },
  })
  console.log('✅ Utilisateur :', admin.email)

  // ── 3. Créer les ressources de permissions ─────────────────────────────────
  const resourceMap: Record<string, string> = {}

  for (const res of RESOURCES) {
    const resource = await prisma.permissionResource.upsert({
      where:  { code: res.code },
      update: { name: res.name, isActive: true },
      create: { name: res.name, code: res.code, isActive: true },
    })
    resourceMap[res.code] = resource.id
    console.log(`   📦 Ressource : ${res.code} (${resource.id})`)
  }

  // ── 4. Créer le rôle SuperAdmin ────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where:  { code: 'super_admin' },
    update: { name: 'Super Admin' },
    create: {
      name:        'Super Admin',
      code:        'super_admin',
      description: 'Accès total à toutes les fonctionnalités',
      isSystem:    true,
    },
  })
  console.log(`\n✅ Rôle : ${superAdminRole.name} (${superAdminRole.id})`)

  // ── 5. Assigner TOUTES les permissions à SuperAdmin ────────────────────────
  for (const res of RESOURCES) {
    const resourceId = resourceMap[res.code]

    await prisma.rolePermission.upsert({
      where: {
        roleId_resourceId: {
          roleId:     superAdminRole.id,
          resourceId,
        },
      },
      update: {
        canRead:           true,
        canCreate:         true,
        canUpdate:         true,
        canDelete:         true,
        canList:           true,
        canExport:         true,
        canApprove:        true,
        canManage:         true,
        specialPermission: 'FULL_ACCESS',
      },
      create: {
        roleId:            superAdminRole.id,
        resourceId,
        canRead:           true,
        canCreate:         true,
        canUpdate:         true,
        canDelete:         true,
        canList:           true,
        canExport:         true,
        canApprove:        true,
        canManage:         true,
        specialPermission: 'FULL_ACCESS',
      },
    })
    console.log(`   🔑 Permission FULL_ACCESS → ${res.code}`)
  }

  // ── 6. Assigner le rôle SuperAdmin à l'utilisateur admin ──────────────────
  const existingRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
  })

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    })
    console.log(`\n✅ Rôle SuperAdmin assigné à ${admin.email}`)
  } else {
    console.log(`\nℹ️  Rôle déjà assigné à ${admin.email}`)
  }

  // ── 7. Récapitulatif ───────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────')
  console.log('🎉 Seeder terminé avec succès !')
  console.log('────────────────────────────────────')
  console.log(`📧 Email    : admin@md2i.com`)
  console.log(`🔒 Password : Admin@2026!`)
  console.log(`👑 Rôle     : Super Admin (FULL_ACCESS)`)
  console.log('────────────────────────────────────\n')
}

main()
  .catch(e => {
    console.error('❌ Erreur seeder :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())