import type { Slide } from '../types'

export function getFeatureContent(slide: Slide) {
  switch (slide.object) {
    case 'network':
      return {
        tl: { title: 'Couverture internationale', text: 'Déploiement de solutions digitales pour projets et institutions sur plusieurs territoires.' },
        tr: { title: 'Interopérabilité', text: 'Systèmes connectés, échanges de données et intégration fluide avec vos outils existants.' },
        bl: { title: 'Pilotage financier', text: 'Suivi, reporting et gestion structurée pour environnements complexes et multi-acteurs.' },
        br: { title: 'Accompagnement', text: "Conseil, formation et assistance pour sécuriser l'adoption et la montée en charge." },
      }

    case 'cube':
      return {
        tl: { title: 'Architecture scalable', text: 'Conception de plateformes robustes, prêtes pour la croissance et les fortes charges.' },
        tr: { title: 'APIs & microservices', text: 'Découpage modulaire, maintenance simplifiée et intégration rapide entre services.' },
        bl: { title: 'Performance', text: 'Temps de réponse optimisés et expérience fluide sur web, mobile et systèmes métiers.' },
        br: { title: 'Déploiement maîtrisé', text: 'De la conception au passage en production avec une approche sécurisée et progressive.' },
      }

    case 'shield':
      return {
        tl: { title: 'Protection des données', text: 'Mesures de sécurité renforcées pour protéger les flux critiques et les informations sensibles.' },
        tr: { title: 'Audit & conformité', text: 'Évaluation des risques, recommandations et mise en conformité adaptée à votre contexte.' },
        bl: { title: 'Haute disponibilité', text: 'Infrastructure pensée pour la continuité de service et la résilience opérationnelle.' },
        br: { title: 'Supervision', text: "Surveillance, alerting et contrôle de l'intégrité de votre système d'information." },
      }

    case 'dna':
      return {
        tl: { title: 'Formation sur mesure', text: 'Programmes adaptés aux métiers, au niveau des équipes et aux objectifs de transformation.' },
        tr: { title: 'Coaching opérationnel', text: "Accompagnement concret pour accélérer l'appropriation des outils et méthodes digitales." },
        bl: { title: 'Montée en compétences', text: "Approche progressive pour renforcer durablement l'autonomie des équipes." },
        br: { title: 'Transformation durable', text: 'Vision, méthode et suivi pour inscrire le changement dans le temps.' },
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