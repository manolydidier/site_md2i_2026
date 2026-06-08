// components/email-marketing/CampaignForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

import {
  useForm,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useGroups } from "@/app/hooks/useEmailMarketing";
import type { Campaign, CampaignFormData } from "@/app/types/email-marketing";
import { campaignSchema } from "@/app/lib/email/schemas";
import { useTheme } from "@/app/context/ThemeContext";

interface CampaignFormProps {
  campaign?: Campaign | null;
  initialHtml?: string;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
}

type PanelTab = "blocks" | "layers" | "code" | "media";
type InspectorTab = "styles" | "properties";
type Device = "desktop" | "tablet" | "mobile";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type MediaKind = "image" | "video" | "file";

type UploadItem = {
  id: string;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
  kind: MediaKind;
};

const ORANGE = "#F28C18";
const ORANGE_DARK = "#C96A08";

const EMAIL_BASE_CSS = `
/* MD2I_EMAIL_BASE */
body {
  margin: 0;
  padding: 0;
  background: #f5f7fa;
  color: #181818;
  font-family: Inter, Arial, sans-serif;
}

.email-shell {
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
}

.email-hero {
  padding: 42px 28px;
  background: linear-gradient(135deg, rgba(239,159,39,.14), rgba(239,159,39,.04));
  border-radius: 0 0 24px 24px;
}

.email-eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(239,159,39,.12);
  color: #ef9f27;
  border: 1px solid rgba(239,159,39,.22);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.email-title {
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.08;
  letter-spacing: -.04em;
}

.email-text {
  margin: 0;
  color: rgba(15,23,42,.68);
  font-size: 15px;
  line-height: 1.7;
}

.email-section {
  padding: 32px 28px;
}

.email-card {
  padding: 22px;
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15,23,42,.06);
}

.email-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 22px;
  padding: 0 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 800;
}

.email-divider {
  height: 1px;
  background: rgba(15,23,42,.10);
  margin: 24px 0;
}

.email-footer {
  padding: 24px 28px;
  color: rgba(15,23,42,.52);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
  background: #f8fafc;
}

@media (max-width: 620px) {
  .email-shell {
    width: 100% !important;
  }

  .email-section,
  .email-hero {
    padding: 26px 20px;
  }

  .email-title {
    font-size: 26px;
  }
}
`;

const DEFAULT_EMAIL_HTML = `
<div class="email-shell">
  <section class="email-hero">
    <span class="email-eyebrow">MD2I</span>
    <h1 class="email-title">Bonjour {{firstName}},</h1>
    <p class="email-text">
      Présentez ici votre message principal. Ce contenu est éditable directement dans GrapesJS.
    </p>
      <a href="#" class="email-btn">Découvrir</a>
        Ajoutez vos textes, images, liens, boutons et contenus personnalisés.
      </p>
    </div>
  </section>

  <section class="email-footer">
    Vous recevez cet email car vous êtes inscrit à notre liste.<br />
    {{email}}
  </section>
</div>
`;

const VARIABLES = ["{{firstName}}", "{{lastName}}", "{{email}}", "{{fullName}}"];

const EMAIL_SAFE_RULES = [
  'Pas de CSS externe <link rel="stylesheet"> dans le HTML envoyé.',
  'Pas de balise <script>.',
  'Pas d’animations CSS : @keyframes, animation, transition.',
  'Pas d’animations SVG : <animate>, <animateTransform>, <animateMotion>.',
  'Pas de balises <meta>, <title>, <html>, <head>, <body> dans le canvas GrapesJS.',
  'Préférer un HTML statique, léger, avec CSS simple.',
];

function sanitizeEmailHtmlForGmail(rawHtml: string) {
  return String(rawHtml || "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<animate\b[^>]*>([\s\S]*?<\/animate>)?/gi, "")
    .replace(/<animateTransform\b[^>]*>([\s\S]*?<\/animateTransform>)?/gi, "")
    .replace(/<animateMotion\b[^>]*>([\s\S]*?<\/animateMotion>)?/gi, "")
    .trim();
}

function sanitizeEmailCssForGmail(rawCss: string) {
  return String(rawCss || "")
    .replace(/@import\s+[^;]+;/gi, "")
    .replace(/@keyframes\s+[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/gi, "")
    .replace(/\banimation(?:-[a-z-]+)?\s*:[^;{}]+;?/gi, "")
    .replace(/\btransition(?:-[a-z-]+)?\s*:[^;{}]+;?/gi, "")
    .replace(/:root\s*\{(?:[^{}]|\{[^{}]*\})*\}/gi, "")
    .replace(/--[a-zA-Z0-9-_]+\s*:[^;{}]+;?/g, "")
    .trim();
}

function getEmailSafetyWarnings(html: string, css: string) {
  const warnings: string[] = [];
  const source = `${html || ""}\n${css || ""}`;

  if (/<link\b[^>]*rel=["']?stylesheet["']?/i.test(source)) {
    warnings.push(
      "CSS externe supprimé : Gmail ne charge pas les fichiers CSS externes."
    );
  }

  if (/<script\b/i.test(source)) {
    warnings.push(
      "Script supprimé : les emails ne doivent pas contenir de JavaScript."
    );
  }

  if (/<animate\b|<animateTransform\b|<animateMotion\b/i.test(source)) {
    warnings.push(
      "Animation SVG supprimée : Gmail peut bloquer ou mal rendre ces animations."
    );
  }

  if (
    /@keyframes\b|\banimation(?:-[a-z-]+)?\s*:|\btransition(?:-[a-z-]+)?\s*:/i.test(
      source
    )
  ) {
    warnings.push(
      "Animation CSS supprimée : rendu instable dans Gmail et Outlook."
    );
  }

  if (/\bdisplay\s*:\s*(flex|grid)/i.test(css)) {
    warnings.push(
      "Attention : flex/grid peut être instable dans certains clients email."
    );
  }

  if (/\bposition\s*:\s*(absolute|fixed|sticky)/i.test(css)) {
    warnings.push(
      "Attention : les positionnements complexes peuvent être instables en email."
    );
  }

  if (/\bclamp\s*\(/i.test(css)) {
    warnings.push(
      "Attention : clamp() peut être ignoré dans certains clients email."
    );
  }

  return warnings;
}

function extractHtmlAndCss(raw: string) {
  if (!raw) {
    return {
      html: DEFAULT_EMAIL_HTML,
      css: EMAIL_BASE_CSS,
    };
  }

  const css = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1])
    .join("\n\n");

  const withoutStyleAndScript = raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  const bodyMatch = withoutStyleAndScript.match(
    /<body[^>]*>([\s\S]*?)<\/body>/i
  );

  const html = bodyMatch ? bodyMatch[1].trim() : withoutStyleAndScript.trim();

  return {
    html: sanitizeEmailHtmlForGmail(html || DEFAULT_EMAIL_HTML),
    css: normalizeEmailCss(sanitizeEmailCssForGmail(css || "")),
  };
}

function normalizeEmailCss(css: string) {
  const cleanCss = sanitizeEmailCssForGmail(css?.trim() || "");

  if (cleanCss.includes("MD2I_EMAIL_BASE")) {
    return cleanCss;
  }

  return `${EMAIL_BASE_CSS}\n\n${cleanCss}`;
}

function compileEmailHtml(html: string, css: string) {
  const safeHtml = sanitizeEmailHtmlForGmail(html);
  const finalCss = normalizeEmailCss(css);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style data-md2i-email-css="true">
${finalCss}
  </style>
</head>
<body>
${safeHtml || ""}
</body>
</html>`;
}

function detectMediaKind(mimeType?: string, url?: string): MediaKind {
  const mime = String(mimeType || "").toLowerCase();
  const lowerUrl = String(url || "").toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(lowerUrl)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(lowerUrl)) return "video";

  return "file";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function CampaignForm({
  campaign,
  initialHtml,
  onSave,
  onCancel,
}: CampaignFormProps) {
  const { dark } = useTheme();
  const { groups } = useGroups();

  const isEdit = Boolean(campaign);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const gjsRef = useRef<Editor | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const initialEditorContent = useMemo(
    () => extractHtmlAndCss(campaign?.htmlContent || initialHtml || ""),
    [campaign?.htmlContent, initialHtml]
  );

  const [activeTab, setActiveTab] = useState<PanelTab | null>("blocks");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("styles");
  const [device, setDevice] = useState<Device>("desktop");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedName, setSelectedName] = useState("Aucun élément");

  const [codeHtml, setCodeHtml] = useState("");
  const [codeCss, setCodeCss] = useState("");
  const [codeNotice, setCodeNotice] = useState("");
  const [emailRulesNotice, setEmailRulesNotice] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");

  const [linkConfig, setLinkConfig] = useState({
    href: "",
    title: "",
    targetBlank: false,
    noFollow: false,
    download: false,
  });

  const [mediaItems, setMediaItems] = useState<UploadItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | MediaKind>("all");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaNotice, setMediaNotice] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    getValues,
    setValue,
    watch,
    handleSubmit,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema) as Resolver<CampaignFormData>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: campaign?.name || "",
      subject: campaign?.subject || "",
      htmlContent: campaign?.htmlContent || initialHtml || "",
      fromName:
        campaign?.fromName ||
        process.env.NEXT_PUBLIC_EMAIL_FROM_NAME ||
        "MD2I",
      fromEmail: campaign?.fromEmail || process.env.NEXT_PUBLIC_EMAIL_FROM || "",
      replyTo: campaign?.replyTo || "",

      // Ancien champ conservé pour compatibilité.
      groupId: campaign?.groupId || "",

      // Nouveau champ : plusieurs groupes.
      groupIds:
        campaign?.campaignGroups?.map((item) => item.groupId) ||
        (campaign?.groupId ? [campaign.groupId] : []),
    },
  });

  const name = watch("name");
  const subject = watch("subject");
  const fromName = watch("fromName");
  const groupIds = watch("groupIds") || [];

  const selectedGroups = groups.filter((group) => groupIds.includes(group.id));
  const selectedGroupName =
    selectedGroups.length > 0
      ? selectedGroups.map((group) => group.name).join(", ")
      : "";

  const isLeftPanelVisible = leftPanelOpen && activeTab !== null;

  const registerLive = useCallback(
    (field: keyof CampaignFormData) =>
      register(field as any, {
        onChange: async (event: { target?: { value?: string } }) => {
          const value = String(event.target?.value ?? "");

          if (value.trim()) {
            clearErrors(field as any);
          }

          await trigger(field as any);
        },
      }),
    [register, clearErrors, trigger]
  );

  const updateNameFromTopbar = async (value: string) => {
    setValue("name", value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (value.trim()) {
      clearErrors("name");
    }

    await trigger("name");
  };

  const colors = {
    shell: dark ? "#151922" : "#FFFFFF",
    shellSoft: dark ? "rgba(255,255,255,.07)" : "rgba(15,23,42,.04)",
    shellSoft2: dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.06)",
    border: dark ? "rgba(255,255,255,.13)" : "rgba(15,23,42,.10)",
    borderStrong: dark ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.14)",
    text: dark ? "#F5F7FB" : "#181818",
    textSoft: dark ? "rgba(245,247,251,.78)" : "rgba(15,23,42,.62)",
    textMute: dark ? "rgba(245,247,251,.50)" : "rgba(15,23,42,.40)",
    hover: dark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.04)",
    panel: dark ? "#1B202B" : "#FFFFFF",
    panelSoft: dark ? "#232936" : "#FBFBFC",
    canvas: dark ? "#10141C" : "#F5F7FA",
    success: "#22c55e",
    danger: "#ef4444",
    warning: "#fb923c",
    accent: ORANGE,
    accentDark: ORANGE_DARK,
    accentSoft: "rgba(242,140,24,.12)",
    accentSoftBorder: "rgba(242,140,24,.28)",
  };

const updateEmailRulesNotice = useCallback((html: string, css: string) => {
  const warnings = getEmailSafetyWarnings(html, css);

  if (warnings.length === 0) {
    setEmailRulesNotice("");
    return;
  }

  setEmailRulesNotice(warnings.join(" "));
}, []);

const getCompiledHtml = useCallback(() => {
  const editor = gjsRef.current;

  if (!editor) {
    const currentHtml = getValues("htmlContent") || "";
    const parsed = extractHtmlAndCss(currentHtml);

    updateEmailRulesNotice(parsed.html, parsed.css);

    return compileEmailHtml(parsed.html, parsed.css);
  }

  const editorHtml = editor.getHtml() || "";
  const editorCss = editor.getCss() || "";

  updateEmailRulesNotice(editorHtml, editorCss);

  return compileEmailHtml(editorHtml, editorCss);
}, [getValues, updateEmailRulesNotice]);

const syncFormHtml = useCallback(() => {
  const html = getCompiledHtml();
  const currentGroupIds = getValues("groupIds") || [];

  setValue("htmlContent", html, {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  });

  console.log("[CampaignForm] htmlContent synchronisé", {
    length: html.length,
    hasStyle: /<style[\s>]/i.test(html),
    hasBaseCss: html.includes("MD2I_EMAIL_BASE"),
    groupIds: currentGroupIds,
  });

  return html;
}, [getCompiledHtml, getValues, setValue]);

  const syncCodeFieldsSilently = useCallback(() => {
    const editor = gjsRef.current;
    if (!editor) return;

    setCodeHtml(editor.getHtml() || "");
    setCodeCss(editor.getCss() || "");
  }, []);

  const syncCodeFieldsFromEditor = useCallback(() => {
    syncCodeFieldsSilently();
    setCodeNotice("HTML / CSS synchronisés depuis le canvas.");
    setTimeout(() => setCodeNotice(""), 2200);
  }, [syncCodeFieldsSilently]);

  const getSelectedComponent = () => gjsRef.current?.getSelected() as any;

  const syncLinkConfigFromSelection = useCallback(() => {
    const selected = getSelectedComponent();

    if (!selected) {
      setLinkConfig({
        href: "",
        title: "",
        targetBlank: false,
        noFollow: false,
        download: false,
      });
      return;
    }

    const attrs = (selected.getAttributes?.() ||
      selected.get?.("attributes") ||
      {}) as Record<string, string>;

    const relValue = String(attrs.rel || "");

    setLinkConfig({
      href: String(attrs.href || ""),
      title: String(attrs.title || ""),
      targetBlank: attrs.target === "_blank",
      noFollow: relValue.includes("nofollow"),
      download: typeof attrs.download !== "undefined",
    });
  }, []);

  const updateSelectedLabel = useCallback(() => {
    const editor = gjsRef.current;
    const selected = editor?.getSelected() as any;

    if (!selected) {
      setSelectedName("Aucun élément");
      syncLinkConfigFromSelection();
      return;
    }

    const label =
      selected?.getName?.() ||
      selected?.get?.("name") ||
      selected?.get?.("tagName") ||
      selected?.get?.("type") ||
      "Élément";

    setSelectedName(String(label));
    syncLinkConfigFromSelection();
  }, [syncLinkConfigFromSelection]);

  const switchDevice = (d: Device) => {
    const map: Record<Device, string> = {
      desktop: "Desktop",
      tablet: "Tablet",
      mobile: "Mobile",
    };

    gjsRef.current?.setDevice(map[d]);
    setDevice(d);
  };

  const fetchMediaLibrary = useCallback(async () => {
    try {
      setMediaLoading(true);
      setMediaError("");

      const res = await fetch("/api/uploads?limit=200");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Impossible de charger les fichiers.");
      }

      const source = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.files)
            ? json.files
            : Array.isArray(json?.items)
              ? json.items
              : [];

      const items: UploadItem[] = source
        .map((f: any) => {
          const url = f?.url ?? f?.path ?? f?.src ?? "";
          const mimeType = f?.mimeType ?? f?.type ?? "";

          if (!url) return null;

          return {
            id: f?.id ?? f?._id ?? url,
            url,
            name:
              f?.name ??
              f?.filename ??
              f?.originalName ??
              url.split("/").pop() ??
              "file",
            mimeType,
            size: f?.size,
            createdAt: f?.createdAt,
            kind: detectMediaKind(mimeType, url),
          } as UploadItem;
        })
        .filter(Boolean) as UploadItem[];

      setMediaItems(items);

      const editor = gjsRef.current;

      if (editor) {
        items.forEach((item) => {
          if (item.kind === "image") {
            editor.AssetManager.add({
              src: item.url,
              name: item.name,
              type: "image",
            } as any);
          }
        });
      }
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Erreur de chargement."
      );
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const openTab = (tab: PanelTab) => {
    if (tab === "code") {
      syncCodeFieldsSilently();
    }

    if (tab === "media" && mediaItems.length === 0 && !mediaLoading) {
      fetchMediaLibrary();
    }

    setActiveTab(tab);
    setLeftPanelOpen(true);
  };

  const hideLeftPanel = () => {
    setLeftPanelOpen(false);
  };

  const toggleLeftPanel = () => {
    setLeftPanelOpen((prev) => !prev);
  };

  const applyCodeBundle = () => {
    const editor = gjsRef.current;
    if (!editor) return;

    try {
      const safeHtml = sanitizeEmailHtmlForGmail(codeHtml);
      const safeCss = sanitizeEmailCssForGmail(codeCss);

      updateEmailRulesNotice(codeHtml, codeCss);

      if (importMode === "replace") {
        editor.setComponents(safeHtml.trim() || `<main></main>`);
        editor.setStyle(safeCss.trim() || EMAIL_BASE_CSS);
      } else {
        if (safeHtml.trim()) editor.addComponents(safeHtml);

        if (safeCss.trim()) {
          const currentCss = editor.getCss() || "";
          editor.setStyle(`${currentCss}

${safeCss}`);
        }
      }

      syncFormHtml();
      setCodeNotice(
        "Code importé dans l'éditeur. Les règles email-safe ont été appliquées."
      );
      setTimeout(() => setCodeNotice(""), 2500);
    } catch (error) {
      console.error(error);
      setCodeNotice("Erreur pendant l'import du code.");
      setTimeout(() => setCodeNotice(""), 2500);
    }
  };

  const applyLinkToSelected = () => {
    const selected = getSelectedComponent();

    if (!selected) {
      setInspectorTab("properties");
      setCodeNotice("Sélectionne un élément avant d'ajouter un lien.");
      setTimeout(() => setCodeNotice(""), 2400);
      return;
    }

    const href = linkConfig.href.trim() || "#";

    const currentAttrs = {
      ...(selected.getAttributes?.() || selected.get?.("attributes") || {}),
    } as Record<string, string>;

    const relParts = new Set<string>();

    if (linkConfig.targetBlank) {
      relParts.add("noopener");
      relParts.add("noreferrer");
    }

    if (linkConfig.noFollow) relParts.add("nofollow");

    const nextAttrs: Record<string, string> = {
      ...currentAttrs,
      href,
    };

    if (linkConfig.title.trim()) nextAttrs.title = linkConfig.title.trim();
    else delete nextAttrs.title;

    if (linkConfig.targetBlank) nextAttrs.target = "_blank";
    else delete nextAttrs.target;

    if (relParts.size) nextAttrs.rel = Array.from(relParts).join(" ");
    else delete nextAttrs.rel;

    if (linkConfig.download) nextAttrs.download = linkConfig.title.trim() || "";
    else delete nextAttrs.download;

    selected.set?.("tagName", "a");
    selected.addAttributes?.(nextAttrs);
    selected.addStyle({ cursor: "pointer" });

    setInspectorTab("properties");
    setCodeNotice("Sélection rendue cliquable.");
    setTimeout(() => setCodeNotice(""), 2400);
    syncLinkConfigFromSelection();
    syncFormHtml();
  };

  const removeLinkFromSelected = () => {
    const selected = getSelectedComponent();

    if (!selected) {
      setInspectorTab("properties");
      return;
    }

    const nextAttrs = {
      ...(selected.getAttributes?.() || selected.get?.("attributes") || {}),
    } as Record<string, string>;

    delete nextAttrs.href;
    delete nextAttrs.target;
    delete nextAttrs.rel;
    delete nextAttrs.download;

    selected.addAttributes?.(nextAttrs);
    selected.addStyle({ cursor: "" });

    setLinkConfig((prev) => ({
      ...prev,
      href: "",
      targetBlank: false,
      noFollow: false,
      download: false,
    }));

    setCodeNotice("Lien retiré de la sélection.");
    setTimeout(() => setCodeNotice(""), 2400);
    syncFormHtml();
  };

  const handleMediaUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    try {
      setUploadingMedia(true);
      setMediaError("");
      setMediaNotice("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Échec de l'upload.");
      }

      const payload = json?.data ?? json;
      const url = payload?.url ?? payload?.path ?? payload?.src;

      if (!url) {
        throw new Error("URL de fichier absente dans la réponse.");
      }

      const item: UploadItem = {
        id: payload?.id ?? payload?._id ?? url,
        url,
        name:
          payload?.name ??
          payload?.filename ??
          payload?.originalName ??
          file.name,
        mimeType: payload?.mimeType ?? payload?.type ?? file.type,
        size: payload?.size ?? file.size,
        createdAt: payload?.createdAt ?? new Date().toISOString(),
        kind: detectMediaKind(payload?.mimeType ?? payload?.type ?? file.type, url),
      };

      setMediaItems((prev) => [item, ...prev]);

      if (item.kind === "image") {
        gjsRef.current?.AssetManager.add({
          src: item.url,
          name: item.name,
          type: "image",
        } as any);
      }

      setMediaNotice("Fichier uploadé.");
      setTimeout(() => setMediaNotice(""), 2200);
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Erreur pendant l'upload."
      );
    } finally {
      setUploadingMedia(false);

      if (mediaInputRef.current) {
        mediaInputRef.current.value = "";
      }
    }
  }, []);

  const insertMediaIntoEditor = useCallback(
    (item: UploadItem) => {
      const editor = gjsRef.current;
      if (!editor) return;

      const safeUrl = escapeHtml(item.url);
      const safeName = escapeHtml(item.name);

      if (item.kind === "image") {
        editor.addComponents(`
        <img src="${safeUrl}" alt="${safeName}" style="max-width:100%;height:auto;display:block;border-radius:16px;" />
      `);
        syncFormHtml();
        return;
      }

      if (item.kind === "video") {
        editor.addComponents(`
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:${ORANGE};text-decoration:none;font-weight:700;">
          Voir la vidéo : ${safeName}
        </a>
      `);
        syncFormHtml();
        return;
      }

      editor.addComponents(`
      <a href="${safeUrl}" download="${safeName}" style="color:${ORANGE};text-decoration:none;font-weight:700;">
        Télécharger ${safeName}
      </a>
    `);

      syncFormHtml();
    },
    [syncFormHtml]
  );

  const filteredMediaItems = mediaItems.filter((item) => {
    const okSearch = item.name.toLowerCase().includes(mediaSearch.toLowerCase());
    const okFilter = mediaFilter === "all" ? true : item.kind === mediaFilter;
    return okSearch && okFilter;
  });

  const insertVariable = (variable: string) => {
    gjsRef.current?.addComponents(variable);
    syncFormHtml();
  };

  const undo = () => gjsRef.current?.UndoManager.undo();
  const redo = () => gjsRef.current?.UndoManager.redo();
  const preview = () => gjsRef.current?.runCommand("preview");
  const fullscr = () => gjsRef.current?.runCommand("fullscreen");

  const cleanHtml = () => {
    if (!confirm("Vider le contenu de la campagne ?")) return;

    gjsRef.current?.setComponents("");
    syncFormHtml();
  };

  const openPreviewModal = () => {
    setPreviewHtml(syncFormHtml());
    setPreviewOpen(true);
  };

const handleSave = async (data: CampaignFormData) => {
  const compiledHtmlContent = getCompiledHtml();

  setValue("htmlContent", compiledHtmlContent, {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  });

  const currentGroupIds = getValues("groupIds") || [];

  const cleanGroupIds = Array.from(
    new Set(currentGroupIds.filter(Boolean))
  );

  const payload: CampaignFormData = {
    ...data,

    // IMPORTANT :
    // On force toujours le HTML compilé depuis GrapesJS.
    // On ne reprend jamais data.htmlContent ici, car il peut être ancien.
    htmlContent: compiledHtmlContent,

    // Nouveau système multi-groupes.
    groupIds: cleanGroupIds,

    // Compatibilité ancien groupId.
    groupId: cleanGroupIds[0] || data.groupId || "",
  };

  console.log("[CampaignForm] payload sauvegarde", {
    name: payload.name,
    groupId: payload.groupId,
    groupIds: payload.groupIds,
    htmlLength: payload.htmlContent?.length || 0,
    hasStyle: /<style[\s>]/i.test(payload.htmlContent || ""),
    hasBaseCss: payload.htmlContent?.includes("MD2I_EMAIL_BASE"),
  });

  if (!payload.htmlContent || !/<style[\s>]/i.test(payload.htmlContent)) {
    alert("Erreur : le CSS n'a pas été compilé dans le HTML.");
    return;
  }

  setSaveStatus("saving");

  try {
    const url =
      isEdit && campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns";

    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const saved = text ? JSON.parse(text) : null;

    if (!res.ok) {
      console.error("[CampaignForm] erreur sauvegarde", {
        status: res.status,
        response: saved,
      });

      throw new Error(
        typeof saved?.error === "string"
          ? saved.error
          : "Erreur serveur"
      );
    }

    console.log("[CampaignForm] sauvegarde OK", {
      id: saved?.id,
      htmlLength: saved?.htmlContent?.length || 0,
      hasStyle: /<style[\s>]/i.test(saved?.htmlContent || ""),
      hasBaseCss: saved?.htmlContent?.includes("MD2I_EMAIL_BASE"),
    });

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2600);

    onSave(saved);
  } catch (error) {
    setSaveStatus("error");
    setTimeout(() => setSaveStatus("idle"), 4000);

    alert(error instanceof Error ? error.message : "Erreur de sauvegarde");
  }
};

  const submitCampaign = () => {
    void handleSubmit(handleSave)();
  };

  const sendTestEmail = async () => {
    const htmlContent = syncFormHtml();
    const values = getValues();

    if (!campaign?.id) {
      alert("Sauvegardez d'abord la campagne avant d'envoyer un test.");
      return;
    }

    if (!testEmail.trim()) {
      alert("Entrez un email de test.");
      return;
    }

    setTestLoading(true);
    setTestMessage(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmail.trim(),
          subject: values.subject,
          htmlContent,
          fromName: values.fromName,
          fromEmail: values.fromEmail,
          replyTo: values.replyTo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestMessage({
          type: "error",
          text: data.error || "Erreur envoi",
        });
        return;
      }

      setTestMessage({
        type: "success",
        text: data.message || `Email de test envoyé à ${testEmail}`,
      });
    } catch (error) {
      setTestMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur réseau",
      });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    if (!mountRef.current || gjsRef.current) return;

    let cancelled = false;

    (async () => {
      const [
        { default: gjsPreset },
        { default: gjsBlocks },
        { default: gjsForms },
        { default: gjsNavbar },
        { default: gjsCustomCode },
      ] = await Promise.all([
        import("grapesjs-preset-webpage"),
        import("grapesjs-blocks-basic"),
        import("grapesjs-plugin-forms"),
        import("grapesjs-navbar"),
        import("grapesjs-custom-code"),
      ]);

      if (cancelled || !mountRef.current) return;

      const editor = grapesjs.init({
        container: mountRef.current,
        height: "100%",
        width: "100%",
        fromElement: false,
        storageManager: false,

        plugins: [gjsPreset, gjsBlocks, gjsForms, gjsNavbar, gjsCustomCode],
        pluginsOpts: {
          "grapesjs-preset-webpage": {
            modalImportTitle: "Importer du HTML",
          },
          "grapesjs-blocks-basic": {
            flexGrid: true,
            blocks: [
              "column1",
              "column2",
              "column3",
              "column3-7",
              "text",
              "link",
              "image",
              "video",
              "map",
            ],
          },
        },

        panels: { defaults: [] },

        deviceManager: {
          devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },

        canvas: {
          styles: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
          ],
        },

        blockManager: { appendTo: "#ed-blocks" },
        layerManager: { appendTo: "#ed-layers" },
        traitManager: { appendTo: "#ed-traits" },
        selectorManager: { appendTo: "#ed-style-selectors" },

        styleManager: {
          appendTo: "#ed-styles-fields",
          sectors: [
            {
              id: "typography",
              name: "Texte",
              open: true,
              properties: [
                {
                  name: "Taille police",
                  property: "font-size",
                  type: "integer" as any,
                  units: ["px", "em", "rem", "%", "vw"],
                  unit: "px",
                  min: 1,
                  max: 200,
                },
                {
                  name: "Graisse",
                  property: "font-weight",
                  type: "select" as any,
                  options: [
                    { id: "300", label: "Light 300" },
                    { id: "400", label: "Normal 400" },
                    { id: "500", label: "Medium 500" },
                    { id: "600", label: "Semibold 600" },
                    { id: "700", label: "Bold 700" },
                    { id: "800", label: "Extrabold 800" },
                    { id: "900", label: "Black 900" },
                  ],
                },
                {
                  name: "Hauteur de ligne",
                  property: "line-height",
                  type: "integer" as any,
                  units: ["", "px", "em"],
                  unit: "",
                  min: 1,
                  max: 5,
                  step: 0.05,
                },
                {
                  name: "Espacement lettres",
                  property: "letter-spacing",
                  type: "integer" as any,
                  units: ["px", "em"],
                  unit: "px",
                  min: -10,
                  max: 50,
                },
                {
                  name: "Couleur texte",
                  property: "color",
                  type: "color" as any,
                },
                {
                  name: "Alignement",
                  property: "text-align",
                  type: "radio" as any,
                  options: [
                    { id: "left", label: "←" },
                    { id: "center", label: "↔" },
                    { id: "right", label: "→" },
                    { id: "justify", label: "≡" },
                  ],
                },
                {
                  name: "Décoration",
                  property: "text-decoration",
                  type: "select" as any,
                  options: [
                    { id: "none", label: "Aucune" },
                    { id: "underline", label: "Souligné" },
                    { id: "line-through", label: "Barré" },
                    { id: "overline", label: "Au-dessus" },
                  ],
                },
                {
                  name: "Transformation",
                  property: "text-transform",
                  type: "select" as any,
                  options: [
                    { id: "none", label: "Aucune" },
                    { id: "uppercase", label: "MAJUSCULES" },
                    { id: "lowercase", label: "minuscules" },
                    { id: "capitalize", label: "Capitalize" },
                  ],
                },
                {
                  name: "Famille police",
                  property: "font-family",
                  type: "select" as any,
                  options: [
                    { id: "Inter, Arial, sans-serif", label: "Inter" },
                    { id: "Arial, Helvetica, sans-serif", label: "Arial" },
                    { id: "Georgia, serif", label: "Georgia" },
                    { id: "system-ui, sans-serif", label: "System UI" },
                    { id: "ui-monospace, monospace", label: "Monospace" },
                  ],
                },
              ],
            },
            {
              id: "background",
              name: "Arrière-plan",
              open: false,
              properties: [
                {
                  name: "Couleur de fond",
                  property: "background-color",
                  type: "color" as any,
                },
                {
                  name: "Image de fond",
                  property: "background-image",
                  type: "base" as any,
                },
                {
                  name: "Taille fond",
                  property: "background-size",
                  type: "select" as any,
                  options: [
                    { id: "auto", label: "Auto" },
                    { id: "cover", label: "Cover" },
                    { id: "contain", label: "Contain" },
                  ],
                },
                {
                  name: "Position fond",
                  property: "background-position",
                  type: "select" as any,
                  options: [
                    { id: "center", label: "Centre" },
                    { id: "top", label: "Haut" },
                    { id: "bottom", label: "Bas" },
                    { id: "left", label: "Gauche" },
                    { id: "right", label: "Droite" },
                  ],
                },
                {
                  name: "Répétition fond",
                  property: "background-repeat",
                  type: "select" as any,
                  options: [
                    { id: "no-repeat", label: "Aucune" },
                    { id: "repeat", label: "Répéter" },
                    { id: "repeat-x", label: "Horizontal" },
                    { id: "repeat-y", label: "Vertical" },
                  ],
                },
              ],
            },
            {
              id: "border",
              name: "Bordure & coins",
              open: false,
              properties: [
                {
                  name: "Couleur bordure",
                  property: "border-color",
                  type: "color" as any,
                },
                {
                  name: "Épaisseur bordure",
                  property: "border-width",
                  type: "integer" as any,
                  units: ["px"],
                  unit: "px",
                  min: 0,
                  max: 30,
                },
                {
                  name: "Style bordure",
                  property: "border-style",
                  type: "select" as any,
                  options: [
                    { id: "none", label: "Aucune" },
                    { id: "solid", label: "Solide" },
                    { id: "dashed", label: "Tirets" },
                    { id: "dotted", label: "Points" },
                    { id: "double", label: "Double" },
                  ],
                },
                {
                  name: "Rayon global",
                  property: "border-radius",
                  type: "integer" as any,
                  units: ["px", "%"],
                  unit: "px",
                  min: 0,
                  max: 999,
                },
              ],
            },
            {
              id: "dimensions",
              name: "Dimensions",
              open: false,
              properties: [
                {
                  name: "Largeur",
                  property: "width",
                  type: "integer" as any,
                  units: ["px", "%", "vw", "em", "rem", "auto"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
                {
                  name: "Hauteur",
                  property: "height",
                  type: "integer" as any,
                  units: ["px", "%", "vh", "em", "rem", "auto"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
                {
                  name: "Larg. max",
                  property: "max-width",
                  type: "integer" as any,
                  units: ["px", "%", "vw", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
              ],
            },
            {
              id: "spacing",
              name: "Espacement",
              open: false,
              properties: [
                {
                  name: "Margin haut",
                  property: "margin-top",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem", "auto"],
                  unit: "px",
                  min: -500,
                  max: 500,
                },
                {
                  name: "Margin droite",
                  property: "margin-right",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem", "auto"],
                  unit: "px",
                  min: -500,
                  max: 500,
                },
                {
                  name: "Margin bas",
                  property: "margin-bottom",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem", "auto"],
                  unit: "px",
                  min: -500,
                  max: 500,
                },
                {
                  name: "Margin gauche",
                  property: "margin-left",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem", "auto"],
                  unit: "px",
                  min: -500,
                  max: 500,
                },
                {
                  name: "Padding haut",
                  property: "padding-top",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 500,
                },
                {
                  name: "Padding droite",
                  property: "padding-right",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 500,
                },
                {
                  name: "Padding bas",
                  property: "padding-bottom",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 500,
                },
                {
                  name: "Padding gauche",
                  property: "padding-left",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 500,
                },
              ],
            },
            {
              id: "layout",
              name: "Disposition",
              open: false,
              properties: [
                {
                  name: "Display",
                  property: "display",
                  type: "select" as any,
                  options: [
                    { id: "block", label: "Block" },
                    { id: "inline-block", label: "Inline-block" },
                    { id: "inline", label: "Inline" },
                    { id: "flex", label: "Flex" },
                    { id: "inline-flex", label: "Inline-flex" },
                    { id: "grid", label: "Grid" },
                    { id: "none", label: "Masqué" },
                  ],
                },
                {
                  name: "Position",
                  property: "position",
                  type: "select" as any,
                  options: [
                    { id: "static", label: "Static" },
                    { id: "relative", label: "Relative" },
                    { id: "absolute", label: "Absolute" },
                    { id: "fixed", label: "Fixed" },
                    { id: "sticky", label: "Sticky" },
                  ],
                },
                {
                  name: "Overflow",
                  property: "overflow",
                  type: "select" as any,
                  options: [
                    { id: "visible", label: "Visible" },
                    { id: "hidden", label: "Caché" },
                    { id: "scroll", label: "Scroll" },
                    { id: "auto", label: "Auto" },
                  ],
                },
              ],
            },
            {
              id: "flexgrid",
              name: "Flex / Grid",
              open: false,
              properties: [
                {
                  name: "Direction flex",
                  property: "flex-direction",
                  type: "select" as any,
                  options: [
                    { id: "row", label: "Row" },
                    { id: "row-reverse", label: "Row reverse" },
                    { id: "column", label: "Column" },
                    { id: "column-reverse", label: "Column reverse" },
                  ],
                },
                {
                  name: "Justify content",
                  property: "justify-content",
                  type: "select" as any,
                  options: [
                    { id: "flex-start", label: "Début" },
                    { id: "center", label: "Centre" },
                    { id: "flex-end", label: "Fin" },
                    { id: "space-between", label: "Space-between" },
                    { id: "space-around", label: "Space-around" },
                    { id: "space-evenly", label: "Space-evenly" },
                  ],
                },
                {
                  name: "Align items",
                  property: "align-items",
                  type: "select" as any,
                  options: [
                    { id: "stretch", label: "Stretch" },
                    { id: "flex-start", label: "Début" },
                    { id: "center", label: "Centre" },
                    { id: "flex-end", label: "Fin" },
                    { id: "baseline", label: "Baseline" },
                  ],
                },
                {
                  name: "Gap",
                  property: "gap",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                },
              ],
            },
            {
              id: "effects",
              name: "Effets",
              open: false,
              properties: [
                {
                  name: "Opacité",
                  property: "opacity",
                  type: "slider" as any,
                  min: 0,
                  max: 1,
                  step: 0.01,
                },
                {
                  name: "Ombre boîte",
                  property: "box-shadow",
                  type: "base" as any,
                },
                {
                  name: "Filtre",
                  property: "filter",
                  type: "base" as any,
                },
              ],
            },
          ],
        },
      });

      gjsRef.current = editor;

      editor.setComponents(initialEditorContent.html);
      editor.setStyle(initialEditorContent.css);

      editor.on("load", () => {
        setIsReady(true);
        syncCodeFieldsSilently();
        updateSelectedLabel();
        syncFormHtml();
      });

      editor.on("component:selected", updateSelectedLabel);
      editor.on("component:deselected", updateSelectedLabel);
      editor.on("component:update", () => {
        updateSelectedLabel();
        syncFormHtml();
      });

      editor.on("style:change", () => {
        syncFormHtml();
      });

      (window as any).grapeJsEditor = editor;
      (window as any).emailCampaignEditor = editor;
    })();

    return () => {
      cancelled = true;

      if ((window as any).grapeJsEditor) {
        delete (window as any).grapeJsEditor;
      }

      if ((window as any).emailCampaignEditor) {
        delete (window as any).emailCampaignEditor;
      }

      gjsRef.current?.destroy();
      gjsRef.current = null;
    };
  }, [
    initialEditorContent.css,
    initialEditorContent.html,
    syncCodeFieldsSilently,
    syncFormHtml,
    updateSelectedLabel,
  ]);

  useEffect(() => {
    if (activeTab === "media" && mediaItems.length === 0 && !mediaLoading) {
      fetchMediaLibrary();
    }
  }, [activeTab, fetchMediaLibrary, mediaItems.length, mediaLoading]);

  return (
    <>
      <div className="ed-root">
        <header className="ed-topbar">
          <div className="ed-topbar__left">
            <button
              type="button"
              className="ed-icon-btn"
              onClick={onCancel}
              title="Retour"
            >
              ←
            </button>

            <input
              className="ed-title-input"
              placeholder="Nom de la campagne…"
              value={name || ""}
              onChange={(e) => {
                void updateNameFromTopbar(e.target.value);
              }}
            />

            <span className="ed-badge">
              {isEdit ? "Édition" : "Brouillon"}
            </span>
          </div>

          <div className="ed-topbar__center">
            <div className="ed-device-row">
              {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`ed-device-btn ${device === d ? "is-active" : ""}`}
                  onClick={() => switchDevice(d)}
                  title={d}
                >
                  {d === "desktop" ? "▣" : d === "tablet" ? "▤" : "▯"}
                </button>
              ))}
            </div>

            <div className="ed-divider" />

            <button type="button" className="ed-icon-btn" onClick={undo}>
              ↶
            </button>

            <button type="button" className="ed-icon-btn" onClick={redo}>
              ↷
            </button>

            <div className="ed-divider" />

            <button type="button" className="ed-icon-btn" onClick={preview}>
              👁
            </button>

            <button
              type="button"
              className="ed-icon-btn"
              onClick={openPreviewModal}
            >
              ✉
            </button>

            <button type="button" className="ed-icon-btn" onClick={fullscr}>
              ⛶
            </button>

            <button type="button" className="ed-icon-btn" onClick={cleanHtml}>
              🗑
            </button>
          </div>

          <div className="ed-topbar__right">
            {saveStatus !== "idle" && (
              <span className={`ed-save-tag ed-save-tag--${saveStatus}`}>
                {saveStatus === "saving" && "Sauvegarde…"}
                {saveStatus === "saved" && "✓ Sauvegardé"}
                {saveStatus === "error" && "✗ Erreur"}
              </span>
            )}

            <button
              type="button"
              className="ed-btn ed-btn--ghost"
              onClick={() => setSidebarOpen(true)}
            >
              Paramètres
            </button>

            <button
              type="button"
              className="ed-btn ed-btn--secondary"
              onClick={onCancel}
            >
              Annuler
            </button>

            <button
              type="button"
              className="ed-btn ed-btn--primary"
              onClick={submitCampaign}
              disabled={saveStatus === "saving" || !isReady}
            >
              {isEdit ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </header>

        <div className={`ed-body ${isLeftPanelVisible ? "" : "is-left-panel-collapsed"}`}>
          <aside className="ed-left-rail">
            <div className="ed-left-rail__top">
              <button
                type="button"
                className={`ed-rail-code ${activeTab === "code" && isLeftPanelVisible ? "is-active" : ""}`}
                onClick={() => openTab("code")}
                title="Code HTML / CSS"
              >
                <span>{"</>"}</span>
                <small>Code</small>
              </button>

              <button
                type="button"
                className={`ed-rail-btn ed-rail-toggle ${isLeftPanelVisible ? "is-active" : ""}`}
                onClick={toggleLeftPanel}
                title={isLeftPanelVisible ? "Masquer le panneau" : "Afficher le panneau"}
              >
                {isLeftPanelVisible ? "⇤" : "⇥"}
              </button>
            </div>

            <div className="ed-rail-stack">
              <button
                type="button"
                className={`ed-rail-btn ${activeTab === "blocks" && isLeftPanelVisible ? "is-active" : ""}`}
                onClick={() => openTab("blocks")}
                title="Blocs"
              >
                ▦
              </button>

              <button
                type="button"
                className={`ed-rail-btn ${activeTab === "layers" && isLeftPanelVisible ? "is-active" : ""}`}
                onClick={() => openTab("layers")}
                title="Calques"
              >
                ⧉
              </button>

              <button
                type="button"
                className={`ed-rail-btn ${activeTab === "media" && isLeftPanelVisible ? "is-active" : ""}`}
                onClick={() => openTab("media")}
                title="Média"
              >
                🖼
              </button>
            </div>

            <div className="ed-rail-bottom">
              <button
                type="button"
                className="ed-rail-btn"
                onClick={() => setSidebarOpen(true)}
                title="Paramètres"
              >
                ⚙
              </button>
            </div>
          </aside>

          <aside className={`ed-left-panel ${isLeftPanelVisible ? "is-open" : "is-hidden"}`}>
            <div className={`ed-panel-section ${activeTab === "blocks" ? "" : "is-panel-hidden"}`}>
              <div className="ed-panel-head">
                <div>
                  <h2>Blocs</h2>
                  <p>Texte, images, liens, colonnes et éléments de base</p>
                </div>

                <button
                  type="button"
                  className="ed-panel-close"
                  onClick={hideLeftPanel}
                  title="Masquer le panneau"
                >
                  ×
                </button>
              </div>

              <div id="ed-blocks" className="ed-blocks-host" />
            </div>

            <div className={`ed-panel-section ${activeTab === "layers" ? "" : "is-panel-hidden"}`}>
              <div className="ed-panel-head">
                <div>
                  <h2>Calques</h2>
                  <p>Structure de l’email</p>
                </div>

                <button
                  type="button"
                  className="ed-panel-close"
                  onClick={hideLeftPanel}
                  title="Masquer le panneau"
                >
                  ×
                </button>
              </div>

              <div id="ed-layers" className="ed-manager-host" />
            </div>

            <div className={`ed-panel-section ${activeTab === "code" ? "" : "is-panel-hidden"}`}>
              <div className="ed-panel-head">
                <div>
                  <h2>Code</h2>
                  <p>Importer ou modifier HTML / CSS</p>
                </div>

                <button
                  type="button"
                  className="ed-panel-close"
                  onClick={hideLeftPanel}
                  title="Masquer le panneau"
                >
                  ×
                </button>
              </div>

              <div className="ed-code-panel">
                <div className="ed-code-card">
                  <div className="ed-code-toolbar">
                    <button
                      type="button"
                      className="ed-code-sync"
                      onClick={syncCodeFieldsFromEditor}
                    >
                      Synchroniser
                    </button>

                    <div className="ed-switch">
                      <button
                        type="button"
                        className={`ed-switch-btn ${importMode === "append" ? "is-active" : ""}`}
                        onClick={() => setImportMode("append")}
                      >
                        Ajouter
                      </button>

                      <button
                        type="button"
                        className={`ed-switch-btn ${importMode === "replace" ? "is-active" : ""}`}
                        onClick={() => setImportMode("replace")}
                      >
                        Remplacer
                      </button>
                    </div>
                  </div>

                  <div className="ed-email-rules-box">
                    <strong>Règles Gmail / email-safe</strong>
                    <ul>
                      {EMAIL_SAFE_RULES.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ed-code-field">
                    <label>HTML</label>
                    <textarea
                      value={codeHtml}
                      onChange={(e) => setCodeHtml(e.target.value)}
                      placeholder="<section>...</section>"
                      rows={12}
                    />
                  </div>

                  <div className="ed-code-field">
                    <label>CSS</label>
                    <textarea
                      value={codeCss}
                      onChange={(e) => setCodeCss(e.target.value)}
                      placeholder="body { margin: 0; }"
                      rows={12}
                    />
                  </div>

                  <div className="ed-code-actions">
                    <button
                      type="button"
                      className="ed-code-primary"
                      onClick={applyCodeBundle}
                    >
                      Appliquer le code
                    </button>

                    <button
                      type="button"
                      className="ed-code-secondary"
                      onClick={() => {
                        setCodeHtml("");
                        setCodeCss("");
                        setCodeNotice("");
                      }}
                    >
                      Vider
                    </button>
                  </div>

                  {codeNotice && <p className="ed-code-notice">{codeNotice}</p>}

                  {emailRulesNotice && (
                    <p className="ed-code-warning">
                      Règles email appliquées : {emailRulesNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={`ed-panel-section ${activeTab === "media" ? "" : "is-panel-hidden"}`}>
              <div className="ed-panel-head">
                <div>
                  <h2>Média</h2>
                  <p>Images et fichiers</p>
                </div>

                <button
                  type="button"
                  className="ed-panel-close"
                  onClick={hideLeftPanel}
                  title="Masquer le panneau"
                >
                  ×
                </button>
              </div>

              <div className="ed-media-panel">
                <input
                  ref={mediaInputRef}
                  type="file"
                  hidden
                  onChange={(e) => handleMediaUpload(e.target.files?.[0] || null)}
                />

                <button
                  type="button"
                  className="ed-media-upload"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                >
                  <span>＋</span>
                  {uploadingMedia ? "Upload…" : "Uploader un fichier"}
                </button>

                <div className="ed-media-filters">
                  <input
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Rechercher…"
                  />

                  <select
                    value={mediaFilter}
                    onChange={(e) =>
                      setMediaFilter(e.target.value as "all" | MediaKind)
                    }
                  >
                    <option value="all">Tous</option>
                    <option value="image">Images</option>
                    <option value="video">Vidéos</option>
                    <option value="file">Fichiers</option>
                  </select>
                </div>

                {mediaLoading && <p className="ed-media-state">Chargement…</p>}
                {mediaError && <p className="ed-media-error">{mediaError}</p>}
                {mediaNotice && <p className="ed-media-notice">{mediaNotice}</p>}

                <div className="ed-media-grid">
                  {filteredMediaItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ed-media-item"
                      onClick={() => insertMediaIntoEditor(item)}
                      title={item.name}
                    >
                      {item.kind === "image" ? (
                        <img src={item.url} alt={item.name} />
                      ) : (
                        <span className="ed-media-file">📎</span>
                      )}

                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="ed-canvas-area">
            <div className="ed-canvas-top">
              <div>
                <span className="ed-canvas-kicker">Campagne email</span>
                <strong>{subject || "Sujet non renseigné"}</strong>
              </div>

              <div className="ed-vars">
                {VARIABLES.map((v) => (
                  <button key={v} type="button" onClick={() => insertVariable(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="ed-canvas-card">
              <div ref={mountRef} className="ed-canvas-mount" />

              {!isReady && (
                <div className="ed-loading">
                  <div className="ed-spinner" />
                  <p>Chargement de GrapesJS…</p>
                </div>
              )}
            </div>
          </main>

          <aside className="ed-inspector">
            <div className="ed-inspector-head">
              <div>
                <span>Inspecteur</span>
                <strong>{selectedName}</strong>
              </div>

              <div className="ed-inspector-tabs">
                <button
                  type="button"
                  className={inspectorTab === "styles" ? "is-active" : ""}
                  onClick={() => setInspectorTab("styles")}
                >
                  Styles
                </button>

                <button
                  type="button"
                  className={inspectorTab === "properties" ? "is-active" : ""}
                  onClick={() => setInspectorTab("properties")}
                >
                  Propriétés
                </button>
              </div>
            </div>

            <div
              className={`ed-inspector-body ${
                inspectorTab === "styles" ? "" : "is-panel-hidden"
              }`}
            >
              <div id="ed-style-selectors" className="ed-selectors-host" />
              <div id="ed-styles-fields" className="ed-styles-host" />
            </div>

            <div
              className={`ed-inspector-body ${
                inspectorTab === "properties" ? "" : "is-panel-hidden"
              }`}
            >
              <div className="ed-link-card">
                <div className="ed-link-card__head">
                  <h3 className="ed-link-card__title">Lien rapide</h3>
                  <p className="ed-link-card__subtitle">
                    Rends n&apos;importe quel élément cliquable.
                  </p>
                </div>

                <div className="ed-link-field">
                  <label>URL / ancre</label>
                  <input
                    value={linkConfig.href}
                    onChange={(e) =>
                      setLinkConfig((prev) => ({
                        ...prev,
                        href: e.target.value,
                      }))
                    }
                    placeholder="https://... ou #section"
                  />
                </div>

                <div className="ed-link-field">
                  <label>Titre du lien</label>
                  <input
                    value={linkConfig.title}
                    onChange={(e) =>
                      setLinkConfig((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Texte d'aide facultatif"
                  />
                </div>

                <label className="ed-link-check">
                  <input
                    type="checkbox"
                    checked={linkConfig.targetBlank}
                    onChange={(e) =>
                      setLinkConfig((prev) => ({
                        ...prev,
                        targetBlank: e.target.checked,
                      }))
                    }
                  />
                  <span>Ouvrir dans un nouvel onglet</span>
                </label>

                <label className="ed-link-check">
                  <input
                    type="checkbox"
                    checked={linkConfig.noFollow}
                    onChange={(e) =>
                      setLinkConfig((prev) => ({
                        ...prev,
                        noFollow: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    Ajouter <code>nofollow</code>
                  </span>
                </label>

                <label className="ed-link-check">
                  <input
                    type="checkbox"
                    checked={linkConfig.download}
                    onChange={(e) =>
                      setLinkConfig((prev) => ({
                        ...prev,
                        download: e.target.checked,
                      }))
                    }
                  />
                  <span>Forcer le téléchargement</span>
                </label>

                <div className="ed-link-actions">
                  <button
                    type="button"
                    className="ed-link-primary"
                    onClick={applyLinkToSelected}
                  >
                    Rendre cliquable
                  </button>

                  <button
                    type="button"
                    className="ed-link-secondary"
                    onClick={removeLinkFromSelected}
                  >
                    Retirer le lien
                  </button>
                </div>

                <p className="ed-link-help">
                  Sélectionne un texte, une image, un bouton ou une carte.
                </p>
              </div>

              <div id="ed-traits" className="ed-props-host" />
            </div>
          </aside>
        </div>
      </div>

      <CampaignSettingsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        registerLive={registerLive}
        errors={errors}
        groups={groups}
        groupIds={groupIds}
        setValue={setValue}
        name={name}
        subject={subject}
        fromName={fromName}
        selectedGroupName={selectedGroupName}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        testLoading={testLoading}
        testMessage={testMessage}
        sendTestEmail={sendTestEmail}
        isEdit={isEdit}
        handleSave={submitCampaign}
      />

      {previewOpen && (
        <div className="preview-backdrop">
          <div className="preview-modal">
            <div className="preview-head">
              <div>
                <h3>Prévisualisation email</h3>
                <p>HTML final compilé depuis GrapesJS.</p>
              </div>

              <button
                type="button"
                className="ed-icon-btn"
                onClick={() => setPreviewOpen(false)}
              >
                ✕
              </button>
            </div>

            <iframe
              title="Prévisualisation campagne"
              srcDoc={previewHtml}
              className="preview-frame"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        *, *::before, *::after {
          box-sizing: border-box;
        }

        :root {
          --ed-shell: ${colors.shell};
          --ed-shell-soft: ${colors.shellSoft};
          --ed-shell-soft-2: ${colors.shellSoft2};
          --ed-panel: ${colors.panel};
          --ed-panel-soft: ${colors.panelSoft};
          --ed-border: ${colors.border};
          --ed-border-strong: ${colors.borderStrong};
          --ed-text: ${colors.text};
          --ed-text-soft: ${colors.textSoft};
          --ed-text-mute: ${colors.textMute};
          --ed-hover: ${colors.hover};
          --ed-accent: ${colors.accent};
          --ed-accent-dark: ${colors.accentDark};
          --ed-accent-soft: ${colors.accentSoft};
          --ed-accent-soft-border: ${colors.accentSoftBorder};
          --ed-success: ${colors.success};
          --ed-danger: ${colors.danger};
          --ed-warning: ${colors.warning};
          --ed-canvas: ${colors.canvas};
          --shadow-sm: ${dark ? "0 1px 2px rgba(0,0,0,.28)" : "0 1px 2px rgba(15,23,42,.06)"};
          --shadow-md: ${dark ? "0 10px 24px rgba(0,0,0,.28)" : "0 8px 20px rgba(15,23,42,.08)"};
          --shadow-lg: ${dark ? "0 18px 44px rgba(0,0,0,.45)" : "0 18px 50px rgba(15,23,42,.12)"};
          --font: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        html,
        body {
          font-family: var(--font);
        }

        .ed-root {
          width: 100%;
          height: 100vh;
          min-height: 760px;
          background: var(--ed-canvas);
          color: var(--ed-text);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--font);
        }

        .ed-topbar {
          height: 68px;
          min-height: 68px;
          display: grid;
          grid-template-columns: minmax(280px, 1fr) auto minmax(280px, 1fr);
          align-items: center;
          gap: 16px;
          padding: 0 14px;
          background: var(--ed-shell);
          border-bottom: 1px solid var(--ed-border);
          z-index: 30;
          box-shadow: var(--shadow-sm);
        }

        .ed-topbar__left,
        .ed-topbar__center,
        .ed-topbar__right {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .ed-topbar__center {
          justify-content: center;
        }

        .ed-topbar__right {
          justify-content: flex-end;
        }

        .ed-title-input {
          width: min(420px, 100%);
          height: 38px;
          border: none;
          outline: none;
          background: transparent;
          color: var(--ed-text);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .ed-title-input::placeholder {
          color: var(--ed-text-mute);
        }

        .ed-icon-btn,
        .ed-device-btn,
        .ed-rail-btn {
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          color: var(--ed-text-soft);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s ease;
          font-family: inherit;
        }

        .ed-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 11px;
        }

        .ed-icon-btn:hover,
        .ed-device-btn:hover,
        .ed-rail-btn:hover {
          color: var(--ed-accent);
          border-color: var(--ed-accent-soft-border);
          background: var(--ed-accent-soft);
        }

        .ed-device-row {
          height: 36px;
          padding: 3px;
          border: 1px solid var(--ed-border);
          border-radius: 12px;
          background: var(--ed-shell-soft);
          display: inline-flex;
          gap: 3px;
        }

        .ed-device-btn {
          width: 30px;
          height: 28px;
          border-radius: 9px;
          border-color: transparent;
          background: transparent;
        }

        .ed-device-btn.is-active,
        .ed-rail-btn.is-active,
        .ed-rail-code.is-active {
          color: var(--ed-accent);
          background: var(--ed-accent-soft);
          border-color: var(--ed-accent-soft-border);
        }

        .ed-divider {
          width: 1px;
          height: 24px;
          background: var(--ed-border);
        }

        .ed-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: 0.15s ease;
          white-space: nowrap;
        }

        .ed-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ed-btn--ghost {
          background: var(--ed-shell-soft);
          border-color: var(--ed-border);
          color: var(--ed-text-soft);
        }

        .ed-btn--secondary {
          background: var(--ed-panel-soft);
          border-color: var(--ed-border);
          color: var(--ed-text);
        }

        .ed-btn--primary {
          color: #fff;
          background: linear-gradient(135deg, var(--ed-accent), var(--ed-accent-dark));
          border-color: var(--ed-accent-soft-border);
          box-shadow: 0 14px 30px rgba(242,140,24,.22);
        }

        .ed-badge,
        .ed-save-tag {
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          color: var(--ed-accent);
          background: var(--ed-accent-soft);
          border: 1px solid var(--ed-accent-soft-border);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ed-save-tag--saved {
          color: var(--ed-success);
          border-color: rgba(34,197,94,.24);
          background: rgba(34,197,94,.10);
        }

        .ed-save-tag--error {
          color: var(--ed-danger);
          border-color: rgba(239,68,68,.24);
          background: rgba(239,68,68,.10);
        }

        .ed-body {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 60px 320px minmax(0, 1fr) 360px;
          background: var(--ed-canvas);
          overflow: hidden;
          transition: grid-template-columns 0.2s ease;
        }

        .ed-body.is-left-panel-collapsed {
          grid-template-columns: 60px 0 minmax(0, 1fr) 360px;
        }

        .ed-left-rail {
          border-right: 1px solid var(--ed-border);
          background: var(--ed-shell);
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
        }

        .ed-left-rail__top,
        .ed-rail-stack,
        .ed-rail-bottom {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ed-rail-btn {
          width: 42px;
          height: 42px;
          border-radius: 13px;
        }

        .ed-rail-toggle {
          font-size: 16px;
          font-weight: 900;
        }

        .ed-rail-code {
          width: 42px;
          min-height: 58px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          color: var(--ed-text-soft);
          border-radius: 14px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: 0.15s ease;
          font-family: inherit;
        }

        .ed-rail-code small {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ed-left-panel {
          min-width: 0;
          border-right: 1px solid var(--ed-border);
          background: var(--ed-panel);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          opacity: 1;
          visibility: visible;
          transition: opacity 0.18s ease, visibility 0.18s ease;
        }

        .ed-left-panel.is-hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          border-right: 0;
        }

        .ed-panel-section {
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .is-panel-hidden {
          display: none !important;
        }

        .ed-panel-head {
          min-height: 68px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--ed-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--ed-panel);
        }

        .ed-panel-head h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: var(--ed-text);
        }

        .ed-panel-head p {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--ed-text-mute);
        }

        .ed-panel-close {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          color: var(--ed-text-soft);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          transition: 0.15s ease;
        }

        .ed-panel-close:hover {
          color: var(--ed-accent);
          border-color: var(--ed-accent-soft-border);
          background: var(--ed-accent-soft);
        }

        .ed-blocks-host,
        .ed-manager-host,
        .ed-props-host,
        .ed-styles-host,
        .ed-selectors-host {
          min-height: 0;
          overflow: auto;
        }

        .ed-blocks-host,
        .ed-manager-host {
          flex: 1;
          padding: 10px;
        }

        .ed-canvas-area {
          min-width: 0;
          min-height: 0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ed-canvas-top {
          min-height: 56px;
          padding: 10px 12px;
          border: 1px solid var(--ed-border);
          border-radius: 16px;
          background: var(--ed-shell);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .ed-canvas-kicker {
          display: block;
          margin-bottom: 3px;
          color: var(--ed-accent);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ed-canvas-top strong {
          color: var(--ed-text);
          font-size: 14px;
          font-weight: 800;
        }

        .ed-vars {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }

        .ed-vars button {
          height: 30px;
          padding: 0 9px;
          border-radius: 999px;
          border: 1px solid var(--ed-accent-soft-border);
          background: var(--ed-accent-soft);
          color: var(--ed-accent);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
        }

        .ed-canvas-card {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          border: 1px solid var(--ed-border);
          border-radius: 18px;
          background: #fff;
          box-shadow: var(--shadow-md);
        }

        .ed-canvas-mount {
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .ed-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(3px);
          color: rgba(15,23,42,.62);
          font-size: 13px;
          font-weight: 700;
        }

        .ed-spinner {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 2px solid rgba(242,140,24,.22);
          border-top-color: var(--ed-accent);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ed-inspector {
          min-width: 0;
          border-left: 1px solid var(--ed-border);
          background: var(--ed-shell);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ed-inspector-head {
          min-height: 68px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--ed-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ed-inspector-head span {
          display: block;
          color: var(--ed-accent);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ed-inspector-head strong {
          display: block;
          margin-top: 4px;
          color: var(--ed-text);
          font-size: 13px;
          font-weight: 800;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ed-inspector-tabs {
          display: inline-flex;
          padding: 3px;
          border-radius: 12px;
          background: var(--ed-shell-soft);
          border: 1px solid var(--ed-border);
        }

        .ed-inspector-tabs button {
          height: 28px;
          padding: 0 10px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: var(--ed-text-mute);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
        }

        .ed-inspector-tabs button.is-active {
          color: var(--ed-accent);
          background: var(--ed-accent-soft);
        }

        .ed-inspector-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 12px;
        }

        .ed-code-panel,
        .ed-media-panel {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 12px;
        }

        .ed-code-card,
        .ed-link-card {
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ed-email-rules-box {
          padding: 11px 12px;
          border: 1px solid var(--ed-border);
          border-radius: 13px;
          background: var(--ed-shell);
          color: var(--ed-text-soft);
        }

        .ed-email-rules-box strong {
          display: block;
          margin-bottom: 7px;
          color: var(--ed-text);
          font-size: 12px;
          font-weight: 900;
        }

        .ed-email-rules-box ul {
          margin: 0;
          padding-left: 18px;
        }

        .ed-email-rules-box li {
          margin: 0 0 5px;
          font-size: 11.5px;
          line-height: 1.45;
          font-weight: 700;
        }

        .ed-code-toolbar,
        .ed-code-actions,
        .ed-link-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .ed-code-sync,
        .ed-code-primary,
        .ed-code-secondary,
        .ed-link-primary,
        .ed-link-secondary {
          height: 34px;
          border-radius: 10px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
        }

        .ed-code-primary,
        .ed-link-primary {
          border: 1px solid var(--ed-accent-soft-border);
          background: linear-gradient(135deg, var(--ed-accent), var(--ed-accent-dark));
          color: #fff;
        }

        .ed-code-secondary,
        .ed-code-sync,
        .ed-link-secondary {
          border: 1px solid var(--ed-border);
          background: var(--ed-shell);
          color: var(--ed-text-soft);
        }

        .ed-switch {
          display: inline-flex;
          padding: 3px;
          border-radius: 12px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell);
        }

        .ed-switch-btn {
          border: 0;
          height: 28px;
          padding: 0 10px;
          border-radius: 9px;
          background: transparent;
          color: var(--ed-text-mute);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
        }

        .ed-switch-btn.is-active {
          color: var(--ed-accent);
          background: var(--ed-accent-soft);
        }

        .ed-code-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .ed-code-field label,
        .ed-link-field label {
          color: var(--ed-text-mute);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ed-code-field textarea {
          width: 100%;
          resize: vertical;
          min-height: 150px;
          padding: 12px;
          border-radius: 13px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell);
          color: var(--ed-text);
          outline: none;
          font-size: 12px;
          line-height: 1.5;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .ed-code-field textarea:focus,
        .ed-link-field input:focus,
        .ed-media-filters input:focus,
        .ed-media-filters select:focus {
          border-color: rgba(242,140,24,.55);
          box-shadow: 0 0 0 4px rgba(242,140,24,.1);
        }

        .ed-code-notice,
        .ed-media-notice {
          margin: 0;
          color: var(--ed-accent);
          font-size: 12px;
          font-weight: 700;
        }

        .ed-code-warning {
          margin: 0;
          padding: 10px 12px;
          color: #92400e;
          background: rgba(251, 191, 36, 0.14);
          border: 1px solid rgba(251, 191, 36, 0.35);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.5;
        }

        .ed-media-error {
          margin: 0;
          color: var(--ed-danger);
          font-size: 12px;
          font-weight: 700;
        }

        .ed-media-upload {
          width: 100%;
          min-height: 86px;
          border: 1px dashed var(--ed-accent-soft-border);
          border-radius: 16px;
          background: var(--ed-accent-soft);
          color: var(--ed-accent);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
        }

        .ed-media-filters {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 92px;
          gap: 8px;
        }

        .ed-media-filters input,
        .ed-media-filters select,
        .ed-link-field input {
          width: 100%;
          height: 38px;
          padding: 0 10px;
          border-radius: 11px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell);
          color: var(--ed-text);
          outline: none;
          font-family: inherit;
        }

        .ed-media-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ed-media-item {
          min-width: 0;
          min-height: 112px;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          color: var(--ed-text-soft);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 7px;
          cursor: pointer;
          overflow: hidden;
          font-family: inherit;
        }

        .ed-media-item:hover {
          border-color: var(--ed-accent-soft-border);
          background: var(--ed-accent-soft);
          color: var(--ed-accent);
        }

        .ed-media-item img {
          width: 100%;
          height: 76px;
          object-fit: cover;
          border-radius: 10px;
        }

        .ed-media-item span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 800;
        }

        .ed-link-card__title {
          margin: 0;
          color: var(--ed-text);
          font-size: 14px;
          font-weight: 900;
        }

        .ed-link-card__subtitle {
          margin: 4px 0 0;
          color: var(--ed-text-mute);
          font-size: 12px;
        }

        .ed-link-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .ed-link-check {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ed-text-soft);
          font-size: 12px;
          font-weight: 700;
        }

        .ed-link-check input {
          accent-color: var(--ed-accent);
        }

        .ed-link-help {
          margin: 0;
          color: var(--ed-text-mute);
          font-size: 12px;
          line-height: 1.5;
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: ${dark ? "rgba(0,0,0,.48)" : "rgba(0,0,0,.22)"};
          backdrop-filter: blur(3px);
          z-index: 99;
        }

        .meta-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          max-width: calc(100vw - 18px);
          height: 100%;
          background: var(--ed-shell);
          color: var(--ed-text);
          border-left: 1px solid var(--ed-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transform: translateX(100%);
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: ${dark ? "-16px 0 40px rgba(0,0,0,.45)" : "-12px 0 34px rgba(0,0,0,.10)"};
          font-family: "DM Sans", system-ui, sans-serif;
        }

        .meta-sidebar--open {
          transform: translateX(0);
        }

        .sidebar-header {
          min-height: 72px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--ed-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sidebar-heading__icon {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ed-accent);
          background: var(--ed-accent-soft);
          border: 1px solid var(--ed-accent-soft-border);
        }

        .sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: var(--ed-text);
          line-height: 1.1;
        }

        .sidebar-subtitle {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--ed-text-mute);
        }

        .sidebar-close {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--ed-border);
          background: var(--ed-shell-soft);
          color: var(--ed-text-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 14px;
          border: 1px solid var(--ed-border);
          border-radius: 16px;
          background: var(--ed-shell-soft);
        }

        .field-label {
          color: var(--ed-text-mute);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .field-required {
          color: var(--ed-danger);
        }

        .field-input,
        .field-select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid var(--ed-border);
          background: ${dark ? "#131318" : "#FFFFFF"};
          color: var(--ed-text);
          outline: none;
          font-family: inherit;
          font-size: 14px;
        }

        .field-input:focus,
        .field-select:focus {
          border-color: rgba(242,140,24,.55);
          box-shadow: 0 0 0 4px rgba(242,140,24,.1);
        }

        .group-check-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 230px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .group-empty {
          margin: 0;
          color: var(--ed-text-mute);
          font-size: 12px;
          font-weight: 700;
        }

        .group-check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 11px;
          border: 1px solid var(--ed-border);
          border-radius: 13px;
          background: var(--ed-shell);
          color: var(--ed-text-soft);
          cursor: pointer;
          transition: 0.15s ease;
        }

        .group-check-item:hover,
        .group-check-item--active {
          border-color: var(--ed-accent-soft-border);
          background: var(--ed-accent-soft);
          color: var(--ed-accent);
        }

        .group-check-item input {
          width: 15px;
          height: 15px;
          accent-color: var(--ed-accent);
          flex-shrink: 0;
        }

        .group-check-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .group-check-text strong {
          color: inherit;
          font-size: 13px;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-check-text small {
          color: var(--ed-text-mute);
          font-size: 11px;
          font-weight: 700;
        }

        .field-hint {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
        }

        .field-hint--error {
          color: var(--ed-danger);
        }

        .summary-card {
          padding: 14px;
          border: 1px solid var(--ed-border);
          border-radius: 16px;
          background: var(--ed-shell-soft);
        }

        .summary-card h3 {
          margin: 0 0 10px;
          color: var(--ed-text);
          font-size: 13px;
          font-weight: 900;
        }

        .summary-card__row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-top: 1px solid var(--ed-border);
        }

        .summary-card__row span {
          color: var(--ed-text-mute);
          font-size: 12px;
        }

        .summary-card__row strong {
          color: var(--ed-text);
          font-size: 12px;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }

        .test-field {
          position: relative;
        }

        .test-field svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ed-text-mute);
        }

        .test-field input {
          width: 100%;
          height: 42px;
          padding: 0 12px 0 38px;
          border-radius: 12px;
          border: 1px solid var(--ed-border);
          background: ${dark ? "#131318" : "#FFFFFF"};
          color: var(--ed-text);
          outline: none;
          font-family: inherit;
        }

        .test-button,
        .sidebar-save-button {
          width: 100%;
          height: 42px;
          border-radius: 12px;
          border: 1px solid var(--ed-accent-soft-border);
          color: #fff;
          background: linear-gradient(135deg, var(--ed-accent), var(--ed-accent-dark));
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }

        .test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message-success {
          margin: 0;
          color: var(--ed-success);
          font-size: 12px;
          font-weight: 800;
        }

        .message-error {
          margin: 0;
          color: var(--ed-danger);
          font-size: 12px;
          font-weight: 800;
        }

        .preview-backdrop {
          position: fixed;
          inset: 0;
          z-index: 120;
          padding: 24px;
          background: rgba(15,23,42,.62);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .preview-modal {
          width: min(980px, 100%);
          height: min(760px, calc(100vh - 48px));
          border-radius: 20px;
          overflow: hidden;
          background: var(--ed-shell);
          border: 1px solid var(--ed-border);
          box-shadow: 0 28px 80px rgba(0,0,0,.34);
          display: flex;
          flex-direction: column;
        }

        .preview-head {
          min-height: 72px;
          padding: 15px 18px;
          border-bottom: 1px solid var(--ed-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-head h3 {
          margin: 0;
          color: var(--ed-text);
          font-size: 15px;
          font-weight: 900;
        }

        .preview-head p {
          margin: 4px 0 0;
          color: var(--ed-text-mute);
          font-size: 12px;
        }

        .preview-frame {
          flex: 1;
          width: 100%;
          border: 0;
          background: #fff;
        }

        .ed-root .gjs-editor,
        .ed-root .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
        }

        .ed-root .gjs-one-bg {
          background: var(--ed-panel) !important;
        }

        .ed-root .gjs-two-color {
          color: var(--ed-text-soft) !important;
        }

        .ed-root .gjs-three-bg {
          background: var(--ed-accent) !important;
        }

        .ed-root .gjs-four-color,
        .ed-root .gjs-four-color-h:hover {
          color: var(--ed-accent) !important;
        }

        .ed-root .gjs-category-title,
        .ed-root .gjs-block-category .gjs-title,
        .ed-root .gjs-sm-sector-title {
          background: var(--ed-shell-soft) !important;
          color: var(--ed-text) !important;
          border-bottom: 1px solid var(--ed-border) !important;
          font-size: 12px !important;
          font-weight: 900 !important;
        }

        .ed-root .gjs-blocks-c {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          padding: 0 !important;
        }

        .ed-root .gjs-block {
          width: 100% !important;
          min-height: 54px !important;
          margin: 0 !important;
          padding: 12px !important;
          border: 1px solid var(--ed-border) !important;
          border-radius: 14px !important;
          background: var(--ed-shell-soft) !important;
          color: var(--ed-text) !important;
          box-shadow: none !important;
          font-family: var(--font) !important;
        }

        .ed-root .gjs-block:hover {
          border-color: var(--ed-accent-soft-border) !important;
          background: var(--ed-accent-soft) !important;
          color: var(--ed-accent) !important;
        }

        .ed-root .gjs-block-label {
          font-size: 12px !important;
          font-weight: 800 !important;
        }

        .ed-root .gjs-layer,
        .ed-root .gjs-sm-property,
        .ed-root .gjs-trt-trait {
          color: var(--ed-text-soft) !important;
          background: transparent !important;
        }

        .ed-root .gjs-field,
        .ed-root .gjs-field input,
        .ed-root .gjs-field select,
        .ed-root .gjs-input-unit {
          background: var(--ed-shell) !important;
          color: var(--ed-text) !important;
          border-color: var(--ed-border) !important;
        }

        @media (max-width: 1280px) {
          .ed-body {
            grid-template-columns: 60px 300px minmax(0, 1fr);
          }

          .ed-body.is-left-panel-collapsed {
            grid-template-columns: 60px 0 minmax(0, 1fr);
          }

          .ed-inspector {
            display: none;
          }
        }

        @media (max-width: 960px) {
          .ed-topbar {
            height: auto;
            min-height: 68px;
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .ed-topbar__center,
          .ed-topbar__right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .ed-body,
          .ed-body.is-left-panel-collapsed {
            grid-template-columns: 56px minmax(0, 1fr);
          }

          .ed-left-panel {
            position: fixed;
            left: 56px;
            top: 68px;
            bottom: 0;
            width: 310px;
            z-index: 40;
            box-shadow: 18px 0 38px rgba(15,23,42,.16);
            transform: translateX(0);
            transition: transform 0.22s ease, opacity 0.18s ease, visibility 0.18s ease;
          }

          .ed-left-panel.is-hidden {
            transform: translateX(-110%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
        }

        @media (max-width: 640px) {
          .ed-left-panel {
            left: 0;
            width: min(320px, 92vw);
          }

          .meta-sidebar {
            width: 100vw;
            max-width: 100vw;
          }

          .ed-vars {
            justify-content: flex-start;
          }

          .ed-canvas-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

function CampaignSettingsSidebar({
  open,
  onClose,
  registerLive,
  errors,
  groups,
  groupIds,
  setValue,
  name,
  subject,
  fromName,
  selectedGroupName,
  testEmail,
  setTestEmail,
  testLoading,
  testMessage,
  sendTestEmail,
  isEdit,
  handleSave,
}: {
  open: boolean;
  onClose: () => void;
  registerLive: (
    field: keyof CampaignFormData
  ) => ReturnType<UseFormRegister<CampaignFormData>>;
  errors: FieldErrors<CampaignFormData>;
  groups: { id: string; name: string; _count?: { contacts: number } }[];
  groupIds: string[];
  setValue: UseFormSetValue<CampaignFormData>;
  name: string;
  subject: string;
  fromName: string;
  selectedGroupName: string;
  testEmail: string;
  setTestEmail: (value: string) => void;
  testLoading: boolean;
  testMessage: { type: "success" | "error"; text: string } | null;
  sendTestEmail: () => void;
  isEdit: boolean;
  handleSave: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`meta-sidebar ${open ? "meta-sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-heading">
            <div className="sidebar-heading__icon">✎</div>

            <div>
              <h2 className="sidebar-title">Campaign Settings</h2>
              <p className="sidebar-subtitle">Configuration de l’email</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form
          className="sidebar-body"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="field-group">
            <label className="field-label">
              Nom campagne <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="Newsletter Janvier 2026"
              {...registerLive("name")}
            />
            {errors.name && (
              <p className="field-hint field-hint--error">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">
              Sujet <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="Nos offres exclusives du mois"
              {...registerLive("subject")}
            />
            {errors.subject && (
              <p className="field-hint field-hint--error">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">
              Nom expéditeur <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="MD2I"
              {...registerLive("fromName")}
            />
            {errors.fromName && (
              <p className="field-hint field-hint--error">
                {errors.fromName.message}
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">
              Email expéditeur <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="email"
              placeholder="noreply@md2i.com"
              {...registerLive("fromEmail")}
            />
            {errors.fromEmail && (
              <p className="field-hint field-hint--error">
                {errors.fromEmail.message}
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">Reply-to</label>
            <input
              className="field-input"
              type="email"
              placeholder="contact@md2i.com"
              {...registerLive("replyTo")}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Groupes cibles</label>

            <div className="group-check-list">
              {groups.length === 0 ? (
                <p className="group-empty">Aucun groupe disponible.</p>
              ) : (
                groups.map((group) => {
                  const checked = groupIds.includes(group.id);

                  return (
                    <label
                      key={group.id}
                      className={`group-check-item ${
                        checked ? "group-check-item--active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const nextGroupIds = e.target.checked
                            ? Array.from(new Set([...groupIds, group.id]))
                            : groupIds.filter((id) => id !== group.id);

                          setValue("groupIds", nextGroupIds, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });

                          setValue("groupId", nextGroupIds[0] || "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                      />

                      <span className="group-check-text">
                        <strong>{group.name}</strong>
                        <small>{group._count?.contacts ?? 0} contact(s)</small>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {errors.groupIds && (
              <p className="field-hint field-hint--error">
                {String(errors.groupIds.message || "Groupes invalides")}
              </p>
            )}
          </div>

          <div className="summary-card">
            <h3>Résumé</h3>

            <div className="summary-card__row">
              <span>Campagne</span>
              <strong>{name || "Sans nom"}</strong>
            </div>

            <div className="summary-card__row">
              <span>Sujet</span>
              <strong>{subject || "—"}</strong>
            </div>

            <div className="summary-card__row">
              <span>Expéditeur</span>
              <strong>{fromName || "—"}</strong>
            </div>

            <div className="summary-card__row">
              <span>Groupes</span>
              <strong>{selectedGroupName || "Aucun"}</strong>
            </div>
          </div>

          {isEdit && (
            <div className="field-group">
              <label className="field-label">Email de test</label>

              <div className="test-field">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>

                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>

              <button
                type="button"
                className="test-button"
                onClick={sendTestEmail}
                disabled={testLoading || !testEmail}
              >
                {testLoading ? "Envoi..." : "Envoyer le test"}
              </button>

              {testMessage && (
                <p
                  className={
                    testMessage.type === "success"
                      ? "message-success"
                      : "message-error"
                  }
                >
                  {testMessage.text}
                </p>
              )}
            </div>
          )}

          <button type="submit" className="sidebar-save-button">
            Enregistrer la campagne
          </button>
        </form>
      </aside>
    </>
  );
}
