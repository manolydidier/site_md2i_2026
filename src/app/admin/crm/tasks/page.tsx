// src/app/(backoffice)/crm/tasks/page.tsx
// ou le chemin exact de ta page Tâches CRM

import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
  Sparkles,
  TimerReset,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";
import TasksTable from "./TasksTable";

export const dynamic = "force-dynamic";

function isTaskOverdue(task: { dueDate: Date | null; status: string }) {
  if (!task.dueDate) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;

  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);

  return due.getTime() < Date.now();
}

function isTaskDueToday(task: { dueDate: Date | null; status: string }) {
  if (!task.dueDate) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;

  const today = new Date();
  const due = new Date(task.dueDate);

  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

export default async function CrmTasksPage() {
  const access = await checkPermission("crm_tasks", "canRead");

  if (!access.ok) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.subtitle}>
            Vous n&apos;avez pas la permission de consulter les tâches CRM.
          </p>
        </div>
      </div>
    );
  }

  const canUpdate = await checkPermission("crm_tasks", "canUpdate").then(
    (r) => r.ok
  );

  const userId = await getCrmOwnerUserId();

  const tasks = await prisma.crmTask.findMany({
    where: {
      userId,
    },
    take: 100,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          stage: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const rows = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    contact: task.contact
      ? {
          id: task.contact.id,
          email: task.contact.email,
          firstName: task.contact.firstName,
          lastName: task.contact.lastName,
          phone: task.contact.phone,
        }
      : null,
    company: task.company
      ? {
          id: task.company.id,
          name: task.company.name,
        }
      : null,
    opportunity: task.opportunity
      ? {
          id: task.opportunity.id,
          title: task.opportunity.title,
          stage: task.opportunity.stage,
          product: task.opportunity.product
            ? {
                id: task.opportunity.product.id,
                name: task.opportunity.product.name,
                slug: task.opportunity.product.slug,
              }
            : null,
        }
      : null,
  }));

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((task) =>
    ["TODO", "IN_PROGRESS"].includes(String(task.status))
  ).length;
  const overdueTasks = tasks.filter(isTaskOverdue).length;
  const todayTasks = tasks.filter(isTaskDueToday).length;
  const doneTasks = tasks.filter((task) => task.status === "DONE").length;

  return (
    <div style={s.page}>
      <header style={s.hero}>
        <div style={s.heroGlow} />

        <div style={s.heroContent}>
          <div>
            <div style={s.eyebrowRow}>
              <span style={s.eyebrowIcon}>
                <Sparkles size={14} />
              </span>

              <p style={s.eyebrow}>Actions commerciales</p>
            </div>

            <h1 style={s.title}>Tâches & relances</h1>

            <p style={s.subtitle}>
              Les relances sont créées automatiquement lorsqu’un prospect
              remplit un formulaire produit ou commercial. Suivez leur statut,
              leur priorité et leur échéance depuis cette page.
            </p>
          </div>

          <div style={s.heroBadge}>
            <ListTodo size={17} />
            <span>Suivi commercial</span>
          </div>
        </div>
      </header>

      <section style={s.statsGrid}>
        <StatCard
          icon={<ListTodo size={22} />}
          label="Tâches"
          value={totalTasks}
          subtitle="Total"
        />

        <StatCard
          icon={<TimerReset size={22} />}
          label="À traiter"
          value={activeTasks}
          subtitle="TODO / En cours"
          highlight
        />

        <StatCard
          icon={<Clock3 size={22} />}
          label="Aujourd’hui"
          value={todayTasks}
          subtitle="Échéance du jour"
        />

        <StatCard
          icon={<AlertTriangle size={22} />}
          label="En retard"
          value={overdueTasks}
          subtitle="Relances urgentes"
          danger
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Terminées"
          value={doneTasks}
          subtitle="Clôturées"
        />
      </section>

      <TasksTable tasks={rows} canUpdate={canUpdate} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  highlight = false,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  subtitle: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        ...s.statCard,
        ...(highlight ? s.statCardHighlight : {}),
        ...(danger ? s.statCardDanger : {}),
      }}
    >
      <div style={s.statTop}>
        <div
          style={{
            ...s.statIcon,
            ...(highlight ? s.statIconHot : {}),
            ...(danger ? s.statIconDanger : {}),
          }}
        >
          {icon}
        </div>

        <span style={s.statChip}>{subtitle}</span>
      </div>

      <p style={s.statLabel}>{label}</p>
      <p style={s.statValue}>{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 32,
    background:
      "radial-gradient(circle at top left, rgba(239,159,39,0.13), transparent 34%), #F8FAFC",
    color: TEXT,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    marginBottom: 22,
    padding: 28,
    borderRadius: 24,
    background:
      "linear-gradient(135deg, #111827 0%, #1F2937 52%, #2B1804 100%)",
    border: `1px solid ${ORANGE_BORDER}`,
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.16)",
  },

  heroGlow: {
    position: "absolute",
    right: -80,
    top: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    background: "rgba(239,159,39,0.22)",
    filter: "blur(12px)",
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
  },

  eyebrowRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  eyebrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(239,159,39,0.16)",
    color: ORANGE,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  eyebrow: {
    margin: 0,
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.11em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    maxWidth: 820,
    margin: "12px 0 0",
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 1.7,
  },

  heroBadge: {
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.14)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 18,
  },

  statCard: {
    padding: 18,
    borderRadius: 20,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
  },

  statCardHighlight: {
    border: `1px solid ${ORANGE_BORDER}`,
    background:
      "linear-gradient(180deg, rgba(239,159,39,0.12), #FFFFFF 62%)",
  },

  statCardDanger: {
    border: "1px solid rgba(239, 68, 68, 0.25)",
    background:
      "linear-gradient(180deg, rgba(239,68,68,0.09), #FFFFFF 62%)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  statIconHot: {
    color: "#FFFFFF",
    background: ORANGE,
  },

  statIconDanger: {
    color: "#991B1B",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
  },

  statChip: {
    padding: "5px 9px",
    borderRadius: 999,
    background: "#F8FAFC",
    color: MUTED,
    fontSize: 11,
    fontWeight: 800,
  },

  statLabel: {
    margin: 0,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  statValue: {
    margin: "4px 0 0",
    color: TEXT,
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
};