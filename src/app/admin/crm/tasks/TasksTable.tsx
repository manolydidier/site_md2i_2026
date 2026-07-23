"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    stage: string;
    product: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
};

type TasksTableProps = {
  tasks: TaskRow[];
  canUpdate: boolean;
};

type ModalForm = {
  status: string;
  priority: string;
  dueDate: string;
};

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminée" },
  { value: "CANCELLED", label: "Annulée" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function toDateInput(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function fromDateInput(value: string) {
  if (!value.trim()) return null;

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function isOverdue(value: string | null, status: string) {
  if (!value) return false;
  if (status === "DONE" || status === "CANCELLED") return false;

  const due = new Date(value);
  due.setHours(23, 59, 59, 999);

  return due.getTime() < Date.now();
}

function isDueToday(value: string | null, status: string) {
  if (!value) return false;
  if (status === "DONE" || status === "CANCELLED") return false;

  const today = new Date();
  const due = new Date(value);

  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

function getContactName(contact: TaskRow["contact"]) {
  if (!contact) return "—";

  const name = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || contact.email;
}

function getStatusLabel(status: string) {
  return STATUSES.find((item) => item.value === status)?.label || status;
}

function getPriorityLabel(priority: string) {
  return PRIORITIES.find((item) => item.value === priority)?.label || priority;
}

function getStatusStyle(status: string): CSSProperties {
  if (status === "DONE") {
    return {
      background: "#DCFCE7",
      color: "#166534",
      border: "1px solid #BBF7D0",
    };
  }

  if (status === "CANCELLED") {
    return {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FECACA",
    };
  }

  if (status === "IN_PROGRESS") {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
      border: "1px solid #FED7AA",
    };
  }

  return {
    background: "#EFF6FF",
    color: "#1E3A8A",
    border: "1px solid #BFDBFE",
  };
}

function getPriorityStyle(priority: string): CSSProperties {
  if (priority === "URGENT") {
    return {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FECACA",
    };
  }

  if (priority === "HIGH") {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
      border: "1px solid #FED7AA",
    };
  }

  if (priority === "LOW") {
    return {
      background: "#DCFCE7",
      color: "#166534",
      border: "1px solid #BBF7D0",
    };
  }

  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
}

function getStageLabel(stage: string) {
  const labels: Record<string, string> = {
    NEW: "Nouvelle",
    QUALIFIED: "Qualifiée",
    PROPOSAL: "Proposition",
    NEGOTIATION: "Négociation",
    WON: "Gagnée",
    LOST: "Perdue",
  };

  return labels[stage] || stage;
}

export default function TasksTable({ tasks, canUpdate }: TasksTableProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [form, setForm] = useState<ModalForm | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aOverdue = isOverdue(a.dueDate, a.status) ? 0 : 1;
      const bOverdue = isOverdue(b.dueDate, b.status) ? 0 : 1;

      if (aOverdue !== bOverdue) return aOverdue - bOverdue;

      return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
    });
  }, [tasks]);

  function openModal(task: TaskRow) {
    setSelected(task);
    setNotice(null);

    setForm({
      status: task.status,
      priority: task.priority,
      dueDate: toDateInput(task.dueDate),
    });
  }

  function closeModal() {
    if (loadingId) return;

    setSelected(null);
    setForm(null);
  }

  function updateForm<K extends keyof ModalForm>(key: K, value: ModalForm[K]) {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [key]: value,
      };
    });
  }

  function applyQuickAction(status?: string, priority?: string) {
    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      };
    });
  }

  async function patchTask(
    id: string,
    body: {
      status?: string;
      priority?: string;
      dueDate?: string | null;
    }
  ) {
    setLoadingId(id);
    setNotice(null);

    try {
      const response = await fetch(`/api/crm/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erreur pendant la mise à jour.");
      }

      setNotice({
        type: "success",
        message: data.message || "Tâche mise à jour.",
      });

      setSelected(null);
      setForm(null);
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la tâche.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  function submitModal() {
    if (!selected || !form) return;

    patchTask(selected.id, {
      status: form.status,
      priority: form.priority,
      dueDate: fromDateInput(form.dueDate),
    });
  }

  return (
    <div style={s.wrapper}>
      {notice && !selected && (
        <div
          style={{
            ...s.notice,
            ...(notice.type === "success" ? s.noticeSuccess : s.noticeError),
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          <span>{notice.message}</span>
        </div>
      )}

      <section style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <div style={s.sectionTitleRow}>
              <span style={s.sectionIcon}>
                <ListTodoIcon />
              </span>

              <h2 style={s.sectionTitle}>Relances à traiter</h2>
            </div>

            <p style={s.sectionSubtitle}>
              Consultez les tâches. Cliquez sur “Gérer” pour modifier le statut,
              la priorité ou l’échéance.
            </p>
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>
              <Sparkles size={20} />
            </div>

            <p>Aucune tâche pour le moment.</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Tâche</th>
                  <th style={s.th}>Contact</th>
                  <th style={s.th}>Entreprise</th>
                  <th style={s.th}>Opportunité</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Priorité</th>
                  <th style={s.th}>Échéance</th>
                  <th style={s.thRight}>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const dueToday = isDueToday(task.dueDate, task.status);

                  return (
                    <tr
                      key={task.id}
                      style={{
                        ...s.tr,
                        ...(overdue ? s.trDanger : {}),
                      }}
                    >
                      <td style={s.td}>
                        <div style={s.mainCell}>
                          <span style={s.name}>{task.title}</span>

                          {task.description && (
                            <span style={s.muted}>{task.description}</span>
                          )}
                        </div>
                      </td>

                      <td style={s.td}>
                        {task.contact ? (
                          <div style={s.mainCell}>
                            <span style={s.inlineIconText}>
                              <UserRound size={14} />
                              {getContactName(task.contact)}
                            </span>

                            <span style={s.inlineMutedText}>
                              <Mail size={13} />
                              {task.contact.email}
                            </span>

                            {task.contact.phone && (
                              <span style={s.inlineMutedText}>
                                <Phone size={13} />
                                {task.contact.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        {task.company?.name ? (
                          <span style={s.inlineIconText}>
                            <Building2 size={14} />
                            {task.company.name}
                          </span>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        {task.opportunity ? (
                          <div style={s.mainCell}>
                            <span style={s.name}>{task.opportunity.title}</span>

                            <div style={s.pillRow}>
                              <span style={s.stageBadge}>
                                {getStageLabel(task.opportunity.stage)}
                              </span>

                              {task.opportunity.product?.name && (
                                <span style={s.productBadge}>
                                  {task.opportunity.product.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            ...getStatusStyle(task.status),
                          }}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            ...getPriorityStyle(task.priority),
                          }}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>

                      <td style={s.td}>
                        <div style={s.mainCell}>
                          <span
                            style={{
                              ...s.dueBadge,
                              ...(overdue ? s.dueLate : {}),
                              ...(dueToday ? s.dueToday : {}),
                            }}
                          >
                            <CalendarDays size={13} />
                            {formatDate(task.dueDate)}
                          </span>

                          {overdue && (
                            <span style={s.dangerText}>En retard</span>
                          )}

                          {dueToday && !overdue && (
                            <span style={s.orangeText}>À faire aujourd’hui</span>
                          )}
                        </div>
                      </td>

                      <td style={s.tdRight}>
                        {canUpdate && (
                          <button
                            type="button"
                            style={s.manageButton}
                            onClick={() => openModal(task)}
                          >
                            <Pencil size={14} />
                            Gérer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && form && (
        <div style={s.modalBackdrop} onMouseDown={closeModal}>
          <div
            style={s.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-task-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <div>
                <p style={s.modalEyebrow}>Gestion tâche</p>

                <h2 id="crm-task-modal-title" style={s.modalTitle}>
                  {selected.title}
                </h2>

                <p style={s.modalSubtitle}>
                  Modifiez le statut, la priorité ou l’échéance de cette relance
                  commerciale.
                </p>
              </div>

              <button
                type="button"
                style={s.modalClose}
                onClick={closeModal}
                disabled={Boolean(loadingId)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={s.modalSummary}>
                <SummaryItem
                  label="Contact"
                  value={selected.contact ? getContactName(selected.contact) : "—"}
                />

                <SummaryItem
                  label="Entreprise"
                  value={selected.company?.name || "—"}
                />

                <SummaryItem
                  label="Opportunité"
                  value={selected.opportunity?.title || "—"}
                />

                <SummaryItem
                  label="Produit"
                  value={selected.opportunity?.product?.name || "—"}
                />
              </div>

              {selected.description && (
                <div style={s.descriptionBox}>
                  <span>Description</span>
                  <p>{selected.description}</p>
                </div>
              )}

              <div style={s.quickActions}>
                <button
                  type="button"
                  style={s.quickButton}
                  onClick={() => applyQuickAction("IN_PROGRESS")}
                >
                  En cours
                </button>

                <button
                  type="button"
                  style={s.quickButtonSuccess}
                  onClick={() => applyQuickAction("DONE")}
                >
                  Terminée
                </button>

                <button
                  type="button"
                  style={s.quickButtonOrange}
                  onClick={() => applyQuickAction(undefined, "URGENT")}
                >
                  Urgent
                </button>

                <button
                  type="button"
                  style={s.quickButtonDanger}
                  onClick={() => applyQuickAction("CANCELLED")}
                >
                  Annuler
                </button>
              </div>

              <div style={s.formGrid}>
                <label style={s.field}>
                  <span>Statut</span>

                  <select
                    style={s.control}
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value)
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={s.field}>
                  <span>Priorité</span>

                  <select
                    style={s.control}
                    value={form.priority}
                    onChange={(event) =>
                      updateForm("priority", event.target.value)
                    }
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={s.field}>
                  <span>Échéance</span>

                  <input
                    style={s.control}
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateForm("dueDate", event.target.value)
                    }
                  />
                </label>

                <div style={s.field}>
                  <span>Créée le</span>

                  <div style={s.readonly}>{formatDate(selected.createdAt)}</div>
                </div>
              </div>

              {notice?.type === "error" && (
                <div style={{ ...s.notice, ...s.noticeError }}>
                  <AlertTriangle size={17} />
                  <span>{notice.message}</span>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button
                type="button"
                style={s.cancelButton}
                onClick={closeModal}
                disabled={Boolean(loadingId)}
              >
                Annuler
              </button>

              <button
                type="button"
                style={{
                  ...s.submitButton,
                  opacity: loadingId === selected.id ? 0.6 : 1,
                }}
                onClick={submitModal}
                disabled={loadingId === selected.id}
              >
                {loadingId === selected.id ? (
                  <>
                    <Loader2 size={16} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.summaryItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ListTodoIcon() {
  return <BriefcaseBusiness size={18} />;
}

const ORANGE = "#EF9F27";
const ORANGE_DARK = "#92400E";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const SURFACE = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT = "#9CA3AF";
const BORDER = "#E5E7EB";

const s: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 16,
  },

  notice: {
    padding: "12px 14px",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
  },

  noticeSuccess: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
  },

  noticeError: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
  },

  card: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  sectionTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  sectionSubtitle: {
    margin: "6px 0 0 43px",
    color: MUTED,
    fontSize: 13,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
  },

  table: {
    width: "100%",
    minWidth: 1120,
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    padding: "13px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  thRight: {
    padding: "13px 14px",
    background: "#F9FAFB",
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tr: {
    background: "#FFFFFF",
  },

  trDanger: {
    background: "#FFFBFB",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
  },

  tdRight: {
    padding: "14px",
    borderBottom: "1px solid #F1F5F9",
    color: "#374151",
    verticalAlign: "top",
    textAlign: "right",
  },

  mainCell: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  name: {
    color: TEXT,
    fontWeight: 900,
  },

  muted: {
    color: SOFT,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.4,
  },

  inlineIconText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: TEXT,
    fontWeight: 800,
  },

  inlineMutedText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: SOFT,
    fontSize: 12,
    fontWeight: 600,
  },

  pillRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  badge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  stageBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#1E3A8A",
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  productBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  dueBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: 999,
    color: "#475569",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  dueLate: {
    color: "#991B1B",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
  },

  dueToday: {
    color: ORANGE_DARK,
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
  },

  dangerText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: 800,
  },

  orangeText: {
    color: ORANGE_DARK,
    fontSize: 12,
    fontWeight: 800,
  },

  manageButton: {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  empty: {
    minHeight: 230,
    borderRadius: 18,
    background: "#F9FAFB",
    border: `1px dashed ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: MUTED,
  },

  emptyIcon: {
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

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    padding: 24,
    background: "rgba(15, 23, 42, 0.48)",
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    width: "min(920px, 100%)",
    background: "#F8FAFC",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
    border: "1px solid rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    background:
      "linear-gradient(135deg, #111827 0%, #1F2937 58%, #2B1804 100%)",
  },

  modalEyebrow: {
    margin: "0 0 6px",
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  modalTitle: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  modalSubtitle: {
    margin: "8px 0 0",
    maxWidth: 620,
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 1.6,
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  modalBody: {
    padding: 22,
    display: "grid",
    gap: 16,
  },

  modalSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  summaryItem: {
    padding: 14,
    borderRadius: 16,
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  descriptionBox: {
    padding: 15,
    borderRadius: 16,
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
  },

  quickActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  quickButton: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonSuccess: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #BBF7D0",
    background: "#DCFCE7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonOrange: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #FED7AA",
    background: "#FFF7ED",
    color: "#9A3412",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonDanger: {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#991B1B",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  control: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  readonly: {
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: MUTED,
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    boxSizing: "border-box",
  },

  modalFooter: {
    padding: 22,
    borderTop: `1px solid ${BORDER}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    background: "#FFFFFF",
  },

  cancelButton: {
    height: 42,
    padding: "0 15px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  submitButton: {
    height: 42,
    padding: "0 15px",
    borderRadius: 12,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
};