// app/(public)/services/page.tsx
// ⚠️  PAS de 'use client' ici — Server Component par défaut
// La PublicNavbar vient automatiquement de app/(public)/layout.tsx

import ServiceCard from './page'

const SERVICES = [
  {
    icon: '⚡',
    badge: 'Nouveau',
    title: 'Développement applicatif',
    description: 'Architectures cloud, microservices et APIs REST. De la conception au déploiement, nous construisons des solutions robustes et scalables.',
    tags: ['Cloud', 'API REST', 'Microservices'],
    cta: 'Découvrir',
    href: '/services/developpement',
  },
  {
    icon: '🛡️',
    badge: 'Pro',
    badgeColor: '#3dd68c',
    title: 'Cybersécurité & Infrastructure',
    description: "Audit de sécurité, mise en conformité RGPD et infrastructure haute disponibilité. Votre SI entre de bonnes mains.",
    tags: ['RGPD', 'Audit', 'Haute dispo'],
    cta: 'Audit gratuit',
    href: '/services/cybersecurite',
  },
  {
    icon: '📊',
    title: 'Gestion financière SARA',
    description: "Logiciels de gestion financière pour organisations internationales. Partenaires du FED et de l'UE depuis plus de 35 ans.",
    tags: ['FED', 'UE', '54 pays'],
    cta: 'En savoir plus',
    href: '/services/sara',
  },
  {
    icon: '🎓',
    badge: '54 pays',
    badgeColor: '#4fa3e0',
    title: 'Formation & Conseil',
    description: 'Programmes de formation sur mesure, coaching agile et accompagnement transformation digitale.',
    tags: ['Agile', 'Formation', 'Conseil'],
    cta: 'Voir les formations',
    href: '/services/formation',
  },
]

export default function ServicesPage() {
  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 'clamp(28px, 4vw, 48px)',
        marginBottom: '3rem',
      }}>
        Nos services
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {SERVICES.map((service, i) => (
          <ServiceCard key={service.href} {...service} index={i} />
        ))}
      </div>
    </main>
  )
}