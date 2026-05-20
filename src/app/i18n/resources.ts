import type { Resource } from 'i18next'

export const resources = {
  fr: {
    translation: {
      navbar: {
        brand: {
          tagline: 'Cabinet IT & Solutions digitales',
        },
        links: {
          home: 'Accueil',
          services: 'Services',
          references: 'Références',
          products: 'Produits',
          about: 'À propos',
          contact: 'Contact',
          contactGeneral: 'Contact général',
          contactGeneralDescription: "Écrire à l'équipe MD2I",
          contactCommercial: 'Contact commercial',
          contactCommercialDescription:
            'Demander un devis, une démo ou un rappel',
        },
        search: {
          aria: 'Recherche',
          placeholder: 'Rechercher une page...',
          escape: 'Échap',
          hint: 'Commencez à taper pour chercher dans le site.',
          noResults: 'Aucun résultat pour "{{query}}".',
        },
        theme: {
          light: 'Mode clair',
          dark: 'Mode sombre',
        },
        language: {
          menu: 'Changer de langue',
        },
        mobileMenu: 'Menu mobile',
        navigation: {
          hide: 'Masquer la navigation',
          show: 'Afficher la navigation',
        },
      },
      dynamic: {
        translating: 'Traduction en cours...',
      },
      common: {
        clear: 'Effacer',
        clearAll: 'Tout effacer',
        close: 'Fermer',
        loading: 'Chargement...',
        page: 'Page {{page}} / {{total}}',
        resetFilters: 'Réinitialiser les filtres',
        scrollTop: 'Retour en haut',
      },
      referencePage: {
        toolbar: {
          homeTitle: "Retour à l'accueil",
          home: 'Accueil',
          hideTools: 'Masquer les outils',
          showTools: 'Afficher les outils',
          tools: 'Outils',
        },
        projectCount_one: '{{count}} projet dans ce pays',
        projectCount_other: '{{count}} projets dans ce pays',
        project: {
          previous: 'Projet précédent',
          next: 'Projet suivant',
        },
        display: {
          list: 'Liste',
          cards: 'Cartes',
        },
        list: {
          interventionTitle: "Titre d'intervention",
          interventionType: 'Intervention de type',
          period: 'Période de réalisation',
          description: 'Description',
        },
        actions: {
          viewDetails: 'Voir les détails',
          details: 'Détails',
          similarProject: 'Projet similaire',
          similar: 'Similaire',
          reset: 'Réinitialiser',
          resetAll: 'Réinitialiser tous les filtres',
          wantSimilar: 'Je veux une solution similaire →',
        },
        notifications: {
          loadError: 'Impossible de charger les références publiques.',
          mapRecentered: 'Carte recentrée.',
          resultsAdjusted: 'Vue ajustée aux résultats.',
          filtersReset: 'Filtres réinitialisés.',
          exportSuccess: 'Export CSV réussi.',
          tagAdded: 'Filtre ajouté : #{{tag}}',
        },
        csv: {
          client: 'Client',
          project: 'Projet',
          country: 'Pays',
          category: 'Catégorie',
          date: 'Date',
          impact: 'Impact',
          technologies: 'Technologies',
          excerpt: 'Extrait',
          details: 'Détails',
        },
        hero: {
          kicker: 'Références mondiales',
          title: 'Carte interactive des projets MD2I',
          text:
            'Explorez les références par pays, secteur, technologie et année. Basculez en mode liste pour parcourir les projets plus facilement.',
        },
        listHeader: {
          kicker: 'Références MD2I',
          title: 'Réalisations et projets clients',
          text:
            "Parcourez les références MD2I sous forme de fiches détaillées, proches de l'ancienne présentation, mais avec une interface plus claire et plus moderne.",
        },
        stats: {
          projects: 'Projets',
          countries: 'Pays',
          sectors: 'Secteurs',
          techs: 'Techs',
        },
        activeFilters_one: '{{count}} filtre actif',
        activeFilters_other: '{{count}} filtres actifs',
        empty: {
          filtered: 'Aucune référence ne correspond aux filtres actuels.',
          published: 'Aucune référence publiée trouvée.',
        },
        command: {
          searchPlaceholder:
            'Rechercher un client, pays, projet, technologie...',
          switchList: '☷ Liste',
          switchMap: '🌍 Carte',
          viewResults: '⊙ Voir résultats',
          recenter: '↺ Recentrer',
          filters: '⚙️ Filtres',
          export: '⬇ Export',
        },
        filters: {
          kicker: 'Exploration',
          title: 'Filtres avancés',
          close: 'Fermer les filtres',
          sortBy: 'Trier par',
          categories: 'Catégories',
          technologies: 'Technologies',
          tags: 'Tags',
          years: 'Années',
        },
        sort: {
          date: 'Date',
          impact: 'Impact',
          client: 'Client',
        },
        loading: {
          map: 'Chargement de la carte…',
          references: 'Chargement des références…',
        },
        modal: {
          summary: 'Résumé du projet',
          details: 'Détails de la mission',
          keyInfo: 'Informations clés',
          technologies: 'Technologies utilisées',
          tags: 'Tags',
        },
        metrics: {
          country: 'Pays',
          client: 'Client',
          team: 'Équipe',
          duration: 'Durée',
          budget: 'Budget',
          impact: 'Impact',
        },
      },
      footer: {
        links: [
          'Accueil',
          'Services',
          'Portfolio',
          'Blog',
          'À propos',
          'Contact',
          'Contact commercial',
        ],
        services: [
          'Développement web',
          'Applications mobiles',
          'Conseil IT',
          'Infogérance',
          'Cybersécurité',
          'Formation digitale',
        ],
        brand: {
          tagline: 'Cabinet IT & Solutions digitales',
          availability: 'Disponible pour nouveaux projets',
          description:
            "Nous accompagnons les entreprises dans leur transformation digitale — conseil, développement sur mesure, logiciels métiers et solutions IT innovantes à Madagascar et à l'international.",
        },
        newsletter: {
          title: 'Recevoir les actualités MD2I',
          text:
            "Votre email sera ajouté au CRM comme nouveau contact. Le nom et l'entreprise seront complétés automatiquement si possible.",
          crmContact: 'Contact CRM',
          companyDetected: 'Entreprise détectée : {{company}}',
          adding: 'Ajout en cours...',
          addEmail: 'Ajouter mon email →',
          validation: {
            email: 'Veuillez saisir une adresse email valide.',
          },
          errors: {
            add: "Impossible d'ajouter ce contact.",
            generic: "Erreur pendant l'inscription.",
          },
          success: {
            createdTitle: 'Bienvenue chez MD2I',
            updatedTitle: 'Contact déjà enregistré',
            createdMessage:
              'Votre email a bien été ajouté au CRM. Nous pourrons vous envoyer nos actualités, offres utiles et informations produits.',
            updatedMessage:
              'Ce contact existait déjà dans le CRM. Ses informations ont été complétées et mises à jour.',
          },
        },
        sections: {
          navigation: 'Navigation',
          services: 'Services',
        },
        location: {
          title: 'Localisation MD2I',
          openMaps: 'Ouvrir MD2I dans Google Maps',
          mapTitle: 'Localisation MD2I Madagascar sur Google Maps',
          logoAlt: 'MD2I Madagascar',
          unavailable:
            "La géolocalisation n'est pas disponible sur ce navigateur.",
          detected:
            "Position détectée. Ouverture de l'itinéraire Google Maps.",
          denied:
            'Localisation refusée. Ouverture de Google Maps sans position de départ.',
          locating: 'Localisation...',
          useMyLocation: "Me localiser et ouvrir l'itinéraire",
        },
        legal: {
          rights: '— Tous droits réservés. Conçu avec soin à Madagascar 🇲🇬',
          mentions: 'Mentions légales',
          privacy: 'Confidentialité',
          terms: 'CGU',
        },
      },
      homeHero: {
        slides: [
          {
            eyebrow: 'Cabinet IT — Paris 1987 — 54 pays',
            title:
              "Solutions <span style='color:#EF9F27'>digitales</span> pour projets de développement international",
            desc:
              "Logiciels de gestion financière, conseil et formation pour organisations internationales. Partenaires du FED et de l'UE depuis plus de 35 ans.",
            buttons: ['Découvrir SARA', 'Nous contacter'],
          },
          {
            eyebrow: 'Logiciels sur mesure',
            title:
              "Développement <span style='color:#EF9F27'>applicatif</span> et systèmes d'information",
            desc:
              'Architectures cloud, microservices et APIs REST. De la conception au déploiement, nous construisons des solutions robustes et scalables.',
            buttons: ['Nos solutions', 'Voir le portfolio'],
          },
          {
            eyebrow: 'Cybersécurité & Infrastructure',
            title:
              "Protégez vos données avec une <span style='color:#EF9F27'>expertise</span> reconnue",
            desc:
              "Audit de sécurité, mise en conformité RGPD, et infrastructure haute disponibilité. Votre système d'information entre de bonnes mains.",
            buttons: ['Audit gratuit', 'En savoir plus'],
          },
          {
            eyebrow: 'Formation & Conseil',
            title:
              "Montée en compétences <span style='color:#EF9F27'>digitale</span> de vos équipes",
            desc:
              'Programmes de formation sur mesure, coaching agile et accompagnement transformation digitale. 54 pays, 3 langues, une expertise unique.',
            buttons: ['Nos formations', 'Contactez-nous'],
          },
        ],
        features: {
          network: {
            tl: {
              title: 'Couverture internationale',
              text:
                'Déploiement de solutions digitales pour projets et institutions sur plusieurs territoires.',
            },
            tr: {
              title: 'Interopérabilité',
              text:
                'Systèmes connectés, échanges de données et intégration fluide avec vos outils existants.',
            },
            bl: {
              title: 'Pilotage financier',
              text:
                'Suivi, reporting et gestion structurée pour environnements complexes et multi-acteurs.',
            },
            br: {
              title: 'Accompagnement',
              text:
                "Conseil, formation et assistance pour sécuriser l'adoption et la montée en charge.",
            },
          },
          cube: {
            tl: {
              title: 'Architecture scalable',
              text:
                'Conception de plateformes robustes, prêtes pour la croissance et les fortes charges.',
            },
            tr: {
              title: 'APIs & microservices',
              text:
                'Découpage modulaire, maintenance simplifiée et intégration rapide entre services.',
            },
            bl: {
              title: 'Performance',
              text:
                'Temps de réponse optimisés et expérience fluide sur web, mobile et systèmes métiers.',
            },
            br: {
              title: 'Déploiement maîtrisé',
              text:
                'De la conception au passage en production avec une approche sécurisée et progressive.',
            },
          },
          shield: {
            tl: {
              title: 'Protection des données',
              text:
                'Mesures de sécurité renforcées pour protéger les flux critiques et les informations sensibles.',
            },
            tr: {
              title: 'Audit & conformité',
              text:
                'Évaluation des risques, recommandations et mise en conformité adaptée à votre contexte.',
            },
            bl: {
              title: 'Haute disponibilité',
              text:
                'Infrastructure pensée pour la continuité de service et la résilience opérationnelle.',
            },
            br: {
              title: 'Supervision',
              text:
                "Surveillance, alerting et contrôle de l'intégrité de votre système d'information.",
            },
          },
          dna: {
            tl: {
              title: 'Formation sur mesure',
              text:
                'Programmes adaptés aux métiers, au niveau des équipes et aux objectifs de transformation.',
            },
            tr: {
              title: 'Coaching opérationnel',
              text:
                "Accompagnement concret pour accélérer l'appropriation des outils et méthodes digitales.",
            },
            bl: {
              title: 'Montée en compétences',
              text:
                "Approche progressive pour renforcer durablement l'autonomie des équipes.",
            },
            br: {
              title: 'Transformation durable',
              text:
                'Vision, méthode et suivi pour inscrire le changement dans le temps.',
            },
          },
        },
      },
      homeProducts: {
        eyebrow: 'Produits',
        titlePrefix: 'Notre gamme de',
        titleEmphasis: 'logiciels',
        lead:
          "Des solutions conçues pour la gestion de projets, le suivi financier, l'administration, le suivi-évaluation et l'accompagnement des institutions et programmes de développement.",
        stats: {
          solutions: 'solutions clés',
          range: 'gamme principale',
        },
        viewProduct: 'Voir le produit',
        items: [
          {
            name: 'SARA PAIE',
            category: 'Gestion de la paie',
            desc:
              'Solution dédiée à la gestion de la paie, au suivi du personnel et à la fiabilité des traitements administratifs.',
            tag: 'Ressources humaines',
          },
          {
            name: 'SARA FED DP ULTIMATE',
            category: 'Gestion de projets FED',
            desc:
              'Logiciel conçu pour le suivi financier, administratif et opérationnel des projets FED multi-bailleurs et multi-projets.',
            tag: 'Projet & finances',
          },
          {
            name: 'SARA FED ON ULTIMATE',
            category: 'Ordonnateur national',
            desc:
              'Outil structuré pour le pilotage, le suivi budgétaire et la consolidation des opérations liées aux conventions.',
            tag: 'Pilotage',
          },
          {
            name: 'SARA NSA',
            category: 'Subventions',
            desc:
              'Application orientée gestion, suivi et contrôle des subventions avec une logique de traçabilité et de conformité.',
            tag: 'Subventions',
          },
          {
            name: 'LUGAF',
            category: 'Gestion financière',
            desc:
              'Solution de gestion financière, comptable et administrative conçue pour les institutions et projets de développement.',
            tag: 'Finance',
          },
          {
            name: 'Plan de passation des marchés',
            category: 'Procurement',
            desc:
              'Module de planification et de suivi des marchés pour une exécution plus claire, structurée et conforme.',
            tag: 'Marchés',
          },
          {
            name: '3S',
            category: 'Suivi des subventions',
            desc:
              'Système dédié au suivi structuré des subventions, des engagements et des principaux jalons de gestion.',
            tag: 'Suivi',
          },
          {
            name: 'SARA M&E',
            category: 'Monitoring & Evaluation',
            desc:
              'Outil complet de suivi-évaluation avec indicateurs, résultats, budget, calendrier et logique de reporting.',
            tag: 'M&E',
          },
          {
            name: 'SARA AT',
            category: 'Assistance technique',
            desc:
              "Solution pensée pour accompagner les activités d'assistance technique, de coordination et de suivi opérationnel.",
            tag: 'Assistance',
          },
        ],
      },
      homeOrganisation: {
        eyebrow: 'Organisation',
        titlePrefix: 'Une organisation pensée pour des',
        titleEmphasis: 'solutions fiables',
        titleSuffix: ', agiles et durables',
        lead:
          "MD2I s'appuie sur une organisation claire et complémentaire, structurée autour de trois pôles d'expertise. Chaque pôle joue un rôle précis dans la chaîne de valeur, du besoin initial jusqu'au déploiement, au suivi et à l'amélioration.",
        pill: "3 pôles d'expertise",
        activePath: 'Parcours actif',
        goToUnit: 'Aller à {{title}}',
        actions: {
          viewDetail: 'Voir le détail',
          explore: 'Explorer ce pôle',
          openActive: 'Ouvrir le pôle actif',
          contactTeam: "Contacter l'équipe",
          previous: 'Précédent',
          next: 'Suivant',
        },
        cta: {
          eyebrow: 'Méthode intégrée',
          title: 'Un parcours fluide entre relation, analyse et exécution',
          text:
            "Cette organisation permet de réduire les frictions, de mieux sécuriser les décisions et d'assurer des livrables plus lisibles, plus fiables et plus durables.",
        },
        modal: {
          closeWindow: 'Fermer la fenêtre',
          kicker: 'Vue détaillée',
          what: 'Ce que fait ce pôle',
          benefits: 'Bénéfices',
          process: 'Processus type',
          tools: 'Outils & leviers',
        },
        units: [
          {
            title: 'Développement commercial & accompagnement client',
            alt:
              'Relation client, coordination projet et accompagnement des partenaires',
            tag: 'Pôle commercial',
            text:
              "Ce pôle pilote la relation avec les partenaires, comprend les besoins, cadre les échanges et accompagne les utilisateurs jusqu'à la mise en service.",
            longText:
              "Ce pôle constitue la porte d'entrée de la relation client. Il identifie les besoins, reformule les attentes, structure les échanges et accompagne les partenaires tout au long du cycle de vie du projet. Il joue aussi un rôle décisif dans la formation, l'assistance, la conduite du changement et le suivi post-déploiement afin de garantir une adoption fluide et durable des solutions.",
            points: [
              'Relation client',
              'Développement commercial',
              'Formation',
              'Assistance',
            ],
            stats: [
              { label: 'Temps de réponse' },
              { label: 'Satisfaction' },
            ],
            details: [
              'Qualification des demandes et compréhension des enjeux métiers',
              'Coordination des échanges entre partenaires, équipes et bénéficiaires',
              'Préparation des propositions, démonstrations et cadrages initiaux',
              'Formation des utilisateurs et accompagnement au démarrage',
              'Suivi opérationnel pour maintenir la qualité de service',
            ],
            process: [
              'Recueillir le besoin et clarifier les objectifs',
              'Traduire les attentes en cadrage exploitable',
              'Coordonner la réponse avec les pôles analyse et technique',
              'Accompagner le déploiement et la prise en main',
              "Suivre l'usage, les retours et les ajustements",
            ],
            tools: ['CRM', 'Ateliers client', 'Support', 'Formation', 'Reporting'],
            benefits: [
              'Vision claire du besoin',
              'Communication plus fluide',
              'Adoption plus rapide des solutions',
            ],
            illustrationCaption:
              'Le pôle commercial crée le lien entre besoin exprimé, solution conçue et expérience vécue.',
          },
          {
            title: 'Analyse, recherche & innovation',
            alt:
              'Analyse métier, innovation, recherche et structuration fonctionnelle',
            tag: 'Pôle analyse',
            text:
              "Ce pôle transforme les besoins métiers en solutions structurées, robustes et évolutives grâce à l'analyse, la modélisation et la veille.",
            longText:
              "Le pôle analyse traduit les attentes des utilisateurs en exigences concrètes, cohérentes et priorisées. Il mobilise l'analyse fonctionnelle, la modélisation des processus, la documentation, la veille technologique ainsi que la recherche de solutions innovantes. Son rôle est de sécuriser la pertinence des choix avant le développement, afin d'éviter les dérives et d'assurer l'alignement entre besoin, usage et solution.",
            points: [
              'Analyse fonctionnelle',
              'R&D',
              'Innovation',
              'Cahier des charges',
            ],
            stats: [
              { label: 'Amélioration continue' },
              { label: 'Expertise métier' },
            ],
            details: [
              'Analyse des processus et des usages existants',
              'Formalisation des spécifications fonctionnelles',
              'Veille sur les méthodes, outils et contraintes réglementaires',
              'Recherche de solutions adaptées au contexte du projet',
              'Priorisation des besoins pour sécuriser le développement',
            ],
            process: [
              'Observer les flux et les besoins du terrain',
              "Modéliser les parcours, contraintes et cas d'usage",
              'Formaliser les règles métier et les exigences',
              'Valider les arbitrages fonctionnels avec les parties prenantes',
              'Préparer une base fiable pour le développement',
            ],
            tools: ['Audit', 'Benchmark', 'Diagrammes', 'Spécifications', 'Veille'],
            benefits: [
              "Moins d'ambiguïtés en projet",
              'Décisions mieux justifiées',
              'Solutions plus adaptées et évolutives',
            ],
            illustrationCaption:
              "Le pôle analyse sécurise l'intelligence du projet avant sa construction technique.",
          },
          {
            title: 'Développement, tests & assurance qualité',
            alt: 'Développement logiciel, tests, validation et assurance qualité',
            tag: 'Pôle technique',
            text:
              'Ce pôle conçoit, développe, teste et fiabilise les solutions logicielles pour assurer performance, stabilité et conformité des livrables.',
            longText:
              "Le pôle technique matérialise la solution. Il développe les fonctionnalités, vérifie leur robustesse, réalise les tests nécessaires et contrôle la qualité avant toute mise en production. Il garantit la performance fonctionnelle, la stabilité technique, la sécurité d'exécution et la conformité des livrables avec les exigences définies en amont.",
            points: ['Développement', 'Tests fonctionnels', 'Qualité', 'Validation'],
            stats: [
              { label: 'Défaut critique' },
              { label: 'Bonnes pratiques' },
            ],
            details: [
              'Conception et développement des fonctionnalités',
              'Tests de cohérence, de parcours et de validation',
              'Contrôle qualité avant mise en production',
              'Correction, optimisation et sécurisation des livrables',
              'Support technique et évolutions après livraison',
            ],
            process: [
              'Construire la solution à partir des spécifications validées',
              "Tester les scénarios d'usage et les règles métier",
              'Corriger les écarts détectés',
              'Valider la qualité et préparer la mise en production',
              'Maintenir et améliorer la solution dans le temps',
            ],
            tools: ['Code review', 'Tests', 'QA', 'Recette', 'Monitoring'],
            benefits: [
              'Livrables plus fiables',
              'Risque réduit en production',
              'Maintenance facilitée',
            ],
            illustrationCaption:
              'Le pôle technique transforme la vision métier en solution stable, testée et prête à servir.',
          },
        ],
      },
      servicesPage: {
        categories: {
          pilotage: 'Pilotage',
          transformation: 'Transformation',
          infrastructure: 'Infrastructure',
          dataAi: 'Data & IA',
          skills: 'Compétences',
        },
        filters: {
          all: 'Tous',
        },
        actions: {
          contact: 'Nous contacter',
          viewDetail: 'Voir le détail',
          talk: 'Parler à MD2I',
        },
        featured: {
          label: 'Service vedette',
          valueTitle: 'Valeur ajoutée principale',
        },
        modal: {
          domain: "Domaine d'expertise",
          positioning: 'Positionnement',
          missionsTitle: 'Missions typiques',
          livrablesTitle: 'Livrables et outils produits',
          impactsTitle: 'Impacts et bénéfices attendus',
          tabs: {
            overview: "Vue d'ensemble",
            missions: 'Missions',
            livrables: 'Livrables',
            impacts: 'Résultats',
          },
        },
        hero: {
          kicker: 'MD2I Madagascar',
          titlePrefix: 'Des expertises',
          titleEmphasis: 'structurées',
          titleSuffix: 'pour des projets à fort impact',
          subtitle:
            "MD2I Madagascar accompagne les institutions publiques, les projets de développement et les organisations partenaires avec une approche fondée sur la rigueur, la lisibilité des processus, la digitalisation et l'adaptation au terrain.",
        },
        stats: {
          experience:
            "d'expérience au service des institutions et des projets",
          domains: "domaines d'expertise structurés dans cette section",
          approach:
            'approche : conseil, outils, gouvernance, données et renforcement',
        },
        sidebar: {
          kicker: 'Explorer les expertises',
          title: 'Filtres de services',
          text: "Filtrer rapidement les domaines d'expertise.",
        },
        cta: {
          title:
            "Besoin d'une expertise claire, structurée et directement opérationnelle ?",
          text:
            "MD2I intervient à l'interface entre conseil, ingénierie, transformation numérique, données et renforcement institutionnel, avec des solutions alignées sur les réalités de terrain et les exigences des partenaires.",
        },
      },
      leadForm: {
        title: 'Demander une information',
        description:
          "Remplissez ce formulaire pour être contacté par l'équipe MD2I.",
        productConcerned: 'Produit concerné : {{product}}',
        progressAria: 'Progression du formulaire',
        progress: 'Étape {{current}} sur {{total}}',
        steps: {
          need: {
            label: 'Besoin',
            title: 'Votre besoin',
            description:
              'Choisissez le produit ou service concerné et le type de demande.',
          },
          contact: {
            label: 'Contact',
            title: 'Vos coordonnées',
            description:
              'Indiquez les informations nécessaires pour vous recontacter.',
          },
          company: {
            label: 'Entreprise',
            title: 'Votre entreprise',
            description:
              'Aidez-nous à mieux comprendre votre contexte professionnel.',
          },
          message: {
            label: 'Message',
            title: 'Votre message',
            description:
              'Décrivez brièvement votre besoin pour recevoir une réponse adaptée.',
          },
        },
        requestTypes: {
          DEMO: {
            label: 'Démonstration',
            option: 'Demander une démonstration',
          },
          QUOTE: { label: 'Devis', option: 'Demander un devis' },
          CONTACT: {
            label: 'Contact commercial',
            option: 'Contact commercial',
          },
          CALLBACK: { label: 'Être rappelé', option: 'Être rappelé' },
          INFO: {
            label: 'Informations',
            option: 'Recevoir plus d’informations',
          },
          SUPPORT: { label: 'Support', option: 'Assistance / support' },
          TRAINING: { label: 'Formation', option: 'Formation' },
          MAINTENANCE: { label: 'Maintenance', option: 'Maintenance' },
          TENDER: { label: 'Appel d’offre', option: 'Appel d’offre' },
          OTHER: { label: 'Autre demande', option: 'Autre demande' },
        },
        fields: {
          product: 'Produit ou service concerné',
          requestType: 'Type de demande',
          firstName: 'Prénom',
          lastName: 'Nom',
          email: 'Email *',
          phone: 'Téléphone',
          jobTitle: 'Fonction',
          company: 'Entreprise *',
          country: 'Pays',
          city: 'Ville',
          message: 'Message *',
        },
        placeholders: {
          firstName: 'Votre prénom',
          lastName: 'Votre nom',
          jobTitle: 'Responsable RH, DAF...',
          company: "Nom de l'entreprise",
          country: 'Madagascar, France...',
          city: 'Votre ville',
          message:
            "Décrivez votre besoin, le nombre d'utilisateurs, le délai souhaité...",
        },
        summary: {
          title: 'Résumé',
          productSelected: 'Produit sélectionné : {{product}}',
          general:
            'Votre demande sera enregistrée comme demande commerciale générale.',
        },
        consent:
          "J'accepte d'être contacté par MD2I au sujet de ma demande.",
        finalSummary: {
          title: 'Avant envoi',
          text:
            "Votre demande sera transmise à l'équipe MD2I et enregistrée dans le CRM pour assurer un suivi commercial.",
        },
        actions: {
          back: 'Retour',
          sending: 'Envoi en cours...',
          submit: 'Envoyer ma demande',
          continue: 'Continuer',
        },
        securityNote:
          'Formulaire sécurisé : validation des champs, anti-spam et contrôle côté serveur.',
        success:
          "Votre demande a bien été envoyée. L'équipe MD2I vous contactera prochainement.",
        validation: {
          productRequired: 'Veuillez choisir un produit ou service.',
          emailRequired: "L'email est obligatoire.",
          emailInvalid: 'Veuillez saisir un email valide.',
          phoneShort: 'Le numéro de téléphone semble trop court.',
          companyRequired:
            'Veuillez indiquer votre entreprise ou organisme.',
          messageRequired: 'Veuillez décrire brièvement votre besoin.',
          messageShort: 'Ajoutez quelques détails supplémentaires.',
          consentRequired: "Vous devez accepter d'être recontacté.",
          blocked: "Votre demande n'a pas pu être validée.",
          wait: "Veuillez patienter quelques secondes avant l'envoi.",
          fixFields: 'Veuillez corriger les champs indiqués.',
          invalidServerResponse: 'Réponse serveur invalide.',
          submitError: "Erreur pendant l'envoi.",
          submitFailed: "Impossible d'envoyer votre demande.",
        },
      },
      productsPage: {
        heroEyebrow: 'Catalogue produits',
        titlePrefix: 'Nos',
        titleEmphasis: 'Solutions',
        subtitle:
          'Logiciels, modules et outils métier conçus pour des équipes exigeantes. Explorez notre catalogue, comparez les tarifs et demandez directement une démonstration.',
        statsProducts: 'produits',
        statsCategories: 'catégories',
        searchPlaceholder: 'Rechercher une solution...',
        filtersOpen: 'Afficher filtres',
        filtersClose: 'Fermer filtres',
        sortOpen: 'Afficher tri',
        sortClose: 'Fermer tri',
        panelAutoClose: 'Fermeture automatique après 6 secondes',
        filtersTitle: 'Filtres',
        sortTitle: 'Tri',
        closeFilters: 'Fermer les filtres',
        closeSort: 'Fermer le tri',
        categories: 'Catégories',
        allCategories: 'Toutes',
        price: 'Prix',
        minPrice: 'Prix min',
        maxPrice: 'Prix max',
        visual: 'Visuel',
        allImages: 'Tous',
        withImage: 'Avec image',
        withoutImage: 'Sans image',
        sortBy: 'Trier par',
        sort: {
          dateDesc: 'Plus récent',
          dateAsc: 'Plus ancien',
          priceAsc: 'Prix croissant',
          priceDesc: 'Prix décroissant',
          nameAsc: 'Nom A → Z',
          nameDesc: 'Nom Z → A',
        },
        resultCount_one:
          '{{count}} solution disponible',
        resultCount_other:
          '{{count}} solutions disponibles',
        emptyTitle: 'Aucune solution trouvée',
        emptyText:
          'Essayez un autre mot-clé ou réinitialisez les filtres actifs.',
        errors: {
          load: 'Impossible de charger les produits.',
        },
        card: {
          eyebrow: 'Solution MD2I',
          category: 'Catégorie',
          updated: 'Mis à jour',
          price: 'Tarif',
          catalog: 'Catalogue',
          productSheet: 'Fiche produit',
          viewSheet: 'Voir la fiche',
          requestDemo: 'Demander une démo',
          noDescription: 'Aucune description disponible.',
          readMore: 'Lire plus',
          collapse: 'Réduire',
          onRequest: 'Sur devis',
        },
      },
      productDetail: {
        loading: 'Chargement...',
        notFound: 'Produit introuvable.',
        back: 'Retour',
        publication: 'Publication',
        viewAllProducts: 'Voir tous les produits',
        requestQuote: 'Demander une démo / un devis',
        requestDemo: 'Demander une démo',
        requestDemoAria: 'Demander une démonstration ou un devis',
        showDetails: 'Afficher les détails',
        detailsTitle: 'Détails produit',
        autoClose: 'Fermeture automatique après 6 secondes',
        closeDetails: 'Fermer les détails',
      },
      productLeadPage: {
        backProducts: 'Retour aux produits',
        viewProduct: 'Voir la fiche produit',
        eyebrow: 'Demande commerciale',
        fallbackExcerpt:
          "Présentez votre besoin à l'équipe MD2I pour recevoir une réponse adaptée.",
        meta: {
          product: 'Produit',
          price: 'Tarif',
        },
        afterSend: {
          title: "Après l'envoi",
          sent: "Votre demande est transmise à l'équipe commerciale MD2I.",
          product: 'Le produit concerné est automatiquement associé au lead.',
          crm: 'Une relance est créée dans le CRM pour assurer le suivi.',
        },
        formFor: 'Demande pour',
        formHeadingPrefix: 'Demander une',
        demo: 'démo',
        formHeadingOr: 'ou un',
        quote: 'devis',
        formSub:
          'Quelques informations suffisent pour qualifier votre demande, sécuriser le suivi commercial et vous orienter vers la bonne réponse MD2I.',
        chips: {
          structured: 'Réponse commerciale structurée',
          secure: 'Formulaire sécurisé anti-spam',
          crm: 'Produit associé au CRM',
        },
        steps: {
          describe: {
            title: 'Vous décrivez le besoin',
            text: 'Indiquez votre contexte, vos coordonnées et le type de demande souhaité.',
          },
          qualify: {
            title: 'MD2I qualifie la demande',
            text: 'Le produit, la source et les informations commerciales sont associés.',
          },
          reply: {
            title: 'Vous recevez un retour',
            text: "L'équipe peut proposer une démonstration, un devis ou un rappel.",
          },
        },
        footer: {
          title: 'Besoin de comparer plusieurs solutions ?',
          text:
            'Consultez le catalogue complet MD2I avant de finaliser votre demande.',
          cta: 'Voir le catalogue',
        },
      },
      articlesPage: {
        heroEyebrow: 'Publications MD2I',
        titlePrefix: 'Nos',
        titleEmphasis: 'Articles',
        subtitle:
          'Découvrez nos publications, nouveautés et informations sur nos activités',
        statsArticles: 'articles',
        statsCategories: 'catégories',
        searchPlaceholder: 'Rechercher un article...',
        filtersOpen: 'Afficher filtres',
        filtersClose: 'Fermer filtres',
        sortOpen: 'Afficher tri',
        sortClose: 'Fermer tri',
        filtersTitle: 'Filtres',
        sortTitle: 'Tri',
        categories: 'Catégories',
        allCategories: 'Toutes',
        sortBy: 'Trier par',
        sort: {
          dateDesc: 'Plus récent',
          dateAsc: 'Plus ancien',
          titleAsc: 'A → Z',
          titleDesc: 'Z → A',
        },
        resultCount_one:
          '{{count}} article disponible',
        resultCount_other:
          '{{count}} articles disponibles',
        emptyTitle: 'Aucun article trouvé',
        emptyText:
          'Essayez un autre mot-clé ou réinitialisez les filtres actifs.',
        errors: {
          load: 'Impossible de charger les articles.',
        },
        card: {
          eyebrow: 'Article MD2I',
          readArticle: "Lire l'article",
          noExcerpt: 'Aucun extrait disponible.',
          readMore: 'Voir plus',
          collapse: 'Voir moins',
        },
      },
      postDetail: {
        loading: 'Chargement...',
        notFound: 'Post introuvable.',
        back: 'Retour',
      },
      contactPage: {
        heroEyebrow: 'Contact MD2I',
        title: 'Une question, un projet, une demande ?',
        titleEmphasis: 'Parlons-en.',
        subtitle:
          'Notre équipe vous oriente vers le bon interlocuteur pour une démonstration, un devis, une demande technique, une formation ou un partenariat stratégique.',
        ctaMessage: 'Envoyer un message',
        ctaSales: 'Demande commerciale',
        ctaDiscover: 'Découvrir MD2I',
        trust: {
          response: 'Réponse structurée',
          crm: 'Suivi CRM',
          support: 'Accompagnement professionnel',
        },
        availability: {
          kicker: 'Disponibilité',
          title: 'Une équipe dédiée à votre demande',
          text: 'Votre message est qualifié puis transmis au pôle le plus adapté pour accélérer le traitement.',
        },
        stats: {
          delayLabel: 'délai moyen',
          delayText: 'réponse rapide',
          polesLabel: 'pôles experts',
          polesText: 'commerce, support, technique, direction',
          officesLabel: 'implantations',
          officesText: 'Madagascar · France',
        },
        cards: {
          pill: 'Contacts directs',
          title: 'Le bon interlocuteur, sans détour',
          subtitle:
            'Sélectionnez le service adapté à votre besoin pour obtenir une réponse plus rapide, plus précise et mieux orientée.',
          direction: {
            title: 'Direction générale',
            description:
              'Partenariats stratégiques, échanges institutionnels et décisions à haut niveau.',
            tag: 'Stratégie',
          },
          sales: {
            title: 'Pôle commercial',
            description:
              'Présentation du cabinet, démonstrations, devis et demandes commerciales.',
            tag: 'Commercial',
          },
          support: {
            title: 'Support & formation',
            description:
              'Assistance utilisateurs, formation, prise en main et suivi opérationnel.',
            tag: 'Support',
          },
          technical: {
            title: 'Développement & technique',
            description:
              'Intégrations, évolutions logicielles, API et architecture technique.',
            tag: 'Technique',
          },
        },
        form: {
          pill: 'Formulaire sécurisé',
          titleLine1: 'Envoyez-nous',
          titleLine2: 'votre message',
          note:
            'Tous les champs marqués * sont requis. Votre demande sera transmise au service compétent.',
          successTitle: 'Message envoyé',
          successText:
            "Merci pour votre demande. L'équipe MD2I vous répondra dans les meilleurs délais.",
          reference: 'Référence : {{id}}',
          anotherMessage: 'Envoyer un autre message',
          stepContact: 'Vos coordonnées',
          stepContactText:
            'Nous utiliserons ces informations pour vous répondre.',
          firstName: 'Prénom *',
          firstNamePlaceholder: 'Votre prénom',
          lastName: 'Nom *',
          lastNamePlaceholder: 'Votre nom',
          email: 'Email *',
          phone: 'Téléphone',
          phonePlaceholder: '+261 34 ...',
          organization: 'Organisation',
          organizationPlaceholder: 'Nom de votre entreprise ou institution',
          stepRequest: 'Votre demande',
          stepRequestText:
            "Sélectionnez l'objet puis décrivez votre besoin.",
          subject: 'Objet *',
          subjectPlaceholder: 'Sélectionner...',
          message: 'Message *',
          messagePlaceholder:
            'Décrivez votre besoin, votre contexte, votre délai ou votre question...',
          summaryTitle: 'Résumé de la demande',
          summaryFallback: 'Sélectionnez un objet',
          summaryText:
            "Votre message sera traité par l'équipe MD2I et orienté vers le pôle compétent.",
          legal:
            'En soumettant ce formulaire, vous acceptez que MD2I traite vos données afin de répondre à votre demande.',
          sending: 'Envoi en cours...',
          submit: 'Envoyer le message',
        },
        subjects: {
          sales: 'Demande commerciale',
          demo: 'Démonstration',
          quote: 'Devis',
          support: 'Support technique',
          training: 'Formation',
          partnership: 'Partenariat',
          recruitment: 'Recrutement',
          other: 'Autre',
        },
        validation: {
          blocked: 'Soumission bloquée.',
          fixFields: 'Veuillez corriger les champs indiqués.',
          sendFailed: "Impossible d'envoyer le message.",
          sendError: "Une erreur est survenue pendant l'envoi.",
          firstNameRequired: 'Prénom obligatoire.',
          lastNameRequired: 'Nom obligatoire.',
          emailRequired: 'Email obligatoire.',
          emailInvalid: 'Email invalide.',
          phoneInvalid: 'Téléphone invalide.',
          subjectRequired: 'Objet obligatoire.',
          subjectInvalid: 'Objet invalide.',
          messageRequired: 'Message obligatoire.',
          min2: 'Minimum 2 caractères.',
          min10: 'Minimum 10 caractères.',
          max120: 'Maximum 120 caractères.',
          max5000: 'Maximum 5000 caractères.',
        },
        offices: {
          pill: 'Implantations',
          title: 'Nos bureaux',
          operational: 'Bureau opérationnel',
          institutional: 'Représentation institutionnelle',
          tanaAddress: 'Adresse à compléter, Antananarivo, Madagascar',
          parisAddress: 'Adresse à compléter, Paris, France',
        },
        frequent: {
          pill: 'Demandes fréquentes',
          title: 'Nous pouvons vous aider à',
          presentation: 'Demander une présentation du cabinet',
          demo: 'Planifier une démonstration en ligne',
          quote: 'Obtenir un devis ou une proposition',
          support: 'Recevoir un appui technique ou une formation',
          routing: 'Être orienté vers le bon interlocuteur',
        },
        nudge: {
          label: 'Prioritaire',
          text: "Besoin d'une réponse rapide ?",
          cta: 'Écrire directement →',
        },
      },
      contactCommercial: {
        eyebrow: 'Contact commercial MD2I',
        title: 'Parlons de votre besoin et trouvons la',
        titleEmphasis: 'bonne solution.',
        subtitle:
          "Sélectionnez un produit ou service, décrivez votre demande, puis l'équipe MD2I vous recontactera avec une réponse adaptée à votre contexte.",
        cta: 'Envoyer une demande',
        hint: "Réponse rapide par l'équipe commerciale",
        cardTitle: 'Accompagnement personnalisé',
        cardText:
          'Votre demande est automatiquement transmise au CRM MD2I pour être suivie par notre équipe commerciale.',
        solutionsAvailable: 'solutions disponibles',
        crmTracking: 'suivi structuré',
        benefits: {
          adaptedTitle: 'Solution adaptée',
          adaptedText:
            'Nous analysons votre demande pour vous orienter vers le bon produit ou service.',
          followTitle: 'Suivi commercial',
          followText:
            'Votre demande est enregistrée proprement pour faciliter le suivi et les relances.',
          exchangeTitle: 'Échange professionnel',
          exchangeText:
            'Vous êtes recontacté avec une réponse claire, structurée et adaptée à votre projet.',
        },
        introBadge: 'Votre demande',
        introTitle: 'Demande commerciale',
        introText:
          'Choisissez le produit ou service qui vous intéresse, puis indiquez vos informations. Cela nous permet de mieux comprendre votre besoin avant de vous recontacter.',
        points: {
          qualification: 'Qualification claire de votre besoin.',
          crm: 'Suivi commercial structuré dans le CRM.',
          product: 'Retour adapté au produit ou service sélectionné.',
        },
        warning:
          "Aucun produit publié n'est disponible pour le moment. Vous pouvez tout de même envoyer une demande générale si le formulaire le permet.",
        formTitle: 'Demande commerciale',
        formDescription:
          "Choisissez le produit ou service qui vous intéresse. L'équipe MD2I vous recontactera rapidement.",
        reassuranceBadge: 'MD2I',
        reassuranceTitle:
          'Un interlocuteur pour transformer votre besoin en solution.',
        reassuranceText:
          'Que votre demande concerne un site web, une solution digitale, un CRM, une automatisation, une maintenance ou un accompagnement, nous vous aidons à clarifier la meilleure approche.',
      },
      aboutPage: {
        heroBadge: 'Le cabinet MD2I',
        heroTitleLine1: 'Une présence discrète dans la forme,',
        heroTitleLine2: "solide dans l'exécution",
        heroText:
          'Depuis 1987, MD2I conçoit et déploie des solutions logicielles, des méthodes et des dispositifs d’accompagnement dédiés à la gestion, au suivi et à l’évaluation des projets de développement. Le cabinet agit avec une priorité constante : produire des outils clairs, robustes et durables, réellement utiles aux équipes.',
        referencesCta: 'Voir nos références',
        contactCta: 'Nous contacter',
        panelLabel: 'Coordination',
        panelText:
          'Une organisation resserrée, des pôles identifiés et des points de contact directs pour chaque besoin métier.',
        metrics: {
          created: 'Création du cabinet',
          countries: 'Pays et ensembles régionaux',
          offices: 'Implantations principales',
        },
        sections: {
          figuresKicker: 'Repères clés',
          figuresTitle: 'Quelques chiffres pour situer MD2I',
          figuresText:
            "Une lecture rapide des repères qui traduisent l'ancienneté, l'ouverture internationale et la capacité d'intervention du cabinet.",
          positioningKicker: 'Positionnement',
          positioningTitle:
            'Des outils utiles, une méthode lisible, un accompagnement durable',
          positioningText:
            "MD2I privilégie une approche sobre : limiter la complexité visuelle, clarifier les usages et concentrer l'effort sur la qualité des processus, la fiabilité des données et la continuité du support.",
          historyKicker: 'Historique',
          historyTitle: 'Une trajectoire construite dans la durée',
          historyText:
            "L'évolution du cabinet reflète une continuité claire : expertise métier, développement d'outils, ouverture internationale et appui durable aux utilisateurs.",
          teamKicker: "L'équipe",
          teamTitle: 'Les équipes, leurs domaines et leurs coordonnées',
          teamText:
            "Chaque carte présente un domaine d'intervention, un rôle clair et des coordonnées directes pour orienter rapidement les demandes.",
          organisationKicker: 'Organisation',
          organisationTitle:
            "Une structure pensée pour couvrir tout le cycle d'intervention",
          organisationText:
            'Le cabinet articule plusieurs pôles complémentaires afin de relier conception, développement, qualité, formation et maintenance.',
          approachKicker: 'Notre approche',
          approachTitle: "Ce qui guide notre manière d'intervenir",
          approachText:
            "Au-delà des outils, MD2I défend une méthode de travail fondée sur la compréhension des usages, la qualité d'exécution et la continuité de l'accompagnement.",
          locationKicker: 'Implantation',
          locationTitle:
            'Un ancrage historique et une présence opérationnelle',
          principlesKicker: 'Principes',
          principlesTitle: 'Les standards que nous nous imposons',
          principlesText:
            "Cette exigence se retrouve dans la conception des outils, l'accompagnement des utilisateurs et la qualité des livrables.",
          ctaKicker: 'Aller plus loin',
          ctaTitle:
            'Un besoin précis ? Contactez directement le bon interlocuteur',
          ctaText:
            "Retrouvez la page Contact pour écrire au cabinet, obtenir une démonstration, demander une présentation ou être mis en relation avec l'équipe la plus adaptée.",
          ctaButton: 'Aller à la page contact',
        },
        memberMeta: {
          email: 'Email',
          phone: 'Téléphone',
          location: 'Localisation',
        },
      },
    },
  },
  en: {
    translation: {
      navbar: {
        brand: {
          tagline: 'IT consulting & digital solutions',
        },
        links: {
          home: 'Home',
          services: 'Services',
          references: 'References',
          products: 'Products',
          about: 'About',
          contact: 'Contact',
          contactGeneral: 'General contact',
          contactGeneralDescription: 'Write to the MD2I team',
          contactCommercial: 'Sales contact',
          contactCommercialDescription: 'Request a quote, demo, or callback',
        },
        search: {
          aria: 'Search',
          placeholder: 'Search a page...',
          escape: 'Esc',
          hint: 'Start typing to search the site.',
          noResults: 'No results for "{{query}}".',
        },
        theme: {
          light: 'Light mode',
          dark: 'Dark mode',
        },
        language: {
          menu: 'Change language',
        },
        mobileMenu: 'Mobile menu',
        navigation: {
          hide: 'Hide navigation',
          show: 'Show navigation',
        },
      },
      dynamic: {
        translating: 'Translating...',
      },
      common: {
        clear: 'Clear',
        clearAll: 'Clear all',
        close: 'Close',
        loading: 'Loading...',
        page: 'Page {{page}} / {{total}}',
        resetFilters: 'Reset filters',
        scrollTop: 'Back to top',
      },
      referencePage: {
        toolbar: {
          homeTitle: 'Back to home',
          home: 'Home',
          hideTools: 'Hide tools',
          showTools: 'Show tools',
          tools: 'Tools',
        },
        projectCount_one: '{{count}} project in this country',
        projectCount_other: '{{count}} projects in this country',
        project: {
          previous: 'Previous project',
          next: 'Next project',
        },
        display: {
          list: 'List',
          cards: 'Cards',
        },
        list: {
          interventionTitle: 'Intervention title',
          interventionType: 'Intervention type',
          period: 'Implementation period',
          description: 'Description',
        },
        actions: {
          viewDetails: 'View details',
          details: 'Details',
          similarProject: 'Similar project',
          similar: 'Similar',
          reset: 'Reset',
          resetAll: 'Reset all filters',
          wantSimilar: 'I want a similar solution →',
        },
        notifications: {
          loadError: 'Unable to load public references.',
          mapRecentered: 'Map recentered.',
          resultsAdjusted: 'View adjusted to results.',
          filtersReset: 'Filters reset.',
          exportSuccess: 'CSV export successful.',
          tagAdded: 'Filter added: #{{tag}}',
        },
        csv: {
          client: 'Client',
          project: 'Project',
          country: 'Country',
          category: 'Category',
          date: 'Date',
          impact: 'Impact',
          technologies: 'Technologies',
          excerpt: 'Excerpt',
          details: 'Details',
        },
        hero: {
          kicker: 'Global references',
          title: 'Interactive map of MD2I projects',
          text:
            'Explore references by country, sector, technology, and year. Switch to list mode to browse projects more easily.',
        },
        listHeader: {
          kicker: 'MD2I references',
          title: 'Achievements and client projects',
          text:
            'Browse MD2I references as detailed cards, close to the previous presentation, with a clearer and more modern interface.',
        },
        stats: {
          projects: 'Projects',
          countries: 'Countries',
          sectors: 'Sectors',
          techs: 'Tech',
        },
        activeFilters_one: '{{count}} active filter',
        activeFilters_other: '{{count}} active filters',
        empty: {
          filtered: 'No reference matches the current filters.',
          published: 'No published reference found.',
        },
        command: {
          searchPlaceholder:
            'Search for a client, country, project, technology...',
          switchList: '☷ List',
          switchMap: '🌍 Map',
          viewResults: '⊙ View results',
          recenter: '↺ Recenter',
          filters: '⚙️ Filters',
          export: '⬇ Export',
        },
        filters: {
          kicker: 'Exploration',
          title: 'Advanced filters',
          close: 'Close filters',
          sortBy: 'Sort by',
          categories: 'Categories',
          technologies: 'Technologies',
          tags: 'Tags',
          years: 'Years',
        },
        sort: {
          date: 'Date',
          impact: 'Impact',
          client: 'Client',
        },
        loading: {
          map: 'Loading map…',
          references: 'Loading references…',
        },
        modal: {
          summary: 'Project summary',
          details: 'Mission details',
          keyInfo: 'Key information',
          technologies: 'Technologies used',
          tags: 'Tags',
        },
        metrics: {
          country: 'Country',
          client: 'Client',
          team: 'Team',
          duration: 'Duration',
          budget: 'Budget',
          impact: 'Impact',
        },
      },
      footer: {
        links: [
          'Home',
          'Services',
          'Portfolio',
          'Blog',
          'About',
          'Contact',
          'Sales contact',
        ],
        services: [
          'Web development',
          'Mobile applications',
          'IT consulting',
          'Managed services',
          'Cybersecurity',
          'Digital training',
        ],
        brand: {
          tagline: 'IT consulting & digital solutions',
          availability: 'Available for new projects',
          description:
            'We support companies in their digital transformation through consulting, tailored development, business software, and innovative IT solutions in Madagascar and internationally.',
        },
        newsletter: {
          title: 'Receive MD2I updates',
          text:
            'Your email will be added to the CRM as a new contact. The name and company will be completed automatically if possible.',
          crmContact: 'CRM contact',
          companyDetected: 'Detected company: {{company}}',
          adding: 'Adding...',
          addEmail: 'Add my email →',
          validation: {
            email: 'Please enter a valid email address.',
          },
          errors: {
            add: 'Unable to add this contact.',
            generic: 'An error occurred during subscription.',
          },
          success: {
            createdTitle: 'Welcome to MD2I',
            updatedTitle: 'Contact already registered',
            createdMessage:
              'Your email has been added to the CRM. We will be able to send you updates, useful offers, and product information.',
            updatedMessage:
              'This contact already existed in the CRM. Its information has been completed and updated.',
          },
        },
        sections: {
          navigation: 'Navigation',
          services: 'Services',
        },
        location: {
          title: 'MD2I location',
          openMaps: 'Open MD2I in Google Maps',
          mapTitle: 'MD2I Madagascar location on Google Maps',
          logoAlt: 'MD2I Madagascar',
          unavailable: 'Geolocation is not available in this browser.',
          detected: 'Position detected. Opening Google Maps directions.',
          denied:
            'Location denied. Opening Google Maps without a starting point.',
          locating: 'Locating...',
          useMyLocation: 'Use my location and open directions',
        },
        legal: {
          rights: '— All rights reserved. Designed with care in Madagascar 🇲🇬',
          mentions: 'Legal notice',
          privacy: 'Privacy',
          terms: 'Terms',
        },
      },
      homeHero: {
        slides: [
          {
            eyebrow: 'IT consulting — Paris 1987 — 54 countries',
            title:
              "Digital <span style='color:#EF9F27'>solutions</span> for international development projects",
            desc:
              'Financial management software, consulting, and training for international organizations. Partners of the EDF and EU for over 35 years.',
            buttons: ['Discover SARA', 'Contact us'],
          },
          {
            eyebrow: 'Tailored software',
            title:
              "Application <span style='color:#EF9F27'>development</span> and information systems",
            desc:
              'Cloud architectures, microservices, and REST APIs. From design to deployment, we build robust and scalable solutions.',
            buttons: ['Our solutions', 'View portfolio'],
          },
          {
            eyebrow: 'Cybersecurity & Infrastructure',
            title:
              "Protect your data with recognized <span style='color:#EF9F27'>expertise</span>",
            desc:
              'Security audits, GDPR compliance, and high-availability infrastructure. Your information system is in good hands.',
            buttons: ['Free audit', 'Learn more'],
          },
          {
            eyebrow: 'Training & Consulting',
            title:
              "Build your teams' <span style='color:#EF9F27'>digital</span> skills",
            desc:
              'Tailored training programs, agile coaching, and digital transformation support. 54 countries, 3 languages, unique expertise.',
            buttons: ['Our training', 'Contact us'],
          },
        ],
        features: {
          network: {
            tl: {
              title: 'International coverage',
              text:
                'Deployment of digital solutions for projects and institutions across multiple territories.',
            },
            tr: {
              title: 'Interoperability',
              text:
                'Connected systems, data exchange, and smooth integration with your existing tools.',
            },
            bl: {
              title: 'Financial steering',
              text:
                'Monitoring, reporting, and structured management for complex multi-stakeholder environments.',
            },
            br: {
              title: 'Support',
              text:
                'Consulting, training, and assistance to secure adoption and scale-up.',
            },
          },
          cube: {
            tl: {
              title: 'Scalable architecture',
              text:
                'Design of robust platforms ready for growth and high workloads.',
            },
            tr: {
              title: 'APIs & microservices',
              text:
                'Modular decomposition, simplified maintenance, and fast integration between services.',
            },
            bl: {
              title: 'Performance',
              text:
                'Optimized response times and a smooth experience across web, mobile, and business systems.',
            },
            br: {
              title: 'Controlled deployment',
              text:
                'From design to production with a secure and progressive approach.',
            },
          },
          shield: {
            tl: {
              title: 'Data protection',
              text:
                'Strengthened security measures to protect critical flows and sensitive information.',
            },
            tr: {
              title: 'Audit & compliance',
              text:
                'Risk assessment, recommendations, and compliance adapted to your context.',
            },
            bl: {
              title: 'High availability',
              text:
                'Infrastructure designed for service continuity and operational resilience.',
            },
            br: {
              title: 'Monitoring',
              text:
                'Monitoring, alerting, and integrity control for your information system.',
            },
          },
          dna: {
            tl: {
              title: 'Tailored training',
              text:
                'Programs adapted to business roles, team levels, and transformation goals.',
            },
            tr: {
              title: 'Operational coaching',
              text:
                'Concrete support to accelerate adoption of digital tools and methods.',
            },
            bl: {
              title: 'Skills development',
              text:
                'A progressive approach to sustainably strengthen team autonomy.',
            },
            br: {
              title: 'Lasting transformation',
              text:
                'Vision, method, and follow-up to anchor change over time.',
            },
          },
        },
      },
      homeProducts: {
        eyebrow: 'Products',
        titlePrefix: 'Our range of',
        titleEmphasis: 'software',
        lead:
          'Solutions designed for project management, financial monitoring, administration, monitoring and evaluation, and support for institutions and development programs.',
        stats: {
          solutions: 'key solutions',
          range: 'main product line',
        },
        viewProduct: 'View product',
        items: [
          {
            name: 'SARA PAIE',
            category: 'Payroll management',
            desc:
              'A solution dedicated to payroll management, staff tracking, and reliable administrative processing.',
            tag: 'Human resources',
          },
          {
            name: 'SARA FED DP ULTIMATE',
            category: 'EDF project management',
            desc:
              'Software designed for financial, administrative, and operational monitoring of multi-donor and multi-project EDF programs.',
            tag: 'Projects & finance',
          },
          {
            name: 'SARA FED ON ULTIMATE',
            category: 'National authorizing officer',
            desc:
              'A structured tool for steering, budget monitoring, and consolidating operations linked to conventions.',
            tag: 'Steering',
          },
          {
            name: 'SARA NSA',
            category: 'Grants',
            desc:
              'An application focused on grant management, monitoring, and control with traceability and compliance logic.',
            tag: 'Grants',
          },
          {
            name: 'LUGAF',
            category: 'Financial management',
            desc:
              'A financial, accounting, and administrative management solution designed for institutions and development projects.',
            tag: 'Finance',
          },
          {
            name: 'Procurement plan',
            category: 'Procurement',
            desc:
              'A planning and monitoring module for procurement processes, enabling clearer, more structured, and compliant execution.',
            tag: 'Procurement',
          },
          {
            name: '3S',
            category: 'Grant monitoring',
            desc:
              'A system dedicated to structured monitoring of grants, commitments, and key management milestones.',
            tag: 'Monitoring',
          },
          {
            name: 'SARA M&E',
            category: 'Monitoring & Evaluation',
            desc:
              'A complete monitoring and evaluation tool with indicators, results, budget, schedule, and reporting logic.',
            tag: 'M&E',
          },
          {
            name: 'SARA AT',
            category: 'Technical assistance',
            desc:
              'A solution designed to support technical assistance, coordination, and operational monitoring activities.',
            tag: 'Assistance',
          },
        ],
      },
      homeOrganisation: {
        eyebrow: 'Organization',
        titlePrefix: 'An organization built for',
        titleEmphasis: 'reliable solutions',
        titleSuffix: ', agile and durable',
        lead:
          'MD2I relies on a clear, complementary organization structured around three areas of expertise. Each area plays a precise role in the value chain, from the initial need through deployment, support, and continuous improvement.',
        pill: '3 areas of expertise',
        activePath: 'Active path',
        goToUnit: 'Go to {{title}}',
        actions: {
          viewDetail: 'View details',
          explore: 'Explore this area',
          openActive: 'Open active area',
          contactTeam: 'Contact the team',
          previous: 'Previous',
          next: 'Next',
        },
        cta: {
          eyebrow: 'Integrated method',
          title: 'A smooth path between relationship, analysis, and execution',
          text:
            'This organization reduces friction, secures decisions more effectively, and produces deliverables that are clearer, more reliable, and more durable.',
        },
        modal: {
          closeWindow: 'Close window',
          kicker: 'Detailed view',
          what: 'What this area does',
          benefits: 'Benefits',
          process: 'Typical process',
          tools: 'Tools & levers',
        },
        units: [
          {
            title: 'Business development & client support',
            alt: 'Client relations, project coordination, and partner support',
            tag: 'Sales team',
            text:
              'This area manages partner relationships, understands needs, structures exchanges, and supports users through go-live.',
            longText:
              'This area is the entry point for client relationships. It identifies needs, reformulates expectations, structures exchanges, and supports partners throughout the project lifecycle. It also plays a key role in training, assistance, change management, and post-deployment follow-up to ensure smooth and lasting adoption of solutions.',
            points: ['Client relations', 'Business development', 'Training', 'Support'],
            stats: [
              { label: 'Response time' },
              { label: 'Satisfaction' },
            ],
            details: [
              'Qualification of requests and understanding of business challenges',
              'Coordination of exchanges between partners, teams, and beneficiaries',
              'Preparation of proposals, demos, and initial scoping',
              'User training and go-live support',
              'Operational follow-up to maintain service quality',
            ],
            process: [
              'Collect the need and clarify objectives',
              'Translate expectations into usable scoping',
              'Coordinate the response with analysis and technical teams',
              'Support deployment and onboarding',
              'Track usage, feedback, and adjustments',
            ],
            tools: ['CRM', 'Client workshops', 'Support', 'Training', 'Reporting'],
            benefits: [
              'Clearer view of the need',
              'Smoother communication',
              'Faster adoption of solutions',
            ],
            illustrationCaption:
              'The sales team connects expressed need, designed solution, and lived experience.',
          },
          {
            title: 'Analysis, research & innovation',
            alt: 'Business analysis, innovation, research, and functional structuring',
            tag: 'Analysis team',
            text:
              'This area turns business needs into structured, robust, and scalable solutions through analysis, modeling, and monitoring.',
            longText:
              'The analysis team translates user expectations into concrete, coherent, and prioritized requirements. It mobilizes functional analysis, process modeling, documentation, technology monitoring, and research into innovative solutions. Its role is to secure the relevance of choices before development, avoiding drift and ensuring alignment between need, usage, and solution.',
            points: ['Functional analysis', 'R&D', 'Innovation', 'Specifications'],
            stats: [
              { label: 'Continuous improvement' },
              { label: 'Business expertise' },
            ],
            details: [
              'Analysis of existing processes and usage',
              'Formalization of functional specifications',
              'Monitoring of methods, tools, and regulatory constraints',
              'Search for solutions adapted to project context',
              'Prioritization of needs to secure development',
            ],
            process: [
              'Observe flows and field needs',
              'Model user journeys, constraints, and use cases',
              'Formalize business rules and requirements',
              'Validate functional decisions with stakeholders',
              'Prepare a reliable base for development',
            ],
            tools: ['Audit', 'Benchmark', 'Diagrams', 'Specifications', 'Monitoring'],
            benefits: [
              'Less ambiguity in projects',
              'Better-justified decisions',
              'More suitable and scalable solutions',
            ],
            illustrationCaption:
              'The analysis team secures project intelligence before technical construction.',
          },
          {
            title: 'Development, testing & quality assurance',
            alt: 'Software development, testing, validation, and quality assurance',
            tag: 'Technical team',
            text:
              'This area designs, develops, tests, and hardens software solutions to ensure performance, stability, and compliant deliverables.',
            longText:
              'The technical team materializes the solution. It develops features, verifies robustness, performs the required tests, and controls quality before production. It guarantees functional performance, technical stability, execution security, and compliance of deliverables with the requirements defined upstream.',
            points: ['Development', 'Functional testing', 'Quality', 'Validation'],
            stats: [
              { label: 'Critical defects' },
              { label: 'Best practices' },
            ],
            details: [
              'Design and development of features',
              'Consistency, journey, and validation testing',
              'Quality control before production',
              'Correction, optimization, and securing of deliverables',
              'Technical support and post-delivery improvements',
            ],
            process: [
              'Build the solution from validated specifications',
              'Test usage scenarios and business rules',
              'Correct detected gaps',
              'Validate quality and prepare production release',
              'Maintain and improve the solution over time',
            ],
            tools: ['Code review', 'Testing', 'QA', 'Acceptance', 'Monitoring'],
            benefits: [
              'More reliable deliverables',
              'Reduced production risk',
              'Easier maintenance',
            ],
            illustrationCaption:
              'The technical team turns business vision into a stable, tested solution ready to serve.',
          },
        ],
      },
      servicesPage: {
        categories: {
          pilotage: 'Project steering',
          transformation: 'Transformation',
          infrastructure: 'Infrastructure',
          dataAi: 'Data & AI',
          skills: 'Skills',
        },
        filters: {
          all: 'All',
        },
        actions: {
          contact: 'Contact us',
          viewDetail: 'View details',
          talk: 'Talk to MD2I',
        },
        featured: {
          label: 'Featured service',
          valueTitle: 'Main added value',
        },
        modal: {
          domain: 'Area of expertise',
          positioning: 'Positioning',
          missionsTitle: 'Typical missions',
          livrablesTitle: 'Deliverables and tools produced',
          impactsTitle: 'Expected impacts and benefits',
          tabs: {
            overview: 'Overview',
            missions: 'Missions',
            livrables: 'Deliverables',
            impacts: 'Results',
          },
        },
        hero: {
          kicker: 'MD2I Madagascar',
          titlePrefix: 'Structured',
          titleEmphasis: 'expertise',
          titleSuffix: 'for high-impact projects',
          subtitle:
            'MD2I Madagascar supports public institutions, development projects, and partner organizations with an approach based on rigor, readable processes, digitalization, and adaptation to the field.',
        },
        stats: {
          experience:
            'of experience serving institutions and projects',
          domains: 'structured expertise areas in this section',
          approach:
            'approach: consulting, tools, governance, data, and capacity building',
        },
        sidebar: {
          kicker: 'Explore expertise',
          title: 'Service filters',
          text: 'Quickly filter areas of expertise.',
        },
        cta: {
          title:
            'Need clear, structured, directly operational expertise?',
          text:
            'MD2I works at the intersection of consulting, engineering, digital transformation, data, and institutional capacity building, with solutions aligned with field realities and partner requirements.',
        },
        services: {
          project: {
            title: 'Technical assistance for project management',
            shortLabel: 'Operational steering',
            badge: 'Strategic service',
            description:
              'Project ownership support, coordination, and monitoring to ensure execution quality, accountability, and sustainability for complex programs.',
            detailTitle: 'Technical assistance for project management',
            illustrationLabel:
              'Program steering, coordination, and monitoring',
            intro:
              'MD2I supports complex projects in their framing, planning, execution, and monitoring to secure results, streamline coordination, and strengthen steering capacity.',
            missions: [
              'Structuring steering arrangements',
              'Support for strategic and operational planning',
              'Organization of monitoring, reporting, and coordination',
              'Support for decision-making and bottleneck resolution',
            ],
            livrables: [
              'Operational action plans',
              'Dashboards and monitoring tools',
              'Periodic implementation reports',
              'Coordination frameworks and responsibility matrices',
            ],
            impacts: [
              'Smoother implementation of activities',
              'Fewer delays and better visibility on results',
              'Stronger steering and accountability',
            ],
            examples: [
              'Multi-stakeholder programs',
              'Structuring public projects',
              'Initiatives funded by technical and financial partners',
            ],
            kpi: '21+ years of sector experience',
          },
          institution: {
            title: 'Institutional support',
            shortLabel: 'Governance & organization',
            badge: 'Internal transformation',
            description:
              'Strengthening governance, procedures, and operational efficiency for public institutions and partner organizations.',
            detailTitle:
              'Institutional support and organizational strengthening',
            illustrationLabel: 'Governance, performance, and organization',
            intro:
              'MD2I supports institutions in improving their governance, internal mechanisms, and effectiveness through structured, pragmatic approaches adapted to the local context.',
            missions: [
              'Organizational and institutional diagnostics',
              'Review of procedures and decision-making circuits',
              'Clarification of roles, responsibilities, and processes',
              'Change management and modernization support',
            ],
            livrables: [
              'Procedure manuals',
              'Organizational and functional diagrams',
              'Institutional strengthening plans',
              'Governance frameworks and accountability tools',
            ],
            impacts: [
              'More effective and more readable institutions',
              'Better continuity in mission execution',
              'Better structured and more traceable decisions',
            ],
            examples: [
              'Ministries and public administrations',
              'Semi-public bodies',
              'Project partner structures',
            ],
            kpi: 'Clarified and more traceable procedures',
          },
          digital: {
            title: 'Digitalization and dematerialization',
            shortLabel: 'Digital processes',
            badge: 'High operational value',
            description:
              'Design and deployment of large-scale digitalization solutions with secure data management systems.',
            detailTitle:
              'Digitalization and dematerialization of processes',
            illustrationLabel: 'Digital flows and secure data circulation',
            intro:
              'MD2I designs and implements solutions that turn paper-based or fragmented processes into faster, traceable, and secure digital workflows.',
            missions: [
              'Mapping existing processes',
              'Designing digital processing journeys',
              'Deploying dematerialized platforms and tools',
              'Securing exchanges, access, and histories',
            ],
            livrables: [
              'Business applications and management interfaces',
              'Digitized validation flows',
              'Structured databases',
              'Data security and governance protocols',
            ],
            impacts: [
              'Shorter processing times',
              'Greater traceability of operations',
              'Centralized and more reliable information',
            ],
            examples: [
              'Document management',
              'Administrative workflows',
              'Large-scale program data',
            ],
            kpi: 'Faster and more secure processes',
          },
          software: {
            title: 'Software development and modeling',
            shortLabel: 'Tailored solutions',
            badge: 'Business-driven approach',
            description:
              'Tailored software solutions for public finance, land management, justice, education, and development programs.',
            detailTitle:
              'Software development and systems modeling',
            illustrationLabel:
              'Application architecture and functional design',
            intro:
              'MD2I develops solutions adapted to business needs, integrating process modeling, technical quality, and alignment with operational realities.',
            missions: [
              'Functional and technical analysis',
              'Data and process modeling',
              'Development of tailored applications',
              'Ongoing maintenance and continuous improvement',
            ],
            livrables: [
              'Web applications and business tools',
              'Functional and technical specifications',
              'Mockups and prototypes',
              'Data architectures and flow diagrams',
            ],
            impacts: [
              'Solutions better adapted to field needs',
              'Time savings in business operations',
              'Better integration between tools and services',
            ],
            examples: [
              'Public information systems',
              'Sector management platforms',
              'Program monitoring tools',
            ],
            kpi: 'Tools aligned with real usage',
          },
          hydraulic: {
            title: 'Hydraulic and civil engineering',
            shortLabel: 'Infrastructure & risks',
            badge: 'Territorial analysis',
            description:
              'Combining IT engineering with infrastructure and hydraulic challenges for risk prevention.',
            detailTitle:
              'Hydraulic engineering, civil engineering, and risk prevention',
            illustrationLabel:
              'Infrastructure, risks, and territorial modeling',
            intro:
              'MD2I combines technical expertise and analytical tools to support projects related to infrastructure, water management, and vulnerability reduction.',
            missions: [
              'Technical studies and field diagnostics',
              'Support for hydraulic infrastructure planning',
              'Risk and vulnerability analysis',
              'Integration of technical and territorial data',
            ],
            livrables: [
              'Technical reports and scoping notes',
              'Decision-support maps',
              'Risk prevention and management scenarios',
              'Documents supporting work programming',
            ],
            impacts: [
              'Better anticipation of risks',
              'Infrastructure better adapted to local contexts',
              'Better documented technical decisions',
            ],
            examples: [
              'Flood prevention',
              'Management of structures and networks',
              'Support for local authorities and territorial programs',
            ],
            kpi: 'Field-based decision support',
          },
          accounting: {
            title: 'Accounting and HR management software',
            shortLabel: 'Integrated management',
            badge: 'Internal steering',
            description:
              'Integrated financial, accounting, and human resources management systems compliant with international standards.',
            detailTitle:
              'Accounting, financial, and HR management software',
            illustrationLabel:
              'Integrated management of resources and operations',
            intro:
              'MD2I implements management tools that improve the reliability of accounting, financial, and HR data while strengthening internal steering.',
            missions: [
              'Analysis of management and reporting needs',
              'Configuration and adaptation of tools',
              'Integration of accounting, financial, and HR modules',
              'Team training and adoption support',
            ],
            livrables: [
              'Integrated management solutions',
              'Business repositories and configuration settings',
              'Automated statements and dashboards',
              'User guides and training materials',
            ],
            impacts: [
              'More reliable management data',
              'Consolidated view of internal operations',
              'Better control of flows and resources',
            ],
            examples: [
              'General and analytical accounting',
              'Human resources management',
              'Budget monitoring and reporting',
            ],
            kpi: 'Stronger reliability of management data',
          },
          studies: {
            title: 'Socio-economic studies and surveys',
            shortLabel: 'Studies & diagnostics',
            badge: 'Data-driven decision-making',
            description:
              'Surveys, diagnostics, and socio-economic studies at national and regional scale to support strategic decision-making.',
            detailTitle:
              'Socio-economic studies, surveys, and diagnostics',
            illustrationLabel: 'Data collection, analysis, and valorization',
            intro:
              'MD2I conducts studies and surveys designed to produce robust information that guides public strategies, projects, and investment decisions.',
            missions: [
              'Methodological design of studies',
              'Organization of data collection',
              'Statistical processing and qualitative analysis',
              'Production of operational recommendations',
            ],
            livrables: [
              'Study reports and diagnostics',
              'Consolidated databases',
              'Summary notes and strategic presentations',
              'Orientation and decision-support recommendations',
            ],
            impacts: [
              'Decisions better grounded in data',
              'Finer understanding of socio-economic realities',
              'More relevant prioritization of actions',
            ],
            examples: [
              'Baseline studies and evaluations',
              'Multi-region field surveys',
              'Sector and territorial analyses',
            ],
            kpi: 'Recommendations useful for decision-making',
          },
          ai: {
            title: 'Artificial intelligence',
            shortLabel: 'Intelligent automation',
            badge: 'Responsible innovation',
            description:
              'Integration of advanced data processing, automation, and decision-support tools into public information systems.',
            detailTitle:
              'Artificial intelligence and intelligent automation',
            illustrationLabel: 'Analysis, automation, and decision support',
            intro:
              'MD2I integrates artificial intelligence approaches to automate selected tasks, accelerate data analysis, and strengthen decision-support tools.',
            missions: [
              'Identification of relevant use cases',
              'Automation of repetitive and document-based tasks',
              'Structuring data for advanced use',
              'Integration of decision-support components',
            ],
            livrables: [
              'Automation flows',
              'Assistants and advanced processing tools',
              'Augmented analysis systems',
              'Responsible and governed usage frameworks',
            ],
            impacts: [
              'Significant time savings',
              'Better use of existing data',
              'Faster and more relevant decision support',
            ],
            examples: [
              'Automated information processing',
              'Document synthesis',
              'Decision support in public systems',
            ],
            kpi: 'Accelerated analysis and targeted automation',
          },
          training: {
            title: 'Training and capacity building',
            shortLabel: 'Skills development',
            badge: 'Sustainable adoption',
            description:
              'Professional training and long-term capacity-building programs based on a rigorous adult-learning approach.',
            detailTitle:
              'Training, support, and capacity building',
            illustrationLabel: 'Knowledge transfer, skills growth, and adoption',
            intro:
              'MD2I designs training and support programs that ensure lasting adoption of deployed methods, tools, and systems.',
            missions: [
              'Assessment of skills needs',
              'Design of adapted training paths',
              'Facilitation of theoretical and practical sessions',
              'Post-training support and consolidation of learning',
            ],
            livrables: [
              'Training modules',
              'Guides and educational materials',
              'Capacity-building plans',
              'Learning assessment systems',
            ],
            impacts: [
              'Skills growth for teams',
              'More lasting adoption of tools',
              'Greater autonomy for beneficiaries',
            ],
            examples: [
              'Business training',
              'Training in the use of digital tools',
              'Long-term institutional strengthening',
            ],
            kpi: 'More sustainable adoption of systems',
          },
        },
      },
      leadForm: {
        title: 'Request information',
        description:
          'Fill out this form to be contacted by the MD2I team.',
        productConcerned: 'Product concerned: {{product}}',
        progressAria: 'Form progress',
        progress: 'Step {{current}} of {{total}}',
        steps: {
          need: {
            label: 'Need',
            title: 'Your need',
            description:
              'Choose the relevant product or service and the type of request.',
          },
          contact: {
            label: 'Contact',
            title: 'Your contact details',
            description:
              'Provide the information needed to contact you.',
          },
          company: {
            label: 'Company',
            title: 'Your company',
            description:
              'Help us better understand your professional context.',
          },
          message: {
            label: 'Message',
            title: 'Your message',
            description:
              'Briefly describe your need to receive a suitable response.',
          },
        },
        requestTypes: {
          DEMO: { label: 'Demo', option: 'Request a demo' },
          QUOTE: { label: 'Quote', option: 'Request a quote' },
          CONTACT: { label: 'Sales contact', option: 'Sales contact' },
          CALLBACK: { label: 'Callback', option: 'Request a callback' },
          INFO: {
            label: 'Information',
            option: 'Receive more information',
          },
          SUPPORT: { label: 'Support', option: 'Assistance / support' },
          TRAINING: { label: 'Training', option: 'Training' },
          MAINTENANCE: { label: 'Maintenance', option: 'Maintenance' },
          TENDER: { label: 'Tender', option: 'Tender' },
          OTHER: { label: 'Other request', option: 'Other request' },
        },
        fields: {
          product: 'Relevant product or service',
          requestType: 'Request type',
          firstName: 'First name',
          lastName: 'Last name',
          email: 'Email *',
          phone: 'Phone',
          jobTitle: 'Job title',
          company: 'Company *',
          country: 'Country',
          city: 'City',
          message: 'Message *',
        },
        placeholders: {
          firstName: 'Your first name',
          lastName: 'Your last name',
          jobTitle: 'HR manager, CFO...',
          company: 'Company name',
          country: 'Madagascar, France...',
          city: 'Your city',
          message:
            'Describe your need, number of users, desired timeline...',
        },
        summary: {
          title: 'Summary',
          productSelected: 'Selected product: {{product}}',
          general:
            'Your request will be recorded as a general sales request.',
        },
        consent:
          'I agree to be contacted by MD2I about my request.',
        finalSummary: {
          title: 'Before sending',
          text:
            'Your request will be sent to the MD2I team and recorded in the CRM for sales follow-up.',
        },
        actions: {
          back: 'Back',
          sending: 'Sending...',
          submit: 'Send my request',
          continue: 'Continue',
        },
        securityNote:
          'Secure form: field validation, anti-spam, and server-side checks.',
        success:
          'Your request has been sent. The MD2I team will contact you soon.',
        validation: {
          productRequired: 'Please choose a product or service.',
          emailRequired: 'Email is required.',
          emailInvalid: 'Please enter a valid email address.',
          phoneShort: 'The phone number seems too short.',
          companyRequired: 'Please enter your company or organization.',
          messageRequired: 'Please briefly describe your need.',
          messageShort: 'Add a few more details.',
          consentRequired: 'You must agree to be contacted.',
          blocked: 'Your request could not be validated.',
          wait: 'Please wait a few seconds before sending.',
          fixFields: 'Please correct the highlighted fields.',
          invalidServerResponse: 'Invalid server response.',
          submitError: 'Error while sending.',
          submitFailed: 'Unable to send your request.',
        },
      },
      productsPage: {
        heroEyebrow: 'Product catalog',
        titlePrefix: 'Our',
        titleEmphasis: 'Solutions',
        subtitle:
          'Software, modules, and business tools designed for demanding teams. Explore our catalog, compare pricing, and request a demo directly.',
        statsProducts: 'products',
        statsCategories: 'categories',
        searchPlaceholder: 'Search for a solution...',
        filtersOpen: 'Show filters',
        filtersClose: 'Close filters',
        sortOpen: 'Show sorting',
        sortClose: 'Close sorting',
        panelAutoClose: 'Closes automatically after 6 seconds',
        filtersTitle: 'Filters',
        sortTitle: 'Sorting',
        closeFilters: 'Close filters',
        closeSort: 'Close sorting',
        categories: 'Categories',
        allCategories: 'All',
        price: 'Price',
        minPrice: 'Min price',
        maxPrice: 'Max price',
        visual: 'Visual',
        allImages: 'All',
        withImage: 'With image',
        withoutImage: 'Without image',
        sortBy: 'Sort by',
        sort: {
          dateDesc: 'Newest',
          dateAsc: 'Oldest',
          priceAsc: 'Price ascending',
          priceDesc: 'Price descending',
          nameAsc: 'Name A → Z',
          nameDesc: 'Name Z → A',
        },
        resultCount_one:
          '{{count}} solution available',
        resultCount_other:
          '{{count}} solutions available',
        emptyTitle: 'No solution found',
        emptyText: 'Try another keyword or reset the active filters.',
        errors: {
          load: 'Unable to load products.',
        },
        card: {
          eyebrow: 'MD2I solution',
          category: 'Category',
          updated: 'Updated',
          price: 'Price',
          catalog: 'Catalog',
          productSheet: 'Product sheet',
          viewSheet: 'View sheet',
          requestDemo: 'Request a demo',
          noDescription: 'No description available.',
          readMore: 'Read more',
          collapse: 'Collapse',
          onRequest: 'On request',
        },
      },
      productDetail: {
        loading: 'Loading...',
        notFound: 'Product not found.',
        back: 'Back',
        publication: 'Publication',
        viewAllProducts: 'View all products',
        requestQuote: 'Request a demo / quote',
        requestDemo: 'Request a demo',
        requestDemoAria: 'Request a demo or quote',
        showDetails: 'Show details',
        detailsTitle: 'Product details',
        autoClose: 'Auto-closes after 6 seconds',
        closeDetails: 'Close details',
      },
      productLeadPage: {
        backProducts: 'Back to products',
        viewProduct: 'View product sheet',
        eyebrow: 'Sales request',
        fallbackExcerpt:
          'Present your need to the MD2I team to receive a suitable response.',
        meta: {
          product: 'Product',
          price: 'Price',
        },
        afterSend: {
          title: 'After sending',
          sent: 'Your request is sent to the MD2I sales team.',
          product: 'The relevant product is automatically linked to the lead.',
          crm: 'A CRM follow-up is created to ensure proper tracking.',
        },
        formFor: 'Request for',
        formHeadingPrefix: 'Request a',
        demo: 'demo',
        formHeadingOr: 'or a',
        quote: 'quote',
        formSub:
          'A few details are enough to qualify your request, secure sales follow-up, and direct you to the right MD2I response.',
        chips: {
          structured: 'Structured sales response',
          secure: 'Secure anti-spam form',
          crm: 'Product linked to the CRM',
        },
        steps: {
          describe: {
            title: 'You describe the need',
            text: 'Share your context, contact details, and preferred request type.',
          },
          qualify: {
            title: 'MD2I qualifies the request',
            text: 'The product, source, and sales information are linked.',
          },
          reply: {
            title: 'You receive a response',
            text: 'The team can propose a demo, quote, or callback.',
          },
        },
        footer: {
          title: 'Need to compare several solutions?',
          text:
            'Browse the full MD2I catalog before finalizing your request.',
          cta: 'View catalog',
        },
      },
      articlesPage: {
        heroEyebrow: 'MD2I publications',
        titlePrefix: 'Our',
        titleEmphasis: 'Articles',
        subtitle:
          'Discover our publications, updates, and news about our activities',
        statsArticles: 'articles',
        statsCategories: 'categories',
        searchPlaceholder: 'Search for an article...',
        filtersOpen: 'Show filters',
        filtersClose: 'Close filters',
        sortOpen: 'Show sorting',
        sortClose: 'Close sorting',
        filtersTitle: 'Filters',
        sortTitle: 'Sorting',
        categories: 'Categories',
        allCategories: 'All',
        sortBy: 'Sort by',
        sort: {
          dateDesc: 'Newest',
          dateAsc: 'Oldest',
          titleAsc: 'A → Z',
          titleDesc: 'Z → A',
        },
        resultCount_one:
          '{{count}} article available',
        resultCount_other:
          '{{count}} articles available',
        emptyTitle: 'No article found',
        emptyText: 'Try another keyword or reset the active filters.',
        errors: {
          load: 'Unable to load articles.',
        },
        card: {
          eyebrow: 'MD2I article',
          readArticle: 'Read article',
          noExcerpt: 'No excerpt available.',
          readMore: 'Read more',
          collapse: 'Show less',
        },
      },
      postDetail: {
        loading: 'Loading...',
        notFound: 'Post not found.',
        back: 'Back',
      },
      contactPage: {
        heroEyebrow: 'Contact MD2I',
        title: 'A question, a project, a request?',
        titleEmphasis: "Let's talk.",
        subtitle:
          'Our team directs you to the right contact for a demo, quote, technical request, training, or strategic partnership.',
        ctaMessage: 'Send a message',
        ctaSales: 'Sales request',
        ctaDiscover: 'Discover MD2I',
        trust: {
          response: 'Structured response',
          crm: 'CRM follow-up',
          support: 'Professional support',
        },
        availability: {
          kicker: 'Availability',
          title: 'A team dedicated to your request',
          text: 'Your message is qualified and forwarded to the most relevant team to speed up processing.',
        },
        stats: {
          delayLabel: 'average delay',
          delayText: 'fast response',
          polesLabel: 'expert teams',
          polesText: 'sales, support, technical, management',
          officesLabel: 'locations',
          officesText: 'Madagascar · France',
        },
        cards: {
          pill: 'Direct contacts',
          title: 'The right contact, without detours',
          subtitle:
            'Select the department that matches your need to receive a faster, clearer, better-routed response.',
          direction: {
            title: 'Executive management',
            description:
              'Strategic partnerships, institutional exchanges, and high-level decisions.',
            tag: 'Strategy',
          },
          sales: {
            title: 'Sales team',
            description:
              'Company presentations, demos, quotes, and sales requests.',
            tag: 'Sales',
          },
          support: {
            title: 'Support & training',
            description:
              'User assistance, training, onboarding, and operational follow-up.',
            tag: 'Support',
          },
          technical: {
            title: 'Development & technical',
            description:
              'Integrations, software improvements, APIs, and technical architecture.',
            tag: 'Technical',
          },
        },
        form: {
          pill: 'Secure form',
          titleLine1: 'Send us',
          titleLine2: 'your message',
          note:
            'All fields marked * are required. Your request will be forwarded to the relevant team.',
          successTitle: 'Message sent',
          successText:
            'Thank you for your request. The MD2I team will reply as soon as possible.',
          reference: 'Reference: {{id}}',
          anotherMessage: 'Send another message',
          stepContact: 'Your contact details',
          stepContactText: 'We will use this information to reply to you.',
          firstName: 'First name *',
          firstNamePlaceholder: 'Your first name',
          lastName: 'Last name *',
          lastNamePlaceholder: 'Your last name',
          email: 'Email *',
          phone: 'Phone',
          phonePlaceholder: '+261 34 ...',
          organization: 'Organization',
          organizationPlaceholder: 'Your company or institution name',
          stepRequest: 'Your request',
          stepRequestText: 'Select the subject, then describe your need.',
          subject: 'Subject *',
          subjectPlaceholder: 'Select...',
          message: 'Message *',
          messagePlaceholder:
            'Describe your need, context, timing, or question...',
          summaryTitle: 'Request summary',
          summaryFallback: 'Select a subject',
          summaryText:
            'Your message will be handled by the MD2I team and routed to the right department.',
          legal:
            'By submitting this form, you agree that MD2I may process your data to respond to your request.',
          sending: 'Sending...',
          submit: 'Send message',
        },
        subjects: {
          sales: 'Sales request',
          demo: 'Demo',
          quote: 'Quote',
          support: 'Technical support',
          training: 'Training',
          partnership: 'Partnership',
          recruitment: 'Recruitment',
          other: 'Other',
        },
        validation: {
          blocked: 'Submission blocked.',
          fixFields: 'Please correct the highlighted fields.',
          sendFailed: 'Unable to send the message.',
          sendError: 'An error occurred while sending.',
          firstNameRequired: 'First name is required.',
          lastNameRequired: 'Last name is required.',
          emailRequired: 'Email is required.',
          emailInvalid: 'Invalid email.',
          phoneInvalid: 'Invalid phone number.',
          subjectRequired: 'Subject is required.',
          subjectInvalid: 'Invalid subject.',
          messageRequired: 'Message is required.',
          min2: 'Minimum 2 characters.',
          min10: 'Minimum 10 characters.',
          max120: 'Maximum 120 characters.',
          max5000: 'Maximum 5000 characters.',
        },
        offices: {
          pill: 'Locations',
          title: 'Our offices',
          operational: 'Operational office',
          institutional: 'Institutional representation',
          tanaAddress: 'Address to be completed, Antananarivo, Madagascar',
          parisAddress: 'Address to be completed, Paris, France',
        },
        frequent: {
          pill: 'Frequent requests',
          title: 'We can help you',
          presentation: 'Request a company presentation',
          demo: 'Schedule an online demo',
          quote: 'Get a quote or proposal',
          support: 'Receive technical support or training',
          routing: 'Be routed to the right contact',
        },
        nudge: {
          label: 'Priority',
          text: 'Need a fast response?',
          cta: 'Write directly →',
        },
      },
      contactCommercial: {
        eyebrow: 'MD2I sales contact',
        title: "Let's discuss your need and find the",
        titleEmphasis: 'right solution.',
        subtitle:
          'Select a product or service, describe your request, and the MD2I team will get back to you with a response suited to your context.',
        cta: 'Send a request',
        hint: 'Fast response from the sales team',
        cardTitle: 'Personalized support',
        cardText:
          'Your request is automatically sent to the MD2I CRM so our sales team can follow it up.',
        solutionsAvailable: 'available solutions',
        crmTracking: 'structured follow-up',
        benefits: {
          adaptedTitle: 'Tailored solution',
          adaptedText:
            'We analyze your request to direct you to the right product or service.',
          followTitle: 'Sales follow-up',
          followText:
            'Your request is recorded properly to make follow-up easier.',
          exchangeTitle: 'Professional exchange',
          exchangeText:
            'You are contacted with a clear, structured response adapted to your project.',
        },
        introBadge: 'Your request',
        introTitle: 'Sales request',
        introText:
          'Choose the product or service you are interested in, then enter your information. This helps us better understand your need before contacting you.',
        points: {
          qualification: 'Clear qualification of your need.',
          crm: 'Structured sales follow-up in the CRM.',
          product: 'Response adapted to the selected product or service.',
        },
        warning:
          'No published product is available at the moment. You can still send a general request if the form allows it.',
        formTitle: 'Sales request',
        formDescription:
          'Choose the product or service you are interested in. The MD2I team will contact you quickly.',
        reassuranceBadge: 'MD2I',
        reassuranceTitle:
          'One contact to turn your need into a solution.',
        reassuranceText:
          'Whether your request concerns a website, a digital solution, a CRM, automation, maintenance, or support, we help you clarify the best approach.',
      },
      aboutPage: {
        heroBadge: 'The MD2I firm',
        heroTitleLine1: 'A discreet presence in form,',
        heroTitleLine2: 'solid in execution',
        heroText:
          'Since 1987, MD2I has designed and deployed software solutions, methods, and support systems dedicated to managing, monitoring, and evaluating development projects. The firm acts with one constant priority: producing clear, robust, and durable tools that are truly useful to teams.',
        referencesCta: 'View our references',
        contactCta: 'Contact us',
        panelLabel: 'Coordination',
        panelText:
          'A focused organization, identified teams, and direct contact points for every business need.',
        metrics: {
          created: 'Firm founded',
          countries: 'Countries and regional groups',
          offices: 'Main locations',
        },
        sections: {
          figuresKicker: 'Key markers',
          figuresTitle: 'A few figures to situate MD2I',
          figuresText:
            "A quick reading of the markers that reflect the firm's experience, international reach, and intervention capacity.",
          positioningKicker: 'Positioning',
          positioningTitle:
            'Useful tools, a readable method, lasting support',
          positioningText:
            'MD2I favors a restrained approach: limiting visual complexity, clarifying usage, and focusing effort on process quality, data reliability, and support continuity.',
          historyKicker: 'History',
          historyTitle: 'A trajectory built over time',
          historyText:
            "The firm's evolution reflects a clear continuity: business expertise, tool development, international openness, and lasting user support.",
          teamKicker: 'The team',
          teamTitle: 'Teams, domains, and contact details',
          teamText:
            'Each card presents an area of work, a clear role, and direct contact details to route requests quickly.',
          organisationKicker: 'Organization',
          organisationTitle:
            'A structure designed to cover the full intervention cycle',
          organisationText:
            'The firm connects complementary teams to link design, development, quality, training, and maintenance.',
          approachKicker: 'Our approach',
          approachTitle: 'What guides the way we work',
          approachText:
            'Beyond tools, MD2I defends a working method based on understanding real usage, execution quality, and continuity of support.',
          locationKicker: 'Location',
          locationTitle: 'Historical roots and operational presence',
          principlesKicker: 'Principles',
          principlesTitle: 'The standards we hold ourselves to',
          principlesText:
            'This requirement is reflected in tool design, user support, and deliverable quality.',
          ctaKicker: 'Go further',
          ctaTitle: 'A specific need? Contact the right person directly',
          ctaText:
            'Go to the Contact page to write to the firm, request a demo, ask for a presentation, or be connected with the most relevant team.',
          ctaButton: 'Go to contact page',
        },
        memberMeta: {
          email: 'Email',
          phone: 'Phone',
          location: 'Location',
        },
        keyFigures: [
          {
            label: 'year founded',
            text:
              'MD2I was founded in Paris with a strong specialization in managing and evaluating development projects.',
          },
          {
            label: 'countries and regional groups',
            text:
              'The firm has worked on five continents in varied institutional contexts.',
          },
          {
            label: 'working languages',
            text:
              'Missions, training, and exchanges are conducted in French, English, and Portuguese.',
          },
          {
            label: 'locations',
            text:
              'Historical roots in Paris and an operational presence in Antananarivo.',
          },
        ],
        history: [
          {
            year: '1987',
            title: 'Firm founded',
            text:
              'MD2I was created in Paris by specialists in engineering, economics, and development project management.',
          },
          {
            year: 'Growth',
            title: 'Structuring business solutions',
            text:
              'The firm designs tools dedicated to project management, monitoring, and evaluation, aligned with partner requirements.',
          },
          {
            year: 'International',
            title: 'Deployment across several continents',
            text:
              'MD2I solutions and support are used in many countries, with a strong ability to adapt to field realities.',
          },
          {
            year: 'Today',
            title: 'Long-term support and continuous evolution',
            text:
              'MD2I continues developing its tools, provides maintenance, supports users, and strengthens the quality of its deliverables.',
          },
        ],
        teamMembers: [
          {
            name: 'Executive management',
            role: 'Strategic steering',
            domain:
              'Institutional vision, general coordination, partnerships',
            bio:
              "Coordinates the firm's orientations, institutional partnerships, and overall development of activities.",
          },
          {
            name: 'Analysis & R&D',
            role: 'Modeling and innovation',
            domain:
              'Functional analysis, needs structuring, applied research',
            bio:
              'Structures needs, formalizes processes, conducts functional analysis, and supports the evolution of business solutions.',
          },
          {
            name: 'Software development',
            role: 'Design and delivery',
            domain:
              'Technical architecture, development, evolutionary maintenance',
            bio:
              "Ensures the technical architecture, application development, and robustness of the firm's deliverables.",
          },
          {
            name: 'Training & support',
            role: 'User support',
            domain: 'Training, assistance, operational support',
            bio:
              'Organizes training, coordinates assistance, and facilitates operational adoption of tools in the field.',
          },
        ],
        teamUnits: [
          {
            title:
              'Commercial development, training, and product maintenance',
            subtitle: 'Partner relations and user support',
            points: [
              'Follow-up of relationships with donors, institutions, and project teams.',
              'Organization of training and tool onboarding.',
              'Operational assistance and product maintenance.',
              'Responsiveness in handling user needs.',
            ],
          },
          {
            title: 'Research, development, and analysis',
            subtitle: 'Design, modeling, and monitoring',
            points: [
              'Research and development in software engineering.',
              'Modeling processes compliant with partner procedures.',
              'Technology and regulatory monitoring.',
              'Structuring databases and formalizing specifications.',
            ],
          },
          {
            title: 'Software development',
            subtitle: 'Engineering and production',
            points: [
              "Design and development of the firm's business applications.",
              'Implementation of robust, scalable solutions adapted to field realities.',
              'Mobilization of experienced technical profiles.',
              'Continuous improvement of tool performance and reliability.',
            ],
          },
          {
            title: 'Testing and quality assurance',
            subtitle: 'Reliability, consistency, and compliance',
            points: [
              'Functional and usability testing.',
              'Verification of data consistency and generated outputs.',
              'Compatibility checks across different environments.',
              'Validation of functional and quality requirements.',
            ],
          },
        ],
        commitments: [
          {
            title: 'Business understanding',
            text:
              'Each solution is designed from the real constraints of managing, monitoring, and evaluating projects.',
          },
          {
            title: 'Durable tools',
            text:
              'MD2I favors reliable, maintainable solutions that teams can actually use over time.',
          },
          {
            title: 'Skills transfer',
            text:
              'Training and support are an integral part of successful deployments.',
          },
          {
            title: 'Operational proximity',
            text:
              'The firm combines strategic vision with concrete support capacity for users.',
          },
        ],
        principles: [
          'Methodological rigor',
          'Field understanding',
          'Deliverable quality',
          'Continuous evolution',
          'Proximity to users',
          'Operational reliability',
        ],
        offices: [
          {
            text:
              "The firm's historical base since its creation, at the heart of its institutional and strategic development.",
          },
          {
            text:
              'A technical and operational office that ensures proximity, responsiveness, and support close to needs.',
          },
        ],
      },
    },
  },
} satisfies Resource
