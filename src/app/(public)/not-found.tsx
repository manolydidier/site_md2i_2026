import Link from 'next/link'

export default function PublicNotFound() {
  return (
    <main className="public-not-found-shell">
      <section className="public-not-found-card">
        <p className="public-loading-kicker">404</p>
        <h1>Page introuvable</h1>
        <p>
          La page demandée n’existe pas ou n’est plus disponible. Vous pouvez
          reprendre la navigation depuis l’accueil ou consulter les solutions
          MD2I.
        </p>
        <div className="public-not-found-actions">
          <Link href="/">Retour à l’accueil</Link>
          <Link href="/produits">Voir les produits</Link>
        </div>
      </section>
    </main>
  )
}
