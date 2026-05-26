"use client";

import Link from "next/link";
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

const ORANGE = "#EF9F27";

function getTokens(dark: boolean) {
  return {
    bg: dark ? "#09090B" : "#F7F4EE",
    glass: dark ? "rgba(17,17,22,0.82)" : "rgba(255,255,255,0.82)",
    glassStrong: dark ? "rgba(17,17,22,0.94)" : "rgba(255,255,255,0.94)",
    cardBg: dark ? "#151519" : "#FFFFFF",
    panelBg: dark ? "rgba(16,16,20,0.96)" : "rgba(255,255,255,0.96)",
    text: dark ? "#F8F4EF" : "#111111",
    textSoft: dark ? "rgba(248,244,239,0.68)" : "rgba(17,17,17,0.66)",
    textMuted: dark ? "rgba(248,244,239,0.42)" : "rgba(17,17,17,0.42)",
    border: dark ? "rgba(255,255,255,0.09)" : "rgba(17,17,17,0.08)",
    borderStrong: dark ? "rgba(255,255,255,0.16)" : "rgba(17,17,17,0.14)",
    shadow: dark
      ? "0 26px 90px rgba(0,0,0,0.55)"
      : "0 26px 90px rgba(17,17,17,0.13)",
    shadowSoft: dark
      ? "0 16px 46px rgba(0,0,0,0.32)"
      : "0 16px 46px rgba(17,17,17,0.08)",
    orangeSoft: dark ? "rgba(239,159,39,0.14)" : "rgba(239,159,39,0.11)",
    orangeBorder: "rgba(239,159,39,0.32)",
    inputBg: dark ? "rgba(255,255,255,0.06)" : "rgba(17,17,17,0.04)",
    mapOverlay: dark
      ? "linear-gradient(180deg, rgba(9,9,11,0.50), rgba(9,9,11,0.06) 32%, rgba(9,9,11,0.22))"
      : "linear-gradient(180deg, rgba(247,244,238,0.50), rgba(247,244,238,0.02) 32%, rgba(247,244,238,0.18))",
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
  t,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ui-icon-button"
      style={{
        width: 38,
        height: 38,
        borderRadius: 13,
        border: `1px solid ${t.border}`,
        background: t.inputBg,
        color: t.text,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 800,
      }}
    >
      {children}
    </button>
  );
}

function FilterChip({
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
      type="button"
      onClick={onClick}
      className="filter-chip"
      style={{
        border: `1px solid ${active ? "rgba(239,159,39,0.55)" : t.border}`,
        background: active ? ORANGE : "transparent",
        color: active ? "#1A0D00" : t.textSoft,
        borderRadius: 999,
        padding: "8px 11px",
        fontSize: 11,
        fontWeight: 850,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function FilterBlock({
  title,
  children,
  t,
}: {
  title: string;
  children: ReactNode;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <p
        style={{
          margin: 0,
          color: t.textMuted,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  icon,
  t,
}: {
  value: string;
  label: string;
  icon: string;
  t: ReturnType<typeof getTokens>;
}) {
  return (
    <div
      style={{
        minWidth: 78,
        padding: "8px 10px",
        borderRadius: 15,
        background: t.inputBg,
        border: `1px solid ${t.border}`,
        display: "grid",
        gap: 2,
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>

      <strong
        style={{
          color: t.text,
          fontSize: 15,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          color: t.textMuted,
          fontSize: 9,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
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
        padding: 15,
        borderRadius: 20,
        background: t.inputBg,
        border: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        gap: 11,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>

      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 4px",
            color: t.textMuted,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>

        <p
          style={{
            margin: 0,
            color: t.text,
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.35,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ToolbarActions({
  open,
  onToggle,
  viewMode,
  t,
}: {
  open: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  t: ReturnType<typeof getTokens>;
}) {
  const { t: translate } = useTranslation();
  const isListMode = viewMode === "list";

  return (
    <div
      style={{
        position: "fixed",
        right: 22,
        top: isListMode ? 22 : undefined,
        bottom: isListMode ? undefined : open ? 84 : 22,
        zIndex: 1600,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Link
        href="/"
        className="command-toggle"
        title={translate("referencePage.toolbar.homeTitle")}
        style={{
          height: 38,
          padding: "0 13px",
          borderRadius: 999,
          border: `1px solid ${t.border}`,
          background: t.glassStrong,
          color: t.text,
          boxShadow: t.shadowSoft,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 950,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(18px)",
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
        <span>{translate("referencePage.toolbar.home")}</span>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        className="command-toggle"
        aria-pressed={open}
        title={
          open
            ? translate("referencePage.toolbar.hideTools")
            : translate("referencePage.toolbar.showTools")
        }
        style={{
          height: 38,
          padding: "0 13px",
          borderRadius: 999,
          border: `1px solid ${open ? t.border : t.orangeBorder}`,
          background: open ? t.glassStrong : ORANGE,
          color: open ? t.text : "#1A0D00",
          boxShadow: t.shadowSoft,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 950,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(18px)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: open ? ORANGE : "#1A0D00",
          }}
        />

        <span>{translate("referencePage.toolbar.tools")}</span>

        <span
          style={{
            fontSize: 13,
            lineHeight: 1,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
          }}
        >
          ↑
        </span>
      </button>
    </div>
  );
}

function ProjectTabs({
  projects,
  activeId,
  onSelect,
  onPrev,
  onNext,
  t,
  sticky = false,
}: {
  projects: Reference[];
  activeId: string;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  t: ReturnType<typeof getTokens>;
  sticky?: boolean;
}) {
  const { t: translate } = useTranslation();

  if (projects.length <= 1) return null;

  return (
    <div
      style={{
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 8 : 1,
        padding: "13px 14px",
        borderBottom: `1px solid ${t.border}`,
        background: sticky ? t.glassStrong : t.panelBg,
        backdropFilter: sticky ? "blur(16px)" : "none",
      }}
    >
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            color: t.textMuted,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {translate("referencePage.projectCount", {
            count: projects.length,
          })}
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          <IconButton
            onClick={onPrev}
            label={translate("referencePage.project.previous")}
            t={t}
          >
            ←
          </IconButton>

          <IconButton
            onClick={onNext}
            label={translate("referencePage.project.next")}
            t={t}
          >
            →
          </IconButton>
        </div>
      </div>

      <div
        className="tabs-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {projects.map((project) => {
          const active = activeId === project.id;

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className="project-tab"
              style={{
                flexShrink: 0,
                border: `1px solid ${
                  active ? "rgba(239,159,39,0.55)" : t.border
                }`,
                background: active ? t.orangeSoft : "transparent",
                color: active ? t.text : t.textSoft,
                borderRadius: 999,
                padding: "9px 12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: active ? ORANGE : t.textMuted,
                }}
              />

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 850,
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

function ReferenceDisplaySwitch({
  value,
  onChange,
  t,
}: {
  value: ReferenceDisplayMode;
  onChange: (value: ReferenceDisplayMode) => void;
  t: ReturnType<typeof getTokens>;
}) {
  const { t: translate } = useTranslation();

  return (
    <div
      className="reference-display-switch"
      style={{
        display: "inline-flex",
        padding: 4,
        borderRadius: 999,
        background: t.inputBg,
        border: `1px solid ${t.border}`,
      }}
    >
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
            style={{
              height: 34,
              padding: "0 13px",
              borderRadius: 999,
              border: "none",
              background: active ? ORANGE : "transparent",
              color: active ? "#1A0D00" : t.textSoft,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 900,
              transition: "background .18s ease, color .18s ease",
            }}
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
  t,
  accent = false,
}: {
  children: ReactNode;
  t: ReturnType<typeof getTokens>;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        minHeight: 24,
        padding: "0 9px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        background: accent ? t.orangeSoft : t.inputBg,
        border: `1px solid ${accent ? t.orangeBorder : t.border}`,
        color: accent ? ORANGE : t.textSoft,
        fontSize: 10,
        fontWeight: 850,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ReferenceTechPreview({
  reference,
  t,
  max = 4,
}: {
  reference: Reference;
  t: ReturnType<typeof getTokens>;
  max?: number;
}) {
  const technologies = reference.technologies || [];
  const visible = technologies.slice(0, max);
  const hiddenCount = Math.max(0, technologies.length - visible.length);

  if (!technologies.length) return null;

  return (
    <div
      className="reference-tech-preview"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      {visible.map((technology) => (
        <ReferenceMiniTag key={technology} t={t}>
          {technology}
        </ReferenceMiniTag>
      ))}

      {hiddenCount > 0 && <ReferenceMiniTag t={t}>+{hiddenCount}</ReferenceMiniTag>}
    </div>
  );
}

function ReferenceListItem({
  reference,
  t,
  onOpen,
}: {
  reference: Reference;
  t: ReturnType<typeof getTokens>;
  onOpen: (reference: Reference) => void;
}) {
  const { t: translate } = useTranslation();
  const descriptionItems = [
    ...(reference.technologies || []).slice(0, 4),
    ...(reference.tags || []).slice(0, 3).map((tag) => `#${tag}`),
  ];

  return (
    <article
      className="reference-classic-item"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 0.42fr) minmax(0, 0.58fr)",
        gap: 28,
        alignItems: "stretch",
        padding: 22,
        borderRadius: 28,
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        boxShadow: "none",
      }}
    >
      <div
        className="reference-classic-media"
        style={{
          display: "grid",
          gap: 14,
          alignContent: "start",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px",
              color: ORANGE,
              fontSize: 11,
              fontWeight: 950,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {reference.code?.toUpperCase() || "REF"}
          </p>

          <h3
            style={{
              margin: 0,
              color: t.text,
              fontSize: 25,
              lineHeight: 1.08,
              fontWeight: 950,
              letterSpacing: "-0.055em",
            }}
          >
            {reference.country}
          </h3>
        </div>

        <div
          style={{
            position: "relative",
            height: 230,
            overflow: "hidden",
            borderRadius: 24,
            background: t.inputBg,
            border: `1px solid ${t.border}`,
          }}
        >
          <img
            src={safeImage(reference.image)}
            alt={reference.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.48), rgba(0,0,0,0.04) 62%, transparent)",
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
              gap: 10,
            }}
          >
            <span
              style={{
                minHeight: 30,
                padding: "0 12px",
                borderRadius: 999,
                background: ORANGE,
                color: "#1A0D00",
                display: "inline-flex",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 950,
              }}
            >
              {reference.category}
            </span>

            <span
              style={{
                minHeight: 30,
                padding: "0 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                color: "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 850,
                backdropFilter: "blur(10px)",
              }}
            >
              {reference.date}
            </span>
          </div>
        </div>
      </div>

      <div
        className="reference-classic-content"
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 22,
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 14px",
              color: t.text,
              fontSize: "clamp(22px, 2.4vw, 32px)",
              lineHeight: 1.08,
              fontWeight: 950,
              letterSpacing: "-0.055em",
            }}
          >
            {reference.country}
            {reference.client ? (
              <>
                {" "}
                <span style={{ color: t.textMuted, fontWeight: 800 }}>
                  · {reference.client}
                </span>
              </>
            ) : null}
          </h3>

          <ul
            style={{
              display: "grid",
              gap: 9,
              margin: "0 0 22px",
              padding: 0,
              listStyle: "none",
            }}
          >
            <li className="reference-classic-info-row">
              <b>{translate("referencePage.list.interventionTitle")} :</b>
              <span>{reference.title}</span>
            </li>

            <li className="reference-classic-info-row">
              <b>{translate("referencePage.list.interventionType")} :</b>
              <span>{reference.category}</span>
            </li>

            <li className="reference-classic-info-row">
              <b>{translate("referencePage.list.period")} :</b>
              <span>{reference.date}</span>
            </li>

            {reference.impact ? (
              <li className="reference-classic-info-row">
                <b>{translate("referencePage.metrics.impact")} :</b>
                <span>{reference.impact}</span>
              </li>
            ) : null}
          </ul>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <h4
              style={{
                margin: 0,
                color: t.text,
                fontSize: 15,
                fontWeight: 950,
                letterSpacing: "-0.02em",
              }}
            >
              {translate("referencePage.list.description")}
            </h4>

            <span
              style={{
                height: 1,
                flex: 1,
                background: t.border,
              }}
            />
          </div>

          <div
            style={{
              marginBottom: descriptionItems.length ? 16 : 0,
            }}
          >
            <RichHtml html={reference.excerpt} color={t.textSoft} clamp={3} />
          </div>

          {descriptionItems.length > 0 ? (
            <ul
              className="reference-classic-checklist"
              style={{
                display: "grid",
                gap: 9,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {descriptionItems.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    color: t.textSoft,
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontWeight: 650,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 1,
                      flexShrink: 0,
                      borderRadius: 5,
                      background: t.orangeSoft,
                      border: `1px solid ${t.orangeBorder}`,
                      color: ORANGE,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 950,
                    }}
                  >
                    ✓
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            paddingTop: 18,
            borderTop: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 7,
            }}
          >
            <ReferenceMiniTag t={t} accent>
              {reference.category}
            </ReferenceMiniTag>

            <ReferenceMiniTag t={t}>{reference.country}</ReferenceMiniTag>

            {(reference.technologies || []).slice(0, 3).map((technology) => (
              <ReferenceMiniTag key={technology} t={t}>
                {technology}
              </ReferenceMiniTag>
            ))}
          </div>

          <div
            className="reference-classic-actions"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => onOpen(reference)}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: "none",
                background: ORANGE,
                color: "#1A0D00",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              {translate("referencePage.actions.viewDetails")}
            </button>

            <Link
              href={getReferenceHref(reference)}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: `1px solid ${t.orangeBorder}`,
                background: t.orangeSoft,
                color: ORANGE,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              Voir la fiche
            </Link>

            <Link
              href={`/contact-commercial?reference=${getReferenceParam(reference)}`}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: `1px solid ${t.border}`,
                background: t.inputBg,
                color: t.text,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 900,
              }}
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
  t,
  onOpen,
}: {
  reference: Reference;
  t: ReturnType<typeof getTokens>;
  onOpen: (reference: Reference) => void;
}) {
  const { t: translate } = useTranslation();

  return (
    <article
      className="reference-card-clean"
      style={{
        overflow: "hidden",
        borderRadius: 24,
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 156,
          overflow: "hidden",
          background: t.inputBg,
        }}
      >
        <img
          src={safeImage(reference.image)}
          alt={reference.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.10) 65%, transparent)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              background: ORANGE,
              color: "#1A0D00",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 950,
            }}
          >
            {reference.category}
          </span>

          <span
            style={{
              background: "rgba(255,255,255,0.16)",
              color: "#FFFFFF",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 850,
              backdropFilter: "blur(8px)",
            }}
          >
            {reference.country}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          display: "grid",
          gap: 13,
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              color: ORANGE,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {reference.client} · {reference.date}
          </p>

          <h3
            style={{
              margin: 0,
              color: t.text,
              fontSize: 17,
              lineHeight: 1.22,
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            {reference.title}
          </h3>
        </div>

        <RichHtml html={reference.excerpt} color={t.textSoft} clamp={2} />

        <ReferenceTechPreview reference={reference} t={t} max={4} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => onOpen(reference)}
            style={{
              height: 38,
              borderRadius: 999,
              border: "none",
              background: ORANGE,
              color: "#1A0D00",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            {translate("referencePage.actions.details")}
          </button>

          <Link
            href={getReferenceHref(reference)}
            style={{
              height: 38,
              borderRadius: 999,
              border: `1px solid ${t.orangeBorder}`,
              background: t.orangeSoft,
              color: ORANGE,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            Fiche
          </Link>

          <Link
            href={`/contact-commercial?reference=${getReferenceParam(reference)}`}
            style={{
              height: 38,
              borderRadius: 999,
              border: `1px solid ${t.border}`,
              background: t.inputBg,
              color: t.text,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 900,
            }}
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
  const t = getTokens(dark);

  const darkRef = useRef(dark);

  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [referenceDisplayMode, setReferenceDisplayMode] =
    useState<ReferenceDisplayMode>("list");
  const [commandBarOpen, setCommandBarOpen] = useState(true);

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
    if (!commandBarOpen) {
      setFilterPanelOpen(false);
    }
  }, [commandBarOpen]);

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

    referencesByCountry.forEach((refs, country) => {
      const avgLat =
        refs.reduce((sum, reference) => sum + reference.lat, 0) / refs.length;

      const avgLng =
        refs.reduce((sum, reference) => sum + reference.lng, 0) / refs.length;

      const projectCount = refs.length;
      const size = projectCount > 1 ? 56 : 46;

      const iconHtml = `
        <div class="md2i-marker">
          <div class="md2i-marker-core" style="
            width:${size}px;
            height:${size}px;
            background:${dark ? "#151519" : "#ffffff"};
          ">
            <span class="md2i-marker-pulse"></span>
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
        iconSize: [size + 12, size + 34],
        iconAnchor: [(size + 12) / 2, size + 34],
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
    const width = 390;
    const offset = 20;
    let left = tooltipData.x + offset;

    if (typeof window !== "undefined" && left + width > window.innerWidth - 16) {
      left = tooltipData.x - width - offset;
    }

    return left;
  })();

  const ttTop = (() => {
    const height = tooltipData.projects.length > 1 ? 520 : 420;
    let top = tooltipData.y - height / 2;

    if (typeof window !== "undefined") {
      if (top < 70) top = 70;

      if (top + height > window.innerHeight - 18) {
        top = window.innerHeight - height - 18;
      }
    }

    return top;
  })();

  return (
    <>
      <style>{`
        @keyframes md2iPulse {
          0% { transform: scale(0.82); opacity: 0.72; }
          100% { transform: scale(1.82); opacity: 0; }
        }

        @keyframes md2iTooltipIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes md2iModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(14px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes drawerIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes commandBarIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes listIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes notificationSlide {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .md2i-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
          position: relative;
        }

        .md2i-marker-core {
          border-radius: 999px;
          border: 3px solid ${ORANGE};
          position: relative;
          overflow: visible;
          box-shadow: 0 14px 30px rgba(0,0,0,0.28);
        }

        .md2i-marker-core img {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
          display: block;
          overflow: hidden;
        }

        .md2i-marker-pulse {
          position: absolute;
          inset: -7px;
          border-radius: 999px;
          border: 2px solid ${ORANGE};
          animation: md2iPulse 2.35s ease-out infinite;
          z-index: -1;
        }

        .md2i-marker-count {
          position: absolute;
          right: -7px;
          bottom: -7px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${ORANGE};
          color: #1A0D00;
          border: 2px solid ${dark ? "#09090B" : "#FFFFFF"};
          font-size: 11px;
          font-weight: 950;
        }

        .md2i-marker-stem {
          width: 2px;
          height: 13px;
          background: ${ORANGE};
        }

        .md2i-marker-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: ${ORANGE};
          opacity: 0.72;
        }

        .rich-html {
          font-size: 14px;
          line-height: 1.78;
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
          color: ${ORANGE};
          text-decoration: underline;
        }

        .rich-html img {
          max-width: 100%;
          height: auto;
          border-radius: 14px;
          display: block;
          margin: 12px 0;
        }

        .rich-html blockquote {
          margin: 12px 0;
          padding-left: 13px;
          border-left: 3px solid ${ORANGE};
          opacity: 0.92;
        }

        .rich-html pre {
          padding: 12px;
          border-radius: 12px;
          overflow-x: auto;
          background: ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"};
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

        .tabs-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .tabs-scroll::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.13)"};
          border-radius: 999px;
        }

        .reference-list-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .reference-list-scroll::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.14)"};
          border-radius: 999px;
        }

        .filter-chip,
        .project-tab,
        .ui-icon-button,
        .command-toggle,
        .reference-card-clean,
        .reference-classic-item {
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            color .18s ease,
            box-shadow .18s ease;
        }

        .filter-chip:hover,
        .project-tab:hover,
        .ui-icon-button:hover,
        .command-toggle:hover {
          transform: translateY(-1px);
          box-shadow: ${dark ? "0 10px 24px rgba(0,0,0,.28)" : "0 10px 24px rgba(17,17,17,.08)"};
        }

        .reference-card-clean:hover,
        .reference-classic-item:hover {
          transform: translateY(-2px);
          border-color: rgba(239,159,39,0.34) !important;
          box-shadow: ${dark ? "0 18px 44px rgba(0,0,0,.30)" : "0 18px 44px rgba(17,17,17,.08)"} !important;
        }

        .reference-display-switch button:hover {
          color: ${ORANGE};
        }

        .reference-classic-info-row {
          display: grid;
          grid-template-columns: 178px minmax(0, 1fr);
          gap: 12px;
          color: ${dark ? "#F8F4EF" : "#111111"};
          font-size: 13.5px;
          line-height: 1.5;
        }

        .reference-classic-info-row b {
          color: ${dark ? "#F8F4EF" : "#111111"};
          font-weight: 950;
        }

        .reference-classic-info-row span {
          color: ${dark ? "rgba(248,244,239,0.68)" : "rgba(17,17,17,0.66)"};
          font-weight: 650;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: ${dark ? "0 12px 30px rgba(0,0,0,.35)" : "0 12px 30px rgba(17,17,17,.12)"} !important;
        }

        .leaflet-control-zoom a {
          background: ${dark ? "rgba(17,17,22,.92)" : "rgba(255,255,255,.92)"} !important;
          color: ${dark ? "#F8F4EF" : "#111111"} !important;
          border-bottom: 1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(17,17,17,.08)"} !important;
        }

        @media (max-width: 1180px) {
          .reference-results-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 980px) {
          .reference-top-panel {
            left: 14px !important;
            right: 14px !important;
            width: auto !important;
            max-width: none !important;
          }

          .reference-command-bar {
            left: 14px !important;
            right: 14px !important;
            width: auto !important;
          }

          .reference-command-inner {
            grid-template-columns: 1fr !important;
          }

          .reference-stats {
            display: none !important;
          }

          .reference-filter-drawer {
            left: 14px !important;
            right: 14px !important;
            width: auto !important;
            top: 120px !important;
          }

          .modal-top-grid {
            grid-template-columns: 1fr !important;
          }

          .modal-content-padding {
            padding: 24px !important;
          }

          .reference-list-header {
            grid-template-columns: 1fr !important;
          }

          .reference-list-header > div:last-child {
            justify-items: start !important;
          }

          .reference-classic-item {
            grid-template-columns: 1fr !important;
          }

          .reference-classic-info-row {
            grid-template-columns: 1fr !important;
            gap: 3px !important;
          }
        }

        @media (max-width: 760px) {
          .reference-results-cards {
            grid-template-columns: 1fr !important;
          }

          .reference-list-page {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .reference-command-bar {
            right: 14px !important;
            left: 14px !important;
            top: 72px !important;
          }
        }

        @media (max-width: 640px) {
          .reference-top-panel {
            top: 14px !important;
          }

          .reference-title {
            font-size: 21px !important;
          }

          .reference-command-actions {
            flex-wrap: wrap !important;
          }

          .reference-command-actions button {
            flex: 1 !important;
          }

          .reference-modal-hero {
            height: 230px !important;
          }

          .reference-classic-item {
            padding: 16px !important;
            border-radius: 22px !important;
          }

          .reference-classic-media > div:nth-child(2) {
            height: 190px !important;
          }

          .reference-classic-actions {
            width: 100%;
          }

          .reference-classic-actions button,
          .reference-classic-actions a {
            width: 100%;
          }
        }
      `}</style>

      <main
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: t.bg,
          transition: "background 0.35s ease",
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: viewMode === "map" ? 1 : 0,
            pointerEvents: viewMode === "map" ? "auto" : "none",
            transition: "opacity 0.22s ease",
          }}
        />

        {viewMode === "map" && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              background: t.mapOverlay,
            }}
          />
        )}

        {viewMode === "map" && (
          <section
            className="reference-top-panel"
            style={{
              position: "fixed",
              top: 96,
              left: 22,
              zIndex: 1000,
              width: "min(470px, calc(100vw - 44px))",
              padding: 18,
              borderRadius: 26,
              background: t.glass,
              border: `1px solid ${t.border}`,
              boxShadow: t.shadowSoft,
              backdropFilter: "blur(18px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    color: ORANGE,
                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {translate("referencePage.hero.kicker")}
                </p>

                <h1
                  className="reference-title"
                  style={{
                    margin: 0,
                    color: t.text,
                    fontSize: 28,
                    lineHeight: 1.05,
                    fontWeight: 950,
                    letterSpacing: "-0.055em",
                  }}
                >
                  {translate("referencePage.hero.title")}
                </h1>

                <p
                  style={{
                    maxWidth: 400,
                    margin: "10px 0 0",
                    color: t.textSoft,
                    fontSize: 13,
                    lineHeight: 1.65,
                    fontWeight: 650,
                  }}
                >
                  {translate("referencePage.hero.text")}
                </p>
              </div>

              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  background: t.orangeSoft,
                  border: `1px solid ${t.orangeBorder}`,
                  color: ORANGE,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  fontSize: 22,
                }}
              >
                🌍
              </div>
            </div>
          </section>
        )}

        {showNotification && (
          <div
            style={{
              position: "fixed",
              top: 90,
              right: 22,
              zIndex: 2200,
              padding: "13px 16px",
              borderRadius: 16,
              background:
                showNotification.type === "success"
                  ? "#10B981"
                  : showNotification.type === "error"
                    ? "#EF4444"
                    : ORANGE,
              color: showNotification.type === "info" ? "#1A0D00" : "#FFFFFF",
              boxShadow: t.shadowSoft,
              animation: "notificationSlide 0.25s ease",
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            {showNotification.message}
          </div>
        )}

        <ToolbarActions
          open={commandBarOpen}
          onToggle={() => setCommandBarOpen((prev) => !prev)}
          viewMode={viewMode}
          t={t}
        />

        {viewMode === "list" && (
          <section
            className="reference-list-page reference-list-scroll"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 850,
              overflowY: "auto",
              padding: commandBarOpen ? "96px 22px 34px" : "28px 22px 34px",
              background: dark
                ? "radial-gradient(circle at top left, rgba(239,159,39,0.08), transparent 34%), #09090B"
                : "radial-gradient(circle at top left, rgba(239,159,39,0.09), transparent 34%), #F7F4EE",
              transition: "padding 0.2s ease",
              animation: "listIn 0.22s ease",
            }}
          >
            <div
              style={{
                maxWidth: 1280,
                margin: "0 auto",
              }}
            >
              <header
                className="reference-list-header"
                style={{
                  marginBottom: 22,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 18,
                  alignItems: "end",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      color: ORANGE,
                      fontSize: 11,
                      fontWeight: 950,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {translate("referencePage.listHeader.kicker")}
                  </p>

                  <h1
                    style={{
                      margin: 0,
                      color: t.text,
                      fontSize: 36,
                      lineHeight: 1.02,
                      fontWeight: 950,
                      letterSpacing: "-0.06em",
                    }}
                  >
                    {translate("referencePage.listHeader.title")}
                  </h1>

                  <p
                    style={{
                      maxWidth: 650,
                      margin: "12px 0 0",
                      color: t.textSoft,
                      fontSize: 14,
                      lineHeight: 1.7,
                      fontWeight: 650,
                    }}
                  >
                    {translate("referencePage.listHeader.text")}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    justifyItems: "end",
                  }}
                >
                  <ReferenceDisplaySwitch
                    value={referenceDisplayMode}
                    onChange={setReferenceDisplayMode}
                    t={t}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 105,
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: t.glassStrong,
                        border: `1px solid ${t.border}`,
                        boxShadow: "none",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: t.text,
                          fontSize: 22,
                          lineHeight: 1,
                          fontWeight: 950,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {filteredReferences.length}
                      </strong>

                      <span
                        style={{
                          color: t.textMuted,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {translate("referencePage.stats.projects")}
                      </span>
                    </div>

                    <div
                      style={{
                        minWidth: 105,
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: t.glassStrong,
                        border: `1px solid ${t.border}`,
                        boxShadow: "none",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: t.text,
                          fontSize: 22,
                          lineHeight: 1,
                          fontWeight: 950,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {stats.countries}
                      </strong>

                      <span
                        style={{
                          color: t.textMuted,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {translate("referencePage.stats.countries")}
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              {hasActiveFilters && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 12,
                    borderRadius: 18,
                    background: t.glassStrong,
                    border: `1px solid ${t.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      color: t.textSoft,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {translate("referencePage.activeFilters", {
                      count: activeFiltersCount,
                    })}
                  </span>

                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                      height: 34,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: `1px solid ${t.orangeBorder}`,
                      background: t.orangeSoft,
                      color: ORANGE,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {translate("referencePage.actions.reset")}
                  </button>
                </div>
              )}

              {filteredReferences.length === 0 ? (
                <div
                  style={{
                    padding: 34,
                    borderRadius: 26,
                    background: t.glassStrong,
                    border: `1px solid ${t.border}`,
                    color: t.textSoft,
                    fontSize: 14,
                    fontWeight: 750,
                    textAlign: "center",
                  }}
                >
                  {translate("referencePage.empty.filtered")}
                </div>
              ) : (
                <div
                  className={
                    referenceDisplayMode === "list"
                      ? "reference-results-list"
                      : "reference-results-cards"
                  }
                  style={{
                    display: "grid",
                    gap: referenceDisplayMode === "list" ? 18 : 16,
                    gridTemplateColumns:
                      referenceDisplayMode === "list"
                        ? "1fr"
                        : "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  {filteredReferences.map((reference) =>
                    referenceDisplayMode === "list" ? (
                      <ReferenceListItem
                        key={reference.id}
                        reference={reference}
                        t={t}
                        onOpen={openProjectDetails}
                      />
                    ) : (
                      <ReferenceCardItem
                        key={reference.id}
                        reference={reference}
                        t={t}
                        onOpen={openProjectDetails}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {commandBarOpen && (
          <section
            className="reference-command-bar"
            style={{
              position: "fixed",
              left: 22,
              right: viewMode === "list" ? 220 : 22,
              top: viewMode === "list" ? 22 : undefined,
              bottom: viewMode === "map" ? 22 : undefined,
              zIndex: 1500,
              padding: 9,
              borderRadius: 22,
              background: t.glassStrong,
              border: `1px solid ${t.border}`,
              boxShadow: t.shadow,
              backdropFilter: "blur(22px)",
              animation: "commandBarIn 0.22s ease",
            }}
          >
            <div
              className="reference-command-inner"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px, 1fr) auto auto",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  height: 38,
                  padding: "0 13px",
                  borderRadius: 999,
                  border: `1px solid ${t.border}`,
                  background: t.inputBg,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <span style={{ color: ORANGE, fontSize: 14 }}>⌕</span>

                <input
                  type="text"
                  placeholder={translate("referencePage.command.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: t.text,
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      color: t.textMuted,
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div
                className="reference-command-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((prev) => (prev === "map" ? "list" : "map"))
                  }
                  className="ui-icon-button"
                  style={{
                    height: 38,
                    padding: "0 13px",
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {viewMode === "map"
                    ? translate("referencePage.command.switchList")
                    : translate("referencePage.command.switchMap")}
                </button>

                {viewMode === "map" && (
                  <>
                    <button
                      type="button"
                      onClick={focusFilteredReferences}
                      className="ui-icon-button"
                      style={{
                        height: 38,
                        padding: "0 13px",
                        borderRadius: 999,
                        border: `1px solid ${t.border}`,
                        background: t.inputBg,
                        color: t.text,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 850,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {translate("referencePage.command.viewResults")}
                    </button>

                    <button
                      type="button"
                      onClick={resetMapView}
                      className="ui-icon-button"
                      style={{
                        height: 38,
                        padding: "0 13px",
                        borderRadius: 999,
                        border: `1px solid ${t.border}`,
                        background: t.inputBg,
                        color: t.text,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 850,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {translate("referencePage.command.recenter")}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setFilterPanelOpen((prev) => !prev)}
                  className="ui-icon-button"
                  style={{
                    height: 38,
                    padding: "0 13px",
                    borderRadius: 999,
                    border: `1px solid ${
                      hasActiveFilters ? "rgba(239,159,39,0.58)" : t.border
                    }`,
                    background: hasActiveFilters ? ORANGE : t.inputBg,
                    color: hasActiveFilters ? "#1A0D00" : t.text,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {translate("referencePage.command.filters")}
                  {activeFiltersCount > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: "0 5px",
                        borderRadius: 999,
                        background: hasActiveFilters ? "#1A0D00" : ORANGE,
                        color: hasActiveFilters ? "#FFFFFF" : "#1A0D00",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 950,
                      }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={exportToCSV}
                  className="ui-icon-button"
                  style={{
                    height: 38,
                    padding: "0 13px",
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 850,
                    whiteSpace: "nowrap",
                  }}
                >
                  {translate("referencePage.command.export")}
                </button>
              </div>

              <div
                className="reference-stats"
                style={{
                  display: viewMode === "list" ? "none" : "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <StatCard
                  value={String(stats.countries)}
                  label={translate("referencePage.stats.countries")}
                  icon="🌍"
                  t={t}
                />
                <StatCard
                  value={String(stats.projects)}
                  label={translate("referencePage.stats.projects")}
                  icon="📍"
                  t={t}
                />
                <StatCard
                  value={String(stats.sectors)}
                  label={translate("referencePage.stats.sectors")}
                  icon="◼"
                  t={t}
                />
                <StatCard
                  value={String(stats.technologies)}
                  label={translate("referencePage.stats.techs")}
                  icon="⚙️"
                  t={t}
                />
              </div>
            </div>
          </section>
        )}

        {filterPanelOpen && commandBarOpen && (
          <aside
            className="reference-filter-drawer"
            style={{
              position: "fixed",
              top: viewMode === "list" ? 84 : 96,
              right: 22,
              zIndex: 1700,
              width: 390,
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              padding: 18,
              borderRadius: 26,
              background: t.panelBg,
              border: `1px solid ${t.borderStrong}`,
              boxShadow: t.shadow,
              backdropFilter: "blur(22px)",
              animation: "drawerIn 0.22s ease",
              display: "grid",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 5px",
                    color: ORANGE,
                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {translate("referencePage.filters.kicker")}
                </p>

                <h2
                  style={{
                    margin: 0,
                    color: t.text,
                    fontSize: 20,
                    fontWeight: 950,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {translate("referencePage.filters.title")}
                </h2>
              </div>

              <IconButton
                label={translate("referencePage.filters.close")}
                t={t}
                onClick={() => setFilterPanelOpen(false)}
              >
                ✕
              </IconButton>
            </div>

            <FilterBlock title={translate("referencePage.filters.sortBy")} t={t}>
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
                  t={t}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.categories")} t={t}>
              {allCategories.map((category) => (
                <FilterChip
                  key={category}
                  active={selectedCategories.includes(category)}
                  label={category}
                  onClick={() => toggleCategory(category)}
                  t={t}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.technologies")} t={t}>
              {allTechnologies.slice(0, 18).map((technology) => (
                <FilterChip
                  key={technology}
                  active={selectedTechnologies.includes(technology)}
                  label={technology}
                  onClick={() => toggleTechnology(technology)}
                  t={t}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.tags")} t={t}>
              {allTags.slice(0, 22).map((tag) => (
                <FilterChip
                  key={tag}
                  active={selectedTags.includes(tag)}
                  label={`#${tag}`}
                  onClick={() => toggleTag(tag)}
                  t={t}
                />
              ))}
            </FilterBlock>

            <FilterBlock title={translate("referencePage.filters.years")} t={t}>
              {allYears.map((year) => (
                <FilterChip
                  key={year}
                  active={selectedYears.includes(year)}
                  label={year}
                  onClick={() => toggleYear(year)}
                  t={t}
                />
              ))}
            </FilterBlock>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  height: 44,
                  borderRadius: 999,
                  border: `1px solid ${t.orangeBorder}`,
                  background: t.orangeSoft,
                  color: ORANGE,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {translate("referencePage.actions.resetAll")}
              </button>
            )}
          </aside>
        )}

        {loadingMap && viewMode === "map" && (
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
            {translate("referencePage.loading.map")}
          </div>
        )}

        {loading && (
          <div
            style={{
              position: "fixed",
              top: 96,
              right: 22,
              zIndex: 1002,
              background: t.panelBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "11px 15px",
              color: t.textSoft,
              fontSize: 12,
              fontWeight: 800,
              boxShadow: t.shadowSoft,
            }}
          >
            {translate("referencePage.loading.references")}
          </div>
        )}

        {!loading && filteredReferences.length === 0 && viewMode === "map" && (
          <div
            style={{
              position: "fixed",
              top: 96,
              right: 22,
              zIndex: 1002,
              background: t.panelBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "12px 16px",
              color: t.textSoft,
              fontSize: 12,
              fontWeight: 800,
              boxShadow: t.shadowSoft,
            }}
          >
            {translate("referencePage.empty.published")}
          </div>
        )}

        {tooltipData.visible &&
          viewMode === "map" &&
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
                  background: t.panelBg,
                  border: `1px solid ${t.borderStrong}`,
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: t.shadow,
                  backdropFilter: "blur(18px)",
                }}
              >
                <div style={{ position: "relative", height: 145 }}>
                  <img
                    src={safeImage(tooltipActiveProject.image)}
                    alt={tooltipActiveProject.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.72), transparent 62%)",
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: ORANGE,
                      color: "#1A0D00",
                      fontSize: 10,
                      fontWeight: 950,
                      padding: "6px 10px",
                      borderRadius: 999,
                    }}
                  >
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
                  t={t}
                />

                <div style={{ padding: 16 }}>
                  <p
                    style={{
                      margin: "0 0 5px",
                      color: ORANGE,
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {tooltipActiveProject.client} · {tooltipActiveProject.date}
                  </p>

                  <h3
                    style={{
                      margin: "0 0 9px",
                      color: t.text,
                      fontSize: 16,
                      fontWeight: 950,
                      lineHeight: 1.32,
                      letterSpacing: "-0.03em",
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
                      margin: "12px 0 14px",
                      flexWrap: "wrap",
                    }}
                  >
                    {(tooltipActiveProject.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          color: ORANGE,
                          fontSize: 10,
                          padding: "5px 9px",
                          border: `1px solid rgba(239,159,39,0.30)`,
                          background: t.orangeSoft,
                          borderRadius: 999,
                          fontWeight: 850,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
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
                      style={{
                        height: 42,
                        borderRadius: 999,
                        background: ORANGE,
                        border: "none",
                        color: "#1A0D00",
                        fontSize: 12,
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      {translate("referencePage.actions.viewDetails")}
                    </button>

                    <Link
                      href={getReferenceHref(tooltipActiveProject)}
                      style={{
                        height: 42,
                        borderRadius: 999,
                        background: t.orangeSoft,
                        border: `1px solid ${t.orangeBorder}`,
                        color: ORANGE,
                        fontSize: 12,
                        fontWeight: 950,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                      }}
                    >
                      Voir la fiche
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        {modalData.visible &&
          modalData.projects.length > 0 &&
          modalActiveProject && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(10px)",
              }}
              onClick={() =>
                setModalData((prev) => ({
                  ...prev,
                  visible: false,
                }))
              }
            >
              <div
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.borderStrong}`,
                  borderRadius: 30,
                  width: "min(1120px, calc(100vw - 32px))",
                  maxHeight: "92vh",
                  overflowY: "auto",
                  boxShadow: "0 34px 95px rgba(0,0,0,0.52)",
                  animation: "md2iModalIn 0.24s ease",
                  position: "relative",
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="reference-modal-hero"
                  style={{
                    position: "relative",
                    height: 335,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={safeImage(modalActiveProject.image)}
                    alt={modalActiveProject.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
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
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.46)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "white",
                      fontSize: 18,
                      cursor: "pointer",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    ✕
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      left: 28,
                      right: 28,
                      bottom: 26,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: ORANGE,
                          color: "#1A0D00",
                          fontSize: 10,
                          fontWeight: 950,
                          padding: "6px 11px",
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
                          fontWeight: 850,
                          padding: "6px 11px",
                          borderRadius: 999,
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {translate("referencePage.projectCount", {
                          count: modalData.projects.length,
                        })}
                      </span>
                    </div>

                    <div>
                      <p
                        style={{
                          margin: "0 0 6px",
                          color: ORANGE,
                          fontSize: 13,
                          fontWeight: 850,
                        }}
                      >
                        {modalActiveProject.client} · {modalActiveProject.date}
                      </p>

                      <h2
                        style={{
                          maxWidth: 780,
                          margin: 0,
                          color: "#FFFFFF",
                          fontSize: 36,
                          lineHeight: 1.08,
                          fontWeight: 950,
                          letterSpacing: "-0.055em",
                        }}
                      >
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
                  t={t}
                  sticky
                />

                <div
                  className="modal-content-padding"
                  style={{
                    padding: "34px 42px 42px",
                    display: "grid",
                    gap: 30,
                  }}
                >
                  <div
                    className="modal-top-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1.2fr) minmax(300px, 0.8fr)",
                      gap: 30,
                      alignItems: "start",
                    }}
                  >
                    <div style={{ minWidth: 0, display: "grid", gap: 18 }}>
                      <section
                        style={{
                          padding: 22,
                          borderRadius: 24,
                          background: t.inputBg,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 10px",
                            color: ORANGE,
                            fontSize: 11,
                            fontWeight: 950,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {translate("referencePage.modal.summary")}
                        </p>

                        <RichHtml
                          html={modalActiveProject.excerpt}
                          color={dark ? "rgba(239,159,39,0.88)" : "#9A5D08"}
                        />
                      </section>

                      <section
                        style={{
                          padding: 24,
                          borderRadius: 24,
                          background: t.panelBg,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 12px",
                            color: t.textMuted,
                            fontSize: 11,
                            fontWeight: 950,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {translate("referencePage.modal.details")}
                        </p>

                        <RichHtml
                          html={modalActiveProject.details}
                          color={t.textSoft}
                        />
                      </section>
                    </div>

                    <aside style={{ minWidth: 0 }}>
                      <div
                        style={{
                          position: "sticky",
                          top: 86,
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <section
                          style={{
                            padding: 18,
                            borderRadius: 24,
                            background: t.panelBg,
                            border: `1px solid ${t.border}`,
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              color: ORANGE,
                              fontSize: 11,
                              fontWeight: 950,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {translate("referencePage.modal.keyInfo")}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                              gap: 12,
                            }}
                          >
                            <MetricCard
                              icon="🌍"
                              label={translate("referencePage.metrics.country")}
                              value={modalActiveProject.country}
                              t={t}
                            />

                            <MetricCard
                              icon="🏢"
                              label={translate("referencePage.metrics.client")}
                              value={modalActiveProject.client}
                              t={t}
                            />

                            {modalActiveProject.team && (
                              <MetricCard
                                icon="👥"
                                label={translate("referencePage.metrics.team")}
                                value={modalActiveProject.team}
                                t={t}
                              />
                            )}

                            {modalActiveProject.duration && (
                              <MetricCard
                                icon="⏱️"
                                label={translate("referencePage.metrics.duration")}
                                value={modalActiveProject.duration}
                                t={t}
                              />
                            )}

                            {modalActiveProject.budget && (
                              <MetricCard
                                icon="💰"
                                label={translate("referencePage.metrics.budget")}
                                value={modalActiveProject.budget}
                                t={t}
                              />
                            )}

                            {modalActiveProject.impact && (
                              <MetricCard
                                icon="📈"
                                label={translate("referencePage.metrics.impact")}
                                value={modalActiveProject.impact}
                                t={t}
                              />
                            )}
                          </div>
                        </section>

                        <Link
                          href={getReferenceHref(modalActiveProject)}
                          onClick={() =>
                            setModalData((prev) => ({
                              ...prev,
                              visible: false,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: 48,
                            borderRadius: 999,
                            background: t.orangeSoft,
                            border: `1px solid ${t.orangeBorder}`,
                            color: ORANGE,
                            fontSize: 14,
                            fontWeight: 950,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                          }}
                        >
                          Voir la fiche complète
                        </Link>

                        <Link
                          href={`/contact-commercial?reference=${getReferenceParam(
                            modalActiveProject
                          )}`}
                          style={{
                            width: "100%",
                            height: 48,
                            borderRadius: 999,
                            background: ORANGE,
                            border: "none",
                            color: "#1A0D00",
                            fontSize: 14,
                            fontWeight: 950,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                          }}
                        >
                          {translate("referencePage.actions.wantSimilar")}
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setModalData((prev) => ({
                              ...prev,
                              visible: false,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: 48,
                            borderRadius: 999,
                            background: "transparent",
                            border: `1px solid ${t.border}`,
                            color: t.textSoft,
                            fontSize: 14,
                            fontWeight: 850,
                            cursor: "pointer",
                          }}
                        >
                          {translate("common.close")}
                        </button>
                      </div>
                    </aside>
                  </div>

                  {(modalActiveProject.technologies || []).length > 0 && (
                    <section
                      style={{
                        padding: 22,
                        borderRadius: 24,
                        background: t.panelBg,
                        border: `1px solid ${t.border}`,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: t.textMuted,
                          fontSize: 11,
                          fontWeight: 950,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {translate("referencePage.modal.technologies")}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {(modalActiveProject.technologies || []).map(
                          (technology) => (
                            <span
                              key={technology}
                              style={{
                                padding: "7px 12px",
                                borderRadius: 999,
                                background: t.inputBg,
                                border: `1px solid ${t.border}`,
                                color: t.textSoft,
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {technology}
                            </span>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {(modalActiveProject.tags || []).length > 0 && (
                    <section
                      style={{
                        padding: 22,
                        borderRadius: 24,
                        background: t.panelBg,
                        border: `1px solid ${t.border}`,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: t.textMuted,
                          fontSize: 11,
                          fontWeight: 950,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {translate("referencePage.modal.tags")}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {(modalActiveProject.tags || []).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag) ? prev : [...prev, tag]
                              );

                              setModalData((prev) => ({
                                ...prev,
                                visible: false,
                              }));

                              showTemporaryNotification(
                                translate("referencePage.notifications.tagAdded", {
                                  tag,
                                }),
                                "info"
                              );
                            }}
                            style={{
                              color: ORANGE,
                              fontSize: 11,
                              padding: "6px 11px",
                              border: `1px solid rgba(239,159,39,0.34)`,
                              borderRadius: 999,
                              background: t.orangeSoft,
                              cursor: "pointer",
                              fontWeight: 850,
                            }}
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
