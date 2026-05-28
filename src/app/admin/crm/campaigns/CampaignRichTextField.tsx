"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/app/components/rtextrich/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="rich-editor-loading">Chargement de l’éditeur…</div>
    ),
  }
);

type CampaignRichTextFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  minHeight?: number;
};

function htmlToText(value: string) {
  if (typeof window === "undefined") return "";

  const container = document.createElement("div");
  container.innerHTML = value;

  return (container.textContent || container.innerText || "").trim();
}

export default function CampaignRichTextField({
  name,
  label,
  placeholder = "Commencez à écrire…",
  defaultValue = "",
  minHeight = 220,
}: CampaignRichTextFieldProps) {
  const [value, setValue] = useState(defaultValue);

  const plainText = useMemo(() => htmlToText(value), [value]);
  const isEmpty = plainText.length === 0;

  return (
    <div className="crm-marketing-field">
      <span>{label}</span>

      <textarea
        name={name}
        value={value}
        readOnly
        required
        aria-hidden="true"
        tabIndex={-1}
        className="crm-hidden-rich-content"
      />

      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        minHeight={minHeight}
      />

      <p className={isEmpty ? "crm-rich-warning" : "crm-rich-ok"}>
        {isEmpty
          ? "Ouvrez l’éditeur, rédigez votre contenu, puis cliquez sur Appliquer."
          : `${plainText.length} caractère(s) enregistrés pour la publication.`}
      </p>
    </div>
  );
}