export default function PublicLoading() {
  return (
    <main className="public-loading-shell" aria-label="Chargement de la page">
      <div className="public-loading-card" role="status" aria-live="polite">
        <span className="public-loading-mark" aria-hidden="true" />
        <div>
          <p className="public-loading-kicker">MD2I</p>
          <h1>Chargement en cours</h1>
          <p>Préparation des contenus publics et des informations utiles.</p>
        </div>
      </div>
    </main>
  )
}
