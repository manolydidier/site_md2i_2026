import type { CSSProperties } from "react";

import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getActorLabel(actor: { email: string; firstName: string | null; lastName: string | null } | null) {
  if (!actor) return "Système";

  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();

  return name || actor.email;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; entity?: string }>;
}) {
  const access = await checkPermission("audit_logs", "canRead");

  if (!access.ok) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.muted}>
            Vous n&apos;avez pas la permission de consulter le journal d&apos;audit.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const actionFilter = params.action?.trim() || "";
  const entityFilter = params.entity?.trim() || "";

  const where = {
    ...(actionFilter ? { action: { contains: actionFilter, mode: "insensitive" as const } } : {}),
    ...(entityFilter ? { entity: { contains: entityFilter, mode: "insensitive" as const } } : {}),
  };

  const [logs, total, distinctActions, distinctEntities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
      take: 100,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildPageHref(nextPage: number) {
    const qs = new URLSearchParams();
    qs.set("page", String(nextPage));
    if (actionFilter) qs.set("action", actionFilter);
    if (entityFilter) qs.set("entity", entityFilter);
    return `/admin/audit?${qs.toString()}`;
  }

  function buildFilterHref(next: { action?: string; entity?: string }) {
    const qs = new URLSearchParams();
    const nextAction = next.action !== undefined ? next.action : actionFilter;
    const nextEntity = next.entity !== undefined ? next.entity : entityFilter;
    if (nextAction) qs.set("action", nextAction);
    if (nextEntity) qs.set("entity", nextEntity);
    return `/admin/audit?${qs.toString()}`;
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <p style={s.eyebrow}>Sécurité</p>
          <h1 style={s.title}>Journal d&apos;audit</h1>
          <p style={s.subtitle}>
            {total.toLocaleString("fr-FR")} événement{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}.
          </p>
        </div>
      </header>

      <div style={s.filters}>
        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Action</span>
          <div style={s.filterChips}>
            <a href={buildFilterHref({ action: "" })} style={{ ...s.chip, ...(actionFilter === "" ? s.chipActive : {}) }}>
              Toutes
            </a>
            {distinctActions.map((item) => (
              <a
                key={item.action}
                href={buildFilterHref({ action: item.action })}
                style={{ ...s.chip, ...(actionFilter === item.action ? s.chipActive : {}) }}
              >
                {item.action}
              </a>
            ))}
          </div>
        </div>

        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Ressource</span>
          <div style={s.filterChips}>
            <a href={buildFilterHref({ entity: "" })} style={{ ...s.chip, ...(entityFilter === "" ? s.chipActive : {}) }}>
              Toutes
            </a>
            {distinctEntities.map((item) => (
              <a
                key={item.entity}
                href={buildFilterHref({ entity: item.entity })}
                style={{ ...s.chip, ...(entityFilter === item.entity ? s.chipActive : {}) }}
              >
                {item.entity}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section style={s.card}>
        {logs.length === 0 ? (
          <div style={s.empty}>
            <p>Aucun événement pour le moment.</p>
            <p style={s.mutedSmall}>
              Le journal se remplit au fur et à mesure des actions enregistrées par l&apos;application.
            </p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Acteur</th>
                  <th style={s.th}>Action</th>
                  <th style={s.th}>Ressource</th>
                  <th style={s.th}>ID ressource</th>
                  <th style={s.th}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={s.tr}>
                    <td style={s.td}>{formatDate(log.createdAt)}</td>
                    <td style={s.td}>{getActorLabel(log.actor)}</td>
                    <td style={s.td}>
                      <span style={s.badge}>{log.action}</span>
                    </td>
                    <td style={s.td}>{log.entity}</td>
                    <td style={s.td}>
                      <code style={s.code}>{log.entityId || "—"}</code>
                    </td>
                    <td style={s.td}>{log.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <footer style={s.pagination}>
            <p style={s.mutedSmall}>
              Page {page} sur {totalPages}
            </p>
            <div style={s.paginationActions}>
              {page > 1 && (
                <a href={buildPageHref(page - 1)} style={s.pageBtn}>
                  ← Précédent
                </a>
              )}
              {page < totalPages && (
                <a href={buildPageHref(page + 1)} style={s.pageBtn}>
                  Suivant →
                </a>
              )}
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 32,
    background: "#F8FAFC",
    color: TEXT,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    margin: 0,
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: MUTED,
    fontSize: 14,
  },
  filters: {
    display: "grid",
    gap: 12,
    marginBottom: 18,
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  filterLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
    minWidth: 70,
  },
  filterChips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    height: 30,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
  },
  chipActive: {
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE_SOFT,
    color: ORANGE,
  },
  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    overflow: "hidden",
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: MUTED,
  },
  mutedSmall: {
    margin: "4px 0 0",
    color: MUTED,
    fontSize: 12,
  },
  muted: {
    color: MUTED,
    fontSize: 13,
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 860,
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "12px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "left",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
  tr: {
    background: SURFACE,
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
  },
  badge: {
    display: "inline-flex",
    padding: "3px 9px",
    borderRadius: 999,
    background: ORANGE_SOFT,
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  code: {
    fontSize: 12,
    color: MUTED,
  },
  pagination: {
    padding: "14px 16px",
    borderTop: `1px solid ${BORDER}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paginationActions: {
    display: "flex",
    gap: 10,
  },
  pageBtn: {
    height: 34,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "none",
  },
};
