// prisma/grant-role.ts
// Assigne un rôle à un utilisateur par email — utile pour amorcer le système
// de permissions (le tout premier compte doit recevoir SUPER_ADMIN via ce
// script, puisque sans rôle il n'a accès à aucune page pour se l'attribuer
// lui-même dans l'UI).
//
// Usage : npm run grant-role -- son.email@exemple.com [CODE_ROLE]
//   CODE_ROLE est optionnel, par défaut SUPER_ADMIN

import { prisma } from '../src/app/lib/prisma'

async function main() {
  const [email, roleCode = 'SUPER_ADMIN'] = process.argv.slice(2)

  if (!email) {
    console.error('Usage: npm run grant-role -- <email> [CODE_ROLE]')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`❌ Aucun utilisateur avec l'email "${email}"`)
    process.exit(1)
  }

  const role =
    (await prisma.role.findUnique({ where: { code: roleCode } })) ??
    (roleCode === 'SUPER_ADMIN' ? await prisma.role.findUnique({ where: { name: 'Super Admin' } }) : null)

  if (!role) {
    console.error(`❌ Aucun rôle avec le code "${roleCode}" (lancez d'abord: npm run seed:permissions)`)
    process.exit(1)
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })

  console.log(`✅ Rôle "${role.name}" (${role.code}) assigné à ${user.email}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
