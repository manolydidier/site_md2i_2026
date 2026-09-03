"use client";

// Bannière façon webmail : sonde périodiquement le nombre de messages
// NEW côté serveur (endpoint déjà utilisé par le badge de la navbar admin)
// et propose d'actualiser dès qu'il augmente, plutôt que de recharger la
// liste sous les pieds de l'utilisateur.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import styles from "./login/admin-messages.module.css";

const POLL_INTERVAL_MS = 25000;

export default function NewMessagesBanner({ initialNewCount }: { initialNewCount: number }) {
  const router = useRouter();
  const [baseline, setBaseline] = useState(initialNewCount);
  const [latest, setLatest] = useState(initialNewCount);

  // Ajuste l'état dérivé pendant le rendu (plutôt que dans un effet) quand
  // le serveur renvoie un nouveau total après un refresh.
  if (baseline !== initialNewCount) {
    setBaseline(initialNewCount);
    setLatest(initialNewCount);
  }

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/messages/new-count", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.ok) setLatest(data.count);
      } catch {
        // silencieux : une sonde ratée n'a pas besoin d'alerter l'utilisateur
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const extra = Math.max(0, latest - baseline);

  if (extra <= 0) return null;

  return (
    <div className={styles.newMessagesBanner}>
      <span>
        {extra} nouveau{extra > 1 ? "x" : ""} message{extra > 1 ? "s" : ""}
      </span>

      <button
        type="button"
        className={styles.newMessagesBannerBtn}
        onClick={() => router.refresh()}
      >
        <RefreshCw size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
        Actualiser
      </button>
    </div>
  );
}
