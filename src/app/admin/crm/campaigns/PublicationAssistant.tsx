"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

type PublicationAssistantProps = {
  channel: string;
  title: string;
  content: string;
  trackedUrl: string | null;
  destinationUrl: string | null;
  ctaLabel: string | null;
};

function getComposerUrl(channel: string, trackedUrl: string, title: string) {
  if (channel === "FACEBOOK") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      trackedUrl
    )}`;
  }

  if (channel === "INDEED") {
    return "https://employers.indeed.com/";
  }

  if (channel === "EMAIL") {
    return `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(trackedUrl)}`;
  }

  if (channel === "LINKEDIN") {
    return "https://www.linkedin.com/feed/";
  }

  return trackedUrl;
}

async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}

export default function PublicationAssistant({
  channel,
  title,
  content,
  trackedUrl,
  destinationUrl,
  ctaLabel,
}: PublicationAssistantProps) {
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const [copyError, setCopyError] = useState(false);

  const finalUrl = trackedUrl || destinationUrl || "";
  const publicationPack = useMemo(() => {
    const lines = [content.trim()];

    if (ctaLabel && finalUrl) {
      lines.push(`${ctaLabel}: ${finalUrl}`);
    } else if (finalUrl) {
      lines.push(finalUrl);
    }

    return lines.filter(Boolean).join("\n\n");
  }, [content, ctaLabel, finalUrl]);

  const composerUrl = finalUrl
    ? getComposerUrl(channel, finalUrl, title)
    : getComposerUrl(channel, "/", title);

  async function handleCopy(kind: "text" | "link", value: string) {
    try {
      setCopyError(false);
      await copyToClipboard(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="crm-publication-assistant">
      <div className="crm-publication-preview">
        <strong>Texte pret a publier</strong>
        <pre>{publicationPack}</pre>
      </div>

      <div className="crm-assistant-actions">
        <button
          type="button"
          onClick={() => handleCopy("text", publicationPack)}
          className="crm-assistant-button"
        >
          {copied === "text" ? <Check size={15} /> : <Copy size={15} />}
          {copied === "text" ? "Copie" : "Copier texte"}
        </button>

        <button
          type="button"
          onClick={() => handleCopy("link", finalUrl)}
          className="crm-assistant-button"
          disabled={!finalUrl}
        >
          {copied === "link" ? <Check size={15} /> : <Copy size={15} />}
          {copied === "link" ? "Lien copie" : "Copier lien"}
        </button>

        <a
          href={composerUrl}
          target="_blank"
          rel="noreferrer"
          className="crm-assistant-button crm-assistant-button-primary"
        >
          <ExternalLink size={15} />
          Ouvrir canal
        </a>
      </div>

      <span className="crm-copy-status" aria-live="polite">
        {copyError
          ? "Copie indisponible dans ce navigateur."
          : copied
            ? "Pret pour publication."
            : ""}
      </span>
    </div>
  );
}
