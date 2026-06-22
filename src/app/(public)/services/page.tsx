'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/app/context/ThemeContext";
import { createPortal } from "react-dom";
import service from "./service.jpg";

type IconProps = {
  color: string;
  size?: number;
};

type ServiceCategory = string;

type ModalTab = "overview" | "missions" | "livrables" | "impacts";

type ServiceCategoryId =
  | "pilotage"
  | "transformation"
  | "infrastructure"
  | "dataAi"
  | "skills";

type CategoryFilter = ServiceCategoryId | "all";

type ServiceProductBridge = {
  href: string;
  label: string;
  hint: string;
};

type Service = {
  id: string;
  category: ServiceCategory;
  Icon: React.ComponentType<IconProps>;
  title: string;
  shortLabel: string;
  badge: string;
  description: string;
  accent: string;
  accentLight: string;
  detailTitle: string;
  illustrationLabel: string;
  intro: string;
  missions: string[];
  livrables: string[];
  impacts: string[];
  examples: string[];
  kpi: string;
  imageUrl: string;
};

const BRAND = {
  charcoal: "#2F2F31",
  graphite: "#5F6062",
  gold: "#E1A12C",
  goldSoft: "#F3D28B",
  ivory: "#F8F7F4",
};

const SERVICE_FIXED_BG_URL = service.src;

function serviceTokens(dark: boolean) {
  return {
    bg: dark ? "#090D13" : "#F8FAFC",
    bgSoft: dark ? "#101620" : "#FDFEFF",
    panel: dark ? "#141A24" : "#FFFFFF",
    panel2: dark ? "#18202B" : "#F8FAFC",
    panel3: dark ? "#1C2633" : "#F1F5F9",
    border: dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.09)",
    borderStrong: dark ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.16)",
    text: dark ? "#F8FAFC" : "#1E293B",
    textSoft: dark ? "rgba(248,250,252,.76)" : "#475569",
    textMute: dark ? "rgba(248,250,252,.58)" : "#64748B",
    accent: BRAND.gold,
    accentSoft: dark ? "rgba(225,161,44,.14)" : "rgba(225,161,44,.11)",
    accentSoft2: BRAND.goldSoft,
    badgeBg: dark ? "rgba(225,161,44,.12)" : "rgba(225,161,44,.10)",
    badgeBorder: dark ? "rgba(225,161,44,.22)" : "rgba(225,161,44,.22)",
    overlay: dark ? "rgba(3,7,18,.72)" : "rgba(15,23,42,.50)",
    heroGlowA: dark
      ? "linear-gradient(135deg, rgba(225,161,44,.16) 0%, rgba(225,161,44,0) 62%)"
      : "linear-gradient(135deg, rgba(225,161,44,.12) 0%, rgba(225,161,44,0) 62%)",
    heroGlowB: dark
      ? "linear-gradient(135deg, rgba(37,99,235,.10) 0%, rgba(37,99,235,0) 68%)"
      : "linear-gradient(135deg, rgba(37,99,235,.08) 0%, rgba(37,99,235,0) 68%)",
    cardShadow: dark
      ? "0 10px 28px rgba(0,0,0,.24)"
      : "0 12px 30px rgba(15,23,42,.07)",
    cardShadowHover: dark
      ? "0 18px 46px rgba(0,0,0,.34), 0 8px 18px rgba(0,0,0,.20)"
      : "0 18px 46px rgba(15,23,42,.11), 0 8px 18px rgba(15,23,42,.06)",
    modalShadow: dark
      ? "0 34px 110px rgba(0,0,0,.46)"
      : "0 34px 110px rgba(15,23,42,.22)",
    ctaGradient: dark
      ? "linear-gradient(135deg, #0F172A 0%, #1E293B 52%, #334155 100%)"
      : "linear-gradient(135deg, #1E293B 0%, #334155 52%, #475569 100%)",
    ctaText: "#FFFFFF",
    ctaSub: dark ? "rgba(255,255,255,.76)" : "rgba(255,255,255,.76)",
    fixedBgImage: dark
      ? `linear-gradient(135deg, rgba(225,161,44,.08) 0%, transparent 45%), linear-gradient(225deg, rgba(37,99,235,.07) 0%, transparent 48%)`
      : `linear-gradient(135deg, rgba(225,161,44,.08) 0%, transparent 44%), linear-gradient(225deg, rgba(37,99,235,.06) 0%, transparent 46%)`,
  };
}

/* ───────────────────────── ICONS ───────────────────────── */

const Icons = {
  Settings: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  Landmark: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  Layers: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Code: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Droplets: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05Z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  ),
  BookOpen: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" />
    </svg>
  ),
  LineChart: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Brain: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  ),
  GraduationCap: ({ color, size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5Z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Sparkles: ({ color, size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3Z" />
      <path d="m19 15 .95 2.05L22 18l-2.05.95L19 21l-.95-2.05L16 18l2.05-.95L19 15Z" />
      <path d="m5 14 .95 2.05L8 17l-2.05.95L5 20l-.95-2.05L2 17l2.05-.95L5 14Z" />
    </svg>
  ),
  ArrowRight: ({ color, size = 15 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ChevronRight: ({ color, size = 13 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

/* ───────────────────────── DATA ───────────────────────── */

const baseServices: Service[] = [
  {
    id: "project",
    category: "Pilotage",
    Icon: Icons.Settings,
    title: "Assistance technique à la gestion de projet",
    shortLabel: "Pilotage opérationnel",
    badge: "Service stratégique",
    description:
      "Maîtrise d'ouvrage, coordination et suivi pour garantir la qualité d'exécution, la redevabilité et la durabilité des programmes complexes.",
    accent: BRAND.gold,
    accentLight: "#FFF6E5",
    detailTitle: "Assistance technique à la gestion de projet",
    illustrationLabel: "Pilotage, coordination et suivi de programmes",
    intro:
      "MD2I accompagne les projets complexes dans leur cadrage, leur planification, leur exécution et leur suivi afin de sécuriser les résultats, fluidifier la coordination et renforcer la capacité de pilotage.",
    missions: [
      "Structuration des dispositifs de pilotage",
      "Appui à la planification stratégique et opérationnelle",
      "Organisation du suivi, du reporting et de la coordination",
      "Accompagnement à la prise de décision et à la résolution de blocages",
    ],
    livrables: [
      "Plans d'action opérationnels",
      "Tableaux de bord et outils de suivi",
      "Rapports périodiques de mise en œuvre",
      "Cadres de coordination et matrices de responsabilités",
    ],
    impacts: [
      "Exécution plus fluide des activités",
      "Réduction des retards et meilleure visibilité sur les résultats",
      "Pilotage renforcé et meilleure redevabilité",
    ],
    examples: [
      "Programmes multi-acteurs",
      "Projets publics structurants",
      "Initiatives financées par partenaires techniques et financiers",
    ],
    kpi: "21+ ans d'expérience sectorielle",
    imageUrl: "/services/illustrations/project.svg",
  },
  {
    id: "institution",
    category: "Pilotage",
    Icon: Icons.Landmark,
    title: "Appui institutionnel",
    shortLabel: "Gouvernance & organisation",
    badge: "Transformation interne",
    description:
      "Renforcement de la gouvernance, des procédures et de l'efficacité opérationnelle des institutions publiques et organisations partenaires.",
    accent: BRAND.charcoal,
    accentLight: "#F3F4F6",
    detailTitle: "Appui institutionnel et renforcement organisationnel",
    illustrationLabel: "Gouvernance, performance et organisation",
    intro:
      "MD2I soutient les institutions dans l'amélioration de leur gouvernance, de leurs mécanismes internes et de leur efficacité, à travers des approches structurées, pragmatiques et adaptées au contexte local.",
    missions: [
      "Diagnostic organisationnel et institutionnel",
      "Révision des procédures et circuits de décision",
      "Clarification des rôles, responsabilités et processus",
      "Accompagnement au changement et à la modernisation",
    ],
    livrables: [
      "Manuels de procédures",
      "Schémas organisationnels et fonctionnels",
      "Plans de renforcement institutionnel",
      "Cadres de gouvernance et outils de redevabilité",
    ],
    impacts: [
      "Institutions plus efficaces et plus lisibles",
      "Meilleure continuité dans l'exécution des missions",
      "Décisions mieux structurées et plus traçables",
    ],
    examples: [
      "Ministères et administrations publiques",
      "Organismes parapublics",
      "Structures partenaires de projets",
    ],
    kpi: "Procédures clarifiées et mieux traçables",
    imageUrl: "/services/illustrations/institution.svg",
  },
  {
    id: "digital",
    category: "Transformation",
    Icon: Icons.Layers,
    title: "Digitalisation et dématérialisation",
    shortLabel: "Processus numériques",
    badge: "Haute valeur opérationnelle",
    description:
      "Conception et déploiement de solutions de digitalisation à grande échelle avec des systèmes sécurisés de gestion de données.",
    accent: BRAND.gold,
    accentLight: "#FFF6E5",
    detailTitle: "Digitalisation et dématérialisation des processus",
    illustrationLabel: "Flux numériques et circulation sécurisée des données",
    intro:
      "MD2I conçoit et met en œuvre des solutions qui transforment les processus papier ou fragmentés en workflows numériques plus rapides, traçables et sécurisés.",
    missions: [
      "Cartographie des processus existants",
      "Conception des parcours de traitement numériques",
      "Mise en place de plateformes et d'outils dématérialisés",
      "Sécurisation des échanges, accès et historiques",
    ],
    livrables: [
      "Applications métiers et interfaces de gestion",
      "Flux de validation numérisés",
      "Bases de données structurées",
      "Protocoles de sécurité et de gouvernance des données",
    ],
    impacts: [
      "Réduction des délais de traitement",
      "Traçabilité accrue des opérations",
      "Centralisation et fiabilité des informations",
    ],
    examples: [
      "Gestion documentaire",
      "Workflow administratif",
      "Données de programme à grande échelle",
    ],
    kpi: "Processus plus rapides et mieux sécurisés",
    imageUrl: "/services/illustrations/digital.svg",
  },
  {
    id: "software",
    category: "Transformation",
    Icon: Icons.Code,
    title: "Développement logiciel et modélisation",
    shortLabel: "Solutions sur mesure",
    badge: "Approche métier",
    description:
      "Solutions logicielles sur mesure pour les finances publiques, le foncier, la justice, l'éducation et les programmes de développement.",
    accent: BRAND.charcoal,
    accentLight: "#F3F4F6",
    detailTitle: "Développement logiciel et modélisation des systèmes",
    illustrationLabel: "Architecture applicative et conception fonctionnelle",
    intro:
      "MD2I développe des solutions adaptées aux besoins métiers, en intégrant la modélisation des processus, la qualité technique et l'alignement avec les réalités opérationnelles.",
    missions: [
      "Analyse fonctionnelle et technique",
      "Modélisation des données et des processus",
      "Développement d'applications sur mesure",
      "Maintenance évolutive et amélioration continue",
    ],
    livrables: [
      "Applications web et outils métiers",
      "Spécifications fonctionnelles et techniques",
      "Maquettes et prototypes",
      "Architectures de données et schémas de flux",
    ],
    impacts: [
      "Solutions mieux adaptées aux besoins terrain",
      "Gain de temps dans les opérations métiers",
      "Meilleure intégration entre outils et services",
    ],
    examples: [
      "Systèmes d'information publics",
      "Plateformes de gestion sectorielle",
      "Outils de suivi de programmes",
    ],
    kpi: "Outils alignés sur les usages réels",
    imageUrl: "/services/illustrations/software.svg",
  },
  {
    id: "hydraulic",
    category: "Infrastructure",
    Icon: Icons.Droplets,
    title: "Génie hydraulique et génie civil",
    shortLabel: "Infrastructure & risques",
    badge: "Analyse territoriale",
    description:
      "Association de l'ingénierie informatique aux problématiques d'infrastructure et hydrauliques pour la prévention des risques.",
    accent: BRAND.gold,
    accentLight: "#FFF6E5",
    detailTitle: "Génie hydraulique, génie civil et prévention des risques",
    illustrationLabel: "Infrastructures, risques et modélisation territoriale",
    intro:
      "MD2I associe expertise technique et outils d'analyse pour appuyer les projets liés aux infrastructures, à la gestion de l'eau et à la réduction des vulnérabilités.",
    missions: [
      "Études techniques et diagnostics de terrain",
      "Appui à la planification d'infrastructures hydrauliques",
      "Analyse des risques et vulnérabilités",
      "Intégration de données techniques et territoriales",
    ],
    livrables: [
      "Rapports techniques et notes de cadrage",
      "Cartographies d'appui à la décision",
      "Scénarios de prévention et de gestion des risques",
      "Documents d'aide à la programmation des travaux",
    ],
    impacts: [
      "Meilleure anticipation des risques",
      "Infrastructure mieux adaptée aux contextes locaux",
      "Décisions techniques mieux documentées",
    ],
    examples: [
      "Prévention des inondations",
      "Gestion des ouvrages et réseaux",
      "Appui aux collectivités et programmes territoriaux",
    ],
    kpi: "Aide à la décision fondée sur le terrain",
    imageUrl: "/services/illustrations/hydraulic.svg",
  },
  {
    id: "accounting",
    category: "Transformation",
    Icon: Icons.BookOpen,
    title: "Logiciels de gestion comptable et RH",
    shortLabel: "Gestion intégrée",
    badge: "Pilotage interne",
    description:
      "Systèmes intégrés de gestion financière, comptable et des ressources humaines conformes aux standards internationaux.",
    accent: BRAND.charcoal,
    accentLight: "#F3F4F6",
    detailTitle: "Logiciels de gestion comptable, financière et RH",
    illustrationLabel: "Gestion intégrée des ressources et des opérations",
    intro:
      "MD2I met en place des outils de gestion permettant d'améliorer la fiabilité des données comptables, financières et RH tout en renforçant le pilotage interne.",
    missions: [
      "Analyse des besoins de gestion et de reporting",
      "Paramétrage et adaptation des outils",
      "Intégration des modules comptables, financiers et RH",
      "Formation des équipes et accompagnement à l'appropriation",
    ],
    livrables: [
      "Solutions intégrées de gestion",
      "Référentiels et paramétrages métier",
      "États et tableaux de bord automatisés",
      "Guides d'utilisation et supports de formation",
    ],
    impacts: [
      "Données de gestion plus fiables",
      "Vision consolidée des opérations internes",
      "Meilleur contrôle des flux et des ressources",
    ],
    examples: [
      "Comptabilité générale et analytique",
      "Gestion des ressources humaines",
      "Suivi budgétaire et reporting",
    ],
    kpi: "Fiabilité renforcée des données de gestion",
    imageUrl: "/services/illustrations/accounting.svg",
  },
  {
    id: "studies",
    category: "Data & IA",
    Icon: Icons.LineChart,
    title: "Études socio-économiques et enquêtes",
    shortLabel: "Études & diagnostics",
    badge: "Décision fondée sur les données",
    description:
      "Enquêtes, diagnostics et études socio-économiques à l'échelle nationale et régionale pour appuyer la prise de décision stratégique.",
    accent: BRAND.gold,
    accentLight: "#FFF6E5",
    detailTitle: "Études socio-économiques, enquêtes et diagnostics",
    illustrationLabel: "Collecte, analyse et valorisation de données",
    intro:
      "MD2I réalise des études et enquêtes destinées à produire des informations robustes pour orienter les stratégies publiques, les projets et les décisions d'investissement.",
    missions: [
      "Conception méthodologique des études",
      "Organisation de la collecte de données",
      "Traitement statistique et analyse qualitative",
      "Production de recommandations opérationnelles",
    ],
    livrables: [
      "Rapports d'étude et diagnostics",
      "Bases de données consolidées",
      "Notes de synthèse et présentations stratégiques",
      "Recommandations d'orientation et d'aide à la décision",
    ],
    impacts: [
      "Décisions mieux fondées sur les données",
      "Compréhension plus fine des réalités socio-économiques",
      "Priorisation plus pertinente des actions",
    ],
    examples: [
      "Études de base et évaluations",
      "Enquêtes terrain multi-régions",
      "Analyses sectorielles et territoriales",
    ],
    kpi: "Recommandations utiles à la décision",
    imageUrl: "/services/illustrations/studies.svg",
  },
  {
    id: "ai",
    category: "Data & IA",
    Icon: Icons.Brain,
    title: "Intelligence artificielle",
    shortLabel: "Automatisation intelligente",
    badge: "Innovation responsable",
    description:
      "Intégration d'outils avancés de traitement de données, d'automatisation et d'aide à la décision dans les systèmes d'information publics.",
    accent: BRAND.charcoal,
    accentLight: "#F3F4F6",
    detailTitle: "Intelligence artificielle et automatisation intelligente",
    illustrationLabel: "Analyse, automatisation et aide à la décision",
    intro:
      "MD2I intègre des approches d'intelligence artificielle pour automatiser certaines tâches, accélérer l'analyse des données et renforcer les outils d'aide à la décision.",
    missions: [
      "Identification des cas d'usage pertinents",
      "Automatisation des tâches répétitives et documentaires",
      "Structuration des données pour exploitation avancée",
      "Intégration de briques d'aide à la décision",
    ],
    livrables: [
      "Flux d'automatisation",
      "Assistants et outils de traitement avancé",
      "Dispositifs d'analyse augmentée",
      "Cadres d'usage responsables et gouvernés",
    ],
    impacts: [
      "Gains de temps significatifs",
      "Meilleure exploitation des données existantes",
      "Appui plus rapide et plus pertinent aux décisions",
    ],
    examples: [
      "Traitement automatisé d'information",
      "Synthèse documentaire",
      "Aide à la décision dans les systèmes publics",
    ],
    kpi: "Analyse accélérée et automatisation ciblée",
    imageUrl: "/services/illustrations/ai.svg",
  },
  {
    id: "training",
    category: "Compétences",
    Icon: Icons.GraduationCap,
    title: "Formation et renforcement de capacités",
    shortLabel: "Montée en compétence",
    badge: "Appropriation durable",
    description:
      "Formations professionnelles et dispositifs de renforcement de capacités sur le long terme, fondés sur une approche andragogique rigoureuse.",
    accent: BRAND.gold,
    accentLight: "#FFF6E5",
    detailTitle: "Formation, accompagnement et renforcement de capacités",
    illustrationLabel: "Transmission, montée en compétence et appropriation",
    intro:
      "MD2I conçoit des dispositifs de formation et d'accompagnement visant à assurer l'appropriation durable des méthodes, outils et systèmes déployés.",
    missions: [
      "Évaluation des besoins en compétences",
      "Conception de parcours de formation adaptés",
      "Animation de sessions théoriques et pratiques",
      "Accompagnement post-formation et consolidation des acquis",
    ],
    livrables: [
      "Modules de formation",
      "Guides et supports pédagogiques",
      "Plans de renforcement de capacités",
      "Dispositifs d'évaluation des acquis",
    ],
    impacts: [
      "Montée en compétence des équipes",
      "Appropriation plus durable des outils",
      "Autonomie renforcée des bénéficiaires",
    ],
    examples: [
      "Formation métier",
      "Formation à l'utilisation d'outils numériques",
      "Renforcement institutionnel sur le long terme",
    ],
    kpi: "Appropriation plus durable des dispositifs",
    imageUrl: "/services/illustrations/training.svg",
  },
];

const CATEGORY_ORDER: ServiceCategoryId[] = [
  "pilotage",
  "transformation",
  "infrastructure",
  "dataAi",
  "skills",
];

const CATEGORY_FALLBACKS: Record<ServiceCategoryId, string> = {
  pilotage: "Pilotage",
  transformation: "Transformation",
  infrastructure: "Infrastructure",
  dataAi: "Data & IA",
  skills: "Compétences",
};

const SERVICE_CATEGORY_IDS: Record<string, ServiceCategoryId> = {
  project: "pilotage",
  institution: "pilotage",
  digital: "transformation",
  software: "transformation",
  hydraulic: "infrastructure",
  accounting: "transformation",
  studies: "dataAi",
  ai: "dataAi",
  training: "skills",
};

const DEFAULT_PRODUCT_BRIDGE: ServiceProductBridge = {
  href: "/produits",
  label: "Voir le catalogue produits",
  hint: "Logiciels, modules et outils métier prêts à relier à vos missions.",
};

const SERVICE_PRODUCT_BRIDGES: Record<string, ServiceProductBridge> = {
  project: {
    href: "/produits?search=tableau%20de%20bord",
    label: "Produits de pilotage",
    hint: "Tableaux de bord, suivi terrain et reporting opérationnel.",
  },
  institution: {
    href: "/produits?search=gouvernance",
    label: "Outils de gouvernance",
    hint: "Solutions pour structurer les processus et la redevabilité.",
  },
  digital: {
    href: "/produits?search=transformation",
    label: "Solutions digitales",
    hint: "Applications et modules pour digitaliser les parcours métier.",
  },
  software: {
    href: "/produits?search=logiciel",
    label: "Logiciels métier",
    hint: "Fiches produits, modules applicatifs et demandes de démonstration.",
  },
  hydraulic: {
    href: "/produits?search=terrain",
    label: "Outils terrain",
    hint: "Supports numériques pour le suivi d'infrastructures et d'enquêtes.",
  },
  accounting: {
    href: "/produits?search=comptabilite",
    label: "Solutions de gestion",
    hint: "Modules de gestion, traçabilité et pilotage administratif.",
  },
  studies: {
    href: "/produits?search=analyse",
    label: "Produits data",
    hint: "Outils d'analyse, visualisation et restitution des indicateurs.",
  },
  ai: {
    href: "/produits?search=IA",
    label: "Solutions IA",
    hint: "Modules d'automatisation et d'aide à la décision.",
  },
  training: {
    href: "/produits?search=formation",
    label: "Supports de formation",
    hint: "Outils d'appropriation, guides et parcours d'accompagnement.",
  },
};

function getServiceCategoryId(serviceId: string): ServiceCategoryId {
  return SERVICE_CATEGORY_IDS[serviceId] ?? "transformation";
}

function translateText(t: TFunction, key: string, defaultValue: string) {
  return String(t(key, { defaultValue }));
}

function translateArray(t: TFunction, key: string, values: string[]) {
  return values.map((value, index) =>
    translateText(t, `${key}.${index}`, value)
  );
}

function getServiceProductBridge(t: TFunction, serviceId: string): ServiceProductBridge {
  const fallback = SERVICE_PRODUCT_BRIDGES[serviceId] ?? DEFAULT_PRODUCT_BRIDGE;

  return {
    href: fallback.href,
    label: translateText(
      t,
      `servicesPage.products.${serviceId}.label`,
      fallback.label
    ),
    hint: translateText(
      t,
      `servicesPage.products.${serviceId}.hint`,
      fallback.hint
    ),
  };
}

function localizeServices(t: TFunction): Service[] {
  return baseServices.map((service) => {
    const key = `servicesPage.services.${service.id}`;
    const categoryId = getServiceCategoryId(service.id);

    return {
      ...service,
      category: translateText(
        t,
        `servicesPage.categories.${categoryId}`,
        service.category
      ),
      title: translateText(t, `${key}.title`, service.title),
      shortLabel: translateText(t, `${key}.shortLabel`, service.shortLabel),
      badge: translateText(t, `${key}.badge`, service.badge),
      description: translateText(t, `${key}.description`, service.description),
      detailTitle: translateText(t, `${key}.detailTitle`, service.detailTitle),
      illustrationLabel: translateText(
        t,
        `${key}.illustrationLabel`,
        service.illustrationLabel
      ),
      intro: translateText(t, `${key}.intro`, service.intro),
      missions: translateArray(t, `${key}.missions`, service.missions),
      livrables: translateArray(t, `${key}.livrables`, service.livrables),
      impacts: translateArray(t, `${key}.impacts`, service.impacts),
      examples: translateArray(t, `${key}.examples`, service.examples),
      kpi: translateText(t, `${key}.kpi`, service.kpi),
    };
  });
}

/* ──────────────────────── HOOKS ──────────────────────── */

function useVisible<T extends HTMLElement>(threshold = 0.14) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      const timer = globalThis.setTimeout(() => setVisible(true), 0);
      return () => globalThis.clearTimeout(timer);
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);

    update();

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return reduceMotion;
}

/* ────────────────────── SMALL PARTS ───────────────────── */

function StatCard({
  title,
  value,
  theme,
}: {
  title: string;
  value: string;
  theme: ReturnType<typeof serviceTokens>;
}) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        padding: "18px 18px 16px",
        boxShadow: theme.cardShadow,
      }}
    >
      <div
        style={{
          fontSize: "1.3rem",
          fontWeight: 800,
          color: theme.text,
          marginBottom: 6,
          fontFamily: "'Georgia', serif",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.84rem",
          lineHeight: 1.7,
          color: theme.textSoft,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function ImpactChip({
  text,
  accent,
  theme,
}: {
  text: string;
  accent: string;
  theme: ReturnType<typeof serviceTokens>;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: theme.panel2,
        border: `1px solid ${theme.border}`,
        fontSize: "0.75rem",
        fontWeight: 700,
        color: theme.textSoft,
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: accent,
          flexShrink: 0,
        }}
      />
      {text}
    </span>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  theme,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  theme: ReturnType<typeof serviceTokens>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 46,
        padding: "12px 16px",
        borderRadius: 16,
        border: `1.5px solid ${active ? theme.accent : theme.border}`,
        background: active ? theme.badgeBg : theme.panel,
        color: active ? theme.accent : theme.textSoft,
        cursor: "pointer",
        fontSize: "0.82rem",
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        transition: "all .25s ease",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "left",
        lineHeight: 1.2,
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

function CTAButton({
  theme,
  href = "/contact",
  label,
  filled = false,
}: {
  theme: ReturnType<typeof serviceTokens>;
  href?: string;
  label?: string;
  filled?: boolean;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const buttonLabel =
    label ?? t("servicesPage.actions.contact", { defaultValue: "Nous contacter" });
  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "14px 22px",
    minHeight: 48,
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "0.875rem",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
    transition: "all .28s cubic-bezier(.22,1,.36,1)",
    background: filled ? theme.accent : theme.accentSoft,
    color: filled ? "#FFFFFF" : theme.accent,
    border: `1.5px solid ${filled ? theme.accent : "rgba(225,161,44,.28)"}`,
    boxShadow: filled && hovered ? "0 16px 36px rgba(225,161,44,.25)" : "none",
    transform: hovered ? "translateY(-1px)" : "translateY(0)",
  };
  const content = (
    <>
      {buttonLabel}
      <span
        style={{
          display: "inline-flex",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          transition: "transform .28s ease",
        }}
      >
        <Icons.ArrowRight color={filled ? "#FFFFFF" : theme.accent} size={15} />
      </span>
    </>
  );

  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={buttonStyle}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyle}
    >
      {content}
    </a>
  );
}

function ProductLink({
  theme,
  href,
  label,
  hint,
  accent,
  filled = false,
  compact = false,
  showHint = true,
  onClick,
}: {
  theme: ReturnType<typeof serviceTokens>;
  href: string;
  label: string;
  hint?: string;
  accent?: string;
  filled?: boolean;
  compact?: boolean;
  showHint?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const linkAccent = accent ?? theme.accent;
  const linkStyle = {
    "--md2i-product-accent": linkAccent,
    "--md2i-product-bg": filled ? linkAccent : theme.panel2,
    "--md2i-product-soft": filled ? "rgba(255,255,255,.16)" : theme.accentSoft,
    "--md2i-product-border": filled ? linkAccent : theme.border,
    "--md2i-product-text": filled ? "#FFFFFF" : theme.text,
    "--md2i-product-muted": filled ? "rgba(255,255,255,.78)" : theme.textSoft,
    "--md2i-product-icon": filled ? "#FFFFFF" : linkAccent,
    "--md2i-product-shadow": filled
      ? "0 16px 36px rgba(225,161,44,.24)"
      : theme.cardShadow,
  } as React.CSSProperties;

  return (
    <Link
      href={href}
      className={`md2i-product-link${filled ? " is-filled" : ""}${
        compact ? " is-compact" : ""
      }`}
      style={linkStyle}
      onClick={onClick}
    >
      <span className="md2i-product-link-icon">
        <Icons.Layers color="currentColor" size={compact ? 16 : 18} />
      </span>
      <span className="md2i-product-link-copy">
        <span>{label}</span>
        {showHint && hint && <small>{hint}</small>}
      </span>
      <span className="md2i-product-link-arrow">
        <Icons.ArrowRight color="currentColor" size={14} />
      </span>
    </Link>
  );
}

function DetailBlock({
  title,
  items,
  accent,
  theme,
}: {
  title: string;
  items: string[];
  accent: string;
  theme: ReturnType<typeof serviceTokens>;
}) {
  return (
    <div>
      <h4
        style={{
          margin: "0 0 14px",
          fontSize: "0.96rem",
          fontWeight: 800,
          color: theme.text,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </h4>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "13px 14px",
              borderRadius: 16,
              background: theme.panel2,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: accent,
                marginTop: 7,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.89rem",
                lineHeight: 1.78,
                color: theme.textSoft,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────── FEATURED BLOCK ───────────────────── */

function FeaturedService({
  service,
  theme,
  onOpen,
}: {
  service: Service;
  theme: ReturnType<typeof serviceTokens>;
  onOpen: (service: Service) => void;
}) {
  const { t } = useTranslation();
  const { Icon } = service;
  const productBridge = getServiceProductBridge(t, service.id);

  return (
    <div
      className="md2i-featured-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.08fr .92fr",
        gap: 0,
        borderRadius: 20,
        overflow: "hidden",
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 420,
          background: theme.panel2,
          overflow: "hidden",
        }}
      >
        <Image
          src={service.imageUrl}
          alt={service.illustrationLabel}
          fill
          priority
          sizes="(max-width: 1080px) 100vw, 52vw"
          unoptimized
          style={{
            objectFit: "contain",
            padding: 18,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.18) 38%, rgba(0,0,0,.52) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#FFFFFF",
              fontSize: "0.75rem",
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {service.badge}
          </span>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,.10)",
              border: "1px solid rgba(255,255,255,.16)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "rgba(255,255,255,.92)",
              fontSize: "0.75rem",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {service.category}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 24,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background: "rgba(255,255,255,.16)",
              border: "1px solid rgba(255,255,255,.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color="#FFFFFF" size={28} />
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: "1.55rem",
              lineHeight: 1.14,
              fontWeight: 700,
              fontFamily: "'Georgia', serif",
              maxWidth: 520,
            }}
          >
            {service.title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,.82)",
              fontSize: "0.92rem",
              lineHeight: 1.75,
              fontFamily: "'Inter', sans-serif",
              maxWidth: 580,
            }}
          >
            {service.illustrationLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "34px 32px",
          display: "grid",
          alignContent: "space-between",
          gap: 24,
          background: theme.panel,
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                background: theme.badgeBg,
                border: `1px solid ${theme.badgeBorder}`,
                color: theme.accent,
                fontSize: "0.74rem",
                fontWeight: 800,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Icons.Sparkles color={theme.accent} size={14} />
              {t("servicesPage.featured.label", {
                defaultValue: "Service vedette",
              })}
            </span>
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: theme.panel2,
                border: `1px solid ${theme.border}`,
                color: theme.textSoft,
                fontSize: "0.74rem",
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {service.shortLabel}
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              color: theme.text,
              fontSize: "1.55rem",
              lineHeight: 1.18,
              letterSpacing: "0",
              fontFamily: "'Georgia', serif",
            }}
          >
            {service.detailTitle}
          </h3>

          <p
            style={{
              margin: 0,
              color: theme.textSoft,
              fontSize: "0.95rem",
              lineHeight: 1.9,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {service.intro}
          </p>

          <div
            style={{
              display: "grid",
              gap: 14,
              padding: "18px",
              borderRadius: 18,
              background: theme.panel2,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                color: theme.text,
                fontSize: "0.92rem",
                fontWeight: 800,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {t("servicesPage.featured.valueTitle", {
                defaultValue: "Valeur ajoutée principale",
              })}
            </div>
            <div
              style={{
                color: theme.textSoft,
                fontSize: "0.88rem",
                lineHeight: 1.8,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {service.kpi}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {service.impacts.slice(0, 2).map((impact, index) => (
                <ImpactChip key={index} text={impact} accent={service.accent} theme={theme} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {service.examples.slice(0, 3).map((item, index) => (
              <span
                key={index}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: service.accentLight,
                  color: service.accent,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div
            className="md2i-product-quick-panel"
            style={{
              display: "grid",
              gap: 14,
              padding: "16px",
              borderRadius: 18,
              background: theme.panel3,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  color: theme.accent,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {t("servicesPage.products.panelKicker", {
                  defaultValue: "Lien produit associé",
                })}
              </div>
              <p
                style={{
                  margin: 0,
                  color: theme.textSoft,
                  fontSize: "0.86rem",
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {productBridge.hint}
              </p>
            </div>
            <ProductLink
              theme={theme}
              href={productBridge.href}
              label={productBridge.label}
              hint={productBridge.hint}
              accent={service.accent}
              compact
              showHint={false}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onOpen(service)}
            style={{
              minHeight: 48,
              padding: "14px 20px",
              borderRadius: 14,
              border: `1px solid ${service.accent}`,
              background: service.accent,
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {t("servicesPage.actions.viewDetail", {
              defaultValue: "Voir le détail",
            })}
            <Icons.ArrowRight color="#FFFFFF" size={15} />
          </button>
          <ProductLink
            theme={theme}
            href={productBridge.href}
            label={t("servicesPage.actions.openProducts", {
              defaultValue: "Voir les produits",
            })}
            hint={productBridge.hint}
            accent={service.accent}
            compact
            showHint={false}
          />
          <CTAButton theme={theme} />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── CARD ───────────────────── */

function ServiceCard({
  service,
  theme,
  onOpen,
  onPreview,
  delay,
  reduceMotion,
}: {
  service: Service;
  theme: ReturnType<typeof serviceTokens>;
  onOpen: (service: Service) => void;
  onPreview: (service: Service) => void;
  delay: number;
  reduceMotion: boolean;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [ref, visible] = useVisible<HTMLElement>(0.08);
  const { Icon } = service;
  const productBridge = getServiceProductBridge(t, service.id);

  return (
    <article
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${t("servicesPage.actions.viewDetail", {
        defaultValue: "Voir le dÃ©tail",
      })} : ${service.title}`}
      className="md2i-service-card"
      onClick={() => onOpen(service)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        onOpen(service);
      }}
      onMouseEnter={() => {
        setHovered(true);
        onPreview(service);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => onPreview(service)}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "left",
        background: theme.panel,
        border: `1px solid ${hovered ? theme.borderStrong : theme.border}`,
        borderRadius: 18,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: hovered ? theme.cardShadowHover : theme.cardShadow,
        transform: reduceMotion
          ? "none"
          : visible
          ? hovered
            ? "translateY(-1px)"
            : "translateY(0)"
          : "translateY(18px)",
        opacity: visible ? 1 : 0,
        filter: "none",
        transition: reduceMotion
          ? "none"
          : "transform .42s cubic-bezier(.22,1,.36,1), opacity .42s ease, box-shadow .24s ease, border-color .22s ease",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: hovered
            ? `linear-gradient(135deg, ${theme.accentSoft} 0%, transparent 42%)`
            : "transparent",
          transition: "background .25s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          opacity: hovered ? 1 : 0,
          transition: "opacity .28s ease",
          background: `linear-gradient(90deg, ${service.accent} 0%, transparent 100%)`,
        }}
      />

      <div
        className="md2i-service-card-media"
        role="img"
        aria-label={service.illustrationLabel}
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: 168,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${hovered ? theme.borderStrong : theme.border}`,
          background: theme.panel2,
          boxShadow: hovered
            ? "0 14px 32px rgba(15,23,42,.10)"
            : "0 8px 20px rgba(15,23,42,.05)",
          transition:
            "border-color .22s ease, box-shadow .22s ease",
          transform: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${service.imageUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            transform: "none",
            transition: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,23,42,.04) 0%, rgba(15,23,42,.18) 48%, rgba(15,23,42,.62) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            style={{
              minWidth: 0,
              color: "#FFFFFF",
              fontSize: "0.72rem",
              lineHeight: 1.35,
              fontWeight: 750,
              fontFamily: "'Inter', sans-serif",
              textShadow: "0 2px 14px rgba(0,0,0,.32)",
            }}
          >
            {service.illustrationLabel}
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              color: "#FFFFFF",
              background: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.18)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <Icon color="#FFFFFF" size={17} />
          </span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: hovered ? service.accent : service.accentLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background .22s ease, color .22s ease",
          }}
        >
          <Icon color={hovered ? "#FFFFFF" : service.accent} size={22} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
          <span
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              background: theme.panel2,
              border: `1px solid ${theme.border}`,
              color: theme.textMute,
              fontSize: "0.7rem",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {service.category}
          </span>
          <span
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              background: service.accentLight,
              color: service.accent,
              fontSize: "0.7rem",
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {service.badge}
          </span>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 10 }}>
        <h3
          style={{
            margin: 0,
            color: theme.text,
            fontSize: "1.02rem",
            lineHeight: 1.34,
            fontWeight: 700,
            fontFamily: "'Georgia', serif",
            letterSpacing: "0",
          }}
        >
          {service.title}
        </h3>
        <div
          style={{
            color: theme.accent,
            fontSize: "0.76rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {service.shortLabel}
        </div>
        <p
          style={{
            margin: 0,
            color: theme.textSoft,
            fontSize: "0.875rem",
            lineHeight: 1.78,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {service.description}
        </p>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {service.impacts.slice(0, 2).map((impact, index) => (
          <ImpactChip key={index} text={impact} accent={service.accent} theme={theme} />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: service.accent,
          opacity: hovered ? 1 : 0.8,
          transform: hovered ? "translateX(0)" : "translateX(-4px)",
          transition: "opacity .28s ease, transform .28s ease",
        }}
      >
        <span
          style={{
            fontSize: "0.76rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {t("servicesPage.actions.viewDetail", {
            defaultValue: "Voir le détail",
          })}
        </span>
        <Icons.ChevronRight color={service.accent} size={13} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 2,
        }}
      >
        <ProductLink
          theme={theme}
          href={productBridge.href}
          label={productBridge.label}
          hint={productBridge.hint}
          accent={service.accent}
          compact
          showHint={false}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </article>
  );
}

/* ────────────────────── MODAL ───────────────────── */

function ServiceModal({
  service,
  onClose,
  theme,
}: {
  service: Service;
  onClose: () => void;
  theme: ReturnType<typeof serviceTokens>;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [isMounted, setIsMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const productBridge = getServiceProductBridge(t, service.id);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveTab("overview"), 0);
    return () => window.clearTimeout(timer);
  }, [service]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("button, a[href]");
      first?.focus();
    }, 40);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [isMounted, onClose]);

  const tabLabels: { key: ModalTab; label: string }[] = [
    {
      key: "overview",
      label: t("servicesPage.modal.tabs.overview", {
        defaultValue: "Vue d'ensemble",
      }),
    },
    {
      key: "missions",
      label: t("servicesPage.modal.tabs.missions", {
        defaultValue: "Missions",
      }),
    },
    {
      key: "livrables",
      label: t("servicesPage.modal.tabs.livrables", {
        defaultValue: "Livrables",
      }),
    },
    {
      key: "impacts",
      label: t("servicesPage.modal.tabs.impacts", {
        defaultValue: "Résultats",
      }),
    },
  ];

  if (!isMounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={service.detailTitle}
      className="md2i-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: theme.overlay,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <div
          ref={panelRef}
          className="md2i-modal-panel md2i-modal-layout"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(1180px, 100%)",
            maxHeight: "92vh",
            overflow: "hidden",
            borderRadius: 20,
            border: `1px solid ${theme.border}`,
            background: theme.panel,
            boxShadow: theme.modalShadow,
            display: "grid",
            gridTemplateColumns: "1fr 1.06fr",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: 320,
              background: theme.panel2,
              overflow: "hidden",
            }}
          >
            <Image
              src={service.imageUrl}
              alt={service.illustrationLabel}
              fill
              sizes="(max-width: 1080px) 100vw, 46vw"
              unoptimized
              style={{ objectFit: "contain", padding: 18 }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.20) 35%, rgba(0,0,0,.58) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                right: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.14)",
                    border: "1px solid rgba(255,255,255,.18)",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {service.category}
                </span>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.10)",
                    border: "1px solid rgba(255,255,255,.18)",
                    color: "rgba(255,255,255,.92)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {service.badge}
                </span>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                bottom: 22,
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: "rgba(255,255,255,.16)",
                  border: "1px solid rgba(255,255,255,.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <service.Icon color="#FFFFFF" size={28} />
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "1.6rem",
                  lineHeight: 1.15,
                  fontWeight: 700,
                  fontFamily: "'Georgia', serif",
                  maxWidth: 520,
                }}
              >
                {service.detailTitle}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,.84)",
                  fontSize: "0.92rem",
                  lineHeight: 1.8,
                  fontFamily: "'Inter', sans-serif",
                  maxWidth: 560,
                }}
              >
                {service.illustrationLabel}
              </div>
            </div>
          </div>

          <div
            className="md2i-modal-scroll"
            style={{
              overflowY: "auto",
              maxHeight: "92vh",
              padding: "28px 28px 24px",
              background: theme.panel,
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                background: theme.panel,
                paddingBottom: 18,
                marginBottom: 18,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      color: theme.accent,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.modal.domain", {
                      defaultValue: "Domaine d'expertise",
                    })}
                  </div>
                  <div
                    style={{
                      color: theme.text,
                      fontSize: "1.35rem",
                      lineHeight: 1.18,
                      fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {service.title}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={t("common.close", { defaultValue: "Fermer" })}
                  onClick={onClose}
                  className="md2i-modal-close"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: theme.panel2,
                    color: theme.textSoft,
                    cursor: "pointer",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                className="md2i-modal-tabs"
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  overflowY: "visible",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                  padding: "2px 0 8px",
                  marginBottom: -8,
                }}
              >
                {tabLabels.map((tab) => {
                  const active = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        height: 42,
                        padding: "0 16px",
                        borderRadius: 999,
                        border: `1.5px solid ${active ? theme.accent : theme.border}`,
                        background: active ? theme.badgeBg : theme.panel2,
                        color: active ? theme.accent : theme.textSoft,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        lineHeight: 1,
                        boxSizing: "border-box",
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 22 }}>
              {activeTab === "overview" && (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: 18,
                    background: theme.panel2,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      color: theme.text,
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      marginBottom: 10,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.modal.positioning", {
                      defaultValue: "Positionnement",
                    })}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: theme.textSoft,
                      fontSize: "0.93rem",
                      lineHeight: 1.88,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {service.intro}
                  </p>
                </div>
              )}

              {activeTab === "missions" && (
                <DetailBlock
                  title={t("servicesPage.modal.missionsTitle", {
                    defaultValue: "Missions typiques",
                  })}
                  items={service.missions}
                  accent={service.accent}
                  theme={theme}
                />
              )}

              {activeTab === "livrables" && (
                <DetailBlock
                  title={t("servicesPage.modal.livrablesTitle", {
                    defaultValue: "Livrables et outils produits",
                  })}
                  items={service.livrables}
                  accent={service.accent}
                  theme={theme}
                />
              )}

              {activeTab === "impacts" && (
                <DetailBlock
                  title={t("servicesPage.modal.impactsTitle", {
                    defaultValue: "Impacts et bénéfices attendus",
                  })}
                  items={service.impacts}
                  accent={service.accent}
                  theme={theme}
                />
              )}
            </div>

            <div
              style={{
                position: "sticky",
                bottom: 0,
                marginTop: 26,
                paddingTop: 18,
                background: `linear-gradient(to top, ${theme.panel} 78%, rgba(255,255,255,0))`,
                borderTop: `1px solid ${theme.border}`,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <CTAButton
                theme={theme}
                filled
                label={t("servicesPage.actions.talk", {
                  defaultValue: "Parler à MD2I",
                })}
              />
              <ProductLink
                theme={theme}
                href={productBridge.href}
                label={productBridge.label}
                hint={productBridge.hint}
                accent={service.accent}
                filled
                compact
              />
              <button
                type="button"
                onClick={onClose}
                style={{
                  minHeight: 48,
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: `1px solid ${theme.border}`,
                  background: theme.panel2,
                  color: theme.textSoft,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 800,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {t("common.close", { defaultValue: "Fermer" })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ────────────────────── MAIN COMPONENT ───────────────────── */

export default function MD2IServicesSection() {
  const { dark } = useTheme();
  const { t } = useTranslation();
  const services = useMemo(() => localizeServices(t), [t]);
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [previewServiceId, setPreviewServiceId] = useState<string>(services[0].id);
  const sectionRef = useRef<HTMLElement | null>(null);

  const [headerRef, headerVisible] = useVisible<HTMLDivElement>(0.16);
  const [featuredRef, featuredVisible] = useVisible<HTMLDivElement>(0.12);
  const [gridRef, gridVisible] = useVisible<HTMLDivElement>(0.06);
  const [ctaRef, ctaVisible] = useVisible<HTMLDivElement>(0.12);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const T = useMemo(() => serviceTokens(dark), [dark]);

  const categories = useMemo(
    () => [
      {
        id: "all" as CategoryFilter,
        label: t("servicesPage.filters.all", { defaultValue: "Tous" }),
      },
      ...CATEGORY_ORDER.map((id) => ({
        id,
        label: t(`servicesPage.categories.${id}`, {
          defaultValue: CATEGORY_FALLBACKS[id],
        }),
      })),
    ],
    [t]
  );

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter((service) => getServiceCategoryId(service.id) === selectedCategory);
  }, [selectedCategory, services]);

  useEffect(() => {
    if (!filteredServices.some((s) => s.id === previewServiceId)) {
      const nextPreviewId = filteredServices[0]?.id ?? services[0].id;
      const timer = window.setTimeout(() => setPreviewServiceId(nextPreviewId), 0);
      return () => window.clearTimeout(timer);
    }
  }, [filteredServices, previewServiceId, services]);

  const previewService =
    filteredServices.find((s) => s.id === previewServiceId) ??
    filteredServices[0] ??
    services[0];

  if (!mounted) return null;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        overflow: "visible",
        minHeight: "100vh",
        backgroundColor: T.bg,
        backgroundImage: `${
          dark
            ? "linear-gradient(180deg, rgba(9,13,19,.86) 0%, rgba(9,13,19,.94) 100%)"
            : "linear-gradient(180deg, rgba(248,250,252,.90) 0%, rgba(248,250,252,.97) 100%)"
        }, url(${SERVICE_FIXED_BG_URL})`,
        backgroundAttachment: "fixed, fixed",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        padding: "clamp(48px, 6vw, 72px) 24px 96px",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── HEADER ── */}
        <div
          ref={headerRef}
          style={{
            display: "grid",
            gap: 24,
            marginBottom: 42,
            opacity: headerVisible ? 1 : 0,
            transform: reduceMotion
              ? "none"
              : headerVisible
              ? "translateY(0)"
              : "translateY(26px)",
            transition: reduceMotion
              ? "none"
              : "opacity .7s ease, transform .7s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 18 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "'Roboto', 'Syne', sans-serif",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.accent,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.accent,
                  boxShadow: `0 0 0 6px ${
                    dark ? "rgba(225,161,44,.16)" : "rgba(225,161,44,.10)"
                  }`,
                }}
              />
              {t("servicesPage.hero.kicker", { defaultValue: "MD2I Madagascar" })}
            </div>

            <div style={{ textAlign: "center", display: "grid", gap: 16 }}>
              <h2
                style={{
                  margin: 0,
                  color: T.text,
                  fontSize: "clamp(2.4rem, 4.8vw, 4rem)",
                  lineHeight: 1.05,
                  letterSpacing: "0",
                  fontWeight: 800,
                  fontFamily: "'Roboto', 'Syne', sans-serif",
                  textWrap: "balance",
                  textShadow: dark
                    ? "0 2px 14px rgba(0,0,0,.34)"
                    : "0 2px 14px rgba(0,0,0,.12)",
                }}
              >
                {t("servicesPage.hero.titlePrefix", {
                  defaultValue: "Des expertises",
                })}{" "}
                <em style={{ fontStyle: "normal", color: T.accent }}>
                  {t("servicesPage.hero.titleEmphasis", {
                    defaultValue: "structurées",
                  })}
                </em>{" "}
                {t("servicesPage.hero.titleSuffix", {
                  defaultValue: "pour des projets à fort impact",
                })}
              </h2>
              <p
                style={{
                  maxWidth: 760,
                  margin: "0 auto",
                  color: T.textSoft,
                  fontSize: "1rem",
                  lineHeight: 1.88,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0",
                }}
              >
                {t("servicesPage.hero.subtitle", {
                  defaultValue:
                    "MD2I Madagascar accompagne les institutions publiques, les projets de développement et les organisations partenaires avec une approche fondée sur la rigueur, la lisibilité des processus, la digitalisation et l'adaptation au terrain.",
                })}
              </p>
              <div className="md2i-hero-actions">
                <ProductLink
                  theme={T}
                  href="/produits"
                  label={t("servicesPage.actions.catalog", {
                    defaultValue: "Explorer le catalogue produits",
                  })}
                  hint={t("servicesPage.actions.catalogHint", {
                    defaultValue:
                      "Accéder aux logiciels, modules et fiches de démonstration.",
                  })}
                  filled
                />
                <CTAButton
                  theme={T}
                  href="/contact-commercial"
                  label={t("servicesPage.actions.commercial", {
                    defaultValue: "Demander un accompagnement",
                  })}
                />
              </div>
            </div>
          </div>

          <div
            className="md2i-stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 16,
              marginTop: 4,
            }}
          >
            <StatCard
              title={t("servicesPage.stats.experience", {
                defaultValue:
                  "d'expérience au service des institutions et des projets",
              })}
              value="21+"
              theme={T}
            />
            <StatCard
              title={t("servicesPage.stats.domains", {
                defaultValue: "domaines d'expertise structurés dans cette section",
              })}
              value="9"
              theme={T}
            />
            <StatCard
              title={t("servicesPage.stats.approach", {
                defaultValue:
                  "approche : conseil, outils, gouvernance, données et renforcement",
              })}
              value="360°"
              theme={T}
            />
          </div>
        </div>

        {/* ── FEATURED ── */}
        <div
          ref={featuredRef}
          style={{
            marginBottom: 28,
            opacity: featuredVisible ? 1 : 0,
            transform: reduceMotion
              ? "none"
              : featuredVisible
              ? "translateY(0)"
              : "translateY(26px)",
            transition: reduceMotion
              ? "none"
              : "opacity .75s ease, transform .75s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <FeaturedService
            service={previewService}
            theme={T}
            onOpen={setSelectedService}
          />
        </div>

        {/* ── SERVICES + SIDEBAR ── */}
        <div className="md2i-services-content-shell">
          <div className="md2i-services-main">
            <div
              ref={gridRef}
              style={{
                marginBottom: 64,
                opacity: gridVisible ? 1 : 0,
                transition: "opacity .4s ease",
              }}
            >
              <div
                className="md2i-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 22,
                }}
              >
                {filteredServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    theme={T}
                    onOpen={setSelectedService}
                    onPreview={(s) => setPreviewServiceId(s.id)}
                    delay={index * 55}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className={`md2i-services-sidebar ${gridVisible ? "is-visible" : ""}`}>
            <div className="md2i-services-sidebar-sticky">
              <div className="md2i-services-sidebar-card">
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      color: T.accent,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.sidebar.kicker", {
                      defaultValue: "Explorer les expertises",
                    })}
                  </div>
                  <div
                    style={{
                      color: T.text,
                      fontSize: "1rem",
                      lineHeight: 1.3,
                      fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {t("servicesPage.sidebar.title", {
                      defaultValue: "Filtres de services",
                    })}
                  </div>
                  <div
                    style={{
                      color: T.textSoft,
                      fontSize: "0.84rem",
                      lineHeight: 1.75,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.sidebar.text", {
                      defaultValue:
                        "Filtrer rapidement les domaines d'expertise.",
                    })}
                  </div>
                </div>

                <div className="md2i-filters-column">
                  {categories.map((category) => (
                    <FilterButton
                      key={category.id}
                      label={category.label}
                      active={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      theme={T}
                    />
                  ))}
                </div>

                <div className="md2i-sidebar-product-card">
                  <div
                    style={{
                      color: T.text,
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.products.sidebarTitle", {
                      defaultValue: "Solutions produit",
                    })}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: T.textSoft,
                      fontSize: "0.82rem",
                      lineHeight: 1.65,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t("servicesPage.products.sidebarText", {
                      defaultValue:
                        "Accéder aux fiches produits, tarifs et demandes de démonstration.",
                    })}
                  </p>
                  <ProductLink
                    theme={T}
                    href="/produits"
                    label={t("servicesPage.actions.openProducts", {
                      defaultValue: "Voir les produits",
                    })}
                    hint={t("servicesPage.products.catalogHint", {
                      defaultValue: "Catalogue complet MD2I",
                    })}
                    compact
                    showHint={false}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── CTA ── */}
        <div
          ref={ctaRef}
          className="md2i-cta"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            background: T.ctaGradient,
            padding: "52px 46px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 28,
            opacity: ctaVisible ? 1 : 0,
            transform: reduceMotion ? "none" : ctaVisible ? "translateY(0)" : "translateY(22px)",
            transition: reduceMotion
              ? "none"
              : "opacity .7s ease .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(225,161,44,.18) 0%, rgba(225,161,44,0) 42%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              background: "rgba(255,255,255,.18)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
            <div
              style={{
                width: 28,
                height: 2,
                borderRadius: 999,
                background: T.accentSoft2,
                marginBottom: 16,
              }}
            />
            <h3
              style={{
                margin: "0 0 14px",
                color: T.ctaText,
                fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)",
                lineHeight: 1.22,
                fontWeight: 700,
                letterSpacing: "0",
                fontFamily: "'Georgia', serif",
              }}
            >
              {t("servicesPage.cta.title", {
                defaultValue:
                  "Besoin d'une expertise claire, structurée et directement opérationnelle ?",
              })}
            </h3>
            <p
              style={{
                margin: 0,
                maxWidth: 620,
                color: T.ctaSub,
                fontSize: "0.92rem",
                lineHeight: 1.82,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {t("servicesPage.cta.text", {
                defaultValue:
                  "MD2I intervient à l'interface entre conseil, ingénierie, transformation numérique, données et renforcement institutionnel, avec des solutions alignées sur les réalités de terrain et les exigences des partenaires.",
              })}
            </p>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <ProductLink
              theme={T}
              href="/produits"
              label={t("servicesPage.actions.openProducts", {
                defaultValue: "Voir les produits",
              })}
              hint={t("servicesPage.products.catalogHint", {
                defaultValue: "Catalogue complet MD2I",
              })}
              filled
              compact
              showHint={false}
            />
            <CTAButton theme={T} filled />
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          theme={T}
        />
      )}

      {/* ── STYLES GLOBAUX ── */}
      <style>{`
        .md2i-services-content-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(252px, 300px);
          gap: 24px;
          align-items: start;
        }

        .md2i-services-main {
          min-width: 0;
        }

        .md2i-services-sidebar {
           position: sticky;
          top: 96px;
          min-width: 0;
          opacity: 0;
          transform: translateY(10px);
          pointer-events: none;
          transition:
            opacity .35s ease,
            transform .38s cubic-bezier(.22,1,.36,1);
        }

        .md2i-services-sidebar.is-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .md2i-services-sidebar-sticky {
          position: sticky;
          top: 96px;
        }

        .md2i-services-sidebar-card {
          display: grid;
          gap: 16px;
          padding: 18px;
          border-radius: 18px;
          background: ${dark ? "rgba(20,26,36,.88)" : "rgba(255,255,255,.86)"};
          border: 1px solid ${dark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.10)"};
          box-shadow: ${dark ? "0 14px 36px rgba(0,0,0,.30)" : "0 14px 36px rgba(15,23,42,.09)"};
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .md2i-services-sidebar-card * {
          position: relative;
          z-index: 1;
        }

        .md2i-filters-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .md2i-hero-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }

        .md2i-service-card:focus-visible,
        .md2i-product-link:focus-visible {
          outline: 3px solid rgba(225,161,44,.44);
          outline-offset: 4px;
        }

        .md2i-service-card-media {
          aspect-ratio: 16 / 9;
        }

        .md2i-product-link {
          min-width: 0;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid var(--md2i-product-border);
          background: var(--md2i-product-bg);
          color: var(--md2i-product-text);
          text-decoration: none;
          box-shadow: var(--md2i-product-shadow);
          font-family: 'Inter', sans-serif;
          transition:
            transform .24s cubic-bezier(.22,1,.36,1),
            box-shadow .24s ease,
            border-color .24s ease,
            background .24s ease;
        }

        .md2i-product-link:hover {
          transform: translateY(-1px);
          border-color: var(--md2i-product-accent);
          box-shadow: 0 14px 32px rgba(15,23,42,.11);
        }

        .md2i-product-link.is-filled:hover {
          box-shadow: 0 14px 32px rgba(225,161,44,.22);
        }

        .md2i-product-link.is-compact {
          min-height: 46px;
          padding: 10px 13px;
        }

        .md2i-product-link-icon {
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: var(--md2i-product-icon);
          background: var(--md2i-product-soft);
        }

        .md2i-product-link-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
          text-align: left;
        }

        .md2i-product-link-copy > span {
          font-size: .82rem;
          font-weight: 850;
          line-height: 1.2;
          white-space: nowrap;
        }

        .md2i-product-link-copy small {
          color: var(--md2i-product-muted);
          font-size: .72rem;
          line-height: 1.38;
          font-weight: 650;
        }

        .md2i-product-link-arrow {
          display: inline-flex;
          flex: 0 0 auto;
          color: var(--md2i-product-icon);
          transition: transform .24s ease;
        }

        .md2i-product-link:hover .md2i-product-link-arrow {
          transform: translateY(-1px);
        }

        .md2i-sidebar-product-card {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 14px;
          background: ${dark ? "rgba(255,255,255,.04)" : "rgba(248,250,252,.90)"};
          border: 1px solid ${dark ? "rgba(255,255,255,.09)" : "rgba(15,23,42,.08)"};
        }

        .md2i-modal-overlay {
          animation: md2iFadeIn .25s ease;
        }

        .md2i-modal-panel {
          animation: md2iZoomIn .4s cubic-bezier(.22,1,.36,1);
          transform-origin: center;
        }

        .md2i-modal-close {
          transition: transform .25s ease, background .25s ease, border-color .25s ease;
        }

        .md2i-modal-close:hover {
          transform: translateY(-1px);
        }

        .md2i-modal-tabs::-webkit-scrollbar {
          display: none;
        }

        .md2i-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${T.accent} ${dark ? "#23262D" : "#F1EEE8"};
          overscroll-behavior: contain;
        }

        .md2i-modal-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .md2i-modal-scroll::-webkit-scrollbar-track {
          background: ${dark ? "#23262D" : "#F1EEE8"};
          border-radius: 999px;
        }

        .md2i-modal-scroll::-webkit-scrollbar-thumb {
          background: ${T.accent};
          border-radius: 999px;
        }

        @keyframes md2iFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes md2iZoomIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1080px) {
          .md2i-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .md2i-featured-grid { grid-template-columns: 1fr !important; }
          .md2i-modal-layout { grid-template-columns: 1fr !important; }
          .md2i-stats-grid { grid-template-columns: 1fr !important; }
          .md2i-overview-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 1180px) {
          .md2i-services-content-shell {
            grid-template-columns: 1fr !important;
          }

          .md2i-services-sidebar {
            order: -1;
          }

          .md2i-services-sidebar-sticky {
            top: 86px;
          }
        }

        @media (max-width: 820px) {
          .md2i-cta {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 36px 24px !important;
          }
        }

        @media (max-width: 700px) {
          .md2i-grid {
            grid-template-columns: 1fr !important;
          }

          .md2i-service-card-media {
            min-height: 196px !important;
          }

          .md2i-hero-actions,
          .md2i-cta > div:last-child {
            width: 100%;
            justify-content: stretch !important;
          }

          .md2i-product-link {
            width: 100%;
          }

          .md2i-product-link-copy > span {
            white-space: normal;
          }

          .md2i-services-sidebar-card {
            padding: 14px !important;
            border-radius: 18px !important;
          }
        }

        @media (max-width: 560px) {
          .md2i-modal-overlay {
            padding: 10px !important;
            place-items: center !important;
          }

          .md2i-modal-panel {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 94vh !important;
            border-radius: 20px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .md2i-modal-overlay,
          .md2i-modal-panel,
          .md2i-modal-close {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
