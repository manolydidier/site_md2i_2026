import type { Slide, Stat } from '../types'

export const SLIDES: Slide[] = [
  {
    eyebrow: 'Cabinet IT — Paris 1987 — 54 pays',
    title:
      "Solutions <span style='color:#EF9F27'>digitales</span> pour projets de développement international",
    desc: "Logiciels de gestion financière, conseil et formation pour organisations internationales. Partenaires du FED et de l'UE depuis plus de 35 ans.",
    btns: [
      { label: 'Découvrir SARA', cls: 'primary' },
      { label: 'Nous contacter', cls: 'secondary' },
    ],
    object: 'network',
    color: 0xef9f27,
  },
  {
    eyebrow: 'Logiciels sur mesure',
    title:
      "Développement <span style='color:#EF9F27'>applicatif</span> et systèmes d'information",
    desc: 'Architectures cloud, microservices et APIs REST. De la conception au déploiement, nous construisons des solutions robustes et scalables.',
    btns: [
      { label: 'Nos solutions', cls: 'primary' },
      { label: 'Voir le portfolio', cls: 'secondary' },
    ],
    object: 'cube',
    color: 0x4fa3e0,
  },
  {
    eyebrow: 'Cybersécurité & Infrastructure',
    title:
      "Protégez vos données avec une <span style='color:#EF9F27'>expertise</span> reconnue",
    desc: "Audit de sécurité, mise en conformité RGPD, et infrastructure haute disponibilité. Votre système d'information entre de bonnes mains.",
    btns: [
      { label: 'Audit gratuit', cls: 'primary' },
      { label: 'En savoir plus', cls: 'secondary' },
    ],
    object: 'shield',
    color: 0x3dd68c,
  },
  {
    eyebrow: 'Formation & Conseil',
    title:
      "Montée en compétences <span style='color:#EF9F27'>digitale</span> de vos équipes",
    desc: 'Programmes de formation sur mesure, coaching agile et accompagnement transformation digitale. 54 pays, 3 langues, une expertise unique.',
    btns: [
      { label: 'Nos formations', cls: 'primary' },
      { label: 'Contactez-nous', cls: 'secondary' },
    ],
    object: 'dna',
    color: 0xb06ae0,
  },
]

export const STATS: Stat[] = [
  { value: 54, suffix: '', label: 'pays' },
  { value: 35, suffix: '+', label: "ans d'expérience" },
  { value: 3, suffix: '', label: 'langues' },
  { value: 100, suffix: '+', label: 'projets livrés' },
]