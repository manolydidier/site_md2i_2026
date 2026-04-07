'use client'

import s from './ProductsSection.module.css'

const products = [
  {
    name: 'SARA PAIE',
    category: 'Gestion de la paie',
    desc: 'Solution dédiée à la gestion de la paie, au suivi du personnel et à la fiabilité des traitements administratifs.',
    tag: 'Ressources humaines',
  },
  {
    name: 'SARA FED DP ULTIMATE',
    category: 'Gestion de projets FED',
    desc: 'Logiciel conçu pour le suivi financier, administratif et opérationnel des projets FED multi-bailleurs et multi-projets.',
    tag: 'Projet & finances',
  },
  {
    name: 'SARA FED ON ULTIMATE',
    category: 'Ordonnateur national',
    desc: 'Outil structuré pour le pilotage, le suivi budgétaire et la consolidation des opérations liées aux conventions.',
    tag: 'Pilotage',
  },
  {
    name: 'SARA NSA',
    category: 'Subventions',
    desc: 'Application orientée gestion, suivi et contrôle des subventions avec une logique de traçabilité et de conformité.',
    tag: 'Subventions',
  },
  {
    name: 'LUGAF',
    category: 'Gestion financière',
    desc: 'Solution de gestion financière, comptable et administrative conçue pour les institutions et projets de développement.',
    tag: 'Finance',
  },
  {
    name: 'Plan de passation des marchés',
    category: 'Procurement',
    desc: 'Module de planification et de suivi des marchés pour une exécution plus claire, structurée et conforme.',
    tag: 'Marchés',
  },
  {
    name: '3S',
    category: 'Suivi des subventions',
    desc: 'Système dédié au suivi structuré des subventions, des engagements et des principaux jalons de gestion.',
    tag: 'Suivi',
  },
  {
    name: 'SARA M&E',
    category: 'Monitoring & Evaluation',
    desc: 'Outil complet de suivi-évaluation avec indicateurs, résultats, budget, calendrier et logique de reporting.',
    tag: 'M&E',
  },
  {
    name: 'SARA AT',
    category: 'Assistance technique',
    desc: 'Solution pensée pour accompagner les activités d’assistance technique, de coordination et de suivi opérationnel.',
    tag: 'Assistance',
  },
]

export default function ProductsSection() {
  return (
    <section className={s.section} id="produits" aria-labelledby="products-title">
      <div className={s.gridBg} aria-hidden="true" />

      <div className={s.wrap}>
        <header className={s.head}>
          <div className={s.headLeft}>
            <span className={s.eyebrow}>
              <span className={s.eyebrowDot} />
              Produits
            </span>

            <h2 className={s.title} id="products-title">
              Notre gamme de <em>logiciels</em>
            </h2>

            <p className={s.lead}>
              Des solutions conçues pour la gestion de projets, le suivi financier,
              l’administration, le suivi-évaluation et l’accompagnement des institutions
              et programmes de développement.
            </p>
          </div>

          <div className={s.headRight}>
            <div className={s.statCard}>
              <span className={s.statNum}>9</span>
              <span className={s.statLabel}>solutions clés</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>SARA</span>
              <span className={s.statLabel}>gamme principale</span>
            </div>
          </div>
        </header>

        <div className={s.productsGrid}>
          {products.map((product, index) => (
            <article key={product.name} className={s.card} style={{ animationDelay: `${index * 60}ms` }}>
              <div className={s.cardTop}>
                <span className={s.badge}>{product.tag}</span>
                <span className={s.index}>{String(index + 1).padStart(2, '0')}</span>
              </div>

              <div className={s.cardBody}>
                <p className={s.category}>{product.category}</p>
                <h3 className={s.cardTitle}>{product.name}</h3>
                <p className={s.desc}>{product.desc}</p>
              </div>

              <div className={s.cardFooter}>
                <button className={s.ghostBtn}>Voir le produit</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}