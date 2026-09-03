"use client";

import { useToasts } from "./actions-context";
import styles from "./login/admin-messages.module.css";

export default function ToastStack() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastStack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toastItem}>
          <span>{toast.message}</span>

          {toast.onUndo ? (
            <button type="button" className={styles.toastUndoBtn} onClick={toast.onUndo}>
              {toast.undoLabel}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
