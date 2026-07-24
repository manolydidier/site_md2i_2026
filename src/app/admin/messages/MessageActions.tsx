"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./login/admin-messages.module.css";

type StatusOption = {
  value: string;
  label: string;
};

type Props = {
  messageId: string;
  currentStatus: string;
  email: string;
  subject: string | null;
  listHref: string;
  statuses: StatusOption[];
  canUpdate: boolean;
  canDelete: boolean;
};

type ApiResult = {
  ok?: boolean;
  authRequired?: boolean;
  loginUrl?: string;
  error?: string;
  message?: {
    id: string;
    status: string;
    updatedAt: string;
  };
};

class AuthRequiredError extends Error {
  loginUrl: string;

  constructor(loginUrl: string) {
    super("Session expirée. Veuillez vous reconnecter.");
    this.name = "AuthRequiredError";
    this.loginUrl = loginUrl;
  }
}

function getMailtoHref(email: string, subject: string | null) {
  return `mailto:${email}?subject=${encodeURIComponent(
    `Re: ${subject || "Votre message"}`
  )}`;
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    redirect: "follow",
    body: JSON.stringify(body),
  });

  /**
   * Cas où le serveur redirige vers le login et fetch suit la redirection.
   * Cela évite d'essayer de parser une page HTML comme du JSON.
   */
  if (response.redirected) {
    const redirectedUrl = new URL(response.url);

    if (redirectedUrl.pathname.includes("/login")) {
      throw new AuthRequiredError(
        `${redirectedUrl.pathname}${redirectedUrl.search}`
      );
    }
  }

  const data = (await response.json().catch(() => null)) as ApiResult | null;

  /**
   * Cas propre recommandé : l'API JSON répond 401 avec loginUrl.
   */
  if (response.status === 401 || data?.authRequired) {
    throw new AuthRequiredError(data?.loginUrl || "/login");
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Action impossible.");
  }

  return data;
}

export default function MessageActions({
  messageId,
  currentStatus,
  email,
  subject,
  listHref,
  statuses,
  canUpdate,
  canDelete,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState("");
  const [savingLabel, setSavingLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  const redirectToLogin = (loginUrl?: string) => {
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/admin/messages";

    const url = loginUrl || "/login";

    if (url.includes("callbackUrl=")) {
      router.replace(url);
      return;
    }

    router.replace(
      `${url}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  };

  const handleActionError = (
    err: unknown,
    fallbackMessage: string,
    rollback?: () => void
  ) => {
    if (err instanceof AuthRequiredError) {
      redirectToLogin(err.loginUrl);
      return;
    }

    rollback?.();

    setSavingLabel("");
    setError(err instanceof Error ? err.message : fallbackMessage);
  };

  const refreshSoftly = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const updateStatus = async (nextStatus: string) => {
    const previousStatus = status;

    setStatus(nextStatus);
    setError("");
    setSavingLabel("Enregistrement...");

    try {
      await postJson("/api/messages/status", {
        id: messageId,
        status: nextStatus,
      });

      setSavingLabel("Enregistré");
      refreshSoftly();

      window.setTimeout(() => {
        setSavingLabel("");
      }, 1400);
    } catch (err) {
      handleActionError(
        err,
        "Impossible de mettre à jour le statut.",
        () => setStatus(previousStatus)
      );
    }
  };

  const markAsRead = async () => {
    const previousStatus = status;

    setStatus("READ");
    setError("");
    setSavingLabel("Enregistrement...");

    try {
      await postJson("/api/messages/read", {
        id: messageId,
      });

      setSavingLabel("Marqué comme lu");
      refreshSoftly();

      window.setTimeout(() => {
        setSavingLabel("");
      }, 1400);
    } catch (err) {
      handleActionError(
        err,
        "Impossible de marquer ce message comme lu.",
        () => setStatus(previousStatus)
      );
    }
  };

  const deleteMessage = async () => {
    const confirmed = window.confirm(
      "Supprimer définitivement ce message ? Cette action est irréversible."
    );

    if (!confirmed) return;

    setError("");
    setSavingLabel("Suppression...");

    try {
      await postJson("/api/messages/delete", {
        id: messageId,
      });

      router.push(listHref);

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      handleActionError(
        err,
        "Impossible de supprimer ce message."
      );
    }
  };

  return (
    <>
      <footer className={styles.readerActions}>
        <a href={getMailtoHref(email, subject)} className={styles.primaryAction}>
          Répondre
        </a>

        {canUpdate && (
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={markAsRead}
            disabled={isPending || status === "READ"}
          >
            Marquer lu
          </button>
        )}

        {canUpdate && (
          <div className={styles.statusAction}>
            <select
              value={status}
              disabled={isPending}
              onChange={(event) => updateStatus(event.target.value)}
            >
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {savingLabel ? (
              <span className={styles.statusSaved}>{savingLabel}</span>
            ) : null}
          </div>
        )}

        {canDelete && (
          <button
            type="button"
            className={styles.dangerAction}
            onClick={deleteMessage}
            disabled={isPending}
          >
            Supprimer
          </button>
        )}
      </footer>

      {error ? (
        <div className={styles.inlineError} role="alert">
          {error}
        </div>
      ) : null}
    </>
  );
}