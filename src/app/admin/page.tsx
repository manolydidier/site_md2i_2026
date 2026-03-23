import Link from 'next/link'
import { auth } from '../../auth'
import { prisma } from '@/app/lib/prisma'

export default async function AdminDashboard() {
  const session = await auth()

  const [
    userCount,
    postCount,
    projectCount,
    productCount,
    messageCount,
    recentMessages,
    recentPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.project.count(),
    prisma.product.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    }),
  ])

  const stats = [
    {
      label: 'Utilisateurs',
      value: userCount,
      icon: '👤',
      description: 'Comptes enregistrés',
    },
    {
      label: 'Articles',
      value: postCount,
      icon: '📰',
      description: 'Publications du blog',
    },
    {
      label: 'Projets',
      value: projectCount,
      icon: '📁',
      description: 'Projets publiés',
    },
    {
      label: 'Produits',
      value: productCount,
      icon: '🛍️',
      description: 'Articles du catalogue',
    },
    {
      label: 'Messages',
      value: messageCount,
      icon: '✉️',
      description: 'Messages reçus',
    },
  ]

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <section
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  margin: '0 0 10px',
                  letterSpacing: '-0.02em',
                }}
              >
                Dashboard Admin
              </h1>
              <p
                style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                }}
              >
                Bonjour, <strong>{session?.user?.name || 'Administrateur'}</strong>. Voici un aperçu global de la plateforme.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/admin/posts/new"
                style={{
                  textDecoration: 'none',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                + Nouvel article
              </Link>

              <Link
                href="/admin/projects/new"
                style={{
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                + Nouveau projet
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '0 0 6px',
                    }}
                  >
                    {stat.label}
                  </p>
                  <h2
                    style={{
                      fontSize: '30px',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    {stat.value}
                  </h2>
                </div>

                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {stat.icon}
                </div>
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  margin: 0,
                }}
              >
                {stat.description}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '16px',
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 4px',
                  }}
                >
                  Messages récents
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    margin: 0,
                  }}
                >
                  Derniers messages envoyés via le formulaire de contact
                </p>
              </div>

              <Link
                href="/admin/messages"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                }}
              >
                Voir tout
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '14px',
                      background: '#fcfcfd',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '6px',
                      }}
                    >
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                        {message.name}
                      </strong>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '0 0 6px',
                        color: '#334155',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {message.subject || 'Sans objet'}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '13px',
                      }}
                    >
                      {message.email}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', margin: 0 }}>Aucun message récent.</p>
              )}
            </div>
          </div>

          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 4px',
                }}
              >
                Actions rapides
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  margin: 0,
                }}
              >
                Accès direct aux sections importantes
              </p>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <Link href="/admin/users" style={quickLinkStyle}>
                Gérer les utilisateurs
              </Link>
              <Link href="/admin/posts" style={quickLinkStyle}>
                Gérer les articles
              </Link>
              <Link href="/admin/projects" style={quickLinkStyle}>
                Gérer les projets
              </Link>
              <Link href="/admin/products" style={quickLinkStyle}>
                Gérer les produits
              </Link>
              <Link href="/admin/messages" style={quickLinkStyle}>
                Voir les messages
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 16px',
              }}
            >
              Derniers articles
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #eef2f7',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: '0 0 4px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {post.title}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <Link
                      href={`/admin/posts/${post.id}`}
                      style={{
                        fontSize: '13px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ouvrir
                    </Link>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', margin: 0 }}>Aucun article récent.</p>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 16px',
              }}
            >
              Résumé global
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <SummaryRow label="Total contenu publié" value={postCount + projectCount + productCount} />
              <SummaryRow label="Total interactions" value={messageCount} />
              <SummaryRow label="Base utilisateurs" value={userCount} />
              <SummaryRow label="Éléments catalogue" value={productCount} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px',
        borderRadius: '12px',
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
      }}
    >
      <span style={{ fontSize: '14px', color: '#475569' }}>{label}</span>
      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{value}</strong>
    </div>
  )
}

const quickLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 600,
  fontSize: '14px',
}