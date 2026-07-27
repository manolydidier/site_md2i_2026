"use client";

import Link from "next/link";
import Image from "next/image";
import type {
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker,
  TileLayer,
} from "leaflet";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/app/context/ThemeContext";
import { translateDynamicItems } from "@/app/i18n/dynamic";
import { normalizeLocale } from "@/app/i18n/settings";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./reference.module.css";

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
type ViewMode = "map" | "list";
type ReferenceDisplayMode = "list" | "card";

function safeImage(src?: string) {
  const value = src?.trim() || "";
  return value || "/placeholder-reference.svg";
}

function stripHtml(html?: string) {
  if (!html) return "";

  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const element = document.createElement("div");
  element.innerHTML = html;

  return (element.textContent || element.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getReferenceParam(reference: Reference) {
  return encodeURIComponent(reference.slug || reference.id || reference.title);
}
function getReferenceHref(reference: Reference) {
  return `/reference/${getReferenceParam(reference)}`;
}
function getNextId(projects: Reference[], activeId: string, direction: 1 | -1) {
  if (projects.length === 0) return activeId;

  const currentIndex = Math.max(
    0,
    projects.findIndex((project) => project.id === activeId)
  );

  const nextIndex =
    (currentIndex + direction + projects.length) % projects.length;

  return projects[nextIndex].id;
}

function RichHtml({
  html,
  clamp,
}: {
  html?: string;
  clamp?: number;
}) {
  return (
    <div
      className={clamp ? `rich-html clamp-${clamp}` : "rich-html"}
      dangerouslySetInnerHTML={{
        __html: html || "",
      }}
    />
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={styles.iconBtn}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
    >
      {label}
    </button>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.filterBlock}>
      <p className={styles.filterBlockTitle}>{title}</p>
      <div className={styles.chipRow}>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricCardLabel}>{label}</p>
      <p className={styles.metricCardValue}>{value}</p>
    </div>
  );
}

function ProjectTabs({
  projects,
  activeId,
  onSelect,
  onPrev,
  onNext,
  sticky = false,
}: {
  projects: Reference[];
  activeId: string;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  sticky?: boolean;
}) {
  const { t: translate } = useTranslation();

  if (projects.length <= 1) return null;

  return (
    <div
      className={`${styles.tabsBar} ${sticky ? styles.tabsBarSticky : ""}`}
    >
      <div className={styles.tabsHead}>
        <span className={styles.tabsCount}>
          {translate("referencePage.projectCount", {
            count: projects.length,
          })}
        </span>

        <div className={styles.tabsNav}>
          <IconButton onClick={onPrev} label={translate("referencePage.project.previous")}>
            ←
          </IconButton>

          <IconButton onClick={onNext} label={translate("referencePage.project.next")}>
            →
          </IconButton>
        </div>
      </div>

      <div className={styles.tabsScroll}>
        {projects.map((project) => {
          const active = activeId === project.id;

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className={`${styles.tabItem} ${active ? styles.tabItemActive : ""}`}
            >
              <span className={styles.tabDot} />
              <span className={styles.tabName}>{project.client}</span>
              <span className={styles.tabDate}>{project.date}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReferenceDisplaySwitch({
  value,
  onChange,
}: {
  value: ReferenceDisplayMode;
  onChange: (value: ReferenceDisplayMode) => void;
}) {
  const { t: translate } = useTranslation();

  return (
    <div className={styles.displaySwitch}>
      {[
        { key: "list" as const, label: translate("referencePage.display.list") },
        { key: "card" as const, label: translate("referencePage.display.cards") },
      ].map((item) => {
        const active = value === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`${styles.displaySwitchBtn} ${
              active ? styles.displaySwitchBtnActive : ""
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ReferenceMiniTag({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span className={`${styles.miniTag} ${accent ? styles.miniTagAccent : ""}`}>
      {children}
    </span>
  );
}

function ReferenceTechPreview({
  reference,
  max = 4,
}: {
  reference: Reference;
  max?: number;
}) {
  const technologies = reference.technologies || [];
  const visible = technologies.slice(0, max);
  const hiddenCount = Math.max(0, technologies.length - visible.length);

  if (!technologies.length) return null;

  return (
    <div className={styles.tagRow}>
      {visible.map((technology) => (
        <ReferenceMiniTag key={technology}>{technology}</ReferenceMiniTag>
      ))}

      {hiddenCount > 0 && <ReferenceMiniTag>+{hiddenCount}</ReferenceMiniTag>}
    </div>
  );
}

function ReferenceListItem({
  reference,
  onOpen,
}: {
  reference: Reference;
  onOpen: (reference: Reference) => void;
}) {
  const { t: translate } = useTranslation();
  const descriptionItems = [
    ...(reference.technologies || []).slice(0, 4),
    ...(reference.tags || []).slice(0, 3).map((tag) => `#${tag}`),
  ];

  return (
    <article className={styles.classicItem}>
      <div>
        <p className={styles.classicMediaCode}>{reference.code?.toUpperCase() || "REF"}</p>
        <h3 className={styles.classicMediaTitle}>{reference.country}</h3>

        <div className={styles.classicMediaImage}>
          <Image
            src={safeImage(reference.image)}
            alt={reference.title}
            fill
            sizes="(max-width: 720px) 100vw, 420px"
            style={{ objectFit: "contain" }}
          />

          <div className={styles.classicBadgeRow}>
            <span className={styles.badgePrimary}>{reference.category}</span>
            <span className={styles.badgeGhost}>{reference.date}</span>
          </div>
        </div>
      </div>

      <div className={styles.classicContent}>
        <div>
          <h3 className={styles.classicHeading}>
            {reference.country}
            {reference.client ? (
              <span className={styles.classicHeadingClient}> · {reference.client}</span>
            ) : null}
          </h3>

          <ul className={styles.infoRows}>
            <li className={styles.infoRow}>
              <b>{translate("referencePage.list.interventionTitle")} :</b>
              <span>{reference.title}</span>
            </li>

            <li className={styles.infoRow}>
              <b>{translate("referencePage.list.interventionType")} :</b>
              <span>{reference.category}</span>
            </li>

            <li className={styles.infoRow}>
              <b>{translate("referencePage.list.period")} :</b>
              <span>{reference.date}</span>
            </li>

            {reference.impact ? (
              <li className={styles.infoRow}>
                <b>{translate("referencePage.metrics.impact")} :</b>
                <span>{reference.impact}</span>
              </li>
            ) : null}
          </ul>

          <div className={styles.sectionLabelRow}>
            <h4 className={styles.sectionLabel}>
              {translate("referencePage.list.description")}
            </h4>
            <span className={styles.sectionRule} />
          </div>

          <div style={{ marginBottom: descriptionItems.length ? 16 : 0 }}>
            <RichHtml html={reference.excerpt} clamp={3} />
          </div>

          {descriptionItems.length > 0 ? (
            <ul className={styles.checklist}>
              {descriptionItems.map((item) => (
                <li key={item} className={styles.checklistItem}>
                  <span className={styles.checkMark}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={styles.classicFooter}>
          <div className={styles.tagRow}>
            <ReferenceMiniTag accent>{reference.category}</ReferenceMiniTag>
            <ReferenceMiniTag>{reference.country}</ReferenceMiniTag>

            {(reference.technologies || []).slice(0, 3).map((technology) => (
              <ReferenceMiniTag key={technology}>{technology}</ReferenceMiniTag>
            ))}
          </div>

          <div className={styles.actionRow}>
            <button type="button" onClick={() => onOpen(reference)} className={styles.primaryBtn}>
              {translate("referencePage.actions.viewDetails")}
            </button>

            <Link href={getReferenceHref(reference)} className={styles.secondaryLink}>
              Voir la fiche
            </Link>

            <Link
              href={`/contact-commercial?reference=${getReferenceParam(reference)}`}
              className={styles.ghostLink}
            >
              {translate("referencePage.actions.similarProject")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReferenceCardItem({
  reference,
  onOpen,
}: {
  reference: Reference;
  onOpen: (reference: Reference) => void;
}) {
  const { t: translate } = useTranslation();

  return (
    <article className={styles.gridCard}>
      <div className={styles.gridCardImage}>
        <Image
          src={safeImage(reference.image)}
          alt={reference.title}
          fill
          sizes="(max-width: 720px) 100vw, 360px"
          style={{ objectFit: "contain" }}
        />

        <div className={styles.classicBadgeRow} style={{ top: 12, bottom: "auto" }}>
          <span className={styles.badgePrimary}>{reference.category}</span>
          <span className={styles.badgeGhost}>{reference.country}</span>
        </div>
      </div>

      <div className={styles.gridCardBody}>
        <div>
          <p className={styles.gridCardEyebrow}>
            {reference.client} · {reference.date}
          </p>
          <h3 className={styles.gridCardTitle}>{reference.title}</h3>
        </div>

        <RichHtml html={reference.excerpt} clamp={2} />

        <ReferenceTechPreview reference={reference} max={4} />

        <div className={styles.gridCardActions}>
          <button type="button" onClick={() => onOpen(reference)} className={styles.primaryBtn}>
            {translate("referencePage.actions.details")}
          </button>

          <Link href={getReferenceHref(reference)} className={styles.secondaryLink}>
            Fiche
          </Link>

          <Link
            href={`/contact-commercial?reference=${getReferenceParam(reference)}`}
            className={styles.ghostLink}
          >
            {translate("referencePage.actions.similar")}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MapReferences() {
  const { dark } = useTheme();
  const { t: translate, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language);

  const darkRef = useRef(dark);

  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [referenceDisplayMode, setReferenceDisplayMode] =
    useState<ReferenceDisplayMode>("list");

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
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const markersRef = useRef<Record<string, Marker[]>>({});
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRefMobile = useRef<HTMLDivElement>(null);
  const menuRefDesktop = useRef<HTMLDivElement>(null);
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setNavSlot(document.getElementById("reference-navbar-menu-slot"));
  }, []);

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
    darkRef.current = dark;
  }, [dark]);

  useEffect(() => {
    setSelectedCategories([]);
    setSelectedTags([]);
  }, [locale]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/public/references", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erreur de chargement");
        }

        const nextReferences = await translateDynamicItems<Reference>(
          Array.isArray(data.data) ? data.data : [],
          locale,
          ["country", "title", "excerpt", "details", "category", "impact"]
        );

        setReferences(nextReferences);
      } catch (error) {
        console.error(error);
        setReferences([]);

        setShowNotification({
          message: translate("referencePage.notifications.loadError"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, [locale, translate]);

  const showTemporaryNotification = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setShowNotification({ message, type });

      setTimeout(() => {
        setShowNotification(null);
      }, 3000);
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalData((prev) => ({ ...prev, visible: false }));
        setTooltipData((prev) => ({ ...prev, visible: false }));
        setFilterPanelOpen(false);
        return;
      }

      if (modalData.visible && modalData.projects.length > 1) {
        if (event.key === "ArrowRight") {
          setModalData((prev) => ({
            ...prev,
            activeTabId: getNextId(prev.projects, prev.activeTabId, 1),
          }));
        }

        if (event.key === "ArrowLeft") {
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

  useEffect(() => {
    if (!filterPanelOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideMobile = menuRefMobile.current?.contains(target);
      const insideDesktop = menuRefDesktop.current?.contains(target);

      if (!insideMobile && !insideDesktop) {
        setFilterPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterPanelOpen]);

  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(references.map((reference) => reference.category))
      ).sort(),
    [references]
  );

  const allTechnologies = useMemo(
    () =>
      Array.from(
        new Set(references.flatMap((reference) => reference.technologies || []))
      ).sort(),
    [references]
  );

  const allYears = useMemo(
    () =>
      Array.from(new Set(references.map((reference) => reference.date)))
        .sort()
        .reverse(),
    [references]
  );

  const allTags = useMemo(
    () =>
      Array.from(
        new Set(references.flatMap((reference) => reference.tags || []))
      ).sort(),
    [references]
  );

  const filteredReferences = useMemo(() => {
    const filtered = references.filter((reference) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        reference.title.toLowerCase().includes(query) ||
        reference.client.toLowerCase().includes(query) ||
        reference.country.toLowerCase().includes(query) ||
        stripHtml(reference.excerpt).toLowerCase().includes(query) ||
        stripHtml(reference.details).toLowerCase().includes(query) ||
        (reference.tags || []).some((tag) =>
          tag.toLowerCase().includes(query)
        ) ||
        (reference.technologies || []).some((tech) =>
          tech.toLowerCase().includes(query)
        );

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(reference.category);

      const matchesTechnology =
        selectedTechnologies.length === 0 ||
        (reference.technologies || []).some((tech) =>
          selectedTechnologies.includes(tech)
        );

      const matchesYear =
        selectedYears.length === 0 || selectedYears.includes(reference.date);

      const matchesTag =
        selectedTags.length === 0 ||
        (reference.tags || []).some((tag) => selectedTags.includes(tag));

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

    filteredReferences.forEach((reference) => {
      if (!grouped.has(reference.country)) {
        grouped.set(reference.country, []);
      }

      grouped.get(reference.country)!.push(reference);
    });

    return grouped;
  }, [filteredReferences]);

  const stats = useMemo(
    () => ({
      countries: referencesByCountry.size,
      projects: filteredReferences.length,
      sectors: new Set(filteredReferences.map((reference) => reference.category))
        .size,
      technologies: new Set(
        filteredReferences.flatMap((reference) => reference.technologies || [])
      ).size,
    }),
    [filteredReferences, referencesByCountry]
  );

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedTechnologies.length +
    selectedYears.length +
    selectedTags.length;

  const hasActiveFilters = activeFiltersCount > 0;

  const tooltipActiveProject =
    tooltipData.projects.find(
      (project) => project.id === tooltipData.activeTabId
    ) || tooltipData.projects[0];

  const modalActiveProject =
    modalData.projects.find((project) => project.id === modalData.activeTabId) ||
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

    let markerIndex = 0;

    referencesByCountry.forEach((refs, country) => {
      const avgLat =
        refs.reduce((sum, reference) => sum + reference.lat, 0) / refs.length;

      const avgLng =
        refs.reduce((sum, reference) => sum + reference.lng, 0) / refs.length;

      const projectCount = refs.length;
      const size = projectCount > 1 ? 52 : 44;
      const markerDelay = Math.min(markerIndex * 45, 360);
      markerIndex += 1;

      const iconHtml = `
        <div class="md2i-marker" style="animation-delay:${markerDelay}ms;">
          <div class="md2i-marker-core" style="
            width:${size}px;
            height:${size}px;
            background:${dark ? "#151519" : "#ffffff"};
          ">
            <img
              src="https://flagicons.lipis.dev/flags/4x3/${refs[0].code}.svg"
              alt="${country}"
              loading="lazy"
            />
            ${
              projectCount > 1
                ? `<strong class="md2i-marker-count">${projectCount}</strong>`
                : ""
            }
          </div>
          <span class="md2i-marker-stem"></span>
          <span class="md2i-marker-dot"></span>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [size + 12, size + 30],
        iconAnchor: [(size + 12) / 2, size + 30],
      });

      const marker = L.marker([avgLat, avgLng], { icon }).addTo(map);

      if (!markersRef.current[country]) {
        markersRef.current[country] = [];
      }

      markersRef.current[country].push(marker);

      marker.on("mouseover", (event: LeafletMouseEvent) => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (!mapContainerRef.current) return;

        const mapRect = mapContainerRef.current.getBoundingClientRect();

        setTooltipData({
          visible: true,
          x: mapRect.left + event.containerPoint.x,
          y: mapRect.top + event.containerPoint.y,
          projects: refs,
          activeTabId: refs[0].id,
        });
      });

      marker.on("mouseout", () => {
        hideTimerRef.current = setTimeout(() => {
          setTooltipData((prev) => ({ ...prev, visible: false }));
        }, 180);
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
    let initializedContainer:
      | (HTMLDivElement & {
          _leaflet_id?: number;
        })
      | null = null;

    const initMap = async () => {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      const container = mapContainerRef.current;
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })
        ._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const rawContainer = container as HTMLDivElement & {
        _leaflet_id?: number;
      };
      initializedContainer = rawContainer;

      if (rawContainer._leaflet_id) {
        delete rawContainer._leaflet_id;
      }

      const initialDark = darkRef.current;

      const map = L.map(container, {
        center: [20, 10],
        zoom: 3,
        zoomControl: true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 30,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      leafletMapRef.current = map;

      tileLayerRef.current = L.tileLayer(getTileUrl(initialDark), {
        attribution: getTileAttribution(initialDark),
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

      if (initializedContainer) {
        if (initializedContainer._leaflet_id) {
          delete initializedContainer._leaflet_id;
        }
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

  useEffect(() => {
    if (!leafletMapRef.current) return;

    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 220);
  }, [viewMode]);

  const resetMapView = () => {
    if (!leafletMapRef.current) return;

    leafletMapRef.current.setView([20, 10], 3, {
      animate: true,
      duration: 0.8,
    });

    showTemporaryNotification(
      translate("referencePage.notifications.mapRecentered"),
      "info"
    );
  };

  const focusFilteredReferences = async () => {
    if (!leafletMapRef.current || filteredReferences.length === 0) return;

    const L = (await import("leaflet")).default;
    const bounds = L.latLngBounds(
      filteredReferences.map((reference) => [reference.lat, reference.lng])
    );

    leafletMapRef.current.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 6,
      animate: true,
    });

    showTemporaryNotification(
      translate("referencePage.notifications.resultsAdjusted"),
      "info"
    );
  };

  const openProjectDetails = (reference: Reference) => {
    const sameCountryProjects =
      referencesByCountry.get(reference.country) || [reference];

    setModalData({
      visible: true,
      projects: sameCountryProjects,
      activeTabId: reference.id,
    });
  };

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
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const toggleTechnology = (technology: string) => {
    setSelectedTechnologies((prev) =>
      prev.includes(technology)
        ? prev.filter((item) => item !== technology)
        : [...prev, technology]
    );
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((item) => item !== year) : [...prev, year]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTechnologies([]);
    setSelectedYears([]);
    setSelectedTags([]);

    showTemporaryNotification(
      translate("referencePage.notifications.filtersReset"),
      "info"
    );
  };

  const exportToCSV = () => {
    const headers = [
      translate("referencePage.csv.client"),
      translate("referencePage.csv.project"),
      translate("referencePage.csv.country"),
      translate("referencePage.csv.category"),
      translate("referencePage.csv.date"),
      translate("referencePage.csv.impact"),
      translate("referencePage.csv.technologies"),
      "Tags",
      translate("referencePage.csv.excerpt"),
      translate("referencePage.csv.details"),
    ];

    const rows = filteredReferences.map((reference) => [
      reference.client,
      reference.title,
      reference.country,
      reference.category,
      reference.date,
      reference.impact || "-",
      (reference.technologies || []).join(", "),
      (reference.tags || []).join(", "),
      stripHtml(reference.excerpt),
      stripHtml(reference.details),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "md2i-references.csv";
    anchor.click();

    URL.revokeObjectURL(url);

    showTemporaryNotification(
      translate("referencePage.notifications.exportSuccess"),
      "success"
    );
  };

  const ttLeft = (() => {
    const width = 340;
    const offset = 20;
    let left = tooltipData.x + offset;

    if (typeof window !== "undefined" && left + width > window.innerWidth - 16) {
      left = tooltipData.x - width - offset;
    }

    return left;
  })();

  const ttTop = (() => {
    const height = tooltipData.projects.length > 1 ? 500 : 400;
    let top = tooltipData.y - height / 2;

    if (typeof window !== "undefined") {
      if (top < 82) top = 82;

      if (top + height > window.innerHeight - 18) {
        top = window.innerHeight - height - 18;
      }
    }

    return top;
  })();

  const renderMenu = (
    variantClass: string,
    ref: React.Ref<HTMLDivElement>
  ) => (
    <div
      className={`${styles.menuWrap} ${variantClass}`}
      data-theme={dark ? "dark" : "light"}
      ref={ref}
    >
      <button
        type="button"
        onClick={() => setFilterPanelOpen((prev) => !prev)}
        aria-expanded={filterPanelOpen}
        aria-label={translate("referencePage.command.filters")}
        className={`${styles.floatingMenuBtn} ${
          filterPanelOpen ? styles.floatingMenuBtnActive : ""
        }`}
      >
        <span className={styles.menuIcon}>
          <span />
          <span />
          <span />
        </span>
        {activeFiltersCount > 0 && (
          <span className={styles.menuBadge}>{activeFiltersCount}</span>
        )}
      </button>

      {filterPanelOpen && (
        <div className={styles.menuPopover}>
          <div className={styles.menuPopoverInner}>
            <div className={styles.menuPopoverHeader}>
              <p className={styles.eyebrow}>{translate("referencePage.hero.kicker")}</p>
              <h1 className={styles.title}>{translate("referencePage.hero.title")}</h1>
            </div>

            <div className={styles.menuViewToggleRow}>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                aria-pressed={viewMode === "map"}
                className={`${styles.menuViewBtn} ${
                  viewMode === "map" ? styles.menuViewBtnActive : ""
                }`}
              >
                🗺 {translate("referencePage.command.switchMap")}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`${styles.menuViewBtn} ${
                  viewMode === "list" ? styles.menuViewBtnActive : ""
                }`}
              >
                ☷ {translate("referencePage.command.switchList")}
              </button>
            </div>

            <div className={styles.searchField}>
              <span className={styles.searchIcon}>⌕</span>

              <input
                type="text"
                placeholder={translate("referencePage.command.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className={styles.searchInput}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={styles.searchClear}
                  aria-label={translate("common.close")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.menuStatsRow}>
              <div className={styles.statChip}>
                <span className={styles.statChipValue}>{stats.countries}</span>
                <span className={styles.statChipLabel}>
                  {translate("referencePage.stats.countries")}
                </span>
              </div>

              <div className={styles.statChip}>
                <span className={styles.statChipValue}>{stats.projects}</span>
                <span className={styles.statChipLabel}>
                  {translate("referencePage.stats.projects")}
                </span>
              </div>

              <div className={styles.statChip}>
                <span className={styles.statChipValue}>{stats.sectors}</span>
                <span className={styles.statChipLabel}>
                  {translate("referencePage.stats.sectors")}
                </span>
              </div>

              <div className={styles.statChip}>
                <span className={styles.statChipValue}>{stats.technologies}</span>
                <span className={styles.statChipLabel}>
                  {translate("referencePage.stats.techs")}
                </span>
              </div>
            </div>

            <div className={styles.menuQuickActions}>
              {viewMode === "map" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      focusFilteredReferences();
                      setFilterPanelOpen(false);
                    }}
                    className={styles.barBtn}
                  >
                    {translate("referencePage.command.viewResults")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetMapView();
                      setFilterPanelOpen(false);
                    }}
                    className={styles.barBtn}
                  >
                    {translate("referencePage.command.recenter")}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  exportToCSV();
                  setFilterPanelOpen(false);
                }}
                className={styles.barBtn}
              >
                {translate("referencePage.command.export")}
              </button>
            </div>

            <div className={styles.menuDivider} />

            <FilterBlock title={translate("referencePage.filters.sortBy")}>
              {(["date", "impact", "client"] as const).map((option) => (
                <FilterChip
                  key={option}
                  active={sortBy === option}
                  label={
                    option === "date"
                      ? translate("referencePage.sort.date")
                      : option === "impact"
                        ? translate("referencePage.sort.impact")
                        : translate("referencePage.sort.client")
                  }
                  onClick={() => setSortBy(option)}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.categories")}>
              {allCategories.map((category) => (
                <FilterChip
                  key={category}
                  active={selectedCategories.includes(category)}
                  label={category}
                  onClick={() => toggleCategory(category)}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.technologies")}>
              {allTechnologies.slice(0, 18).map((technology) => (
                <FilterChip
                  key={technology}
                  active={selectedTechnologies.includes(technology)}
                  label={technology}
                  onClick={() => toggleTechnology(technology)}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.tags")}>
              {allTags.slice(0, 22).map((tag) => (
                <FilterChip
                  key={tag}
                  active={selectedTags.includes(tag)}
                  label={`#${tag}`}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.years")}>
              {allYears.map((year) => (
                <FilterChip
                  key={year}
                  active={selectedYears.includes(year)}
                  label={year}
                  onClick={() => toggleYear(year)}
                />
              ))}
            </FilterBlock>

            {hasActiveFilters && (
              <div className={styles.filtersFooter}>
                <button type="button" onClick={clearFilters} className={styles.clearBtn}>
                  {translate("referencePage.actions.resetAll")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes md2iTooltipIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes md2iModalIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes md2iMarkerIn {
          from { opacity: 0; transform: translateY(-8px) scale(.7); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .md2i-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
          position: relative;
          animation: md2iMarkerIn .38s cubic-bezier(.16, 1, .3, 1) both;
        }

        .md2i-marker-core {
          border-radius: 999px;
          border: 2px solid #EF9F27;
          position: relative;
          overflow: visible;
          box-shadow: 0 8px 20px rgba(0,0,0,0.20);
        }

        .md2i-marker-core img {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: contain;
          display: block;
          overflow: hidden;
        }

        .md2i-marker-count {
          position: absolute;
          right: -6px;
          bottom: -6px;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EF9F27;
          color: #1A0D00;
          border: 2px solid ${dark ? "#09090B" : "#FFFFFF"};
          font-size: 10px;
          font-weight: 900;
        }

        .md2i-marker-stem {
          width: 2px;
          height: 12px;
          background: #EF9F27;
        }

        .md2i-marker-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #EF9F27;
          opacity: 0.72;
        }

        .rich-html {
          font-size: 14px;
          line-height: 1.7;
          color: var(--t2, #475569);
        }

        .rich-html p {
          margin: 0 0 11px;
        }

        .rich-html h1,
        .rich-html h2,
        .rich-html h3 {
          margin: 0 0 10px;
          line-height: 1.25;
        }

        .rich-html ul,
        .rich-html ol {
          margin: 0 0 12px;
          padding-left: 18px;
        }

        .rich-html a {
          color: #EF9F27;
          text-decoration: underline;
        }

        .rich-html img {
          max-width: 100%;
          height: auto;
          border-radius: 14px;
          display: block;
          margin: 12px 0;
        }

        .clamp-2,
        .clamp-3 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .clamp-2 {
          -webkit-line-clamp: 2;
        }

        .clamp-3 {
          -webkit-line-clamp: 3;
        }
      `}</style>

      <main className={styles.page} data-theme={dark ? "dark" : "light"}>
        <div
          ref={mapContainerRef}
          className={`${styles.mapLayer} ${
            viewMode !== "map" ? styles.mapLayerHidden : ""
          }`}
        />

        {viewMode === "map" && (
          <div aria-hidden="true" className={styles.mapOverlay} />
        )}

        {renderMenu(styles.menuWrapMobile, menuRefMobile)}
        {navSlot &&
          createPortal(
            renderMenu(styles.menuWrapDesktop, menuRefDesktop),
            navSlot
          )}

        {showNotification && (
          <div
            className={styles.toast}
            style={{
              background:
                showNotification.type === "success"
                  ? "#10B981"
                  : showNotification.type === "error"
                    ? "#EF4444"
                    : "#EF9F27",
              color: showNotification.type === "info" ? "#1A0D00" : "#FFFFFF",
            }}
          >
            {showNotification.message}
          </div>
        )}

        {loadingMap && viewMode === "map" && (
          <div className={styles.floatingBadge} style={{ top: "50%" }}>
            {translate("referencePage.loading.map")}
          </div>
        )}

        {loading && (
          <div className={styles.floatingBadge}>
            {translate("referencePage.loading.references")}
          </div>
        )}

        {!loading && filteredReferences.length === 0 && viewMode === "map" && (
          <div className={styles.floatingBadge}>
            {translate("referencePage.empty.published")}
          </div>
        )}

        {viewMode === "map" && !loading && filteredReferences.length > 0 && (
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={styles.mapListCta}
          >
            {translate("referencePage.command.switchList")} · {filteredReferences.length}
          </button>
        )}

        {viewMode === "list" && (
          <section className={styles.listPage}>
            <div className={styles.listInner}>
              <div className={styles.listHeader}>
                <div>
                  <p className={styles.eyebrow}>{translate("referencePage.listHeader.kicker")}</p>
                  <h1 className={styles.listTitle}>{translate("referencePage.listHeader.title")}</h1>
                  <p className={styles.listSub}>{translate("referencePage.listHeader.text")}</p>
                </div>

                <div className={styles.listHeaderRight}>
                  <ReferenceDisplaySwitch
                    value={referenceDisplayMode}
                    onChange={setReferenceDisplayMode}
                  />

                  <div className={styles.listStatBox}>
                    <span className={styles.listStatValue}>{filteredReferences.length}</span>
                    <span className={styles.listStatLabel}>
                      {translate("referencePage.stats.projects")}
                    </span>
                  </div>

                  <div className={styles.listStatBox}>
                    <span className={styles.listStatValue}>{stats.countries}</span>
                    <span className={styles.listStatLabel}>
                      {translate("referencePage.stats.countries")}
                    </span>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className={styles.activeFiltersBar}>
                  <span className={styles.activeFiltersText}>
                    {translate("referencePage.activeFilters", {
                      count: activeFiltersCount,
                    })}
                  </span>

                  <button type="button" onClick={clearFilters} className={styles.clearBtn}>
                    {translate("referencePage.actions.reset")}
                  </button>
                </div>
              )}

              {filteredReferences.length === 0 ? (
                <div className={styles.emptyState}>
                  {translate("referencePage.empty.filtered")}
                </div>
              ) : (
                <div
                  className={
                    referenceDisplayMode === "list" ? styles.resultsList : styles.resultsCards
                  }
                >
                  {filteredReferences.map((reference) =>
                    referenceDisplayMode === "list" ? (
                      <ReferenceListItem
                        key={reference.id}
                        reference={reference}
                        onOpen={openProjectDetails}
                      />
                    ) : (
                      <ReferenceCardItem
                        key={reference.id}
                        reference={reference}
                        onOpen={openProjectDetails}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {tooltipData.visible &&
          viewMode === "map" &&
          tooltipData.projects.length > 0 &&
          tooltipActiveProject && (
            <div
              className={styles.tooltip}
              style={{
                left: ttLeft,
                top: ttTop,
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
              <div className={styles.tooltipMedia}>
                <Image
                  src={safeImage(tooltipActiveProject.image)}
                  alt={tooltipActiveProject.title}
                  fill
                  sizes="320px"
                  style={{ objectFit: "contain" }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 62%)",
                  }}
                />

                <span className={styles.badgePrimary} style={{ position: "absolute", top: 12, left: 12 }}>
                  {tooltipActiveProject.category}
                </span>
              </div>

              <ProjectTabs
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
              />

              <div className={styles.tooltipBody}>
                <p className={styles.classicMediaCode}>
                  {tooltipActiveProject.client} · {tooltipActiveProject.date}
                </p>

                <h3 style={{ margin: "0 0 9px", fontSize: 16, fontWeight: 800 }}>
                  {tooltipActiveProject.title}
                </h3>

                <RichHtml html={tooltipActiveProject.excerpt} clamp={2} />

                <div className={styles.tagRow} style={{ margin: "12px 0 14px" }}>
                  {(tooltipActiveProject.tags || []).slice(0, 3).map((tag) => (
                    <ReferenceMiniTag key={tag} accent>
                      #{tag}
                    </ReferenceMiniTag>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTooltipData((prev) => ({ ...prev, visible: false }));

                      setModalData({
                        visible: true,
                        projects: tooltipData.projects,
                        activeTabId: tooltipData.activeTabId,
                      });
                    }}
                    className={styles.primaryBtn}
                  >
                    {translate("referencePage.actions.viewDetails")}
                  </button>

                  <Link href={getReferenceHref(tooltipActiveProject)} className={styles.secondaryLink}>
                    Voir la fiche
                  </Link>
                </div>
              </div>
            </div>
          )}

        {modalData.visible &&
          modalData.projects.length > 0 &&
          modalActiveProject && (
            <div
              className={styles.modalOverlay}
              onClick={() =>
                setModalData((prev) => ({
                  ...prev,
                  visible: false,
                }))
              }
            >
              <div
                className={styles.modalCard}
                style={{ animation: "md2iModalIn 0.22s ease" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.modalHero}>
                  <Image
                    src={safeImage(modalActiveProject.image)}
                    alt={modalActiveProject.title}
                    fill
                    sizes="(max-width: 920px) 100vw, 1080px"
                    style={{ objectFit: "contain" }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.22) 58%, transparent)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        visible: false,
                      }))
                    }
                    className={styles.modalCloseBtn}
                    aria-label={translate("common.close")}
                  >
                    ✕
                  </button>

                  <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, display: "grid", gap: 10 }}>
                    <div className={styles.tagRow}>
                      <span className={styles.badgePrimary}>{modalActiveProject.category}</span>
                      <span className={styles.badgeGhost}>
                        {translate("referencePage.projectCount", {
                          count: modalData.projects.length,
                        })}
                      </span>
                    </div>

                    <div>
                      <p style={{ margin: "0 0 6px", color: "#F7C060", fontSize: 12, fontWeight: 800 }}>
                        {modalActiveProject.client} · {modalActiveProject.date}
                      </p>

                      <h2 style={{ maxWidth: 780, margin: 0, color: "#FFFFFF", fontSize: 30, lineHeight: 1.1, fontWeight: 800 }}>
                        {modalActiveProject.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <ProjectTabs
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
                  sticky
                />

                <div style={{ padding: "26px 26px 30px", display: "grid", gap: 22 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 0.8fr)",
                      gap: 22,
                      alignItems: "start",
                    }}
                  >
                    <div style={{ minWidth: 0, display: "grid", gap: 14 }}>
                      <section className={styles.metricCard} style={{ padding: 18 }}>
                        <p className={styles.metricCardLabel}>{translate("referencePage.modal.summary")}</p>
                        <RichHtml html={modalActiveProject.excerpt} />
                      </section>

                      <section className={styles.metricCard} style={{ padding: 18 }}>
                        <p className={styles.metricCardLabel}>{translate("referencePage.modal.details")}</p>
                        <RichHtml html={modalActiveProject.details} />
                      </section>
                    </div>

                    <aside style={{ minWidth: 0, display: "grid", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <MetricCard label={translate("referencePage.metrics.country")} value={modalActiveProject.country} />
                        <MetricCard label={translate("referencePage.metrics.client")} value={modalActiveProject.client} />
                        {modalActiveProject.team && (
                          <MetricCard label={translate("referencePage.metrics.team")} value={modalActiveProject.team} />
                        )}
                        {modalActiveProject.duration && (
                          <MetricCard label={translate("referencePage.metrics.duration")} value={modalActiveProject.duration} />
                        )}
                        {modalActiveProject.budget && (
                          <MetricCard label={translate("referencePage.metrics.budget")} value={modalActiveProject.budget} />
                        )}
                        {modalActiveProject.impact && (
                          <MetricCard label={translate("referencePage.metrics.impact")} value={modalActiveProject.impact} />
                        )}
                      </div>

                      <Link
                        href={getReferenceHref(modalActiveProject)}
                        onClick={() => setModalData((prev) => ({ ...prev, visible: false }))}
                        className={styles.secondaryLink}
                        style={{ width: "100%", minHeight: 46 }}
                      >
                        Voir la fiche complète
                      </Link>

                      <Link
                        href={`/contact-commercial?reference=${getReferenceParam(modalActiveProject)}`}
                        className={styles.primaryBtn}
                        style={{ width: "100%", minHeight: 46 }}
                      >
                        {translate("referencePage.actions.wantSimilar")}
                      </Link>

                      <button
                        type="button"
                        onClick={() => setModalData((prev) => ({ ...prev, visible: false }))}
                        className={styles.ghostLink}
                        style={{ width: "100%", minHeight: 46, border: "1px solid var(--line2)" }}
                      >
                        {translate("common.close")}
                      </button>
                    </aside>
                  </div>

                  {(modalActiveProject.technologies || []).length > 0 && (
                    <section className={styles.metricCard} style={{ padding: 18 }}>
                      <p className={styles.metricCardLabel}>{translate("referencePage.modal.technologies")}</p>
                      <div className={styles.tagRow} style={{ marginTop: 6 }}>
                        {(modalActiveProject.technologies || []).map((technology) => (
                          <ReferenceMiniTag key={technology}>{technology}</ReferenceMiniTag>
                        ))}
                      </div>
                    </section>
                  )}

                  {(modalActiveProject.tags || []).length > 0 && (
                    <section className={styles.metricCard} style={{ padding: 18 }}>
                      <p className={styles.metricCardLabel}>{translate("referencePage.modal.tags")}</p>
                      <div className={styles.tagRow} style={{ marginTop: 6 }}>
                        {(modalActiveProject.tags || []).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));

                              setModalData((prev) => ({ ...prev, visible: false }));

                              showTemporaryNotification(
                                translate("referencePage.notifications.tagAdded", { tag }),
                                "info"
                              );
                            }}
                            className={styles.miniTagAccent}
                            style={{ border: "1px solid var(--acc-bd)", borderRadius: 999, padding: "6px 11px", cursor: "pointer", background: "var(--acc-dim)" }}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
      </main>
    </>
  );
}
