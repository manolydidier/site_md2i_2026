"use client";

import { useTheme } from "@/app/context/ThemeContext";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Reference {
  id: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  title: string;
  excerpt: string;
  image: string;
  details: string;
  date: string;
  client: string;
  category: string;
  tags?: string[];
  impact?: string;
  technologies?: string[];
  team?: string;
  duration?: string;
  budget?: string;
}

/* ─────────────────────────────────────────
   DONNÉES ENRICHIES
───────────────────────────────────────── */
const REFERENCES: Reference[] = [
  // France - 3 projets
  {
    id: "1",
    country: "France",
    code: "fr",
    lat: 46.603,
    lng: 1.888,
    title: "MD2I — Transformation digitale Groupe La Poste",
    excerpt: "Refonte complète des services numériques et accompagnement des équipes sur 3 ans.",
    image: "https://picsum.photos/id/20/800/500",
    details: "Mission complète de conseil UX/UI, conduite du changement et formation de 120 équipes métiers. Refonte de 14 portails internes, migration vers une architecture microservices, et déploiement d'une plateforme omnicanale. Résultat : +42% de satisfaction client, réduction de 30% du temps de traitement des demandes.",
    date: "2023",
    client: "Groupe La Poste",
    category: "Transformation digitale",
    tags: ["UX/UI", "Microservices", "Omnicanal"],
    impact: "+42% satisfaction client",
    technologies: ["React", "Node.js", "Kafka", "Docker"],
    team: "12 consultants",
    duration: "18 mois",
    budget: "2.4M€",
  },
  {
    id: "1b",
    country: "France",
    code: "fr",
    lat: 46.85,
    lng: 2.35,
    title: "MD2I — IA prédictive pour SNCF Réseau",
    excerpt: "Maintenance prédictive des infrastructures ferroviaires par deep learning.",
    image: "https://picsum.photos/id/13/800/500",
    details: "Déploiement d'une solution de maintenance prédictive sur 5000 km de voies ferrées. Analyse en temps réel de 100 000 capteurs IoT, réduction des incidents de 67%, économie de 120M€ sur 5 ans.",
    date: "2024",
    client: "SNCF Réseau",
    category: "IA & Data Science",
    tags: ["Deep Learning", "IoT", "Maintenance prédictive"],
    impact: "67% réduction des incidents",
    technologies: ["TensorFlow", "Kafka", "InfluxDB", "Grafana"],
    team: "8 data scientists",
    duration: "24 mois",
    budget: "3.1M€",
  },
  {
    id: "1c",
    country: "France",
    code: "fr",
    lat: 45.76,
    lng: 4.84,
    title: "MD2I — Smart Building pour Lyon Métropole",
    excerpt: "Gestion intelligente des consommations énergétiques des bâtiments publics.",
    image: "https://picsum.photos/id/153/800/500",
    details: "Déploiement d'une plateforme de smart building pour 340 bâtiments publics. Optimisation énergétique par IA, réduction de 45% des consommations, ROI en 18 mois.",
    date: "2023",
    client: "Métropole de Lyon",
    category: "Smart Building",
    tags: ["IoT", "Efficacité énergétique", "BIM"],
    impact: "-45% consommation énergétique",
    technologies: ["LoRaWAN", "MQTT", "TimescaleDB"],
    team: "6 ingénieurs",
    duration: "14 mois",
    budget: "1.8M€",
  },
  // Allemagne - 2 projets
  {
    id: "2",
    country: "Allemagne",
    code: "de",
    lat: 51.165,
    lng: 10.451,
    title: "MD2I — Industrie 4.0 & jumeaux numériques Siemens",
    excerpt: "Conception d'une plateforme de simulation industrielle en temps réel pour 8 usines.",
    image: "https://picsum.photos/id/48/800/500",
    details: "Déploiement d'une infrastructure IoT connectant 2 400 capteurs dans 8 sites de production. Création de jumeaux numériques permettant la simulation de scénarios de production et la maintenance prédictive. L'IA embarquée réduit les arrêts non planifiés de 67%.",
    date: "2023",
    client: "Siemens AG",
    category: "Industrie 4.0",
    tags: ["Digital TwinDigital Twin", "IoT", "IA embarquée"],
    impact: "-67% arrêts non planifiés",
    technologies: ["AWS IoT", "Unity", "PyTorch"],
    team: "15 experts",
    duration: "20 mois",
    budget: "4.2M€",
  },
  {
    id: "2b",
    country: "Allemagne",
    code: "de",
    lat: 50.11,
    lng: 8.68,
    title: "MD2I — Cybersécurité automobile pour Mercedes-Benz",
    excerpt: "Plateforme de détection d'intrusion pour véhicules connectés.",
    image: "https://picsum.photos/id/91/800/500",
    details: "Développement d'un IDS (Intrusion Detection System) pour les futures générations de véhicules. Analyse comportementale embarquée, protection en temps réel contre les cyberattaques. Certification ISO 21434 obtenue.",
    date: "2024",
    client: "Mercedes-Benz AG",
    category: "Cybersécurité",
    tags: ["Automotive", "IDS", "Sécurité embarquée"],
    impact: "100% des flottes protégées",
    technologies: ["Rust", "TensorFlow Lite", "CAN bus"],
    team: "10 ingénieurs sécurité",
    duration: "16 mois",
    budget: "2.9M€",
  },
  // États-Unis - 3 projets
  {
    id: "6",
    country: "États-Unis",
    code: "us",
    lat: 37.09,
    lng: -95.712,
    title: "MD2I — IA médicale & diagnostic prédictif Boston Medical",
    excerpt: "Déploiement d'un système de diagnostic assisté par IA dans 12 hôpitaux.",
    image: "https://picsum.photos/id/26/800/500",
    details: "Développement d'une IA capable d'analyser 50 000 images radiologiques par jour. Précision de 97,3% sur la détection précoce de tumeurs pulmonaires. Déploiement dans 12 hôpitaux, formation de 450 radiologues.",
    date: "2024",
    client: "Boston Medical Center",
    category: "HealthTech & IA",
    tags: ["Medical Imaging", "Deep Learning", "Diagnostic"],
    impact: "97.3% précision diagnostic",
    technologies: ["PyTorch", "MONAI", "DICOM", "Kubernetes"],
    team: "14 chercheurs",
    duration: "22 mois",
    budget: "5.5M$",
  },
  {
    id: "6b",
    country: "États-Unis",
    code: "us",
    lat: 40.7128,
    lng: -74.006,
    title: "MD2I — Optimisation financière pour JPMorgan Chase",
    excerpt: "Algorithmes de trading haute fréquence et gestion des risques.",
    image: "https://picsum.photos/id/77/800/500",
    details: "Développement de modèles de prédiction pour le trading algorithmique. Latence inférieure à 1ms, détection d'anomalies en temps réel, conformité SEC/FINRA. Performance supérieure de 34% aux benchmarks du marché.",
    date: "2023",
    client: "JPMorgan Chase",
    category: "Fintech",
    tags: ["HFT", "Risk Management", "ML"],
    impact: "+34% performance",
    technologies: ["C++", "Python", "Apache Flink"],
    team: "9 quants",
    duration: "15 mois",
    budget: "3.8M$",
  },
  {
    id: "6c",
    country: "États-Unis",
    code: "us",
    lat: 37.7749,
    lng: -122.4194,
    title: "MD2I — Cloud natif pour Netflix",
    excerpt: "Migration complète vers une architecture serverless multicloud.",
    image: "https://picsum.photos/id/42/800/500",
    details: "Migration de 200 microservices vers serverless. Réduction des coûts de 42%, amélioration de la scalabilité (10M à 200M utilisateurs). Disponibilité 99.999% maintenue.",
    date: "2023",
    client: "Netflix",
    category: "Cloud & DevOps",
    tags: ["Serverless", "Multicloud", "Microservices"],
    impact: "-42% coûts infrastructure",
    technologies: ["AWS Lambda", "Terraform", "Kubernetes"],
    team: "20 DevOps",
    duration: "18 mois",
    budget: "6.2M$",
  },
  // Espagne
  {
    id: "3",
    country: "Espagne",
    code: "es",
    lat: 40.416,
    lng: -3.703,
    title: "MD2I — Smart City Barcelone 2030",
    excerpt: "Déploiement d'une plateforme urbaine intelligente pour 1,6M d'habitants.",
    image: "https://picsum.photos/id/59/800/500",
    details: "Conception d'une plateforme de gestion urbaine intégrée couvrant mobilité, énergie, déchets et sécurité. Intégration de 180 000 capteurs. Réduction de 25% de la consommation énergétique.",
    date: "2022",
    client: "Mairie de Barcelone",
    category: "Smart City",
    tags: ["IoT", "Urban Data", "Mobilité"],
    impact: "-25% consommation énergétique",
    technologies: ["FIWARE", "LoRaWAN", "Kafka"],
    team: "25 experts",
    duration: "30 mois",
    budget: "7.5M€",
  },
  // Italie
  {
    id: "4",
    country: "Italie",
    code: "it",
    lat: 41.902,
    lng: 12.496,
    title: "MD2I — Luxe digital Ferragamo",
    excerpt: "Stratégie digitale omnicanale pour la maison de couture florentine.",
    image: "https://picsum.photos/id/36/800/500",
    details: "Refonte de l'expérience digitale : e-commerce, app mobile, réalité virtuelle. IA de recommandation personnalisée. Résultats : +89% conversion e-commerce, +35% panier moyen.",
    date: "2022",
    client: "Salvatore Ferragamo",
    category: "Luxe & Digital",
    tags: ["E-commerce", "VR/AR", "Personalization"],
    impact: "+89% conversion",
    technologies: ["Vue.js", "Strapi", "Algolia"],
    team: "8 développeurs",
    duration: "12 mois",
    budget: "1.5M€",
  },
  // Royaume-Uni
  {
    id: "5",
    country: "Royaume-Uni",
    code: "gb",
    lat: 51.507,
    lng: -0.127,
    title: "MD2I — Fintech Revolut",
    excerpt: "Audit et refonte de l'architecture pour la licence bancaire européenne.",
    image: "https://picsum.photos/id/180/800/500",
    details: "Mise en conformité PSD2/RGPD, détection de fraude par ML, refonte sécurité. Accompagnement de 450 ingénieurs.",
    date: "2023",
    client: "Revolut",
    category: "Fintech",
    tags: ["Conformité", "Fraud Detection", "Security"],
    impact: "Licence bancaire obtenue",
    technologies: ["Go", "Kafka", "Datadog"],
    team: "18 consultants",
    duration: "14 mois",
    budget: "4.2M£",
  },
  // Japon
  {
    id: "7",
    country: "Japon",
    code: "jp",
    lat: 35.685,
    lng: 139.751,
    title: "MD2I — Robotique collaborative Toyota",
    excerpt: "Intégration de robots collaboratifs dans les usines de Nagoya.",
    image: "https://picsum.photos/id/160/800/500",
    details: "Intégration de 340 cobots dans 6 lignes d'assemblage, vision par ordinateur pour contrôle qualité. Gain de productivité de 38%.",
    date: "2023",
    client: "Toyota",
    category: "Robotique",
    tags: ["Cobots", "Computer Vision", "Industry 4.0"],
    impact: "+38% productivité",
    technologies: ["ROS2", "OpenCV", "NVIDIA Jetson"],
    team: "12 roboticiens",
    duration: "20 mois",
    budget: "5.8M$",
  },
  // Chine
  {
    id: "8",
    country: "Chine",
    code: "cn",
    lat: 30.572,
    lng: 104.066,
    title: "MD2I — Supply Chain Alibaba",
    excerpt: "Optimisation logistique par reinforcement learning.",
    image: "https://picsum.photos/id/96/800/500",
    details: "Système d'optimisation prédisant la demande à J+7 avec 94% précision, optimisation des routes. Économie de 180M$ annuels.",
    date: "2024",
    client: "Alibaba",
    category: "Supply Chain",
    tags: ["RL", "Demand Forecasting", "Route Optimization"],
    impact: "-180M$ économies",
    technologies: ["Ray", "PyTorch", "Redis"],
    team: "16 data scientists",
    duration: "24 mois",
    budget: "9.5M$",
  },
  // Brésil
  {
    id: "9",
    country: "Brésil",
    code: "br",
    lat: -14.235,
    lng: -51.925,
    title: "MD2I — Logistique dernier kilomètre Mercado Livre",
    excerpt: "Plateforme de livraison pour 5 500 municipalités.",
    image: "https://picsum.photos/id/117/800/500",
    details: "Crowdsourcing + optimisation algorithmique. App mobile pour 80 000 livreurs. Réduction de 45% du délai de livraison.",
    date: "2022",
    client: "Mercado Livre",
    category: "Logistique",
    tags: ["Last Mile", "Crowdsourcing", "Routing"],
    impact: "-45% délais livraison",
    technologies: ["React Native", "GraphQL", "PostGIS"],
    team: "22 développeurs",
    duration: "16 mois",
    budget: "3.2M$",
  },
  // Afrique du Sud - 2 projets
  {
    id: "10",
    country: "Afrique du Sud",
    code: "za",
    lat: -30.559,
    lng: 22.937,
    title: "MD2I — Réseau solaire Eskom",
    excerpt: "Plateforme de gestion pour 4 GW d'énergie solaire.",
    image: "https://picsum.photos/id/145/800/500",
    details: "SCADA nouvelle génération pour 47 centrales solaires, prévision de production par IA météo. Gestion de l'intermittence par algorithmes de stockage.",
    date: "2024",
    client: "Eskom Holdings",
    category: "Énergie",
    tags: ["Renewable Energy", "SCADA", "Forecasting"],
    impact: "+28% production solaire",
    technologies: ["Python", "InfluxDB", "Grafana"],
    team: "11 ingénieurs",
    duration: "28 mois",
    budget: "6.5M$",
  },
  {
    id: "11",
    country: "Afrique du Sud",
    code: "za",
    lat: -30.52,
    lng: 22.97,
    title: "MD2I — Fintech inclusive pour TymeBank",
    excerpt: "Plateforme bancaire digitale pour les populations non bancarisées.",
    image: "https://picsum.photos/id/99/800/500",
    details: "Déploiement d'une solution bancaire 100% mobile pour 5 millions d'utilisateurs en zone rurale. Architecture cloud-native, onboarding biométrique, micro-crédit algorithmique. Croissance de 200% du portefeuille client en 18 mois.",
    date: "2023",
    client: "TymeBank",
    category: "Fintech inclusive",
    tags: ["Digital Banking", "Financial Inclusion", "Biometrics"],
    impact: "5M utilisateurs actifs",
    technologies: ["React Native", "Node.js", "MongoDB", "AWS"],
    team: "14 experts fintech",
    duration: "15 mois",
    budget: "2.8M$",
  },
];

const ORANGE = "#EF9F27";

// Extraire les catégories uniques
const ALL_CATEGORIES = Array.from(new Set(REFERENCES.map(r => r.category))).sort();
const ALL_TECHNOLOGIES = Array.from(new Set(REFERENCES.flatMap(r => r.technologies || []))).sort();

// Extraire les années uniques
const ALL_YEARS = Array.from(new Set(REFERENCES.map(r => r.date))).sort().reverse();

function getTokens(dark: boolean) {
  return {
    bg: dark ? "#0f0e0d" : "#f5f4f0",
    headerBg: dark ? "rgba(15,14,13,0.92)" : "rgba(255,255,255,0.93)",
    cardBg: dark ? "#1f1e1b" : "#ffffff",
    sidebarBg: dark ? "rgba(26,25,22,0.90)" : "rgba(255,255,255,0.90)",
    text: dark ? "#f4f1ec" : "#0d0e10",
    textSoft: dark ? "#9a9590" : "#5f5e5a",
    textMuted: dark ? "#6b6a65" : "#888780",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    borderStrong: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
    shadow: dark ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.14)",
    mapTile: dark
      ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
      : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    mapAttrib: dark
      ? '© <a href="https://stadiamaps.com/">Stadia Maps</a>'
      : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  };
}

export default function MapReferences() {
  const { dark } = useTheme();
  const t = getTokens(dark);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "impact" | "client">("date");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<{ [key: string]: any[] }>({});
  const tileLayerRef = useRef<any>(null);

  // Tooltip
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    projects: Reference[];
    activeTabId: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    projects: [],
    activeTabId: "",
  });
  
  // Modal
  const [modalData, setModalData] = useState<{
    visible: boolean;
    projects: Reference[];
    activeTabId: string;
  }>({
    visible: false,
    projects: [],
    activeTabId: "",
  });
  
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string; type: string} | null>(null);

  // Données filtrées et triées
  const filteredReferences = useMemo(() => {
    let filtered = REFERENCES.filter(ref => {
      const matchesSearch = searchQuery === "" || 
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ref.tags && ref.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (ref.technologies && ref.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(ref.category);
      const matchesTechnology = selectedTechnologies.length === 0 || (ref.technologies && ref.technologies.some(tech => selectedTechnologies.includes(tech)));
      const matchesYear = selectedYears.length === 0 || selectedYears.includes(ref.date);
      
      return matchesSearch && matchesCategory && matchesTechnology && matchesYear;
    });

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date);
      if (sortBy === "client") return a.client.localeCompare(b.client);
      if (sortBy === "impact") return (b.impact?.length || 0) - (a.impact?.length || 0);
      return 0;
    });

    return filtered;
  }, [searchQuery, selectedCategories, selectedTechnologies, selectedYears, sortBy]);

  // Regrouper par pays
  const referencesByCountry = useMemo(() => {
    const grouped = new Map<string, Reference[]>();
    filteredReferences.forEach(ref => {
      if (!grouped.has(ref.country)) {
        grouped.set(ref.country, []);
      }
      grouped.get(ref.country)!.push(ref);
    });
    return grouped;
  }, [filteredReferences]);

  const stats = useMemo(() => ({
    countries: referencesByCountry.size,
    projects: filteredReferences.length,
    sectors: new Set(filteredReferences.map(r => r.category)).size,
    totalImpact: filteredReferences.reduce((sum, r) => sum + (parseInt(r.impact?.match(/\d+/)?.[0] || "0")), 0),
  }), [filteredReferences, referencesByCountry]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setModalData(prev => ({ ...prev, visible: false })); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Afficher une notification
  const showTemporaryNotification = (message: string, type: "success" | "info" = "success") => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Mise à jour des marqueurs
  const updateMarkers = useCallback(async () => {
    if (!leafletMapRef.current || !isMapReady) return;
    
    const L = (await import("leaflet")).default;
    const map = leafletMapRef.current;
    if (!map) return;

    Object.values(markersRef.current).flat().forEach(marker => marker.remove());
    markersRef.current = {};

    referencesByCountry.forEach((refs, country) => {
      const avgLat = refs.reduce((sum, r) => sum + r.lat, 0) / refs.length;
      const avgLng = refs.reduce((sum, r) => sum + r.lng, 0) / refs.length;
      const nbProjects = refs.length;
      
      const iconHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;position:relative;">
          <div style="
            width:${nbProjects > 1 ? 52 : 42}px;
            height:${nbProjects > 1 ? 52 : 42}px;
            border-radius:50%;
            border:3px solid ${ORANGE};
            background:${dark ? "#1a1916" : "white"};
            overflow:hidden;
            position:relative;
            box-shadow:0 2px 12px rgba(0,0,0,0.3);
            transition:transform 0.2s;
          ">
            <div style="
              position:absolute;inset:-5px;border-radius:50%;
              border:2px solid ${ORANGE};
              animation:md2iPulse 2.4s ease-out infinite;
            "></div>
            <img
              src="https://flagicons.lipis.dev/flags/4x3/${refs[0].code}.svg"
              alt="${country}"
              style="width:100%;height:100%;object-fit:cover;display:block;"
              loading="lazy"
            />
            ${nbProjects > 1 ? `
              <div style="
                position:absolute;
                bottom:-5px;
                right:-5px;
                background:${ORANGE};
                color:white;
                font-size:10px;
                font-weight:bold;
                width:18px;
                height:18px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                border:2px solid ${dark ? "#0f0e0d" : "white"};
              ">
                ${nbProjects}
              </div>
            ` : ''}
          </div>
          <div style="width:2px;height:11px;background:${ORANGE};"></div>
          <div style="width:6px;height:6px;border-radius:50%;background:${ORANGE};opacity:0.55;"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [nbProjects > 1 ? 60 : 44, nbProjects > 1 ? 74 : 58],
        iconAnchor: [nbProjects > 1 ? 30 : 22, nbProjects > 1 ? 74 : 58],
      });

      const marker = L.marker([avgLat, avgLng], { icon }).addTo(map);
      
      if (!markersRef.current[country]) markersRef.current[country] = [];
      markersRef.current[country].push(marker);

      marker.on("mouseover", (e: any) => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        const mapRect = mapContainerRef.current!.getBoundingClientRect();
        setTooltipData({
          visible: true,
          x: mapRect.left + e.containerPoint.x,
          y: mapRect.top + e.containerPoint.y,
          projects: refs,
          activeTabId: refs[0].id,
        });
      });

      marker.on("mouseout", () => {
        hideTimerRef.current = setTimeout(() => setTooltipData(prev => ({ ...prev, visible: false })), 200);
      });

      marker.on("click", () => {
        setTooltipData(prev => ({ ...prev, visible: false }));
        setModalData({
          visible: true,
          projects: refs,
          activeTabId: refs[0].id,
        });
      });
    });
  }, [referencesByCountry, dark, isMapReady]);

  // Init Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center: [20, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 4,
      });
      leafletMapRef.current = map;

      tileLayerRef.current = L.tileLayer(
        dark ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: dark ? '© <a href="https://stadiamaps.com/">Stadia Maps</a>' : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, crossOrigin: "anonymous" }
      ).addTo(map);
      
      setIsMapReady(true);
    };

    initMap();
    return () => { leafletMapRef.current?.remove(); leafletMapRef.current = null; setIsMapReady(false); };
  }, []);

  useEffect(() => { if (isMapReady) updateMarkers(); }, [updateMarkers, isMapReady]);

  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;
    const updateTileLayer = async () => {
      const L = (await import("leaflet")).default;
      tileLayerRef.current?.remove();
      tileLayerRef.current = L.tileLayer(
        dark ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: dark ? '© <a href="https://stadiamaps.com/">Stadia Maps</a>' : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, crossOrigin: "anonymous" }
      ).addTo(leafletMapRef.current!);
    };
    updateTileLayer();
  }, [dark, isMapReady]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTechnologies([]);
    setSelectedYears([]);
    showTemporaryNotification("Filtres réinitialisés", "info");
  };

  const exportToCSV = () => {
    const headers = ["Client", "Projet", "Pays", "Catégorie", "Date", "Impact", "Technologies"];
    const rows = filteredReferences.map(r => [
      r.client, r.title, r.country, r.category, r.date, r.impact || "-", (r.technologies || []).join(", ")
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "md2i-references.csv";
    a.click();
    URL.revokeObjectURL(url);
    showTemporaryNotification("Export CSV réussi", "success");
  };

  const ttLeft = (() => {
    const W = 380;
    const OFFSET = 20;
    let left = tooltipData.x + OFFSET;
    if (typeof window !== "undefined" && left + W > window.innerWidth - 16)
      left = tooltipData.x - W - OFFSET;
    return left;
  })();

  const ttTop = (() => {
    const H = 420;
    let top = tooltipData.y - H / 2;
    if (typeof window !== "undefined") {
      if (top < 60) top = 60;
      if (top + H > window.innerHeight - 16) top = window.innerHeight - H - 16;
    }
    return top;
  })();

  const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0 || selectedTechnologies.length > 0 || selectedYears.length > 0;

  const tooltipActiveProject = tooltipData.projects.find(p => p.id === tooltipData.activeTabId) || tooltipData.projects[0];
  const modalActiveProject = modalData.projects.find(p => p.id === modalData.activeTabId) || modalData.projects[0];

  return (
    <>
      <style>{`
        @keyframes md2iPulse { 0% { transform: scale(0.85); opacity: 0.75; } 100% { transform: scale(1.65); opacity: 0; } }
        @keyframes md2iTooltipIn { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes md2iModalIn { from { opacity: 0; transform: scale(0.96) translateY(14px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes notificationSlide { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
      `}</style>

      <main style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: t.bg, transition: "background 0.35s" }}>

        {/* NOTIFICATION TOAST */}
        {showNotification && (
          <div style={{
            position: "fixed", top: 80, right: 20, zIndex: 2000,
            background: showNotification.type === "success" ? "#10b981" : ORANGE,
            color: "white", padding: "12px 20px", borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            animation: "notificationSlide 0.3s ease",
            fontSize: 13, fontWeight: 500,
          }}>
            {showNotification.message}
          </div>
        )}

        {/* HEADER */}
        <header style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: t.headerBg, borderBottom: `0.5px solid ${t.border}`, backdropFilter: "blur(18px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 14px rgba(239,159,39,0.35)" }}>M²</div>
            <div>
              <h1 style={{ color: t.text, fontSize: 15, fontWeight: 700 }}>MD2I</h1>
              <p style={{ color: t.textMuted, fontSize: 10, marginTop: 3 }}>Références mondiales · Innovation & Transformation</p>
            </div>
          </div>

          {/* Barre de recherche améliorée */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 500, margin: "0 20px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${t.border}`, borderRadius: 40, padding: "6px 14px" }}>
              <span style={{ fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher par titre, client, pays, technologie, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: t.text, fontSize: 12 }}
              />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.textMuted }}>✕</button>}
            </div>
            
            <button onClick={() => setFilterPanelOpen(!filterPanelOpen)} style={{ display: "flex", alignItems: "center", gap: 6, background: hasActiveFilters ? ORANGE : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"), border: `0.5px solid ${hasActiveFilters ? "transparent" : t.border}`, borderRadius: 40, padding: "6px 14px", cursor: "pointer", color: hasActiveFilters ? "white" : t.text, fontSize: 12, fontWeight: 500 }}>
              <span>⚙️</span> Filtres {hasActiveFilters && <span style={{ background: "white", color: ORANGE, borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>{selectedCategories.length + selectedTechnologies.length + selectedYears.length}</span>}
            </button>

            {/* Export CSV */}
            <button onClick={exportToCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${t.border}`, borderRadius: 40, padding: "6px 14px", cursor: "pointer", color: t.text, fontSize: 12 }}>
              📊 Exporter CSV
            </button>
          </div>

          {/* Stats améliorées */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${t.border}`, borderRadius: 16, padding: "8px 18px" }}>
              <StatBadge value={stats.countries.toString()} label="Pays" t={t} />
              <div style={{ width: "0.5px", height: 28, background: t.border }} />
              <StatBadge value={stats.projects.toString()} label="Projets" t={t} />
              <div style={{ width: "0.5px", height: 28, background: t.border }} />
              <StatBadge value={stats.sectors.toString()} label="Secteurs" t={t} />
              <div style={{ width: "0.5px", height: 28, background: t.border }} />
              <StatBadge value={`+${stats.totalImpact}%`} label="Impact" t={t} />
            </div>
          </div>
        </header>

        {/* PANEL FILTRES AMÉLIORÉ */}
        {filterPanelOpen && (
          <div style={{ position: "absolute", top: 70, right: 20, zIndex: 1001, width: 320, background: t.cardBg, border: `0.5px solid ${t.borderStrong}`, borderRadius: 20, boxShadow: t.shadow, padding: 16, animation: "slideDown 0.2s ease", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: t.text, fontSize: 13, fontWeight: 700 }}>Filtres avancés</h3>
              {hasActiveFilters && <button onClick={clearFilters} style={{ background: "transparent", border: "none", color: ORANGE, fontSize: 11, cursor: "pointer" }}>Tout réinitialiser</button>}
            </div>

            {/* Tri */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, marginBottom: 10 }}>TRIER PAR</p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["date", "impact", "client"] as const).map(option => (
                  <button key={option} onClick={() => setSortBy(option)} style={{ background: sortBy === option ? ORANGE : "transparent", border: `0.5px solid ${sortBy === option ? "transparent" : t.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 10, color: sortBy === option ? "white" : t.textSoft, cursor: "pointer" }}>
                    {option === "date" ? "📅 Date" : option === "impact" ? "📈 Impact" : "🏢 Client"}
                  </button>
                ))}
              </div>
            </div>

            {/* Catégories */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, marginBottom: 10 }}>CATÉGORIES</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)} style={{ background: selectedCategories.includes(cat) ? ORANGE : "transparent", border: `0.5px solid ${selectedCategories.includes(cat) ? "transparent" : t.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: selectedCategories.includes(cat) ? "white" : t.textSoft, cursor: "pointer" }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, marginBottom: 10 }}>TECHNOLOGIES</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_TECHNOLOGIES.slice(0, 15).map(tech => (
                  <button key={tech} onClick={() => toggleTechnology(tech)} style={{ background: selectedTechnologies.includes(tech) ? ORANGE : "transparent", border: `0.5px solid ${selectedTechnologies.includes(tech) ? "transparent" : t.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: selectedTechnologies.includes(tech) ? "white" : t.textSoft, cursor: "pointer" }}>{tech}</button>
                ))}
              </div>
            </div>

            {/* Années */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, marginBottom: 10 }}>ANNÉES</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_YEARS.map(year => (
                  <button key={year} onClick={() => toggleYear(year)} style={{ background: selectedYears.includes(year) ? ORANGE : "transparent", border: `0.5px solid ${selectedYears.includes(year) ? "transparent" : t.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: selectedYears.includes(year) ? "white" : t.textSoft, cursor: "pointer" }}>{year}</button>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: 12, borderTop: `0.5px solid ${t.border}`, color: t.textMuted, fontSize: 10, textAlign: "center" }}>
              {filteredReferences.length} résultat{filteredReferences.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* CARTE */}
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

        {/* TOOLTIP AVEC TABS ET MÉTRIQUES */}
        {tooltipData.visible && tooltipData.projects.length > 0 && (
          <div
            style={{ position: "fixed", zIndex: 1500, left: ttLeft, top: ttTop, width: 380, animation: "md2iTooltipIn 0.18s ease", pointerEvents: "auto" }}
            onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
            onMouseLeave={() => { setTooltipData(prev => ({ ...prev, visible: false })); }}
          >
            <div style={{ background: t.cardBg, border: `0.5px solid ${t.borderStrong}`, borderRadius: 20, overflow: "hidden", boxShadow: t.shadow }}>
              
              <div style={{ position: "relative", height: 130 }}>
                <img src={tooltipActiveProject.image} alt={tooltipActiveProject.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />
                <span style={{ position: "absolute", top: 10, left: 10, background: ORANGE, color: "white", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 99 }}>{tooltipActiveProject.category}</span>
                <div style={{ position: "absolute", bottom: 10, right: 10, width: 34, height: 24, borderRadius: 5, overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)" }}>
                  <img src={`https://flagicons.lipis.dev/flags/4x3/${tooltipActiveProject.code}.svg`} alt={tooltipActiveProject.country} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                {/* Badge impact */}
                {tooltipActiveProject.impact && (
                  <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "2px 8px", fontSize: 9, color: "#4ade80" }}>
                    📈 {tooltipActiveProject.impact}
                  </div>
                )}
              </div>

              {tooltipData.projects.length > 1 && (
                <div style={{ display: "flex", borderBottom: `0.5px solid ${t.border}`, background: dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  {tooltipData.projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => setTooltipData(prev => ({ ...prev, activeTabId: project.id }))}
                      style={{
                        flex: 1,
                        padding: "8px 6px",
                        background: "transparent",
                        border: "none",
                        color: tooltipData.activeTabId === project.id ? ORANGE : t.textSoft,
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: "pointer",
                        borderBottom: tooltipData.activeTabId === project.id ? `2px solid ${ORANGE}` : "2px solid transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      {project.date} · {project.client.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: "12px 14px" }}>
                <p style={{ color: ORANGE, fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{tooltipActiveProject.client} · {tooltipActiveProject.date}</p>
                <h3 style={{ color: t.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {tooltipActiveProject.title}
                </h3>
                <p style={{ color: t.textSoft, fontSize: 11, lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {tooltipActiveProject.excerpt}
                </p>
                
                {/* Métriques rapides */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {tooltipActiveProject.team && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: t.textMuted }}>
                      <span>👥</span> {tooltipActiveProject.team}
                    </div>
                  )}
                  {tooltipActiveProject.duration && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: t.textMuted }}>
                      <span>⏱️</span> {tooltipActiveProject.duration}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setTooltipData(prev => ({ ...prev, visible: false }));
                    setModalData({
                      visible: true,
                      projects: tooltipData.projects,
                      activeTabId: tooltipData.activeTabId,
                    });
                  }}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 12, background: ORANGE, border: "none", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  📋 Détails complets →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE AVEC TABS ET MÉTRIQUES DÉTAILLÉES */}
        {modalData.visible && modalData.projects.length > 0 && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={() => setModalData(prev => ({ ...prev, visible: false }))}>
            <div style={{ background: t.cardBg, border: `0.5px solid ${t.borderStrong}`, borderRadius: 28, width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", animation: "md2iModalIn 0.25s ease" }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ position: "relative", height: 260 }}>
                <img src={modalActiveProject.image} alt={modalActiveProject.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 20, left: 24, display: "flex", alignItems: "flex-end", gap: 16 }}>
                  <div style={{ width: 64, height: 48, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)" }}>
                    <img src={`https://flagicons.lipis.dev/flags/4x3/${modalActiveProject.code}.svg`} alt={modalActiveProject.country} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 5 }}>{modalActiveProject.country}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ background: ORANGE, color: "white", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>{modalActiveProject.category}</span>
                      <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>{modalActiveProject.date}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setModalData(prev => ({ ...prev, visible: false }))} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>

              {modalData.projects.length > 1 && (
                <div style={{ display: "flex", borderBottom: `0.5px solid ${t.border}`, background: dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", padding: "0 24px", overflowX: "auto" }}>
                  {modalData.projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => setModalData(prev => ({ ...prev, activeTabId: project.id }))}
                      style={{
                        padding: "14px 20px",
                        background: "transparent",
                        border: "none",
                        color: modalData.activeTabId === project.id ? ORANGE : t.textSoft,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        borderBottom: modalData.activeTabId === project.id ? `2px solid ${ORANGE}` : "2px solid transparent",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.date} · {project.client}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: "28px 32px 32px" }}>
                <p style={{ color: ORANGE, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{modalActiveProject.client}</p>
                <h2 style={{ color: t.text, fontSize: 24, fontWeight: 700, lineHeight: 1.3, marginBottom: 20 }}>{modalActiveProject.title}</h2>

                <div style={{ borderLeft: `3px solid ${ORANGE}`, paddingLeft: 16, marginBottom: 24 }}>
                  <p style={{ color: dark ? "rgba(239,159,39,0.85)" : "#a0660a", fontSize: 14, lineHeight: 1.65, fontStyle: "italic" }}>{modalActiveProject.excerpt}</p>
                </div>

                <p style={{ color: t.textSoft, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{modalActiveProject.details}</p>

                {/* Métriques détaillées */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {modalActiveProject.team && <MetricCard icon="👥" label="Équipe" value={modalActiveProject.team} t={t} />}
                  {modalActiveProject.duration && <MetricCard icon="⏱️" label="Durée" value={modalActiveProject.duration} t={t} />}
                  {modalActiveProject.budget && <MetricCard icon="💰" label="Budget" value={modalActiveProject.budget} t={t} />}
                  {modalActiveProject.impact && <MetricCard icon="📈" label="Impact" value={modalActiveProject.impact} t={t} />}
                </div>

                {modalActiveProject.technologies && modalActiveProject.technologies.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ color: t.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>🛠️ TECHNOLOGIES UTILISÉES</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {modalActiveProject.technologies.map(tech => <span key={tech} style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", padding: "6px 12px", borderRadius: 20, fontSize: 11, color: t.textSoft }}>{tech}</span>)}
                    </div>
                  </div>
                )}

                {modalActiveProject.tags && modalActiveProject.tags.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ color: t.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>🏷️ TAGS</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {modalActiveProject.tags.map(tag => <span key={tag} style={{ color: ORANGE, fontSize: 10, padding: "4px 10px", border: `0.5px solid ${ORANGE}40`, borderRadius: 20 }}>#{tag}</span>)}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button style={{ flex: 1, padding: "14px 0", borderRadius: 14, background: ORANGE, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                    📧 Contacter MD2I
                  </button>
                  <button onClick={() => setModalData(prev => ({ ...prev, visible: false }))} style={{ padding: "14px 28px", borderRadius: 14, background: "transparent", border: `0.5px solid ${t.border}`, color: t.textSoft, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LÉGENDE AMÉLIORÉE */}
        <div style={{ position: "absolute", bottom: 180, left: 16, zIndex: 1000 }}>
          <div style={{ background: t.sidebarBg, border: `0.5px solid ${t.border}`, borderRadius: 18, padding: "12px 16px", backdropFilter: "blur(12px)" }}>
            <p style={{ color: t.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, fontWeight: 600 }}>📖 Légende</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <LegendItem color={ORANGE} label="Référence active" t={t} />
              <LegendItem color={ORANGE} label="Plusieurs projets (cluster avec tabs)" t={t} isCluster />
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 11 }}>🖱</span><span style={{ color: t.textMuted, fontSize: 11 }}>Survol pour aperçu avec tabs</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 11 }}>👆</span><span style={{ color: t.textMuted, fontSize: 11 }}>Clic pour modale détaillée</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 11 }}>📊</span><span style={{ color: t.textMuted, fontSize: 11 }}>Export CSV disponible</span></div>
            </div>
          </div>
        </div>

        {/* RACCOURCI CLAVIER */}
        <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000, fontSize: 9, color: t.textMuted, background: t.sidebarBg, padding: "4px 8px", borderRadius: 8 }}>
          ⌨️ ESC · Fermer
        </div>

      </main>
    </>
  );
}

function StatBadge({ value, label, t }: { value: string; label: string; t: ReturnType<typeof getTokens> }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: ORANGE, fontWeight: 700, fontSize: 17, lineHeight: 1 }}>{value}</p>
      <p style={{ color: t.textMuted, fontSize: 9, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</p>
    </div>
  );
}

function MetricCard({ icon, label, value, t }: { icon: string; label: string; value: string; t: ReturnType<typeof getTokens> }) {
  return (
    <div style={{ background: t.sidebarBg, borderRadius: 12, padding: "12px", border: `0.5px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <p style={{ color: t.textMuted, fontSize: 10, marginBottom: 2 }}>{label}</p>
          <p style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, t, isCluster }: { color: string; label: string; t: ReturnType<typeof getTokens>; isCluster?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {isCluster ? (
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, color: "white", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
      ) : (
        <div style={{ width: 10, height: 10, borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}80` }} />
      )}
      <span style={{ color: t.textMuted, fontSize: 11 }}>{label}</span>
    </div>
  );
}