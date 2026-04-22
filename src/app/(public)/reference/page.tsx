"use client";

import { useTheme } from "@/app/context/ThemeContext";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

interface Reference {
  id: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  title: string;
  slug?: string;
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

type SortBy = "date" | "impact" | "client";

const ORANGE = "#EF9F27";

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
    stickyBg: dark ? "rgba(31,30,27,0.94)" : "rgba(255,255,255,0.94)",
  };
}

function safeImage(src?: string) {
  const value = src?.trim() || "";
  return value || "/placeholder-reference.svg";
}

function stripHtml(html?: string) {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
}

function RichHtml({
  html,
  color,
  clamp,
}: {
  html?: string;
  color: string;
  clamp?: number;
}) {
  return (
    <div
      className={clamp ? `rich-html clamp-${clamp}` : "rich-html"}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}

function getNextId(projects: Reference[], activeId: string, direction: 1 | -1) {
  if (projects.length === 0) return activeId;
  const currentIndex = Math.max(
    0,
    projects.findIndex((p) => p.id === activeId)
  );
  const nextIndex =
    (currentIndex + direction + projects.length) % projects.length;
  return projects[nextIndex].id;
}

function ArrowButton({
  onClick,
  dark,
  t,
  label,
}: {
  onClick: () => void;
  dark: boolean;
  t: ReturnType<typeof getTokens>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        border: `0.5px solid ${t.border}`,
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        color: t.text,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label === "previous" ? "←" : "→"}
    </button>
  );
}

function MinimalTabs({
  projects,
  activeId,
  onSelect,
  onPrev,
  onNext,
  dark,
  t,
  sticky = false,
}: {
  projects: Reference[];
  activeId: string;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  dark: boolean;
  t: ReturnType<typeof getTokens>;
  sticky?: boolean;
}) {
  if (projects.length <= 1) return null;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: `0.5px solid ${t.border}`,
        background: sticky ? t.stickyBg : dark ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.015)",
        backdropFilter: sticky ? "blur(12px)" : "none",
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 8 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            color: t.textMuted,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {projects.length} projets
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <ArrowButton
            onClick={onPrev}
            dark={dark}
            t={t}
            label="previous"
          />
          <ArrowButton
            onClick={onNext}
            dark={dark}
            t={t}
            label="next"
          />
        </div>
      </div>

      <div
        className="tabs-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "thin",
          paddingBottom: 2,
        }}
      >
        {projects.map((project) => {
          const active = activeId === project.id;

          return (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              style={{
                flexShrink: 0,
                border: active
                  ? `1px solid ${ORANGE}`
                  : `0.5px solid ${t.border}`,
                background: active
                  ? dark
                    ? "rgba(239,159,39,0.10)"
                    : "rgba(239,159,39,0.08)"
                  : "transparent",
                color: active ? t.text : t.textSoft,
                borderRadius: 999,
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: active ? ORANGE : dark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.16)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {project.client}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: active ? ORANGE : t.textMuted,
                  whiteSpace: "nowrap",
                }}
              >
                {project.date}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
  t,
}: {
  title: string;
  children: React.ReactNode;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          color: t.textMuted,
          fontSize: 10,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  label,
  onClick,
  t,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? ORANGE : "transparent",
        border: `0.5px solid ${active ? "transparent" : t.border}`,
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 10,
        color: active ? "white" : t.textSoft,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function StatBadge({
  value,
  label,
  t,
}: {
  value: string;
  label: string;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          color: ORANGE,
          fontWeight: 700,
          fontSize: 17,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          color: t.textMuted,
          fontSize: 9,
          marginTop: 3,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  t,
}: {
  icon: string;
  label: string;
  value: string;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <div
      style={{
        background: t.sidebarBg,
        borderRadius: 12,
        padding: "12px",
        border: `0.5px solid ${t.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <p style={{ color: t.textMuted, fontSize: 10, marginBottom: 2 }}>
            {label}
          </p>
          <p style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MapReferences() {
  const { dark } = useTheme();
  const t = getTokens(dark);

  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");

  const [showNotification, setShowNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any[] }>({});
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [modalData, setModalData] = useState<{
    visible: boolean;
    projects: Reference[];
    activeTabId: string;
  }>({
    visible: false,
    projects: [],
    activeTabId: "",
  });

  useEffect(() => {
    const loadReferences = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/public/references", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erreur de chargement");
        }

        setReferences(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error(error);
        setReferences([]);
        setShowNotification({
          message: "Impossible de charger les références publiques",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, []);

  const showTemporaryNotification = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setShowNotification({ message, type });
      setTimeout(() => setShowNotification(null), 3000);
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalData((prev) => ({ ...prev, visible: false }));
        setTooltipData((prev) => ({ ...prev, visible: false }));
        return;
      }

      if (modalData.visible && modalData.projects.length > 1) {
        if (e.key === "ArrowRight") {
          setModalData((prev) => ({
            ...prev,
            activeTabId: getNextId(prev.projects, prev.activeTabId, 1),
          }));
        }
        if (e.key === "ArrowLeft") {
          setModalData((prev) => ({
            ...prev,
            activeTabId: getNextId(prev.projects, prev.activeTabId, -1),
          }));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalData.visible, modalData.projects.length]);

  const ALL_CATEGORIES = useMemo(
    () => Array.from(new Set(references.map((r) => r.category))).sort(),
    [references]
  );

  const ALL_TECHNOLOGIES = useMemo(
    () => Array.from(new Set(references.flatMap((r) => r.technologies || []))).sort(),
    [references]
  );

  const ALL_YEARS = useMemo(
    () => Array.from(new Set(references.map((r) => r.date))).sort().reverse(),
    [references]
  );

  const ALL_TAGS = useMemo(
    () => Array.from(new Set(references.flatMap((r) => r.tags || []))).sort(),
    [references]
  );

  const filteredReferences = useMemo(() => {
    const filtered = references.filter((ref) => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        ref.title.toLowerCase().includes(q) ||
        ref.client.toLowerCase().includes(q) ||
        ref.country.toLowerCase().includes(q) ||
        stripHtml(ref.excerpt).toLowerCase().includes(q) ||
        stripHtml(ref.details).toLowerCase().includes(q) ||
        (ref.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
        (ref.technologies || []).some((tech) => tech.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(ref.category);

      const matchesTechnology =
        selectedTechnologies.length === 0 ||
        (ref.technologies || []).some((tech) => selectedTechnologies.includes(tech));

      const matchesYear =
        selectedYears.length === 0 || selectedYears.includes(ref.date);

      const matchesTag =
        selectedTags.length === 0 ||
        (ref.tags || []).some((tag) => selectedTags.includes(tag));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTechnology &&
        matchesYear &&
        matchesTag
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date);
      if (sortBy === "client") return a.client.localeCompare(b.client);
      if (sortBy === "impact") {
        return (b.impact?.length || 0) - (a.impact?.length || 0);
      }
      return 0;
    });

    return filtered;
  }, [
    references,
    searchQuery,
    selectedCategories,
    selectedTechnologies,
    selectedYears,
    selectedTags,
    sortBy,
  ]);

  const referencesByCountry = useMemo(() => {
    const grouped = new Map<string, Reference[]>();
    filteredReferences.forEach((ref) => {
      if (!grouped.has(ref.country)) grouped.set(ref.country, []);
      grouped.get(ref.country)!.push(ref);
    });
    return grouped;
  }, [filteredReferences]);

  const stats = useMemo(
    () => ({
      countries: referencesByCountry.size,
      projects: filteredReferences.length,
      sectors: new Set(filteredReferences.map((r) => r.category)).size,
      totalImpact: filteredReferences.reduce(
        (sum, r) => sum + Number(r.impact?.match(/\d+/)?.[0] || "0"),
        0
      ),
    }),
    [filteredReferences, referencesByCountry]
  );

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategories.length > 0 ||
    selectedTechnologies.length > 0 ||
    selectedYears.length > 0 ||
    selectedTags.length > 0;

  const tooltipActiveProject =
    tooltipData.projects.find((p) => p.id === tooltipData.activeTabId) ||
    tooltipData.projects[0];

  const modalActiveProject =
    modalData.projects.find((p) => p.id === modalData.activeTabId) ||
    modalData.projects[0];

  const getTileUrl = useCallback(
    (isDark: boolean) =>
      isDark
        ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
        : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    []
  );

  const getTileAttribution = useCallback(
    (isDark: boolean) =>
      isDark
        ? '© <a href="https://stadiamaps.com/">Stadia Maps</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    []
  );

  const clearAllMarkers = useCallback(() => {
    Object.values(markersRef.current)
      .flat()
      .forEach((marker) => {
        try {
          marker.remove();
        } catch {}
      });

    markersRef.current = {};
  }, []);

  const updateMarkers = useCallback(async () => {
    if (!leafletMapRef.current || !isMapReady) return;

    const L = (await import("leaflet")).default;
    const map = leafletMapRef.current;

    clearAllMarkers();

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
            ${
              nbProjects > 1
                ? `<div style="
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
                  ">${nbProjects}</div>`
                : ""
            }
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

      if (!markersRef.current[country]) {
        markersRef.current[country] = [];
      }
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
        hideTimerRef.current = setTimeout(() => {
          setTooltipData((prev) => ({ ...prev, visible: false }));
        }, 200);
      });

      marker.on("click", () => {
        setTooltipData((prev) => ({ ...prev, visible: false }));
        setModalData({
          visible: true,
          projects: refs,
          activeTabId: refs[0].id,
        });
      });
    });
  }, [referencesByCountry, dark, isMapReady, clearAllMarkers]);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      const container = mapContainerRef.current;
      const L = (await import("leaflet")).default;

      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const rawContainer = container as HTMLDivElement & { _leaflet_id?: number };
      if (rawContainer._leaflet_id) delete rawContainer._leaflet_id;

      const map = L.map(container, {
        center: [20, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 6,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      leafletMapRef.current = map;

      tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
        attribution: getTileAttribution(dark),
        maxZoom: 19,
        crossOrigin: "anonymous",
      }).addTo(map);

      setIsMapReady(true);
      setLoadingMap(false);

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    };

    initMap();

    return () => {
      cancelled = true;

      clearAllMarkers();

      if (tileLayerRef.current) {
        try {
          tileLayerRef.current.remove();
        } catch {}
        tileLayerRef.current = null;
      }

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      if (mapContainerRef.current) {
        const rawContainer = mapContainerRef.current as HTMLDivElement & {
          _leaflet_id?: number;
        };
        if (rawContainer._leaflet_id) delete rawContainer._leaflet_id;
      }

      setIsMapReady(false);
    };
  }, [getTileUrl, getTileAttribution, clearAllMarkers]);

  useEffect(() => {
    const updateTileLayer = async () => {
      if (!leafletMapRef.current || !isMapReady) return;

      const L = (await import("leaflet")).default;
      const map = leafletMapRef.current;

      if (tileLayerRef.current) {
        try {
          tileLayerRef.current.remove();
        } catch {}
      }

      tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
        attribution: getTileAttribution(dark),
        maxZoom: 19,
        crossOrigin: "anonymous",
      }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    };

    updateTileLayer();
  }, [dark, isMapReady, getTileUrl, getTileAttribution]);

  useEffect(() => {
    if (!isMapReady) return;
    updateMarkers();
  }, [isMapReady, updateMarkers]);

  const goTooltip = (direction: 1 | -1) => {
    setTooltipData((prev) => {
      if (prev.projects.length <= 1) return prev;
      return {
        ...prev,
        activeTabId: getNextId(prev.projects, prev.activeTabId, direction),
      };
    });
  };

  const goModal = (direction: 1 | -1) => {
    setModalData((prev) => {
      if (prev.projects.length <= 1) return prev;
      return {
        ...prev,
        activeTabId: getNextId(prev.projects, prev.activeTabId, direction),
      };
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTechnologies([]);
    setSelectedYears([]);
    setSelectedTags([]);
    showTemporaryNotification("Filtres réinitialisés", "info");
  };

  const exportToCSV = () => {
    const headers = [
      "Client",
      "Projet",
      "Pays",
      "Catégorie",
      "Date",
      "Impact",
      "Technologies",
      "Tags",
      "Extrait",
      "Détails",
    ];

    const rows = filteredReferences.map((r) => [
      r.client,
      r.title,
      r.country,
      r.category,
      r.date,
      r.impact || "-",
      (r.technologies || []).join(", "),
      (r.tags || []).join(", "),
      stripHtml(r.excerpt),
      stripHtml(r.details),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "md2i-references.csv";
    a.click();
    URL.revokeObjectURL(url);

    showTemporaryNotification("Export CSV réussi", "success");
  };

  const ttLeft = (() => {
    const W = 390;
    const OFFSET = 20;
    let left = tooltipData.x + OFFSET;

    if (typeof window !== "undefined" && left + W > window.innerWidth - 16) {
      left = tooltipData.x - W - OFFSET;
    }

    return left;
  })();

  const ttTop = (() => {
    const H = tooltipData.projects.length > 1 ? 520 : 420;
    let top = tooltipData.y - H / 2;

    if (typeof window !== "undefined") {
      if (top < 60) top = 60;
      if (top + H > window.innerHeight - 16) {
        top = window.innerHeight - H - 16;
      }
    }

    return top;
  })();

  return (
    <>
      <style>{`
        @keyframes md2iPulse {
          0% { transform: scale(0.85); opacity: 0.75; }
          100% { transform: scale(1.65); opacity: 0; }
        }

        @keyframes md2iTooltipIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes md2iModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(14px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes notificationSlide {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .rich-html {
          font-size: 14px;
          line-height: 1.7;
        }

        .rich-html p {
          margin: 0 0 10px;
        }

        .rich-html h1,
        .rich-html h2,
        .rich-html h3 {
          margin: 0 0 10px;
          line-height: 1.3;
        }

        .rich-html ul,
        .rich-html ol {
          margin: 0 0 10px;
          padding-left: 18px;
        }

        .rich-html a {
          color: ${ORANGE};
          text-decoration: underline;
        }

        .rich-html img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          display: block;
          margin: 10px 0;
        }

        .rich-html blockquote {
          margin: 10px 0;
          padding-left: 12px;
          border-left: 3px solid ${ORANGE};
          opacity: 0.9;
        }

        .rich-html pre {
          padding: 12px;
          border-radius: 10px;
          overflow-x: auto;
          background: ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
        }

        .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tabs-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .tabs-scroll::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.12)"};
          border-radius: 999px;
        }
      `}</style>

      <main
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: t.bg,
          transition: "background 0.35s",
        }}
      >
        {showNotification && (
          <div
            style={{
              position: "fixed",
              top: 80,
              right: 20,
              zIndex: 2000,
              background:
                showNotification.type === "success"
                  ? "#10b981"
                  : showNotification.type === "error"
                  ? "#ef4444"
                  : ORANGE,
              color: "white",
              padding: "12px 20px",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              animation: "notificationSlide 0.3s ease",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {showNotification.message}
          </div>
        )}

        <header
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            background: t.headerBg,
            borderBottom: `0.5px solid ${t.border}`,
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: ORANGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 4px 14px rgba(239,159,39,0.35)",
              }}
            >
              M²
            </div>

            <div>
              <h1 style={{ color: t.text, fontSize: 15, fontWeight: 700 }}>
                MD2I
              </h1>
              <p
                style={{
                  color: t.textMuted,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                Références mondiales · Innovation & Transformation
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              maxWidth: 640,
              margin: "0 24px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: dark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
                border: `0.5px solid ${t.border}`,
                borderRadius: 40,
                padding: "6px 14px",
              }}
            >
              <span style={{ fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: t.text,
                  fontSize: 12,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: t.textMuted,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: hasActiveFilters
                  ? ORANGE
                  : dark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
                border: `0.5px solid ${hasActiveFilters ? "transparent" : t.border}`,
                borderRadius: 40,
                padding: "6px 14px",
                cursor: "pointer",
                color: hasActiveFilters ? "white" : t.text,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>⚙️</span>
              Filtres
            </button>

            <button
              onClick={exportToCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: dark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
                border: `0.5px solid ${t.border}`,
                borderRadius: 40,
                padding: "6px 14px",
                cursor: "pointer",
                color: t.text,
                fontSize: 12,
              }}
            >
              📊 Exporter CSV
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: dark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
                border: `0.5px solid ${t.border}`,
                borderRadius: 16,
                padding: "8px 18px",
              }}
            >
              <StatBadge value={String(stats.countries)} label="Pays" t={t} />
              <div style={{ width: "0.5px", height: 28, background: t.border }} />
              <StatBadge value={String(stats.projects)} label="Projets" t={t} />
              <div style={{ width: "0.5px", height: 28, background: t.border }} />
              <StatBadge value={String(stats.sectors)} label="Secteurs" t={t} />
            </div>
          </div>
        </header>

        {filterPanelOpen && (
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 20,
              zIndex: 1001,
              width: 360,
              background: t.cardBg,
              border: `0.5px solid ${t.borderStrong}`,
              borderRadius: 20,
              boxShadow: t.shadow,
              padding: 16,
              animation: "slideDown 0.2s ease",
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ color: t.text, fontSize: 13, fontWeight: 700 }}>
                Filtres avancés
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: ORANGE,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Tout réinitialiser
                </button>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  color: t.textMuted,
                  fontSize: 10,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                TRIER PAR
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["date", "impact", "client"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    style={{
                      background: sortBy === option ? ORANGE : "transparent",
                      border: `0.5px solid ${sortBy === option ? "transparent" : t.border}`,
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 10,
                      color: sortBy === option ? "white" : t.textSoft,
                      cursor: "pointer",
                    }}
                  >
                    {option === "date"
                      ? "📅 Date"
                      : option === "impact"
                      ? "📈 Impact"
                      : "🏢 Client"}
                  </button>
                ))}
              </div>
            </div>

            <FilterSection title="CATÉGORIES" t={t}>
              {ALL_CATEGORIES.map((cat) => (
                <FilterPill
                  key={cat}
                  active={selectedCategories.includes(cat)}
                  label={cat}
                  onClick={() => toggleCategory(cat)}
                  t={t}
                />
              ))}
            </FilterSection>

            <FilterSection title="TECHNOLOGIES" t={t}>
              {ALL_TECHNOLOGIES.slice(0, 16).map((tech) => (
                <FilterPill
                  key={tech}
                  active={selectedTechnologies.includes(tech)}
                  label={tech}
                  onClick={() => toggleTechnology(tech)}
                  t={t}
                />
              ))}
            </FilterSection>

            <FilterSection title="TAGS" t={t}>
              {ALL_TAGS.slice(0, 20).map((tag) => (
                <FilterPill
                  key={tag}
                  active={selectedTags.includes(tag)}
                  label={`#${tag}`}
                  onClick={() => toggleTag(tag)}
                  t={t}
                />
              ))}
            </FilterSection>

            <FilterSection title="ANNÉES" t={t}>
              {ALL_YEARS.map((year) => (
                <FilterPill
                  key={year}
                  active={selectedYears.includes(year)}
                  label={year}
                  onClick={() => toggleYear(year)}
                  t={t}
                />
              ))}
            </FilterSection>
          </div>
        )}

        <div
          ref={mapContainerRef}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />

        {loadingMap && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "grid",
              placeItems: "center",
              color: t.textSoft,
              fontSize: 14,
              background: "transparent",
            }}
          >
            Chargement de la carte…
          </div>
        )}

        {loading && (
          <div
            style={{
              position: "absolute",
              top: 90,
              left: 20,
              zIndex: 1002,
              background: t.cardBg,
              border: `0.5px solid ${t.border}`,
              borderRadius: 14,
              padding: "10px 14px",
              color: t.textSoft,
              fontSize: 12,
            }}
          >
            Chargement des références…
          </div>
        )}

        {!loading && filteredReferences.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: 90,
              left: 20,
              zIndex: 1002,
              background: t.cardBg,
              border: `0.5px solid ${t.border}`,
              borderRadius: 14,
              padding: "12px 16px",
              color: t.textSoft,
              fontSize: 12,
            }}
          >
            Aucune référence publiée trouvée
          </div>
        )}

        {tooltipData.visible &&
          tooltipData.projects.length > 0 &&
          tooltipActiveProject && (
            <div
              style={{
                position: "fixed",
                zIndex: 1500,
                left: ttLeft,
                top: ttTop,
                width: 390,
                animation: "md2iTooltipIn 0.18s ease",
                pointerEvents: "auto",
              }}
              onMouseEnter={() => {
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              }}
              onMouseLeave={() => {
                setTooltipData((prev) => ({ ...prev, visible: false }));
              }}
            >
              <div
                style={{
                  background: t.cardBg,
                  border: `0.5px solid ${t.borderStrong}`,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: t.shadow,
                }}
              >
                <div style={{ position: "relative", height: 130 }}>
                  <img
                    src={safeImage(tooltipActiveProject.image)}
                    alt={tooltipActiveProject.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: ORANGE,
                      color: "white",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 99,
                    }}
                  >
                    {tooltipActiveProject.category}
                  </span>
                </div>

                <MinimalTabs
                  projects={tooltipData.projects}
                  activeId={tooltipData.activeTabId}
                  onSelect={(id) =>
                    setTooltipData((prev) => ({
                      ...prev,
                      activeTabId: id,
                    }))
                  }
                  onPrev={() => goTooltip(-1)}
                  onNext={() => goTooltip(1)}
                  dark={dark}
                  t={t}
                />

                <div style={{ padding: "12px 14px" }}>
                  <p
                    style={{
                      color: ORANGE,
                      fontSize: 10,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {tooltipActiveProject.client} · {tooltipActiveProject.date}
                  </p>

                  <h3
                    style={{
                      color: t.text,
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginBottom: 8,
                    }}
                  >
                    {tooltipActiveProject.title}
                  </h3>

                  <RichHtml
                    html={tooltipActiveProject.excerpt}
                    color={t.textSoft}
                    clamp={2}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      margin: "10px 0 12px",
                      flexWrap: "wrap",
                    }}
                  >
                    {(tooltipActiveProject.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          color: ORANGE,
                          fontSize: 10,
                          padding: "4px 8px",
                          border: `0.5px solid ${ORANGE}40`,
                          borderRadius: 20,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setTooltipData((prev) => ({ ...prev, visible: false }));
                      setModalData({
                        visible: true,
                        projects: tooltipData.projects,
                        activeTabId: tooltipData.activeTabId,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      borderRadius: 12,
                      background: ORANGE,
                      border: "none",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          )}

        {modalData.visible && modalData.projects.length > 0 && modalActiveProject && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setModalData((prev) => ({ ...prev, visible: false }))}
          >
            <div
              style={{
                background: t.cardBg,
                border: `0.5px solid ${t.borderStrong}`,
                borderRadius: 28,
                width: "min(1100px, calc(100vw - 32px))",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                animation: "md2iModalIn 0.25s ease",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: "relative", height: 320 }}>
                <img
                  src={safeImage(modalActiveProject.image)}
                  alt={modalActiveProject.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
                  }}
                />
                <button
                  onClick={() =>
                    setModalData((prev) => ({ ...prev, visible: false }))
                  }
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    color: "white",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>

                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    bottom: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: ORANGE,
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "5px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {modalActiveProject.category}
                  </span>

                  <span
                    style={{
                      background: "rgba(255,255,255,0.14)",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 999,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {modalData.projects.length} projet
                    {modalData.projects.length > 1 ? "s" : ""} dans ce pays
                  </span>
                </div>
              </div>

              <MinimalTabs
                projects={modalData.projects}
                activeId={modalData.activeTabId}
                onSelect={(id) =>
                  setModalData((prev) => ({
                    ...prev,
                    activeTabId: id,
                  }))
                }
                onPrev={() => goModal(-1)}
                onNext={() => goModal(1)}
                dark={dark}
                t={t}
                sticky
              />

              <div
                style={{
                  padding: "32px 40px 40px",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
                  gap: 28,
                  alignItems: "start",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      color: ORANGE,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {modalActiveProject.client}
                  </p>

                  <h2
                    style={{
                      color: t.text,
                      fontSize: 32,
                      fontWeight: 700,
                      lineHeight: 1.22,
                      marginBottom: 20,
                    }}
                  >
                    {modalActiveProject.title}
                  </h2>

                  <div
                    style={{
                      borderLeft: `3px solid ${ORANGE}`,
                      paddingLeft: 16,
                      marginBottom: 24,
                    }}
                  >
                    <RichHtml
                      html={modalActiveProject.excerpt}
                      color={dark ? "rgba(239,159,39,0.85)" : "#a0660a"}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <RichHtml html={modalActiveProject.details} color={t.textSoft} />
                  </div>

                  {(modalActiveProject.technologies || []).length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p
                        style={{
                          color: t.textMuted,
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 12,
                        }}
                      >
                        🛠️ TECHNOLOGIES UTILISÉES
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(modalActiveProject.technologies || []).map((tech) => (
                          <span
                            key={tech}
                            style={{
                              background: dark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.05)",
                              padding: "6px 12px",
                              borderRadius: 20,
                              fontSize: 11,
                              color: t.textSoft,
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(modalActiveProject.tags || []).length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <p
                        style={{
                          color: t.textMuted,
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 12,
                        }}
                      >
                        🏷️ TAGS
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(modalActiveProject.tags || []).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag) ? prev : [...prev, tag]
                              );
                              setModalData((prev) => ({ ...prev, visible: false }));
                              showTemporaryNotification(`Filtre ajouté : #${tag}`, "info");
                            }}
                            style={{
                              color: ORANGE,
                              fontSize: 10,
                              padding: "4px 10px",
                              border: `0.5px solid ${ORANGE}40`,
                              borderRadius: 20,
                              background: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside style={{ minWidth: 0 }}>
                  <div
                    style={{
                      position: "sticky",
                      top: 96,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                      {modalActiveProject.team && (
                        <MetricCard
                          icon="👥"
                          label="Équipe"
                          value={modalActiveProject.team}
                          t={t}
                        />
                      )}
                      {modalActiveProject.duration && (
                        <MetricCard
                          icon="⏱️"
                          label="Durée"
                          value={modalActiveProject.duration}
                          t={t}
                        />
                      )}
                      {modalActiveProject.budget && (
                        <MetricCard
                          icon="💰"
                          label="Budget"
                          value={modalActiveProject.budget}
                          t={t}
                        />
                      )}
                      {modalActiveProject.impact && (
                        <MetricCard
                          icon="📈"
                          label="Impact"
                          value={modalActiveProject.impact}
                          t={t}
                        />
                      )}
                    </div>

                    <button
                      style={{
                        width: "100%",
                        padding: "14px 0",
                        borderRadius: 14,
                        background: ORANGE,
                        border: "none",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📧 Contacter MD2I
                    </button>

                    <button
                      onClick={() =>
                        setModalData((prev) => ({ ...prev, visible: false }))
                      }
                      style={{
                        width: "100%",
                        padding: "14px 0",
                        borderRadius: 14,
                        background: "transparent",
                        border: `0.5px solid ${t.border}`,
                        color: t.textSoft,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Fermer
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}