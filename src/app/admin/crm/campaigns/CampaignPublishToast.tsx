"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

function formatChannel(value: string | null) {
  if (value === "LINKEDIN") return "LinkedIn";
  if (value === "FACEBOOK") return "Facebook";

  return value || "le canal";
}

export default function CampaignPublishToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("publish");
  const channel = searchParams.get("channel");
  const title = searchParams.get("title");

  const [visible, setVisible] = useState(false);

  const toast = useMemo(() => {
    if (!status) return null;

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
  }, [status, channel, title]);

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