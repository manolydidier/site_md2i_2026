import type { TFunction } from 'i18next'
import type { Slide } from '../types'

function translateText(t: TFunction | undefined, key: string, defaultValue: string) {
  return t ? String(t(key, { defaultValue })) : defaultValue
}

function feature(
  t: TFunction | undefined,
  key: string,
  title: string,
  text: string
) {
  return {
    title: translateText(t, `homeHero.features.${key}.title`, title),
    text: translateText(t, `homeHero.features.${key}.text`, text),
  }
}

export function getFeatureContent(slide: Slide, t?: TFunction) {
  switch (slide.object) {
    case 'network':
      return {
        tl: feature(t, 'network.tl', 'Couverture internationale', 'Déploiement de solutions digitales pour projets et institutions sur plusieurs territoires.'),
        tr: feature(t, 'network.tr', 'Interopérabilité', 'Systèmes connectés, échanges de données et intégration fluide avec vos outils existants.'),
        bl: feature(t, 'network.bl', 'Pilotage financier', 'Suivi, reporting et gestion structurée pour environnements complexes et multi-acteurs.'),
        br: feature(t, 'network.br', 'Accompagnement', "Conseil, formation et assistance pour sécuriser l'adoption et la montée en charge."),
      }

    case 'cube':
      return {
        tl: feature(t, 'cube.tl', 'Architecture scalable', 'Conception de plateformes robustes, prêtes pour la croissance et les fortes charges.'),
        tr: feature(t, 'cube.tr', 'APIs & microservices', 'Découpage modulaire, maintenance simplifiée et intégration rapide entre services.'),
        bl: feature(t, 'cube.bl', 'Performance', 'Temps de réponse optimisés et expérience fluide sur web, mobile et systèmes métiers.'),
        br: feature(t, 'cube.br', 'Déploiement maîtrisé', 'De la conception au passage en production avec une approche sécurisée et progressive.'),
      }

    case 'shield':
      return {
        tl: feature(t, 'shield.tl', 'Protection des données', 'Mesures de sécurité renforcées pour protéger les flux critiques et les informations sensibles.'),
        tr: feature(t, 'shield.tr', 'Audit & conformité', 'Évaluation des risques, recommandations et mise en conformité adaptée à votre contexte.'),
        bl: feature(t, 'shield.bl', 'Haute disponibilité', 'Infrastructure pensée pour la continuité de service et la résilience opérationnelle.'),
        br: feature(t, 'shield.br', 'Supervision', "Surveillance, alerting et contrôle de l'intégrité de votre système d'information."),
      }

    case 'dna':
      return {
        tl: feature(t, 'dna.tl', 'Formation sur mesure', 'Programmes adaptés aux métiers, au niveau des équipes et aux objectifs de transformation.'),
        tr: feature(t, 'dna.tr', 'Coaching opérationnel', "Accompagnement concret pour accélérer l'appropriation des outils et méthodes digitales."),
        bl: feature(t, 'dna.bl', 'Montée en compétences', "Approche progressive pour renforcer durablement l'autonomie des équipes."),
        br: feature(t, 'dna.br', 'Transformation durable', 'Vision, méthode et suivi pour inscrire le changement dans le temps.'),
      }

    default:
      return {
        tl: { title: '', text: '' },
        tr: { title: '', text: '' },
        bl: { title: '', text: '' },
        br: { title: '', text: '' },
      }
  }
}
