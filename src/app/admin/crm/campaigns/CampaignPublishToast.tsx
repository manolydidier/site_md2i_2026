"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

function formatChannel(value: string | null) {
  if (value === "LINKEDIN") return "LinkedIn";
  if (value === "FACEBOOK") return "Facebook";

  return value || "le canal";
}

function readCount(value: string | null) {
  const count = Number(value);

  return Number.isFinite(count) ? count : 0;
}

export default function CampaignPublishToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queueStatus = searchParams.get("queue");
  const queueMessage = searchParams.get("message");
  const checked = readCount(searchParams.get("checked"));
  const published = readCount(searchParams.get("published"));
  const manualReady = readCount(searchParams.get("manualReady"));
  const failed = readCount(searchParams.get("failed"));
  const skipped = readCount(searchParams.get("skipped"));
  const status = searchParams.get("publish");
  const channel = searchParams.get("channel");
  const title = searchParams.get("title");

  const [visible, setVisible] = useState(false);

  const toast = useMemo(() => {
    if (queueStatus) {
      if (queueStatus === "failed") {
        return {
          success: false,
          title: "File non traitée",
          message:
            queueMessage ||
            "Le traitement manuel de la file a rencontré une erreur.",
        };
      }

      if (checked === 0) {
        return {
          success: true,
          title: "File vérifiée",
          message: "Aucune publication échue n'attendait un envoi.",
        };
      }

      return {
        success: failed === 0,
        title: failed > 0 ? "File traitée avec erreurs" : "File traitée",
        message: `${published} publiée(s), ${manualReady} prête(s) en manuel, ${failed} échec(s), ${skipped} ignorée(s).`,
      };
    }

    if (!status) return null;

    if (status === "skipped") {
      return {
        success: true,
        title: "Publication non renvoyée",
        message:
          "Cette publication est déjà publiée ou annulée. Aucun nouveau post n'a été créé.",
      };
    }

    const success = status === "success";
    const channelLabel = formatChannel(channel);

    return {
      success,
      title: success
        ? `Publication envoyée sur ${channelLabel}`
        : `Échec de publication sur ${channelLabel}`,
      message: success
        ? title
          ? `"${title}" est maintenant marqué comme publié.`
          : "La publication est maintenant marquée comme publiée."
        : title
          ? `"${title}" n’a pas pu être publiée. Consultez le détail de l’erreur dans la carte.`
          : "La publication n’a pas pu être publiée. Consultez le détail de l’erreur dans la carte.",
    };
  }, [
    queueStatus,
    queueMessage,
    checked,
    published,
    manualReady,
    failed,
    skipped,
    status,
    channel,
    title,
  ]);

  useEffect(() => {
    if (!toast) return;

    setVisible(true);

    const timeout = window.setTimeout(() => {
      closeToast();
    }, 5200);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  function closeToast() {
    setVisible(false);

    const url = new URL(window.location.href);

    url.searchParams.delete("publish");
    url.searchParams.delete("channel");
    url.searchParams.delete("title");
    url.searchParams.delete("queue");
    url.searchParams.delete("checked");
    url.searchParams.delete("published");
    url.searchParams.delete("manualReady");
    url.searchParams.delete("failed");
    url.searchParams.delete("skipped");
    url.searchParams.delete("message");

    router.replace(`${url.pathname}${url.search}`, {
      scroll: false,
    });
  }

  if (!toast || !visible) return null;

  return (
    <div
      className={
        toast.success
          ? "crm-publish-toast crm-publish-toast-success"
          : "crm-publish-toast crm-publish-toast-error"
      }
      role="status"
      aria-live="polite"
    >
      <div className="crm-publish-toast-icon">
        {toast.success ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}
      </div>

      <div className="crm-publish-toast-content">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>

      <button
        type="button"
        className="crm-publish-toast-close"
        onClick={closeToast}
        aria-label="Fermer la notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
