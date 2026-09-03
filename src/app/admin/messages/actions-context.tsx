"use client";

// Contexte partagé par la liste (survol, sélection groupée) et les
// raccourcis clavier : centralise les actions (lu/non lu, archiver,
// supprimer) avec un vrai mécanisme d'annulation façon webmail — l'action
// est appliquée visuellement tout de suite, l'appel réseau n'est déclenché
// qu'après quelques secondes si l'utilisateur n'a pas cliqué "Annuler".

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthRequiredError, postJson } from "./api-client";

type ToastItem = {
  id: number;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
};

type MailActionsValue = {
  canUpdate: boolean;
  canDelete: boolean;
  selected: Set<string>;
  toggleOne: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
  pendingRemoval: Set<string>;
  inFlight: Set<string>;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  archive: (id: string) => void;
  remove: (id: string) => void;
  bulkMarkRead: (ids: string[]) => void;
  bulkArchive: (ids: string[]) => void;
  bulkRemove: (ids: string[]) => void;
};

const MailActionsContext = createContext<MailActionsValue | null>(null);
const ToastContext = createContext<ToastItem[] | null>(null);

const UNDO_DELAY_MS = 4500;

export function useMailActions() {
  const ctx = useContext(MailActionsContext);
  if (!ctx) throw new Error("useMailActions must be used within MailActionsProvider");
  return ctx;
}

export function useToasts() {
  return useContext(ToastContext) || [];
}

export function MailActionsProvider({
  canUpdate,
  canDelete,
  children,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  children: ReactNode;
}) {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingRemoval, setPendingRemoval] = useState<Set<string>>(new Set());
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const toastId = useRef(0);

  const redirectToLogin = useCallback(
    (loginUrl?: string) => {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/admin/messages";
      const url = loginUrl || "/login";
      if (url.includes("callbackUrl=")) {
        router.replace(url);
        return;
      }
      router.replace(`${url}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    },
    [router]
  );

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, options?: { undoLabel?: string; onUndo?: () => void; commit?: () => void }) => {
      const id = ++toastId.current;
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          undoLabel: options?.onUndo ? options.undoLabel || "Annuler" : undefined,
          onUndo: options?.onUndo
            ? () => {
                dismissToast(id);
                options.onUndo?.();
              }
            : undefined,
        },
      ]);

      const delay = options?.commit ? UNDO_DELAY_MS : 2600;
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
        options?.commit?.();
      }, delay);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const runCommit = useCallback(
    async (run: () => Promise<unknown>, onDone?: () => void) => {
      try {
        await run();
        router.refresh();
      } catch (err) {
        if (err instanceof AuthRequiredError) {
          redirectToLogin(err.loginUrl);
          return;
        }
        pushToast(err instanceof Error ? err.message : "Action impossible.");
      } finally {
        onDone?.();
      }
    },
    [router, redirectToLogin, pushToast]
  );

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const allChecked = ids.length > 0 && ids.every((id) => prev.has(id));
      return allChecked ? new Set() : new Set(ids);
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const withInFlight = useCallback(async (id: string, run: () => Promise<unknown>) => {
    setInFlight((prev) => new Set(prev).add(id));
    try {
      await run();
    } finally {
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const markRead = useCallback(
    (id: string) => {
      withInFlight(id, () =>
        runCommit(() => postJson("/api/messages/read", { id }))
      );
      pushToast("Marqué comme lu.");
    },
    [withInFlight, runCommit, pushToast]
  );

  const markUnread = useCallback(
    (id: string) => {
      withInFlight(id, () =>
        runCommit(() => postJson("/api/messages/status", { id, status: "NEW" }))
      );
      pushToast("Marqué comme non lu.");
    },
    [withInFlight, runCommit, pushToast]
  );

  const archive = useCallback(
    (id: string) => {
      setPendingRemoval((prev) => new Set(prev).add(id));
      const undo = () =>
        setPendingRemoval((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

      pushToast("Message archivé.", {
        onUndo: undo,
        commit: () =>
          runCommit(() => postJson("/api/messages/status", { id, status: "ARCHIVED" }), undo),
      });
    },
    [pushToast, runCommit]
  );

  const remove = useCallback(
    (id: string) => {
      setPendingRemoval((prev) => new Set(prev).add(id));
      const undo = () =>
        setPendingRemoval((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

      pushToast("Message supprimé.", {
        onUndo: undo,
        commit: () => runCommit(() => postJson("/api/messages/delete", { id }), undo),
      });
    },
    [pushToast, runCommit]
  );

  const bulkMarkRead = useCallback(
    (ids: string[]) => {
      setInFlight((prev) => new Set([...prev, ...ids]));
      runCommit(
        () => Promise.all(ids.map((id) => postJson("/api/messages/read", { id }))),
        () =>
          setInFlight((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          })
      );
      pushToast(`${ids.length} message${ids.length > 1 ? "s" : ""} marqué${ids.length > 1 ? "s" : ""} comme lu.`);
      clearSelection();
    },
    [runCommit, pushToast, clearSelection]
  );

  const bulkArchive = useCallback(
    (ids: string[]) => {
      setPendingRemoval((prev) => new Set([...prev, ...ids]));
      const undo = () =>
        setPendingRemoval((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });

      pushToast(`${ids.length} message${ids.length > 1 ? "s" : ""} archivé${ids.length > 1 ? "s" : ""}.`, {
        onUndo: undo,
        commit: () =>
          runCommit(
            () => Promise.all(ids.map((id) => postJson("/api/messages/status", { id, status: "ARCHIVED" }))),
            undo
          ),
      });
      clearSelection();
    },
    [pushToast, runCommit, clearSelection]
  );

  const bulkRemove = useCallback(
    (ids: string[]) => {
      setPendingRemoval((prev) => new Set([...prev, ...ids]));
      const undo = () =>
        setPendingRemoval((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });

      pushToast(`${ids.length} message${ids.length > 1 ? "s" : ""} supprimé${ids.length > 1 ? "s" : ""}.`, {
        onUndo: undo,
        commit: () =>
          runCommit(
            () => Promise.all(ids.map((id) => postJson("/api/messages/delete", { id }))),
            undo
          ),
      });
      clearSelection();
    },
    [pushToast, runCommit, clearSelection]
  );

  const value = useMemo<MailActionsValue>(
    () => ({
      canUpdate,
      canDelete,
      selected,
      toggleOne,
      toggleAll,
      clearSelection,
      pendingRemoval,
      inFlight,
      markRead,
      markUnread,
      archive,
      remove,
      bulkMarkRead,
      bulkArchive,
      bulkRemove,
    }),
    [
      canUpdate,
      canDelete,
      selected,
      toggleOne,
      toggleAll,
      clearSelection,
      pendingRemoval,
      inFlight,
      markRead,
      markUnread,
      archive,
      remove,
      bulkMarkRead,
      bulkArchive,
      bulkRemove,
    ]
  );

  return (
    <MailActionsContext.Provider value={value}>
      <ToastContext.Provider value={toasts}>{children}</ToastContext.Provider>
    </MailActionsContext.Provider>
  );
}

export { ToastContext };
