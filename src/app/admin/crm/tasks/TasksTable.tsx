"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const today = new Date();

  due.setHours(23, 59, 59, 999);

  return due.getTime() < today.getTime();
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

function getStatusClass(status: string) {
  if (status === "DONE") return "crm-badge-green";
  if (status === "CANCELLED") return "crm-badge-red";
  if (status === "IN_PROGRESS") return "crm-badge-orange";

  return "";
}

function getPriorityClass(priority: string) {
  if (priority === "URGENT") return "crm-badge-red";
  if (priority === "HIGH") return "crm-badge-orange";
  if (priority === "LOW") return "crm-badge-green";

  return "";
}

export default function TasksTable({ tasks }: TasksTableProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [form, setForm] = useState<ModalForm | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  if (tasks.length === 0) {
    return (
      <div className="crm-card crm-section">
        <div className="crm-empty">Aucune tâche pour le moment.</div>
      </div>
    );
  }

  return (
    <div className="crm-grid">
      {notice && !selected && (
        <div
          className={
            notice.type === "success"
              ? "crm-notice crm-notice-success"
              : "crm-notice crm-notice-error"
          }
        >
          {notice.message}
        </div>
      )}

      <div className="crm-card crm-section">
        <div className="crm-section-head">
          <div>
            <h2 className="crm-section-title">Relances à traiter</h2>
            <p className="crm-section-subtitle">
              Consultez les tâches. Cliquez sur “Gérer” pour modifier le statut,
              la priorité ou l’échéance dans une fenêtre dédiée.
            </p>
          </div>
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Contact</th>
                <th>Entreprise</th>
                <th>Opportunité</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Échéance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <tr key={task.id} className={overdue ? "crm-row-danger" : ""}>
                    <td>
                      <div className="crm-name">{task.title}</div>

                      {task.description && (
                        <div className="crm-muted crm-small-text">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td>
                      {task.contact ? (
                        <>
                          <div className="crm-name">
                            {getContactName(task.contact)}
                          </div>
                          <div className="crm-muted">{task.contact.email}</div>
                          {task.contact.phone && (
                            <div className="crm-muted">{task.contact.phone}</div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>{task.company?.name || "—"}</td>

                    <td>
                      {task.opportunity ? (
                        <>
                          <div className="crm-name">
                            {task.opportunity.title}
                          </div>

                          {task.opportunity.product?.name && (
                            <div className="crm-muted">
                              {task.opportunity.product.name}
                            </div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <span className={`crm-badge ${getStatusClass(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`crm-badge ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>

                    <td>
                      <div className={overdue ? "crm-danger-text" : ""}>
                        {formatDate(task.dueDate)}
                      </div>

                      {overdue && (
                        <div className="crm-muted crm-small-text">En retard</div>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="crm-mini-button crm-mini-button-primary"
                        onClick={() => openModal(task)}
                      >
                        Gérer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && form && (
        <div className="crm-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="crm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-task-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="crm-modal-header">
              <div>
                <p className="crm-modal-eyebrow">Gestion tâche</p>

                <h2 id="crm-task-modal-title" className="crm-modal-title">
                  {selected.title}
                </h2>

                <p className="crm-modal-subtitle">
                  Modifiez le statut, la priorité ou l’échéance de cette
                  relance commerciale.
                </p>
              </div>

              <button
                type="button"
                className="crm-modal-close"
                onClick={closeModal}
                disabled={Boolean(loadingId)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="crm-modal-body">
              <div className="crm-modal-summary">
                <div>
                  <span>Contact</span>
                  <strong>
                    {selected.contact ? getContactName(selected.contact) : "—"}
                  </strong>
                </div>

                <div>
                  <span>Entreprise</span>
                  <strong>{selected.company?.name || "—"}</strong>
                </div>

                <div>
                  <span>Opportunité</span>
                  <strong>{selected.opportunity?.title || "—"}</strong>
                </div>

                <div>
                  <span>Produit</span>
                  <strong>{selected.opportunity?.product?.name || "—"}</strong>
                </div>
              </div>

              {selected.description && (
                <div className="crm-modal-description">
                  <span>Description</span>
                  <p>{selected.description}</p>
                </div>
              )}

              <div className="crm-modal-quick-actions">
                <button
                  type="button"
                  className="crm-mini-button crm-mini-button-secondary"
                  onClick={() => applyQuickAction("IN_PROGRESS")}
                >
                  Marquer en cours
                </button>

                <button
                  type="button"
                  className="crm-mini-button"
                  onClick={() => applyQuickAction("DONE")}
                >
                  Marquer terminée
                </button>

                <button
                  type="button"
                  className="crm-mini-button crm-mini-button-secondary"
                  onClick={() => applyQuickAction(undefined, "URGENT")}
                >
                  Passer en urgent
                </button>

                <button
                  type="button"
                  className="crm-mini-button crm-mini-button-danger"
                  onClick={() => applyQuickAction("CANCELLED")}
                >
                  Annuler la tâche
                </button>
              </div>

              <div className="crm-modal-form-grid">
                <label className="crm-modal-field">
                  <span>Statut</span>

                  <select
                    className="crm-control"
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

                <label className="crm-modal-field">
                  <span>Priorité</span>

                  <select
                    className="crm-control"
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

                <label className="crm-modal-field">
                  <span>Échéance</span>

                  <input
                    className="crm-control"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateForm("dueDate", event.target.value)
                    }
                  />
                </label>

                <div className="crm-modal-field">
                  <span>Créée le</span>
                  <div className="crm-modal-readonly">
                    {formatDate(selected.createdAt)}
                  </div>
                </div>
              </div>

              {notice?.type === "error" && (
                <div className="crm-notice crm-notice-error">
                  {notice.message}
                </div>
              )}
            </div>

            <div className="crm-modal-footer">
              <button
                type="button"
                className="crm-modal-cancel"
                onClick={closeModal}
                disabled={Boolean(loadingId)}
              >
                Annuler
              </button>

              <button
                type="button"
                className="crm-modal-submit"
                onClick={submitModal}
                disabled={loadingId === selected.id}
              >
                {loadingId === selected.id
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}