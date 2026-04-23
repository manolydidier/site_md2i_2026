import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './apropos.module.css'
import ContactPage from '../contact/contact'

export const metadata: Metadata = {
  title: 'À propos | MD2I',
  description:
    "MD2I accompagne les projets de développement avec des solutions logicielles, de l'expertise métier et un appui durable sur le terrain.",
}

const keyFigures = [
  {
    value: '1987',
    label: 'année de création',
    text: 'MD2I a été fondé à Paris avec une spécialisation forte en gestion et évaluation des projets de développement.',
  },
  {
    value: '54',
    label: 'pays et ensembles régionaux',
    text: 'Le cabinet est intervenu sur les cinq continents dans des contextes institutionnels variés.',
  },
  {
    value: '3',
    label: 'langues de travail',
    text: 'Les missions, formations et échanges sont conduits en français, en anglais et en portugais.',
  },
  {
    value: '2',
    label: 'implantations',
    text: 'Un ancrage historique à Paris et une présence opérationnelle à Antananarivo.',
  },
]

const history = [
  {
    year: '1987',
    title: 'Création du cabinet',
    text:
      "MD2I est créé à Paris par des spécialistes de l’ingénierie, de l’économie et de la gestion de projets de développement.",
  },
  {
    year: 'Croissance',
    title: 'Structuration de solutions métiers',
    text:
      "Le cabinet conçoit des outils dédiés à la gestion, au suivi et à l’évaluation des projets, en lien avec les exigences de ses partenaires.",
  },
  {
    year: 'International',
    title: 'Déploiement sur plusieurs continents',
    text:
      "Les solutions et l’accompagnement de MD2I sont mobilisés dans de nombreux pays, avec une forte capacité d’adaptation aux réalités de terrain.",
  },
  {
    year: "Aujourd'hui",
    title: 'Appui durable et évolution continue',
    text:
      "MD2I poursuit le développement de ses outils, assure la maintenance, accompagne les utilisateurs et renforce la qualité de ses livrables.",
  },
]

const teamMembers = [
  {
    name: 'Direction générale',
    role: 'Pilotage stratégique',
    domain: 'Vision institutionnelle, coordination générale, partenariats',
    email: 'direction@md2i.com',
    phone: '+261 34 00 000 00',
    location: 'Antananarivo / Paris',
    bio:
      "Coordonne les orientations du cabinet, les partenariats institutionnels et le développement global des activités.",
    initials: 'DG',
  },
  {
    name: 'Analyse & R&D',
    role: 'Modélisation et innovation',
    domain: 'Analyse fonctionnelle, structuration des besoins, recherche appliquée',
    email: 'analyse@md2i.com',
    phone: '+261 34 00 000 01',
    location: 'Antananarivo',
    bio:
      "Structure les besoins, formalise les processus, conduit l’analyse fonctionnelle et accompagne l’évolution des solutions métiers.",
    initials: 'AR',
  },
  {
    name: 'Développement logiciel',
    role: 'Conception et réalisation',
    domain: 'Architecture technique, développement, maintenance évolutive',
    email: 'dev@md2i.com',
    phone: '+261 34 00 000 02',
    location: 'Antananarivo',
    bio:
      "Assure l’architecture technique, le développement des applications et la robustesse des livrables produits par le cabinet.",
    initials: 'DL',
  },
  {
    name: 'Formation & support',
    role: 'Accompagnement des utilisateurs',
    domain: 'Formation, assistance, support opérationnel',
    email: 'support@md2i.com',
    phone: '+261 34 00 000 03',
    location: 'Antananarivo',
    bio:
      "Organise les formations, coordonne l’assistance et facilite l’appropriation opérationnelle des outils sur le terrain.",
    initials: 'FS',
  },
]

const teamUnits = [
  {
    title: 'Développement commercial, formation et maintenance produit',
    subtitle: 'Relations partenaires et accompagnement des utilisateurs',
    points: [
      'Suivi des relations avec les bailleurs, institutions et équipes projet.',
      'Organisation des formations et de la prise en main des outils.',
      'Assistance opérationnelle et maintenance produit.',
      'Réactivité dans le traitement des besoins utilisateurs.',
    ],
  },
  {
    title: 'Recherche, développement et analyse',
    subtitle: 'Conception, modélisation et veille',
    points: [
      'Recherche et développement en ingénierie logicielle.',
      'Modélisation de processus conformes aux procédures des partenaires.',
      'Veille technologique et réglementaire.',
      'Structuration de bases de données et formalisation de cahiers des charges.',
    ],
  },
  {
    title: 'Développement logiciel',
    subtitle: 'Ingénierie et production',
    points: [
      'Conception et développement des applications métiers du cabinet.',
      'Mise en œuvre de solutions robustes, évolutives et adaptées au terrain.',
      'Mobilisation de profils techniques expérimentés.',
      'Amélioration continue des performances et de la fiabilité des outils.',
    ],
  },
  {
    title: 'Tests et assurance qualité',
    subtitle: 'Fiabilité, cohérence et conformité',
    points: [
      'Tests fonctionnels et de convivialité.',
      'Vérification de la cohérence des données et des sorties produites.',
      'Contrôle de compatibilité avec différents environnements.',
      'Validation du respect des exigences fonctionnelles et qualité.',
    ],
  },
]

const commitments = [
  {
    title: 'Compréhension métier',
    text:
      "Chaque solution est conçue à partir des contraintes réelles de gestion, de suivi et d’évaluation des projets.",
  },
  {
    title: 'Outils durables',
    text:
      "MD2I privilégie des solutions fiables, maintenables et réellement utilisables par les équipes dans le temps.",
  },
  {
    title: 'Transfert de compétences',
    text:
      "La formation et l’accompagnement font partie intégrante de la réussite des déploiements.",
  },
  {
    title: 'Proximité opérationnelle',
    text:
      "Le cabinet combine vision stratégique et capacité d’appui concret auprès des utilisateurs.",
  },
]

const principles = [
  'Rigueur méthodologique',
  'Compréhension du terrain',
  'Qualité des livrables',
  'Évolution continue',
  'Proximité avec les utilisateurs',
  'Fiabilité opérationnelle',
]

const offices = [
  {
    title: 'Paris',
    text:
      "Ville d’ancrage historique du cabinet depuis sa création, au cœur de son développement institutionnel et stratégique.",
  },
  {
    title: 'Antananarivo',
    text:
      "Bureau technique et opérationnel permettant d’assurer proximité, réactivité et accompagnement au plus près des besoins.",
  },
]

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroShell}>
            <div className={styles.heroMain}>
              <span className={styles.badge}>Le cabinet MD2I</span>

              <h1 className={styles.heroTitle}>
                Une présence discrète dans la forme,
                <br />
                solide dans l’exécution
              </h1>

              <p className={styles.heroText}>
                Depuis 1987, MD2I conçoit et déploie des solutions logicielles,
                des méthodes et des dispositifs d’accompagnement dédiés à la
                gestion, au suivi et à l’évaluation des projets de développement.
                Le cabinet agit avec une priorité constante : produire des outils
                clairs, robustes et durables, réellement utiles aux équipes.
              </p>

              <div className={styles.heroActions}>
                <Link href="/portfolio" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Voir nos références
                </Link>
                <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>
                  Nous contacter
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <div className={styles.heroPanelIntro}>
                <span className={styles.heroPanelLabel}>Coordination</span>
                <p>
                  Une organisation resserrée, des pôles identifiés et des points
                  de contact directs pour chaque besoin métier.
                </p>
              </div>

              <div className={styles.heroMetrics}>
                <div>
                  <strong>1987</strong>
                  <span>Création du cabinet</span>
                </div>
                <div>
                  <strong>54</strong>
                  <span>Pays et ensembles régionaux</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>Implantations principales</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>Repères clés</span>
            <h2>Quelques chiffres pour situer MD2I</h2>
            <p>
              Une lecture rapide des repères qui traduisent l’ancienneté,
              l’ouverture internationale et la capacité d’intervention du cabinet.
            </p>
          </div>

          <div className={styles.statsGrid}>
            {keyFigures.map((item) => (
              <article key={item.label} className={styles.statCard}>
                <div className={styles.statValue}>{item.value}</div>
                <div className={styles.statLabel}>{item.label}</div>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <div className={styles.editorialBand}>
            <div>
              <span className={styles.sectionKicker}>Positionnement</span>
              <h2>Des outils utiles, une méthode lisible, un accompagnement durable</h2>
            </div>
            <p>
              MD2I privilégie une approche sobre : limiter la complexité visuelle,
              clarifier les usages et concentrer l’effort sur la qualité des
              processus, la fiabilité des données et la continuité du support.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>Historique</span>
            <h2>Une trajectoire construite dans la durée</h2>
            <p>
              L’évolution du cabinet reflète une continuité claire : expertise
              métier, développement d’outils, ouverture internationale et appui
              durable aux utilisateurs.
            </p>
          </div>

          <div className={styles.timeline}>
            {history.map((item, index) => (
              <article key={item.title} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>{index + 1}</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineYear}>{item.year}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>L’équipe</span>
            <h2>Les équipes, leurs domaines et leurs coordonnées</h2>
            <p>
              Chaque carte présente un domaine d’intervention, un rôle clair et
              des coordonnées directes pour orienter rapidement les demandes.
            </p>
          </div>

          <div className={styles.membersGrid}>
            {teamMembers.map((member) => (
              <article key={member.name + member.role} className={styles.memberCard}>
                <div className={styles.memberTop}>
                  <div className={styles.memberAvatar}>{member.initials}</div>
                  <div className={styles.memberHeading}>
                    <h3>{member.name}</h3>
                    <p className={styles.memberRole}>{member.role}</p>
                    <span className={styles.memberTag}>{member.domain}</span>
                  </div>
                </div>

                <p className={styles.memberBio}>{member.bio}</p>

                <div className={styles.memberMeta}>
                  <div>
                    <span>Email</span>
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  </div>
                  <div>
                    <span>Téléphone</span>
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`}>{member.phone}</a>
                  </div>
                  <div>
                    <span>Localisation</span>
                    <strong>{member.location}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>Organisation</span>
            <h2>Une structure pensée pour couvrir tout le cycle d’intervention</h2>
            <p>
              Le cabinet articule plusieurs pôles complémentaires afin de relier
              conception, développement, qualité, formation et maintenance.
            </p>
          </div>

          <div className={styles.teamGrid}>
            {teamUnits.map((unit) => (
              <article key={unit.title} className={styles.teamCard}>
                <div className={styles.teamCardTop}>
                  <h3>{unit.title}</h3>
                  <p className={styles.teamSubtitle}>{unit.subtitle}</p>
                </div>
                <ul className={styles.teamList}>
                  {unit.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>Notre approche</span>
            <h2>Ce qui guide notre manière d’intervenir</h2>
            <p>
              Au-delà des outils, MD2I défend une méthode de travail fondée sur
              la compréhension des usages, la qualité d’exécution et la
              continuité de l’accompagnement.
            </p>
          </div>

          <div className={styles.commitmentGrid}>
            {commitments.map((item) => (
              <article key={item.title} className={styles.commitmentCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <span className={styles.sectionKicker}>Implantation</span>
              <h2>Un ancrage historique et une présence opérationnelle</h2>

              <div className={styles.officeGrid}>
                {offices.map((office) => (
                  <div key={office.title} className={styles.officeCard}>
                    <h3>{office.title}</h3>
                    <p>{office.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <span className={styles.sectionKicker}>Principes</span>
              <h2>Les standards que nous nous imposons</h2>

              <div className={styles.pillWrap}>
                {principles.map((item) => (
                  <span key={item} className={styles.pill}>
                    {item}
                  </span>
                ))}
              </div>

              <p className={styles.panelNote}>
                Cette exigence se retrouve dans la conception des outils,
                l’accompagnement des utilisateurs et la qualité des livrables.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <span className={styles.sectionKicker}>Aller plus loin</span>
            <h2>Un besoin précis ? Contactez directement le bon interlocuteur</h2>
            <p>
              Retrouvez la page Contact pour écrire au cabinet, obtenir une
              démonstration, demander une présentation ou être mis en relation
              avec l’équipe la plus adaptée.
            </p>

            <div className={styles.heroActions}>
              <Link href="/contact" className={`${styles.btn} ${styles.btnPrimary}`}>
                Aller à la page contact
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ContactPage/>
    </main>
  )
}
