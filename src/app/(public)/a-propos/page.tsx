import type { Metadata } from 'next'
import Link from 'next/link'
import { T } from '@/app/i18n/T'
import styles from './apropos.module.css'

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
              <span className={styles.badge}>
                <T k="aboutPage.heroBadge">Le cabinet MD2I</T>
              </span>

              <h1 className={styles.heroTitle}>
                <T k="aboutPage.heroTitleLine1">
                  Une présence discrète dans la forme,
                </T>
                <br />
                <T k="aboutPage.heroTitleLine2">
                  solide dans l’exécution
                </T>
              </h1>

              <p className={styles.heroText}>
                <T k="aboutPage.heroText">
                  Depuis 1987, MD2I conçoit et déploie des solutions
                  logicielles, des méthodes et des dispositifs
                  d’accompagnement dédiés à la gestion, au suivi et à
                  l’évaluation des projets de développement. Le cabinet agit
                  avec une priorité constante : produire des outils clairs,
                  robustes et durables, réellement utiles aux équipes.
                </T>
              </p>

              <div className={styles.heroActions}>
                <Link href="/portfolio" className={`${styles.btn} ${styles.btnPrimary}`}>
                  <T k="aboutPage.referencesCta">Voir nos références</T>
                </Link>
                <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>
                  <T k="aboutPage.contactCta">Nous contacter</T>
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <div className={styles.heroPanelIntro}>
                <span className={styles.heroPanelLabel}>
                  <T k="aboutPage.panelLabel">Coordination</T>
                </span>
                <p>
                  <T k="aboutPage.panelText">
                    Une organisation resserrée, des pôles identifiés et des
                    points de contact directs pour chaque besoin métier.
                  </T>
                </p>
              </div>

              <div className={styles.heroMetrics}>
                <div>
                  <strong>1987</strong>
                  <span>
                    <T k="aboutPage.metrics.created">Création du cabinet</T>
                  </span>
                </div>
                <div>
                  <strong>54</strong>
                  <span>
                    <T k="aboutPage.metrics.countries">
                      Pays et ensembles régionaux
                    </T>
                  </span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>
                    <T k="aboutPage.metrics.offices">
                      Implantations principales
                    </T>
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.figuresKicker">Repères clés</T>
            </span>
            <h2>
              <T k="aboutPage.sections.figuresTitle">
                Quelques chiffres pour situer MD2I
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.figuresText">
                Une lecture rapide des repères qui traduisent l’ancienneté,
                l’ouverture internationale et la capacité d’intervention du
                cabinet.
              </T>
            </p>
          </div>

          <div className={styles.statsGrid}>
            {keyFigures.map((item, index) => (
              <article key={item.label} className={styles.statCard}>
                <div className={styles.statValue}>{item.value}</div>
                <div className={styles.statLabel}>
                  <T k={`aboutPage.keyFigures.${index}.label`}>
                    {item.label}
                  </T>
                </div>
                <p>
                  <T k={`aboutPage.keyFigures.${index}.text`}>
                    {item.text}
                  </T>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <div className={styles.editorialBand}>
            <div>
              <span className={styles.sectionKicker}>
                <T k="aboutPage.sections.positioningKicker">Positionnement</T>
              </span>
              <h2>
                <T k="aboutPage.sections.positioningTitle">
                  Des outils utiles, une méthode lisible, un accompagnement
                  durable
                </T>
              </h2>
            </div>
            <p>
              <T k="aboutPage.sections.positioningText">
                MD2I privilégie une approche sobre : limiter la complexité
                visuelle, clarifier les usages et concentrer l’effort sur la
                qualité des processus, la fiabilité des données et la
                continuité du support.
              </T>
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.historyKicker">Historique</T>
            </span>
            <h2>
              <T k="aboutPage.sections.historyTitle">
                Une trajectoire construite dans la durée
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.historyText">
                L’évolution du cabinet reflète une continuité claire :
                expertise métier, développement d’outils, ouverture
                internationale et appui durable aux utilisateurs.
              </T>
            </p>
          </div>

          <div className={styles.timeline}>
            {history.map((item, index) => (
              <article key={item.title} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>{index + 1}</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineYear}>
                    <T k={`aboutPage.history.${index}.year`}>
                      {item.year}
                    </T>
                  </div>
                  <h3>
                    <T k={`aboutPage.history.${index}.title`}>
                      {item.title}
                    </T>
                  </h3>
                  <p>
                    <T k={`aboutPage.history.${index}.text`}>
                      {item.text}
                    </T>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.teamKicker">L’équipe</T>
            </span>
            <h2>
              <T k="aboutPage.sections.teamTitle">
                Les équipes, leurs domaines et leurs coordonnées
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.teamText">
                Chaque carte présente un domaine d’intervention, un rôle clair
                et des coordonnées directes pour orienter rapidement les
                demandes.
              </T>
            </p>
          </div>

          <div className={styles.membersGrid}>
            {teamMembers.map((member, index) => (
              <article key={member.name + member.role} className={styles.memberCard}>
                <div className={styles.memberTop}>
                  <div className={styles.memberAvatar}>{member.initials}</div>
                  <div className={styles.memberHeading}>
                    <h3>
                      <T k={`aboutPage.teamMembers.${index}.name`}>
                        {member.name}
                      </T>
                    </h3>
                    <p className={styles.memberRole}>
                      <T k={`aboutPage.teamMembers.${index}.role`}>
                        {member.role}
                      </T>
                    </p>
                    <span className={styles.memberTag}>
                      <T k={`aboutPage.teamMembers.${index}.domain`}>
                        {member.domain}
                      </T>
                    </span>
                  </div>
                </div>

                <p className={styles.memberBio}>
                  <T k={`aboutPage.teamMembers.${index}.bio`}>
                    {member.bio}
                  </T>
                </p>

                <div className={styles.memberMeta}>
                  <div>
                    <span>
                      <T k="aboutPage.memberMeta.email">Email</T>
                    </span>
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  </div>
                  <div>
                    <span>
                      <T k="aboutPage.memberMeta.phone">Téléphone</T>
                    </span>
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`}>{member.phone}</a>
                  </div>
                  <div>
                    <span>
                      <T k="aboutPage.memberMeta.location">Localisation</T>
                    </span>
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
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.organisationKicker">Organisation</T>
            </span>
            <h2>
              <T k="aboutPage.sections.organisationTitle">
                Une structure pensée pour couvrir tout le cycle d’intervention
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.organisationText">
                Le cabinet articule plusieurs pôles complémentaires afin de
                relier conception, développement, qualité, formation et
                maintenance.
              </T>
            </p>
          </div>

          <div className={styles.teamGrid}>
            {teamUnits.map((unit, unitIndex) => (
              <article key={unit.title} className={styles.teamCard}>
                <div className={styles.teamCardTop}>
                  <h3>
                    <T k={`aboutPage.teamUnits.${unitIndex}.title`}>
                      {unit.title}
                    </T>
                  </h3>
                  <p className={styles.teamSubtitle}>
                    <T k={`aboutPage.teamUnits.${unitIndex}.subtitle`}>
                      {unit.subtitle}
                    </T>
                  </p>
                </div>
                <ul className={styles.teamList}>
                  {unit.points.map((point, pointIndex) => (
                    <li key={point}>
                      <T k={`aboutPage.teamUnits.${unitIndex}.points.${pointIndex}`}>
                        {point}
                      </T>
                    </li>
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
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.approachKicker">Notre approche</T>
            </span>
            <h2>
              <T k="aboutPage.sections.approachTitle">
                Ce qui guide notre manière d’intervenir
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.approachText">
                Au-delà des outils, MD2I défend une méthode de travail fondée
                sur la compréhension des usages, la qualité d’exécution et la
                continuité de l’accompagnement.
              </T>
            </p>
          </div>

          <div className={styles.commitmentGrid}>
            {commitments.map((item, index) => (
              <article key={item.title} className={styles.commitmentCard}>
                <h3>
                  <T k={`aboutPage.commitments.${index}.title`}>
                    {item.title}
                  </T>
                </h3>
                <p>
                  <T k={`aboutPage.commitments.${index}.text`}>
                    {item.text}
                  </T>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <span className={styles.sectionKicker}>
                <T k="aboutPage.sections.locationKicker">Implantation</T>
              </span>
              <h2>
                <T k="aboutPage.sections.locationTitle">
                  Un ancrage historique et une présence opérationnelle
                </T>
              </h2>

              <div className={styles.officeGrid}>
                {offices.map((office, index) => (
                  <div key={office.title} className={styles.officeCard}>
                    <h3>{office.title}</h3>
                    <p>
                      <T k={`aboutPage.offices.${index}.text`}>
                        {office.text}
                      </T>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <span className={styles.sectionKicker}>
                <T k="aboutPage.sections.principlesKicker">Principes</T>
              </span>
              <h2>
                <T k="aboutPage.sections.principlesTitle">
                  Les standards que nous nous imposons
                </T>
              </h2>

              <div className={styles.pillWrap}>
                {principles.map((item, index) => (
                  <span key={item} className={styles.pill}>
                    <T k={`aboutPage.principles.${index}`}>{item}</T>
                  </span>
                ))}
              </div>

              <p className={styles.panelNote}>
                <T k="aboutPage.sections.principlesText">
                  Cette exigence se retrouve dans la conception des outils,
                  l’accompagnement des utilisateurs et la qualité des livrables.
                </T>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <span className={styles.sectionKicker}>
              <T k="aboutPage.sections.ctaKicker">Aller plus loin</T>
            </span>
            <h2>
              <T k="aboutPage.sections.ctaTitle">
                Un besoin précis ? Contactez directement le bon interlocuteur
              </T>
            </h2>
            <p>
              <T k="aboutPage.sections.ctaText">
                Retrouvez la page Contact pour écrire au cabinet, obtenir une
                démonstration, demander une présentation ou être mis en
                relation avec l’équipe la plus adaptée.
              </T>
            </p>

            <div className={styles.heroActions}>
              <Link href="/contact" className={`${styles.btn} ${styles.btnPrimary}`}>
                <T k="aboutPage.sections.ctaButton">
                  Aller à la page contact
                </T>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* <ContactPage/> */}
    </main>
  )
}
