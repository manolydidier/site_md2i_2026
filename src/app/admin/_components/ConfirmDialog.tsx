"use client";

// Remplace window.confirm() par une boîte de dialogue stylée, cohérente
// quel que soit le système de style de la page hôte (Tailwind ou styles
// inline) puisqu'elle est entièrement autonome. Usage :
//
//   const { confirm, confirmDialog } = useConfirm();
//   ...
//   if (!(await confirm("Supprimer cet élément ?"))) return;
//   ...
//   return <>{confirmDialog}{...}</>;

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | ReactNode) => {
    const normalized: ConfirmOptions =
      options && typeof options === "object" && "message" in (options as ConfirmOptions)
        ? (options as ConfirmOptions)
        : { message: options as ReactNode };

    setState(normalized);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setState(null);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  useEffect(() => {
    if (!state) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") settle(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, settle]);

  const confirmDialog = state ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof state.title === "string" ? state.title : "Confirmation"}
      onClick={() => settle(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20, 18, 16, 0.45)",
        padding: 16,
        fontFamily: "inherit",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#FFFFFF",
          borderRadius: 14,
          padding: 22,
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        }}
      >
        {state.title && (
          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#1C1917" }}>
            {state.title}
          </h3>
        )}

        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#44403C" }}>
          {state.message}
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={() => settle(false)}
            style={{
              minHeight: 38,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #E7E4DD",
              background: "#FFFFFF",
              color: "#3A3632",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            {state.cancelLabel || "Annuler"}
          </button>

          <button
            type="button"
            autoFocus
            onClick={() => settle(true)}
            style={{
              minHeight: 38,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: state.danger ? "#B42318" : "#1C1917",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            {state.confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmDialog };
}
