"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import PostMetaSidebar, { PostMeta } from "./PostMetaSidebar";
import { generateSlug } from "@/app/lib/utils/slug";
import { useTheme } from "@/app/context/ThemeContext";

interface GrapesEditorProps {
  mode: "create" | "edit";
  postId?: string;
}

type PanelTab = "blocks" | "layers" | "code" | "media";
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

const BASE_BLOCKS_CSS = `
/* MD2I_BASE_BLOCKS */
.hero-md2i {
  padding: 56px 24px;
}

.hero-md2i__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px;
  border-radius: 28px;
  border: 1px solid rgba(239,159,39,.18);
  background: rgba(239,159,39,.06);
}

.hero-md2i__badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(239,159,39,.10);
  color: #ef9f27;
  border: 1px solid rgba(239,159,39,.18);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hero-md2i h1 {
  margin: 16px 0 10px;
  font-size: clamp(34px, 6vw, 62px);
  line-height: 1.02;
}

.hero-md2i p {
  margin: 0 0 22px;
  max-width: 760px;
  line-height: 1.7;
}

.hero-md2i__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.cards-md2i {
  padding: 24px;
}

.cards-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.cards-md2i__item {
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
  box-shadow: 0 14px 34px rgba(15,23,42,.06);
}

.body-light-demo {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px;
  border-radius: 22px;
  border: 1px dashed rgba(239,159,39,.35);
  background: rgba(239,159,39,.06);
}

@media (max-width: 840px) {
  .cards-md2i__grid {
    grid-template-columns: 1fr;
  }

  .hero-md2i__inner {
    padding: 24px;
  }
}
`;

export default function GrapesEditor({ mode, postId }: GrapesEditorProps) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const gjsRef = useRef<Editor | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const { dark } = useTheme();

  const [activeTab, setActiveTab] = useState<PanelTab | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"styles" | "properties">("styles");
  const [device, setDevice] = useState<Device>("desktop");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedName, setSelectedName] = useState("Aucun élément");

  const [codeHtml, setCodeHtml] = useState("");
  const [codeCss, setCodeCss] = useState("");
  const [codeJs, setCodeJs] = useState("");
  const [codeNotice, setCodeNotice] = useState("");
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

  // ─── Quick style panel state ──────────────────────────────────────────────
  const [quickStyle, setQuickStyle] = useState({
    fontSize: "",
    fontWeight: "400",
    lineHeight: "",
    letterSpacing: "",
    color: "",
    backgroundColor: "",
    borderColor: "",
    borderWidth: "",
    borderRadius: "",
    width: "",
    height: "",
    minWidth: "",
    minHeight: "",
    maxWidth: "",
    marginTop: "",
    marginRight: "",
    marginBottom: "",
    marginLeft: "",
    paddingTop: "",
    paddingRight: "",
    paddingBottom: "",
    paddingLeft: "",
    display: "",
    flexDirection: "",
    justifyContent: "",
    alignItems: "",
    gap: "",
    opacity: "",
    boxShadow: "",
    zIndex: "",
  });

  const [pageSettings, setPageSettings] = useState({
    backgroundColor: dark ? "#0B0B0E" : "#FFFFFF",
    textColor: dark ? "#F2EFEA" : "#181818",
    fontFamily: "Inter, Arial, sans-serif",
    maxWidth: 1200,
    paddingX: 24,
    paddingY: 40,
  });

  const [meta, setMeta] = useState<PostMeta>({
    title: "",
    slug: "",
    excerpt: "",
    coverImage: "",
    status: "DRAFT",
    categoryId: "",
    tags: [],
    authorId: "",
  });

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

  const quickTextColors = dark
    ? ["#F2EFEA", "rgba(255,255,255,.72)", ORANGE, "#22c55e", "#ef4444"]
    : ["#181818", "#475569", ORANGE, "#1D9E75", "#dc2626"];

  const quickBackgroundColors = dark
    ? ["transparent", "#1B202B", "#232936", "rgba(242,140,24,.12)", "#ffffff"]
    : ["transparent", "#ffffff", "#f8fafc", "rgba(242,140,24,.10)", "#181818"];

  const detectMediaKind = useCallback((mimeType?: string, url?: string): MediaKind => {
    const mime = String(mimeType || "").toLowerCase();
    const lowerUrl = String(url || "").toLowerCase();

    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(lowerUrl)) return "image";
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(lowerUrl)) return "video";

    return "file";
  }, []);

  const syncMediaAssetsToEditor = useCallback((items: UploadItem[]) => {
    const editor = gjsRef.current;
    if (!editor) return;

    const assetManager = editor.AssetManager;
    if (!assetManager) return;

    const assetCollection: any = typeof assetManager.getAll === "function" ? assetManager.getAll() : [];
    const assets = Array.isArray(assetCollection)
      ? assetCollection
      : Array.isArray(assetCollection?.models)
        ? assetCollection.models
        : [];

    items.forEach((item) => {
      const existing = assets.find((asset: any) => {
        const src = asset?.get?.("src") || asset?.attributes?.src;
        return src === item.url;
      });

      if (!existing) {
        assetManager.add({
          src: item.url,
          name: item.name,
          type: item.kind === "image" ? "image" : undefined,
        } as any);
      }
    });
  }, []);

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
            name: f?.name ?? f?.filename ?? f?.originalName ?? url.split("/").pop() ?? "file",
            mimeType,
            size: f?.size,
            createdAt: f?.createdAt,
            kind: detectMediaKind(mimeType, url),
          } as UploadItem;
        })
        .filter(Boolean) as UploadItem[];

      setMediaItems(items);
      syncMediaAssetsToEditor(items);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setMediaLoading(false);
    }
  }, [detectMediaKind, syncMediaAssetsToEditor]);

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
      if (!res.ok) throw new Error(json?.error || "Échec de l'upload.");

      const payload = json?.data ?? json;
      const nextUrl = payload?.url ?? payload?.path ?? payload?.src;
      if (!nextUrl) throw new Error("URL de fichier absente dans la réponse.");

      const item: UploadItem = {
        id: payload?.id ?? payload?._id ?? nextUrl,
        url: nextUrl,
        name: payload?.name ?? payload?.filename ?? payload?.originalName ?? file.name,
        mimeType: payload?.mimeType ?? payload?.type ?? file.type,
        size: payload?.size ?? file.size,
        createdAt: payload?.createdAt ?? new Date().toISOString(),
        kind: detectMediaKind(payload?.mimeType ?? payload?.type ?? file.type, nextUrl),
      };

      setMediaItems((prev) => [item, ...prev]);
      syncMediaAssetsToEditor([item]);
      setMediaNotice("Fichier uploadé.");
      setTimeout(() => setMediaNotice(""), 2200);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Erreur pendant l'upload.");
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }, [detectMediaKind, syncMediaAssetsToEditor]);

  const escapeHtml = useCallback((value: string) => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }, []);

  const insertMediaIntoEditor = useCallback((item: UploadItem, mode: "insert" | "open" | "download" = "insert") => {
    const editor = gjsRef.current;
    if (!editor) return;

    const safeUrl = escapeHtml(item.url);
    const safeName = escapeHtml(item.name);
    const safeType = escapeHtml(item.mimeType || "");

    if (mode === "insert") {
      if (item.kind === "image") {
        editor.addComponents(`
          <img src="${safeUrl}" alt="${safeName}" style="max-width:100%;height:auto;display:block;" />
        `);
        return;
      }

      if (item.kind === "video") {
        editor.addComponents(`
          <video controls style="max-width:100%;height:auto;display:block;">
            <source src="${safeUrl}" type="${safeType || "video/mp4"}" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
        `);
        return;
      }

      editor.addComponents(`
        <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid rgba(0,0,0,.12);border-radius:12px;">
          <div style="font-size:22px;">📎</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeName}</div>
            <a href="${safeUrl}" download="${safeName}" style="color:${ORANGE};text-decoration:none;">Télécharger</a>
          </div>
        </div>
      `);
      return;
    }

    if (mode === "open") {
      editor.addComponents(`
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a>
      `);
      return;
    }

    editor.addComponents(`
      <a href="${safeUrl}" download="${safeName}">Télécharger ${safeName}</a>
    `);
  }, [escapeHtml]);

  const filteredMediaItems = mediaItems.filter((item) => {
    const okSearch = item.name.toLowerCase().includes(mediaSearch.toLowerCase());
    const okFilter = mediaFilter === "all" ? true : item.kind === mediaFilter;
    return okSearch && okFilter;
  });

  const getSelectedComponent = () => gjsRef.current?.getSelected() as any;

  // ─── Sync quickStyle from selected component ──────────────────────────────
  const syncQuickStyleFromSelection = useCallback(() => {
    const selected = getSelectedComponent();
    if (!selected) {
      setQuickStyle({
        fontSize: "", fontWeight: "400", lineHeight: "", letterSpacing: "",
        color: "", backgroundColor: "", borderColor: "", borderWidth: "",
        borderRadius: "", width: "", height: "", minWidth: "", minHeight: "",
        maxWidth: "", marginTop: "", marginRight: "", marginBottom: "",
        marginLeft: "", paddingTop: "", paddingRight: "", paddingBottom: "",
        paddingLeft: "", display: "", flexDirection: "", justifyContent: "",
        alignItems: "", gap: "", opacity: "", boxShadow: "", zIndex: "",
      });
      return;
    }
    const s = (selected.getStyle?.() || {}) as Record<string, string>;
    setQuickStyle({
      fontSize: s["font-size"] || "",
      fontWeight: s["font-weight"] || "400",
      lineHeight: s["line-height"] || "",
      letterSpacing: s["letter-spacing"] || "",
      color: s["color"] || "",
      backgroundColor: s["background-color"] || "",
      borderColor: s["border-color"] || "",
      borderWidth: s["border-width"] || "",
      borderRadius: s["border-radius"] || "",
      width: s["width"] || "",
      height: s["height"] || "",
      minWidth: s["min-width"] || "",
      minHeight: s["min-height"] || "",
      maxWidth: s["max-width"] || "",
      marginTop: s["margin-top"] || "",
      marginRight: s["margin-right"] || "",
      marginBottom: s["margin-bottom"] || "",
      marginLeft: s["margin-left"] || "",
      paddingTop: s["padding-top"] || "",
      paddingRight: s["padding-right"] || "",
      paddingBottom: s["padding-bottom"] || "",
      paddingLeft: s["padding-left"] || "",
      display: s["display"] || "",
      flexDirection: s["flex-direction"] || "",
      justifyContent: s["justify-content"] || "",
      alignItems: s["align-items"] || "",
      gap: s["gap"] || "",
      opacity: s["opacity"] || "",
      boxShadow: s["box-shadow"] || "",
      zIndex: s["z-index"] || "",
    });
  }, []);

  // Apply a single CSS property to selected component
  const applyStyleProp = useCallback((prop: string, value: string) => {
    const selected = getSelectedComponent();
    if (!selected) return;
    selected.addStyle({ [prop]: value });
  }, []);

  const syncLinkConfigFromSelection = useCallback(() => {
    const selected = getSelectedComponent();

    if (!selected) {
      setLinkConfig({ href: "", title: "", targetBlank: false, noFollow: false, download: false });
      return;
    }

    const attrs = (selected.getAttributes?.() || selected.get?.("attributes") || {}) as Record<string, string>;
    const relValue = String(attrs.rel || "");

    setLinkConfig({
      href: String(attrs.href || ""),
      title: String(attrs.title || ""),
      targetBlank: attrs.target === "_blank",
      noFollow: relValue.includes("nofollow"),
      download: typeof attrs.download !== "undefined",
    });
  }, []);

  const appendBaseBlocksCss = useCallback((editor: Editor) => {
    const currentCss = editor.getCss() || "";
    if (currentCss.includes("MD2I_BASE_BLOCKS")) return;
    editor.setStyle(`${currentCss}\n\n${BASE_BLOCKS_CSS}`);
  }, []);

  const extractStoredJsFromHtml = (html: string) => {
    const scriptRegex =
      /<script[^>]*data-editor-custom-js=["']true["'][^>]*>([\s\S]*?)<\/script>/gi;
    let extractedJs = "";
    const cleanedHtml = html.replace(scriptRegex, (_, js) => {
      extractedJs += `${js ?? ""}\n`;
      return "";
    });
    return { html: cleanedHtml.trim(), js: extractedJs.trim() };
  };

  const syncCodeFieldsSilently = useCallback(() => {
    const editor = gjsRef.current;
    if (!editor) return;
    const rawHtml = editor.getHtml() || "";
    const rawCss = editor.getCss() || "";
    const { html } = extractStoredJsFromHtml(rawHtml);
    setCodeHtml(html);
    setCodeCss(rawCss);
  }, []);

  const syncCodeFieldsFromEditor = useCallback(() => {
    const editor = gjsRef.current;
    if (!editor) return;
    const rawHtml = editor.getHtml() || "";
    const rawCss = editor.getCss() || "";
    const { html } = extractStoredJsFromHtml(rawHtml);
    setCodeHtml(html);
    setCodeCss(rawCss);
    setCodeNotice("HTML / CSS synchronisés depuis le canvas.");
    setTimeout(() => setCodeNotice(""), 2200);
  }, []);

  const readPageStyles = useCallback(() => {
    const editor = gjsRef.current;
    const wrapper = editor?.getWrapper() as any;
    if (!wrapper) return;
    const styles = (wrapper.getStyle?.() || {}) as Record<string, string>;
    setPageSettings((prev) => ({
      backgroundColor: styles["background-color"] || prev.backgroundColor,
      textColor: styles["color"] || prev.textColor,
      fontFamily: styles["font-family"] || prev.fontFamily,
      maxWidth: getNumberFromCss(styles["max-width"], prev.maxWidth),
      paddingX: getNumberFromCss(styles["padding-left"], prev.paddingX),
      paddingY: getNumberFromCss(styles["padding-top"], prev.paddingY),
    }));
  }, []);

  const loadPost = useCallback(
    async (editor: Editor) => {
      if (!postId) return;
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) return;
        const post = await res.json();
        setMeta({
          title: post.title ?? "",
          slug: post.slug ?? "",
          excerpt: post.excerpt ?? "",
          coverImage: post.coverImage ?? "",
          status: post.status ?? "DRAFT",
          categoryId: post.categoryId ?? "",
          tags: post.tags?.map((t: { tag: { id: string } }) => t.tag.id) ?? [],
          authorId: post.authorId ?? "",
        });
        if (post.gjsComponents) editor.setComponents(post.gjsComponents);
        else if (post.gjsHtml) editor.setComponents(post.gjsHtml);
        if (post.gjsStyles) editor.setStyle(post.gjsStyles);
        setCodeJs(post.gjsJs ?? "");
        appendBaseBlocksCss(editor);
        setTimeout(() => {
          runCanvasJs(post.gjsJs ?? "");
          syncCodeFieldsSilently();
          readPageStyles();
        }, 0);
      } catch (e) {
        console.error("loadPost", e);
      }
    },
    [appendBaseBlocksCss, postId, readPageStyles, syncCodeFieldsSilently]
  );

  const getNumberFromCss = (value: unknown, fallback: number) => {
    if (!value) return fallback;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : fallback;
  };

  const applyPageStyles = (
    overrides: Partial<{
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
      maxWidth: number;
      paddingX: number;
      paddingY: number;
    }> = {}
  ) => {
    const editor = gjsRef.current;
    const wrapper = editor?.getWrapper() as any;
    if (!editor || !wrapper) return;
    const next = { ...pageSettings, ...overrides };
    setPageSettings(next);
    wrapper.addStyle({
      "background-color": next.backgroundColor,
      color: next.textColor,
      "font-family": next.fontFamily,
      "min-height": "100vh",
      "max-width": next.maxWidth ? `${next.maxWidth}px` : "",
      "margin-left": next.maxWidth ? "auto" : "",
      "margin-right": next.maxWidth ? "auto" : "",
      "padding-top": `${next.paddingY}px`,
      "padding-right": `${next.paddingX}px`,
      "padding-bottom": `${next.paddingY}px`,
      "padding-left": `${next.paddingX}px`,
    });
  };

  const resetPageStyles = () => {
    applyPageStyles({
      backgroundColor: dark ? "#0B0B0E" : "#FFFFFF",
      textColor: dark ? "#F2EFEA" : "#181818",
      fontFamily: "Inter, Arial, sans-serif",
      maxWidth: 1200,
      paddingX: 24,
      paddingY: 40,
    });
  };

  const applyPagePreset = (preset: "light" | "dark" | "warm") => {
    if (preset === "light") {
      applyPageStyles({ backgroundColor: "#FFFFFF", textColor: "#181818", fontFamily: "Inter, Arial, sans-serif", maxWidth: 1200, paddingX: 24, paddingY: 40 });
    }
    if (preset === "dark") {
      applyPageStyles({ backgroundColor: "#0B0B0E", textColor: "#F2EFEA", fontFamily: "Inter, Arial, sans-serif", maxWidth: 1200, paddingX: 24, paddingY: 40 });
    }
    if (preset === "warm") {
      applyPageStyles({ backgroundColor: "#FFF8EF", textColor: "#2B2118", fontFamily: "Inter, Arial, sans-serif", maxWidth: 1200, paddingX: 24, paddingY: 40 });
    }
  };

  const registerCustomBlocks = useCallback(
    (editor: Editor) => {
      editor.Blocks.add("hero-md2i", {
        label: "Hero MD2I",
        category: "MD2I",
        select: true,
        content: `
          <section class="hero-md2i">
            <div class="hero-md2i__inner">
              <span class="hero-md2i__badge">MD2I</span>
              <h1>Votre titre principal</h1>
              <p>Un texte d'introduction élégant pour présenter votre service.</p>
              <a href="#" class="hero-md2i__btn">Découvrir</a>
            </div>
          </section>
        `,
      });

      editor.Blocks.add("card-grid-md2i", {
        label: "Cards 3 colonnes",
        category: "MD2I",
        select: true,
        content: `
          <section class="cards-md2i">
            <div class="cards-md2i__grid">
              <article class="cards-md2i__item"><h3>Bloc 1</h3><p>Texte de présentation.</p></article>
              <article class="cards-md2i__item"><h3>Bloc 2</h3><p>Texte de présentation.</p></article>
              <article class="cards-md2i__item"><h3>Bloc 3</h3><p>Texte de présentation.</p></article>
            </div>
          </section>
        `,
      });

      editor.Blocks.add("body-section-light", {
        label: "Section claire",
        category: "MD2I",
        select: true,
        content: `
          <section class="body-light-demo">
            <h2>Section claire</h2>
            <p>Cette section laisse mieux voir les styles globaux de la page.</p>
          </section>
        `,
      });

      appendBaseBlocksCss(editor);
    },
    [appendBaseBlocksCss]
  );

  useEffect(() => {
    if (!mountRef.current || gjsRef.current) return;

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

      const editor = grapesjs.init({
        container: mountRef.current!,
        height: "100%",
        width: "100%",
        fromElement: false,
        storageManager: false,

        plugins: [gjsPreset, gjsBlocks, gjsForms, gjsNavbar, gjsCustomCode],
        pluginsOpts: {
          [gjsPreset as never]: { modalImportTitle: "Importer du HTML" },
          [gjsBlocks as never]: { flexGrid: true },
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
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
          ],
          scripts: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"],
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
                {
                  name: "Rayon haut-gauche",
                  property: "border-top-left-radius",
                  type: "integer" as any,
                  units: ["px", "%"],
                  unit: "px",
                  min: 0,
                  max: 999,
                },
                {
                  name: "Rayon haut-droit",
                  property: "border-top-right-radius",
                  type: "integer" as any,
                  units: ["px", "%"],
                  unit: "px",
                  min: 0,
                  max: 999,
                },
                {
                  name: "Rayon bas-gauche",
                  property: "border-bottom-left-radius",
                  type: "integer" as any,
                  units: ["px", "%"],
                  unit: "px",
                  min: 0,
                  max: 999,
                },
                {
                  name: "Rayon bas-droit",
                  property: "border-bottom-right-radius",
                  type: "integer" as any,
                  units: ["px", "%"],
                  unit: "px",
                  min: 0,
                  max: 999,
                },
                {
                  name: "Outline",
                  property: "outline",
                  type: "base" as any,
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
                  name: "Larg. min",
                  property: "min-width",
                  type: "integer" as any,
                  units: ["px", "%", "vw", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
                {
                  name: "Haut. min",
                  property: "min-height",
                  type: "integer" as any,
                  units: ["px", "%", "vh", "em", "rem"],
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
                {
                  name: "Haut. max",
                  property: "max-height",
                  type: "integer" as any,
                  units: ["px", "%", "vh", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
              ],
            },
            {
              id: "spacing",
              name: "Espacement (Margin / Padding)",
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
                    { id: "none", label: "Masqué (none)" },
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
                  name: "Top",
                  property: "top",
                  type: "integer" as any,
                  units: ["px", "%", "em"],
                  unit: "px",
                },
                {
                  name: "Right",
                  property: "right",
                  type: "integer" as any,
                  units: ["px", "%", "em"],
                  unit: "px",
                },
                {
                  name: "Bottom",
                  property: "bottom",
                  type: "integer" as any,
                  units: ["px", "%", "em"],
                  unit: "px",
                },
                {
                  name: "Left",
                  property: "left",
                  type: "integer" as any,
                  units: ["px", "%", "em"],
                  unit: "px",
                },
                {
                  name: "Z-index",
                  property: "z-index",
                  type: "integer" as any,
                  units: [""],
                  unit: "",
                  min: -999,
                  max: 9999,
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
                    { id: "row", label: "Row →" },
                    { id: "row-reverse", label: "Row ←" },
                    { id: "column", label: "Column ↓" },
                    { id: "column-reverse", label: "Column ↑" },
                  ],
                },
                {
                  name: "Flex wrap",
                  property: "flex-wrap",
                  type: "select" as any,
                  options: [
                    { id: "nowrap", label: "Nowrap" },
                    { id: "wrap", label: "Wrap" },
                    { id: "wrap-reverse", label: "Wrap-reverse" },
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
                  name: "Align self",
                  property: "align-self",
                  type: "select" as any,
                  options: [
                    { id: "auto", label: "Auto" },
                    { id: "stretch", label: "Stretch" },
                    { id: "flex-start", label: "Début" },
                    { id: "center", label: "Centre" },
                    { id: "flex-end", label: "Fin" },
                  ],
                },
                {
                  name: "Gap",
                  property: "gap",
                  type: "integer" as any,
                  units: ["px", "%", "em", "rem"],
                  unit: "px",
                  min: 0,
                  max: 200,
                },
                {
                  name: "Flex grow",
                  property: "flex-grow",
                  type: "integer" as any,
                  units: [""],
                  unit: "",
                  min: 0,
                  max: 10,
                },
                {
                  name: "Flex shrink",
                  property: "flex-shrink",
                  type: "integer" as any,
                  units: [""],
                  unit: "",
                  min: 0,
                  max: 10,
                },
                {
                  name: "Flex basis",
                  property: "flex-basis",
                  type: "integer" as any,
                  units: ["px", "%", "em", "auto"],
                  unit: "px",
                  min: 0,
                  max: 5000,
                },
                {
                  name: "Grid colonnes",
                  property: "grid-template-columns",
                  type: "base" as any,
                },
                {
                  name: "Grid lignes",
                  property: "grid-template-rows",
                  type: "base" as any,
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
                {
                  name: "Backdrop filter",
                  property: "backdrop-filter",
                  type: "base" as any,
                },
                {
                  name: "Blend mode",
                  property: "mix-blend-mode",
                  type: "select" as any,
                  options: [
                    { id: "normal", label: "Normal" },
                    { id: "multiply", label: "Multiply" },
                    { id: "screen", label: "Screen" },
                    { id: "overlay", label: "Overlay" },
                    { id: "darken", label: "Darken" },
                    { id: "lighten", label: "Lighten" },
                  ],
                },
              ],
            },
            {
              id: "transform",
              name: "Transformation",
              open: false,
              properties: [
                { name: "Transform", property: "transform", type: "base" as any },
                { name: "Transition", property: "transition", type: "base" as any },
                {
                  name: "Curseur",
                  property: "cursor",
                  type: "select" as any,
                  options: [
                    { id: "default", label: "Default" },
                    { id: "pointer", label: "Pointer" },
                    { id: "move", label: "Move" },
                    { id: "text", label: "Text" },
                    { id: "not-allowed", label: "Not-allowed" },
                    { id: "grab", label: "Grab" },
                  ],
                },
                {
                  name: "Object fit",
                  property: "object-fit",
                  type: "select" as any,
                  options: [
                    { id: "fill", label: "Fill" },
                    { id: "contain", label: "Contain" },
                    { id: "cover", label: "Cover" },
                    { id: "none", label: "None" },
                    { id: "scale-down", label: "Scale-down" },
                  ],
                },
              ],
            },
          ],
        },
      });

      gjsRef.current = editor;
      registerCustomBlocks(editor);

      const updateSelectedLabel = () => {
        const selected = editor.getSelected() as any;
        if (!selected) {
          setSelectedName("Aucun élément");
          syncLinkConfigFromSelection();
          syncQuickStyleFromSelection();
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
        syncQuickStyleFromSelection();
      };

      editor.on("load", async () => {
        setIsReady(true);
        if (mode === "edit") {
          await loadPost(editor);
        } else {
          appendBaseBlocksCss(editor);
          setTimeout(() => {
            syncCodeFieldsSilently();
            runCanvasJs(codeJs);
            readPageStyles();
          }, 0);
        }
        updateSelectedLabel();
      });

      editor.on("component:selected", updateSelectedLabel);
      editor.on("component:deselected", updateSelectedLabel);
      editor.on("component:update", updateSelectedLabel);
      // Re-sync quick style when style changes on selected
      editor.on("style:change", () => {
        syncQuickStyleFromSelection();
      });
    })();

    return () => {
      gjsRef.current?.destroy();
      gjsRef.current = null;
    };
  }, [appendBaseBlocksCss, loadPost, mode, readPageStyles, registerCustomBlocks, syncLinkConfigFromSelection, syncQuickStyleFromSelection]);

  useEffect(() => {
    if (activeTab === "media" && mediaItems.length === 0 && !mediaLoading) {
      fetchMediaLibrary();
    }
  }, [activeTab, fetchMediaLibrary, mediaItems.length, mediaLoading]);

  const openTab = (tab: PanelTab) => {
    if (tab === "code") syncCodeFieldsSilently();
    if (tab === "media" && mediaItems.length === 0 && !mediaLoading) fetchMediaLibrary();
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const switchDevice = (d: Device) => {
    const map: Record<Device, string> = { desktop: "Desktop", tablet: "Tablet", mobile: "Mobile" };
    gjsRef.current?.setDevice(map[d]);
    setDevice(d);
  };

  const applyToSelected = (style: Record<string, string>) => {
    const editor = gjsRef.current;
    const selected = editor?.getSelected();
    if (!selected) { setInspectorTab("styles"); return; }
    selected.addStyle(style);
    setInspectorTab("styles");
    syncQuickStyleFromSelection();
  };

  const clearQuickStyles = () => {
    const editor = gjsRef.current;
    const selected = editor?.getSelected();
    if (!selected) { setInspectorTab("styles"); return; }
    selected.addStyle({
      color: "", "background-color": "", border: "",
      "border-radius": "", "box-shadow": "", padding: "",
    });
    syncQuickStyleFromSelection();
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
    const originalTagName = String(selected.get?.("tagName") || "").toLowerCase();
    const currentAttrs = { ...(selected.getAttributes?.() || selected.get?.("attributes") || {}) } as Record<string, string>;
    const relParts = new Set<string>();
    if (linkConfig.targetBlank) { relParts.add("noopener"); relParts.add("noreferrer"); }
    if (linkConfig.noFollow) relParts.add("nofollow");
    const nextAttrs: Record<string, string> = { ...currentAttrs, href };
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
    const childCount = typeof selected.components === "function" ? selected.components().length : 0;
    const currentStyle = (selected.getStyle?.() || {}) as Record<string, string>;
    const blockLikeTags = ["div", "section", "article", "main", "aside", "nav", "header", "footer", "ul", "ol", "li", "figure", "button", "picture", "img", "card"];
    const nextStyle: Record<string, string> = { cursor: "pointer" };
    if (!currentStyle.display && (blockLikeTags.includes(originalTagName) || childCount > 0)) {
      nextStyle.display = originalTagName === "img" ? "inline-block" : "block";
    }
    selected.addStyle(nextStyle);
    setInspectorTab("properties");
    setCodeNotice("Sélection rendue cliquable.");
    setTimeout(() => setCodeNotice(""), 2400);
    syncLinkConfigFromSelection();
  };

  const removeLinkFromSelected = () => {
    const selected = getSelectedComponent();
    if (!selected) { setInspectorTab("properties"); return; }
    const nextAttrs = { ...(selected.getAttributes?.() || selected.get?.("attributes") || {}) } as Record<string, string>;
    delete nextAttrs.href;
    delete nextAttrs.target;
    delete nextAttrs.rel;
    delete nextAttrs.download;
    selected.addAttributes?.(nextAttrs);
    selected.addStyle({ cursor: "" });
    setLinkConfig((prev) => ({ ...prev, href: "", targetBlank: false, noFollow: false, download: false }));
    setCodeNotice("Lien retiré de la sélection.");
    setTimeout(() => setCodeNotice(""), 2400);
  };

  const runCanvasJs = (js: string) => {
    const editor = gjsRef.current;
    if (!editor) return;
    const doc = editor.Canvas.getDocument();
    if (!doc) return;
    doc.querySelectorAll('script[data-runtime-custom-js="true"]').forEach((el) => el.remove());
    if (!js.trim()) return;
    const script = doc.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-runtime-custom-js", "true");
    script.text = js;
    doc.body.appendChild(script);
  };

  const applyCodeBundle = () => {
    const editor = gjsRef.current;
    if (!editor) return;
    try {
      if (importMode === "replace") {
        editor.setComponents(codeHtml.trim() || `<main></main>`);
        editor.setStyle(codeCss.trim() || "");
      } else {
        if (codeHtml.trim()) editor.addComponents(codeHtml);
        if (codeCss.trim()) {
          const currentCss = editor.getCss() || "";
          editor.setStyle(`${currentCss}\n\n${codeCss}`);
        }
      }
      appendBaseBlocksCss(editor);
      runCanvasJs(codeJs);
      setTimeout(() => { syncCodeFieldsSilently(); readPageStyles(); }, 0);
      setCodeNotice("Code importé dans l'éditeur.");
      setTimeout(() => setCodeNotice(""), 2500);
    } catch (error) {
      console.error(error);
      setCodeNotice("Erreur pendant l'import du code.");
      setTimeout(() => setCodeNotice(""), 2500);
    }
  };

  const fillExampleBodyDark = () => {
    setImportMode("replace");
    setCodeHtml(`<main class="demo-hero">
  <div class="demo-hero__content">
    <span class="demo-badge">MD2I Demo</span>
    <h1>Body édité avec HTML + CSS + JS</h1>
    <p>Ceci est un exemple injecté par copier-coller dans GrapesJS.</p>
    <div class="demo-actions">
      <button class="demo-btn" type="button">Cliquer</button>
      <a href="#" class="demo-link">Voir plus</a>
    </div>
    <div class="demo-grid">
      <article class="demo-card"><h3>Bloc 1</h3><p>Carte sombre avec accent orange.</p></article>
      <article class="demo-card"><h3>Bloc 2</h3><p>Exemple pratique pour tester le body.</p></article>
      <article class="demo-card"><h3>Bloc 3</h3><p>Vous pouvez ensuite l'éditer visuellement.</p></article>
    </div>
  </div>
</main>`);
    setCodeCss(`html,body{margin:0;min-height:100%}body{font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at top left,rgba(239,159,39,.20),transparent 28%),linear-gradient(180deg,#0b0b0e 0%,#111318 100%);color:#f2efea;padding:48px 24px}.demo-hero{max-width:1120px;margin:0 auto}.demo-hero__content{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:28px;padding:40px;box-shadow:0 24px 60px rgba(0,0,0,.30)}.demo-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(239,159,39,.10);color:#ef9f27;border:1px solid rgba(239,159,39,.22);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.demo-hero h1{margin:16px 0 10px;font-size:clamp(34px,6vw,64px);line-height:1.02;letter-spacing:-.04em}.demo-hero p{margin:0;max-width:760px;color:rgba(255,255,255,.74);font-size:17px;line-height:1.7}.demo-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:26px}.demo-btn,.demo-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:14px;text-decoration:none;font-weight:700}.demo-btn{border:none;background:linear-gradient(135deg,#ef9f27,#c97d15);color:#fff;cursor:pointer;box-shadow:0 12px 28px rgba(239,159,39,.24)}.demo-link{border:1px solid rgba(239,159,39,.24);background:rgba(239,159,39,.08);color:#ef9f27}.demo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:30px}.demo-card{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:18px;padding:20px}.demo-card h3{margin:0 0 8px;font-size:18px}.demo-card p{margin:0;font-size:14px;color:rgba(255,255,255,.66)}@media(max-width:840px){.demo-grid{grid-template-columns:1fr}.demo-hero__content{padding:24px}}`);
    setCodeJs(`document.querySelectorAll('.demo-btn').forEach((btn)=>{btn.addEventListener('click',()=>{alert('Bonjour depuis le canvas GrapesJS');});});`);
    setActiveTab("code");
  };

  const fillExampleBodyLight = () => {
    setImportMode("replace");
    setCodeHtml(`<section class="light-demo">
  <div class="light-demo__inner">
    <span class="light-demo__eyebrow">Exemple clair</span>
    <h2>Landing simple avec body clair</h2>
    <p>Cet exemple montre un body clair, une carte centrale et un bouton orange.</p>
    <button class="light-demo__btn" type="button">Tester le JS</button>
  </div>
</section>`);
    setCodeCss(`html,body{margin:0;min-height:100%}body{font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at top left,rgba(239,159,39,.12),transparent 24%),#f7f8fa;color:#181818;padding:56px 20px}.light-demo{max-width:920px;margin:0 auto}.light-demo__inner{background:#ffffff;border:1px solid rgba(0,0,0,.08);border-radius:26px;padding:42px;box-shadow:0 16px 40px rgba(15,23,42,.08)}.light-demo__eyebrow{display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(239,159,39,.10);color:#ef9f27;border:1px solid rgba(239,159,39,.20);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.light-demo h2{margin:16px 0 10px;font-size:clamp(30px,5vw,52px);line-height:1.04;letter-spacing:-.04em}.light-demo p{margin:0;color:rgba(0,0,0,.62);line-height:1.7;max-width:680px}.light-demo__btn{margin-top:24px;min-height:48px;padding:0 18px;border:none;border-radius:14px;background:linear-gradient(135deg,#ef9f27,#c97d15);color:#fff;font-weight:700;cursor:pointer}`);
    setCodeJs(`document.querySelectorAll('.light-demo__btn').forEach((btn)=>{btn.addEventListener('click',()=>{btn.textContent='JS exécuté';});});`);
    setActiveTab("code");
  };

  const undo = () => gjsRef.current?.UndoManager.undo();
  const redo = () => gjsRef.current?.UndoManager.redo();
  const preview = () => gjsRef.current?.runCommand("preview");
  const fullscr = () => gjsRef.current?.runCommand("fullscreen");
  const cleanHtml = () => gjsRef.current?.runCommand("core:canvas-clear");

  const handleSave = async (statusOverride?: "DRAFT" | "PUBLISHED") => {
    const editor = gjsRef.current;
    if (!editor) return;
    if (!meta.title || !meta.slug || !meta.authorId) { setSidebarOpen(true); return; }
    runCanvasJs(codeJs);
    syncCodeFieldsSilently();
    setSaveStatus("saving");
    const payload = {
      ...meta,
      ...(statusOverride && { status: statusOverride }),
      gjsComponents: editor.getComponents().toJSON(),
      gjsStyles: editor.getStyle(),
      gjsHtml: editor.getHtml(),
      gjsJs: codeJs,
    };
    try {
      const url = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Échec"); }
      const saved = await res.json();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
      if (mode === "create") router.push(`/admin/posts/${saved.id}/edit`);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
      alert(err instanceof Error ? err.message : "Erreur de sauvegarde");
    }
  };

  const handleTitleChange = (title: string) =>
    setMeta((p) => ({ ...p, title, slug: mode === "create" ? generateSlug(title) : p.slug }));

  // Helper: controlled style row for the quick style panel
  const StyleRow = ({
    label, prop, value, type = "text", placeholder = "",
    options,
  }: {
    label: string;
    prop: string;
    value: string;
    type?: "text" | "number" | "color" | "select";
    placeholder?: string;
    options?: { id: string; label: string }[];
  }) => {
    const handleChange = (v: string) => {
      setQuickStyle((prev) => ({ ...prev, [prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: v }));
      applyStyleProp(prop, v);
    };

    if (type === "select") {
      return (
        <div className="qs-row">
          <label className="qs-label">{label}</label>
          <select className="qs-input" value={value} onChange={(e) => handleChange(e.target.value)}>
            <option value="">—</option>
            {options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      );
    }

    if (type === "color") {
      return (
        <div className="qs-row">
          <label className="qs-label">{label}</label>
          <div className="qs-color-wrap">
            <input
              type="color"
              className="qs-color-swatch"
              value={value && value !== "transparent" ? value : "#000000"}
              onChange={(e) => handleChange(e.target.value)}
            />
            <input
              type="text"
              className="qs-input qs-input--color-text"
              value={value}
              placeholder="transparent / #hex / rgba"
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleChange(e.target.value)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="qs-row">
        <label className="qs-label">{label}</label>
        <input
          type={type}
          className="qs-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setQuickStyle((prev) => ({ ...prev, [prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: e.target.value }));
          }}
          onBlur={(e) => applyStyleProp(prop, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applyStyleProp(prop, (e.target as HTMLInputElement).value); }}
        />
      </div>
    );
  };

  return (
    <div className="ed-root">
      <header className="ed-topbar">
        <div className="ed-topbar__left">
          <button className="ed-icon-btn" onClick={() => router.push("/admin/posts")} title="Retour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <input
            className="ed-title-input"
            placeholder="Titre du post…"
            value={meta.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <span className={`ed-badge ed-badge--${meta.status.toLowerCase()}`}>
            {{ DRAFT: "Brouillon", PUBLISHED: "Publié", ARCHIVED: "Archivé" }[meta.status] ?? meta.status}
          </span>
        </div>

        <div className="ed-topbar__center">
          <div className="ed-device-row">
            {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
              <button key={d} className={`ed-device-btn ${device === d ? "is-active" : ""}`} onClick={() => switchDevice(d)} title={d}>
                {d === "desktop" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>}
                {d === "tablet" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="18" r=".5" fill="currentColor" /></svg>}
                {d === "mobile" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="18" r=".5" fill="currentColor" /></svg>}
              </button>
            ))}
          </div>
          <div className="ed-divider" />
          <button className="ed-icon-btn" onClick={undo} title="Annuler"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6" /><path d="M3.51 15A9 9 0 101.77 9.23L3 13" /></svg></button>
          <button className="ed-icon-btn" onClick={redo} title="Rétablir"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6" /><path d="M20.49 15A9 9 0 1122.23 9.23L21 13" /></svg></button>
          <div className="ed-divider" />
          <button className="ed-icon-btn" onClick={preview} title="Aperçu"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
          <button className="ed-icon-btn" onClick={fullscr} title="Plein écran"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg></button>
          <button className="ed-icon-btn" onClick={cleanHtml} title="Vider"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6m5 0V4h4v2" /></svg></button>
        </div>

        <div className="ed-topbar__right">
          {saveStatus !== "idle" && (
            <span className={`ed-save-tag ed-save-tag--${saveStatus}`}>
              {saveStatus === "saving" && "Sauvegarde…"}
              {saveStatus === "saved" && "✓ Sauvegardé"}
              {saveStatus === "error" && "✗ Erreur"}
            </span>
          )}
          <button className="ed-btn ed-btn--ghost" onClick={() => setSidebarOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></svg>
            Paramètres
          </button>
          <button className="ed-btn ed-btn--secondary" onClick={() => handleSave("DRAFT")} disabled={saveStatus === "saving"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
            Brouillon
          </button>
          <button className="ed-btn ed-btn--primary" onClick={() => handleSave("PUBLISHED")} disabled={saveStatus === "saving"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            {meta.status === "PUBLISHED" ? "Mettre à jour" : "Publier"}
          </button>
        </div>
      </header>

      <div className="ed-body ed-body--studio">
        <aside className="ed-left-rail">
          <div className="ed-left-rail__top">
            <button className="ed-rail-brand" onClick={() => openTab("blocks")} title="Blocs" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <button className={`ed-rail-code ${activeTab === "code" ? "is-active" : ""}`} onClick={() => openTab("code")} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              <span>Code</span>
            </button>
          </div>

          <div className="ed-rail-stack">
            {[
              { id: "blocks", title: "Blocs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
              { id: "layers", title: "Calques", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
              { id: "media", title: "Média", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 15l-5-5L5 20" /></svg> },
            ].map((item) => (
              <button key={item.id} type="button" className={`ed-rail-btn ${activeTab === item.id ? "is-active" : ""}`} onClick={() => openTab(item.id as PanelTab)} title={item.title}>
                {item.icon}
              </button>
            ))}
          </div>

          <div className="ed-rail-bottom">
            <button className="ed-rail-btn" type="button" onClick={() => setSidebarOpen(true)} title="Paramètres">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 0010 3.09V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
            </button>
            <button className="ed-rail-btn" type="button" onClick={cleanHtml} title="Vider">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6m5 0V4h4v2" /></svg>
            </button>
          </div>
        </aside>

        <aside className={`ed-left-drawer ${activeTab ? "is-open" : ""} ${activeTab === "code" ? "is-wide" : ""}`}>
          <div className="ed-left-drawer__head">
            <div>
              <span className="ed-left-drawer__eyebrow">Studio</span>
              <strong>
                {activeTab === "blocks" && "Blocs"}
                {activeTab === "layers" && "Calques"}
                {activeTab === "code" && "Code personnalisé"}
                {activeTab === "media" && "Médiathèque"}
              </strong>
            </div>
            <button className="ed-left-drawer__close" type="button" onClick={() => setActiveTab(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div id="ed-blocks" className={`ed-panel ${activeTab === "blocks" ? "is-visible" : ""}`} />
          <div id="ed-layers" className={`ed-panel ${activeTab === "layers" ? "is-visible" : ""}`} />

          <div className={`ed-panel ${activeTab === "media" ? "is-visible" : ""}`}>
            <div className="ed-media-shell">
              <div className="ed-media-head">
                <div>
                  <h3 className="ed-code-title">Médiathèque</h3>
                  <p className="ed-code-subtitle">Upload, chargement et insertion rapide dans GrapesJS</p>
                </div>
                <button type="button" className="ed-code-primary" onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia}>
                  {uploadingMedia ? "Upload…" : "Uploader"}
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  hidden
                  onChange={(e) => handleMediaUpload(e.target.files?.[0] || null)}
                />
              </div>

              <div className="ed-media-toolbar">
                <input
                  className="ed-media-search"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Rechercher un fichier..."
                />
                <div className="ed-media-filters">
                  {(["all", "image", "video", "file"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`ed-switch-btn ${mediaFilter === value ? "is-active" : ""}`}
                      onClick={() => setMediaFilter(value)}
                    >
                      {value === "all" ? "Tous" : value === "image" ? "Images" : value === "video" ? "Vidéos" : "Fichiers"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ed-media-actions">
                <button type="button" className="ed-code-secondary" onClick={fetchMediaLibrary} disabled={mediaLoading}>
                  {mediaLoading ? "Chargement…" : "Rafraîchir"}
                </button>
                {mediaNotice && <span className="ed-media-notice">{mediaNotice}</span>}
              </div>

              {mediaError && <div className="ed-media-error">{mediaError}</div>}

              <div className="ed-media-grid">
                {filteredMediaItems.map((item) => (
                  <div key={item.id} className="ed-media-card">
                    <div className="ed-media-preview">
                      {item.kind === "image" ? (
                        <img src={item.url} alt={item.name} />
                      ) : item.kind === "video" ? (
                        <video src={item.url} muted playsInline preload="metadata" />
                      ) : (
                        <div className="ed-media-file">📎</div>
                      )}
                    </div>
                    <div className="ed-media-card__body">
                      <div className="ed-media-name" title={item.name}>{item.name}</div>
                      <div className="ed-media-meta">{item.kind.toUpperCase()}</div>
                      <div className="ed-media-card__actions">
                        <button type="button" className="ed-media-btn ed-media-btn--primary" onClick={() => insertMediaIntoEditor(item, "insert")}>Insérer</button>
                        <button type="button" className="ed-media-btn" onClick={() => insertMediaIntoEditor(item, "open")}>Lien ouvrir</button>
                        <button type="button" className="ed-media-btn" onClick={() => insertMediaIntoEditor(item, "download")}>Lien télécharger</button>
                      </div>
                    </div>
                  </div>
                ))}

                {!mediaLoading && filteredMediaItems.length === 0 && (
                  <div className="ed-media-empty">Aucun média trouvé.</div>
                )}
              </div>
            </div>
          </div>

          <div className={`ed-panel ${activeTab === "code" ? "is-visible" : ""}`}>
            <div className="ed-code-shell">
              <div className="ed-code-card">
                <div className="ed-code-head">
                  <div>
                    <h3 className="ed-code-title">Importer HTML / CSS / JS</h3>
                    <p className="ed-code-subtitle">Collez votre code puis appliquez-le dans l'éditeur</p>
                  </div>
                </div>
                <div className="ed-import-switch">
                  <button type="button" className={`ed-switch-btn ${importMode === "append" ? "is-active" : ""}`} onClick={() => setImportMode("append")}>Ajouter</button>
                  <button type="button" className={`ed-switch-btn ${importMode === "replace" ? "is-active" : ""}`} onClick={() => setImportMode("replace")}>Remplacer</button>
                </div>
                <div className="ed-code-field">
                  <label>HTML</label>
                  <textarea value={codeHtml} onChange={(e) => setCodeHtml(e.target.value)} placeholder="<section>...</section>" rows={9} />
                </div>
                <div className="ed-code-field">
                  <label>CSS</label>
                  <textarea value={codeCss} onChange={(e) => setCodeCss(e.target.value)} placeholder="body { margin: 0; }" rows={9} />
                </div>
                <div className="ed-code-field">
                  <label>JS</label>
                  <textarea value={codeJs} onChange={(e) => setCodeJs(e.target.value)} placeholder="document.querySelector(...)" rows={8} />
                </div>
                <div className="ed-code-actions">
                  <button type="button" className="ed-code-primary" onClick={applyCodeBundle}>Appliquer le code</button>
                  <button type="button" className="ed-code-secondary" onClick={() => { setCodeHtml(""); setCodeCss(""); setCodeJs(""); setCodeNotice(""); }}>Vider</button>
                </div>
                {codeNotice && <p className="ed-code-notice">{codeNotice}</p>}
              </div>

              <div className="ed-code-card">
                <div className="ed-code-head">
                  <div>
                    <h3 className="ed-code-title">Exemples rapides</h3>
                    <p className="ed-code-subtitle">Chargez un exemple puis cliquez sur "Appliquer le code"</p>
                  </div>
                </div>
                <div className="ed-example-list">
                  <button type="button" className="ed-example-btn" onClick={fillExampleBodyDark}>Exemple body sombre</button>
                  <button type="button" className="ed-example-btn" onClick={fillExampleBodyLight}>Exemple body clair</button>
                </div>
                <div className="ed-example-note">
                  Astuce : mettez le mode sur <strong>Remplacer</strong> pour tester un template complet, ou sur <strong>Ajouter</strong> pour injecter seulement une section.
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="ed-canvas-area">
          {!isReady && (
            <div className="ed-splash">
              <div className="ed-splash__ring" />
              <p>Chargement de l'éditeur…</p>
            </div>
          )}
          <div ref={mountRef} className="ed-mount" />
        </main>

        <aside className="ed-rightbar">
          <div className="ed-rightbar__tabs">
            <button type="button" className={`ed-rightbar__tab ${inspectorTab === "styles" ? "is-active" : ""}`} onClick={() => setInspectorTab("styles")}>Styles</button>
            <button type="button" className={`ed-rightbar__tab ${inspectorTab === "properties" ? "is-active" : ""}`} onClick={() => setInspectorTab("properties")}>Properties</button>
          </div>

          <div className="ed-rightbar__body">
            {/* ── STYLES PANEL ── */}
            <div className={`ed-inspector-panel ${inspectorTab === "styles" ? "is-visible" : ""}`}>
              <div className="ed-style-shell">

                {/* Page / Body global */}
                <div className="ed-global-card">
                  <div className="ed-global-card__head">
                    <div>
                      <h3 className="ed-global-card__title">Page / Body</h3>
                      <p className="ed-global-card__subtitle">Style global de la page exportée</p>
                    </div>
                    <button type="button" className="ed-global-reset" onClick={resetPageStyles}>Reset</button>
                  </div>
                  <div className="ed-global-presets">
                    <button type="button" className="ed-global-preset" onClick={() => applyPagePreset("light")}>Clair</button>
                    <button type="button" className="ed-global-preset" onClick={() => applyPagePreset("dark")}>Sombre</button>
                    <button type="button" className="ed-global-preset" onClick={() => applyPagePreset("warm")}>Warm</button>
                  </div>
                  <div className="ed-global-grid">
                    <div className="ed-global-field">
                      <label>Fond page</label>
                      <div className="qs-color-wrap">
                        <input type="color" className="qs-color-swatch" value={pageSettings.backgroundColor && pageSettings.backgroundColor !== "transparent" ? pageSettings.backgroundColor : "#ffffff"} onChange={(e) => applyPageStyles({ backgroundColor: e.target.value })} />
                        <input className="ed-global-input" value={pageSettings.backgroundColor} onChange={(e) => setPageSettings((p) => ({ ...p, backgroundColor: e.target.value }))} onBlur={() => applyPageStyles({ backgroundColor: pageSettings.backgroundColor })} placeholder="#FFFFFF" />
                      </div>
                    </div>
                    <div className="ed-global-field">
                      <label>Couleur texte</label>
                      <div className="qs-color-wrap">
                        <input type="color" className="qs-color-swatch" value={pageSettings.textColor && pageSettings.textColor !== "transparent" ? pageSettings.textColor : "#181818"} onChange={(e) => applyPageStyles({ textColor: e.target.value })} />
                        <input className="ed-global-input" value={pageSettings.textColor} onChange={(e) => setPageSettings((p) => ({ ...p, textColor: e.target.value }))} onBlur={() => applyPageStyles({ textColor: pageSettings.textColor })} placeholder="#181818" />
                      </div>
                    </div>
                    <div className="ed-global-field">
                      <label>Police globale</label>
                      <select className="ed-global-input" value={pageSettings.fontFamily} onChange={(e) => applyPageStyles({ fontFamily: e.target.value })}>
                        <option value="Inter, Arial, sans-serif">Inter</option>
                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                        <option value="system-ui, sans-serif">System UI</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="ui-monospace, monospace">Monospace</option>
                      </select>
                    </div>
                    <div className="ed-global-field">
                      <label>Largeur max</label>
                      <div className="ed-global-inline">
                        <input type="range" min="720" max="1600" step="10" value={pageSettings.maxWidth} onChange={(e) => applyPageStyles({ maxWidth: Number(e.target.value) })} />
                        <span>{pageSettings.maxWidth}px</span>
                      </div>
                    </div>
                    <div className="ed-global-field">
                      <label>Padding X</label>
                      <div className="ed-global-inline">
                        <input type="range" min="0" max="120" step="2" value={pageSettings.paddingX} onChange={(e) => applyPageStyles({ paddingX: Number(e.target.value) })} />
                        <span>{pageSettings.paddingX}px</span>
                      </div>
                    </div>
                    <div className="ed-global-field">
                      <label>Padding Y</label>
                      <div className="ed-global-inline">
                        <input type="range" min="0" max="160" step="2" value={pageSettings.paddingY} onChange={(e) => applyPageStyles({ paddingY: Number(e.target.value) })} />
                        <span>{pageSettings.paddingY}px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected element info + selector */}
                <div className="ed-style-topcard">
                  <div className="ed-style-topcard__row">
                    <span className="ed-style-kicker">Sélection</span>
                    <span className="ed-style-pill">{selectedName}</span>
                  </div>
                  <div id="ed-style-selectors" className="ed-style-selectors" />
                </div>

                {/* ── Quick Style Editor (replaces color chips) ── */}
                <div className="ed-quick-card">
                  <div className="ed-quick-head">
                    <span>Édition rapide — Typographie</span>
                    <button type="button" className="ed-mini-reset" onClick={clearQuickStyles}>Réinitialiser</button>
                  </div>
                  <div className="qs-grid">
                    <StyleRow label="Taille police" prop="font-size" value={quickStyle.fontSize} placeholder="16px / 1rem" />
                    <StyleRow label="Graisse" prop="font-weight" value={quickStyle.fontWeight} type="select"
                      options={[
                        { id: "300", label: "Light 300" }, { id: "400", label: "Normal 400" },
                        { id: "500", label: "Medium 500" }, { id: "600", label: "Semibold 600" },
                        { id: "700", label: "Bold 700" }, { id: "800", label: "Extrabold 800" },
                      ]}
                    />
                    <StyleRow label="Hauteur ligne" prop="line-height" value={quickStyle.lineHeight} placeholder="1.5" />
                    <StyleRow label="Espacement" prop="letter-spacing" value={quickStyle.letterSpacing} placeholder="0.04em" />
                    <StyleRow label="Couleur texte" prop="color" value={quickStyle.color} type="color" />
                    <StyleRow label="Alignement" prop="text-align" value={quickStyle.display} type="select"
                      options={[
                        { id: "left", label: "Gauche" }, { id: "center", label: "Centre" },
                        { id: "right", label: "Droite" }, { id: "justify", label: "Justifié" },
                      ]}
                    />
                  </div>
                </div>

                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Couleur de fond & bordure</span></div>
                  <div className="qs-grid">
                    <StyleRow label="Fond" prop="background-color" value={quickStyle.backgroundColor} type="color" />
                    <StyleRow label="Couleur bordure" prop="border-color" value={quickStyle.borderColor} type="color" />
                    <StyleRow label="Épaisseur bordure" prop="border-width" value={quickStyle.borderWidth} placeholder="1px" />
                    <StyleRow label="Style bordure" prop="border-style" value={""} type="select"
                      options={[
                        { id: "none", label: "Aucune" }, { id: "solid", label: "Solide" },
                        { id: "dashed", label: "Tirets" }, { id: "dotted", label: "Points" },
                      ]}
                    />
                    <StyleRow label="Border radius" prop="border-radius" value={quickStyle.borderRadius} placeholder="8px / 999px" />
                  </div>
                  <div className="ed-radius-row">
                    {["0px", "8px", "14px", "22px", "999px"].map((radius) => (
                      <button type="button" key={radius} className="ed-radius-btn" onClick={() => applyToSelected({ "border-radius": radius })}>
                        {radius === "999px" ? "Pill" : radius}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Dimensions</span></div>
                  <div className="qs-grid">
                    <StyleRow label="Largeur" prop="width" value={quickStyle.width} placeholder="auto / 100% / 320px" />
                    <StyleRow label="Hauteur" prop="height" value={quickStyle.height} placeholder="auto / 200px" />
                    <StyleRow label="Min-width" prop="min-width" value={quickStyle.minWidth} placeholder="0" />
                    <StyleRow label="Min-height" prop="min-height" value={quickStyle.minHeight} placeholder="0" />
                    <StyleRow label="Max-width" prop="max-width" value={quickStyle.maxWidth} placeholder="1200px" />
                  </div>
                </div>

                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Margin</span></div>
                  <div className="qs-grid qs-grid--4">
                    <StyleRow label="↑ Haut" prop="margin-top" value={quickStyle.marginTop} placeholder="0" />
                    <StyleRow label="→ Droite" prop="margin-right" value={quickStyle.marginRight} placeholder="0" />
                    <StyleRow label="↓ Bas" prop="margin-bottom" value={quickStyle.marginBottom} placeholder="0" />
                    <StyleRow label="← Gauche" prop="margin-left" value={quickStyle.marginLeft} placeholder="0" />
                  </div>
                  <div className="qs-shortcut-row">
                    {["0px", "4px", "8px", "16px", "24px", "auto"].map((v) => (
                      <button key={v} type="button" className="qs-shortcut-btn" onClick={() => applyToSelected({ "margin-top": v, "margin-right": v, "margin-bottom": v, "margin-left": v })}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Padding</span></div>
                  <div className="qs-grid qs-grid--4">
                    <StyleRow label="↑ Haut" prop="padding-top" value={quickStyle.paddingTop} placeholder="0" />
                    <StyleRow label="→ Droite" prop="padding-right" value={quickStyle.paddingRight} placeholder="0" />
                    <StyleRow label="↓ Bas" prop="padding-bottom" value={quickStyle.paddingBottom} placeholder="0" />
                    <StyleRow label="← Gauche" prop="padding-left" value={quickStyle.paddingLeft} placeholder="0" />
                  </div>
                  <div className="qs-shortcut-row">
                    {["0px", "4px", "8px", "12px", "16px", "24px"].map((v) => (
                      <button key={v} type="button" className="qs-shortcut-btn" onClick={() => applyToSelected({ "padding-top": v, "padding-right": v, "padding-bottom": v, "padding-left": v })}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Layout & Effets</span></div>
                  <div className="qs-grid">
                    <StyleRow label="Display" prop="display" value={quickStyle.display} type="select"
                      options={[
                        { id: "block", label: "Block" }, { id: "inline-block", label: "Inline-block" },
                        { id: "flex", label: "Flex" }, { id: "inline-flex", label: "Inline-flex" },
                        { id: "grid", label: "Grid" }, { id: "none", label: "None" },
                      ]}
                    />
                    <StyleRow label="Flex dir." prop="flex-direction" value={quickStyle.flexDirection} type="select"
                      options={[
                        { id: "row", label: "Row →" }, { id: "column", label: "Column ↓" },
                        { id: "row-reverse", label: "Row ←" }, { id: "column-reverse", label: "Column ↑" },
                      ]}
                    />
                    <StyleRow label="Justify" prop="justify-content" value={quickStyle.justifyContent} type="select"
                      options={[
                        { id: "flex-start", label: "Début" }, { id: "center", label: "Centre" },
                        { id: "flex-end", label: "Fin" }, { id: "space-between", label: "Space-between" },
                        { id: "space-around", label: "Space-around" },
                      ]}
                    />
                    <StyleRow label="Align" prop="align-items" value={quickStyle.alignItems} type="select"
                      options={[
                        { id: "flex-start", label: "Début" }, { id: "center", label: "Centre" },
                        { id: "flex-end", label: "Fin" }, { id: "stretch", label: "Stretch" },
                      ]}
                    />
                    <StyleRow label="Gap" prop="gap" value={quickStyle.gap} placeholder="16px" />
                    <StyleRow label="Opacité" prop="opacity" value={quickStyle.opacity} placeholder="1" />
                    <StyleRow label="Z-index" prop="z-index" value={quickStyle.zIndex} placeholder="1" />
                  </div>
                </div>

                {/* Presets visuels */}
                <div className="ed-quick-card">
                  <div className="ed-quick-head"><span>Presets visuels</span></div>
                  <div className="ed-preset-grid">
                    <button type="button" className="ed-preset-btn" onClick={() => applyToSelected({ "background-color": ORANGE, color: "#ffffff", border: `1px solid ${ORANGE}`, padding: "12px 18px", "border-radius": "14px" })}>Accent</button>
                    <button type="button" className="ed-preset-btn" onClick={() => applyToSelected({ "background-color": dark ? "#131318" : "#ffffff", color: dark ? "#F2EFEA" : "#181818", border: `1px solid ${colors.borderStrong}`, padding: "12px 18px", "border-radius": "14px" })}>Carte</button>
                    <button type="button" className="ed-preset-btn" onClick={() => applyToSelected({ "background-color": "transparent", color: ORANGE, border: `1px solid rgba(239,159,39,.28)`, padding: "12px 18px", "border-radius": "999px" })}>Outline</button>
                    <button type="button" className="ed-preset-btn" onClick={() => applyToSelected({ "box-shadow": dark ? "0 12px 28px rgba(0,0,0,.32)" : "0 10px 22px rgba(15,23,42,.10)", "border-radius": "18px" })}>Ombre</button>
                  </div>
                </div>

                {/* GrapesJS native style manager */}
                <div className="ed-gjs-style-label">Propriétés avancées (GrapesJS)</div>
                <div id="ed-styles-fields" className="ed-style-fields" />
              </div>
            </div>

            {/* ── PROPERTIES PANEL ── */}
            <div className={`ed-inspector-panel ${inspectorTab === "properties" ? "is-visible" : ""}`}>
              <div className="ed-props-shell">
                <div className="ed-style-topcard">
                  <div className="ed-style-topcard__row">
                    <span className="ed-style-kicker">Sélection</span>
                    <span className="ed-style-pill">{selectedName}</span>
                  </div>
                  <p className="ed-props-note">Propriétés, attributs et options du composant sélectionné.</p>
                </div>

                <div className="ed-link-card">
                  <div className="ed-link-card__head">
                    <h3 className="ed-link-card__title">Lien rapide</h3>
                    <p className="ed-link-card__subtitle">Rends n'importe quel élément cliquable depuis ce panneau.</p>
                  </div>
                  <div className="ed-link-field">
                    <label>URL / ancre</label>
                    <input value={linkConfig.href} onChange={(e) => setLinkConfig((prev) => ({ ...prev, href: e.target.value }))} placeholder="https://... ou #section" />
                  </div>
                  <div className="ed-link-field">
                    <label>Titre du lien</label>
                    <input value={linkConfig.title} onChange={(e) => setLinkConfig((prev) => ({ ...prev, title: e.target.value }))} placeholder="Texte d'aide facultatif" />
                  </div>
                  <label className="ed-link-check">
                    <input type="checkbox" checked={linkConfig.targetBlank} onChange={(e) => setLinkConfig((prev) => ({ ...prev, targetBlank: e.target.checked }))} />
                    <span>Ouvrir dans un nouvel onglet</span>
                  </label>
                  <label className="ed-link-check">
                    <input type="checkbox" checked={linkConfig.noFollow} onChange={(e) => setLinkConfig((prev) => ({ ...prev, noFollow: e.target.checked }))} />
                    <span>Ajouter <code>nofollow</code></span>
                  </label>
                  <label className="ed-link-check">
                    <input type="checkbox" checked={linkConfig.download} onChange={(e) => setLinkConfig((prev) => ({ ...prev, download: e.target.checked }))} />
                    <span>Forcer le téléchargement</span>
                  </label>
                  <div className="ed-link-actions">
                    <button type="button" className="ed-link-primary" onClick={applyLinkToSelected}>Rendre cliquable</button>
                    <button type="button" className="ed-link-secondary" onClick={removeLinkFromSelected}>Retirer le lien</button>
                  </div>
                  <p className="ed-link-help">Sélectionne un bloc, une image, un bouton, un texte ou une carte, puis applique le lien.</p>
                </div>

                <div id="ed-traits" className="ed-props-host" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <PostMetaSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        meta={meta}
        onMetaChange={setMeta}
        onTitleChange={handleTitleChange}
        postId={postId}
      />

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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

        html, body { font-family: var(--font); background: var(--ed-shell); color: var(--ed-text); margin: 0; }

        .ed-root {
          display: flex; flex-direction: column; height: 100vh; overflow: hidden;
          background: ${dark ? "radial-gradient(circle at top left,rgba(242,140,24,.12),transparent 30%),#151922" : "linear-gradient(180deg,#FFF7EE 0%,#FFFDF9 16%,#F7F8FA 100%)"};
        }

        .ed-topbar {
          display: flex; align-items: center; gap: 12px; padding: 0 12px;
          height: 46px; min-height: 46px;
          background: ${dark ? "#181D27" : "#FFFFFF"};
          border-bottom: 1px solid var(--ed-border);
          backdrop-filter: blur(12px); z-index: 60; position: relative;
          box-shadow: var(--shadow-sm);
        }
        .ed-topbar__left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; max-width: 36%; }
        .ed-topbar__center { display: flex; align-items: center; gap: 4px; }
        .ed-topbar__right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .ed-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: var(--ed-shell-soft); border: 1px solid var(--ed-border);
          border-radius: 10px; color: var(--ed-text-soft); cursor: pointer;
          transition: all 0.15s ease; flex-shrink: 0;
        }
        .ed-icon-btn:hover { color: var(--ed-accent); border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); transform: translateY(-1px); }

        .ed-title-input {
          background: ${dark ? "#202634" : "#FFFFFF"}; border: 1px solid var(--ed-border); outline: none;
          font-family: var(--font); font-size: 14px; font-weight: 700; color: var(--ed-text);
          min-width: 0; flex: 1; max-width: 220px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; padding: 0 10px; border-radius: 8px; height: 32px; transition: all 0.15s ease;
        }
        .ed-title-input:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 4px rgba(239,159,39,.10); }
        .ed-title-input::placeholder { color: var(--ed-text-mute); font-weight: 500; }

        .ed-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 8px; border-radius: 8px; border: 1px solid; flex-shrink: 0; }
        .ed-badge--draft { color: var(--ed-text-soft); border-color: var(--ed-border); background: var(--ed-shell-soft); }
        .ed-badge--published { color: var(--ed-success); border-color: rgba(34,197,94,.24); background: rgba(34,197,94,.10); }
        .ed-badge--archived { color: var(--ed-warning); border-color: rgba(251,146,60,.24); background: rgba(251,146,60,.10); }

        .ed-device-row { display: flex; gap: 0; padding: 0; border-radius: 8px; background: transparent; border: none; box-shadow: none; }
        .ed-device-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 30px; border-radius: 8px; border: 1px solid var(--ed-border); background: ${dark ? "#202634" : "#F7F8FC"}; color: var(--ed-text-soft); cursor: pointer; transition: all 0.15s ease; }
        .ed-device-btn:hover { color: var(--ed-accent); background: var(--ed-accent-soft); }
        .ed-device-btn.is-active { color: var(--ed-accent); background: var(--ed-accent-soft); box-shadow: inset 0 0 0 1px var(--ed-accent-soft-border); }

        .ed-divider { width: 1px; height: 20px; background: var(--ed-border); margin: 0 4px; }

        .ed-save-tag { font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 999px; white-space: nowrap; }
        .ed-save-tag--saving { color: var(--ed-text-soft); background: var(--ed-shell-soft); }
        .ed-save-tag--saved { color: var(--ed-success); background: rgba(34,197,94,.10); }
        .ed-save-tag--error { color: var(--ed-danger); background: rgba(239,68,68,.10); }

        .ed-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; border: 1px solid; }
        .ed-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .ed-btn--ghost { background: var(--ed-shell-soft); border-color: var(--ed-border); color: var(--ed-text-soft); }
        .ed-btn--ghost:hover { color: var(--ed-accent); border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); }
        .ed-btn--secondary { background: var(--ed-shell-soft); border-color: var(--ed-border); color: var(--ed-text); }
        .ed-btn--secondary:hover:not(:disabled) { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); }
        .ed-btn--primary { background: linear-gradient(135deg,var(--ed-accent),var(--ed-accent-dark)); border-color: rgba(255,255,255,.08); color: #fff; font-weight: 700; box-shadow: 0 10px 22px rgba(242,140,24,.28); }
        .ed-btn--primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(242,140,24,.32); }

        .ed-body--studio {
          display: grid; grid-template-columns: 56px auto 1fr 340px;
          height: calc(100vh - 46px);
        }

        .ed-left-rail {
          background: ${dark ? "#171B24" : "#F7F8FC"};
          border-right: 1px solid rgba(255,255,255,.08);
          display: flex; flex-direction: column; align-items: center;
          justify-content: space-between; padding: 8px 6px 10px; gap: 12px;
        }
        .ed-left-rail__top, .ed-rail-stack, .ed-rail-bottom { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }

        .ed-rail-brand, .ed-rail-btn {
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; border: 1px solid var(--ed-border);
          background: ${dark ? "#202634" : "#FFFFFF"}; color: var(--ed-text-soft); cursor: pointer; transition: all .16s ease;
        }
        .ed-rail-brand:hover, .ed-rail-btn:hover { border-color: rgba(242,140,24,.4); color: var(--ed-accent); background: rgba(242,140,24,.12); }
        .ed-rail-btn.is-active { background: linear-gradient(180deg,rgba(242,140,24,.24),rgba(242,140,24,.10)); color: var(--ed-accent); border-color: rgba(242,140,24,.48); }

        .ed-rail-code {
          width: 38px; min-height: 38px; padding: 0; overflow: hidden; border-radius: 10px;
          border: 1px solid var(--ed-border); background: ${dark ? "#202634" : "#FFFFFF"};
          color: var(--ed-text-soft); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .16s ease;
        }
        .ed-rail-code span { display: none; }
        .ed-rail-code:hover { border-color: rgba(242,140,24,.4); color: var(--ed-accent); background: rgba(242,140,24,.12); }
        .ed-rail-code.is-active { background: linear-gradient(180deg,rgba(242,140,24,.24),rgba(242,140,24,.10)); color: var(--ed-accent); border-color: rgba(242,140,24,.48); }

        .ed-left-drawer {
          width: 0; min-width: 0; overflow: hidden;
          background: var(--ed-panel); border-right: 1px solid rgba(255,255,255,.08);
          transition: width .18s ease, min-width .18s ease;
        }
        .ed-left-drawer.is-open { width: 300px; min-width: 300px; }
        .ed-left-drawer.is-wide { width: 430px; min-width: 430px; }

        .ed-left-drawer__head {
          height: 54px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 14px; border-bottom: 1px solid var(--ed-border);
          background: ${dark ? "#202634" : "#F7F8FC"};
        }
        .ed-left-drawer__eyebrow { display: block; font-size: 10px; line-height: 1; text-transform: uppercase; letter-spacing: .08em; color: var(--ed-text-mute); margin-bottom: 6px; }
        .ed-left-drawer__head strong { font-size: 13px; color: var(--ed-text); }
        .ed-left-drawer__close {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--ed-border);
          background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text-soft);
          display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .ed-panel { display: none; height: 100%; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(239,159,39,.18) transparent; background: transparent; }
        .ed-panel.is-visible { display: block; }

        .ed-canvas-area { background: ${dark ? "#111722" : "#EEF2F7"}; position: relative; overflow: hidden; padding: 18px; }
        .ed-mount { width: 100%; height: 100%; border-radius: 26px; overflow: hidden; box-shadow: ${dark ? "0 26px 60px rgba(0,0,0,.34)" : "0 26px 60px rgba(15,23,42,.10)"}; border: 1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.08)"}; }

        .ed-splash {
          position: absolute; inset: 0; background: ${dark ? "rgba(11,11,14,.82)" : "rgba(245,247,251,.88)"};
          display: flex; flex-direction: row; align-items: center; justify-content: center;
          z-index: 50; gap: 14px; color: var(--ed-text-soft); font-size: 13px; backdrop-filter: blur(4px);
        }
        .ed-splash__ring { width: 38px; height: 38px; border: 3px solid ${dark ? "rgba(255,255,255,.14)" : "#dbe5f0"}; border-top-color: var(--ed-accent); border-radius: 50%; animation: gjs-spin 0.75s linear infinite; }

        .ed-rightbar { width: 340px; min-width: 340px; background: var(--ed-panel); border-left: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; overflow: hidden; }
        .ed-rightbar__tabs { display: grid; grid-template-columns: 1fr 1fr; background: ${dark ? "#171D27" : "#FFFFFF"}; border-bottom: 1px solid var(--ed-border); }
        .ed-rightbar__tab { height: 38px; border: none; border-bottom: 2px solid transparent; background: transparent; color: var(--ed-text-soft); font-size: 13px; font-weight: 600; cursor: pointer; }
        .ed-rightbar__tab.is-active { color: var(--ed-text); border-bottom-color: var(--ed-accent); background: linear-gradient(180deg,rgba(242,140,24,.10),transparent); }
        .ed-rightbar__body { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(239,159,39,.18) transparent; }

        .ed-inspector-panel { display: none; min-height: 100%; }
        .ed-inspector-panel.is-visible { display: block; }

        .ed-style-shell { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ed-props-shell { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ed-props-host { min-height: 240px; }
        .ed-props-note { margin-top: 8px; font-size: 12px; line-height: 1.55; color: var(--ed-text-soft); }

        .ed-style-topcard, .ed-quick-card, .ed-global-card {
          background: var(--ed-panel); border: 1px solid var(--ed-border);
          border-radius: 12px; box-shadow: var(--shadow-sm); overflow: hidden;
        }
        .ed-style-topcard { padding: 14px; }
        .ed-style-topcard__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
        .ed-style-kicker { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ed-text-mute); }
        .ed-style-pill { font-size: 11px; font-weight: 700; color: var(--ed-accent); background: var(--ed-accent-soft); border: 1px solid var(--ed-accent-soft-border); border-radius: 999px; padding: 4px 10px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ed-quick-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px 8px; color: var(--ed-text); font-size: 12px; font-weight: 700; }
        .ed-mini-reset { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text-soft); padding: 5px 9px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.15s ease; }
        .ed-mini-reset:hover { color: var(--ed-accent); border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); }

        /* ── Quick Style Grid ── */
        .qs-grid { display: grid; grid-template-columns: 1fr; gap: 0; padding: 0 10px 10px; }
        .qs-grid--4 { grid-template-columns: 1fr 1fr; }
        .qs-row { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; border-bottom: 1px solid var(--ed-border); }
        .qs-row:last-child { border-bottom: none; }
        .qs-label { font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--ed-text-mute); }
        .qs-input {
          width: 100%; min-height: 30px; border: 1px solid var(--ed-border);
          background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text);
          border-radius: 8px; padding: 0 8px; font-family: var(--font); font-size: 12px; outline: none; transition: border-color .15s ease;
        }
        .qs-input:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 3px rgba(239,159,39,.10); }
        .qs-color-wrap { display: flex; align-items: center; gap: 6px; }
        .qs-color-swatch {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--ed-border);
          padding: 2px; cursor: pointer; background: transparent; flex-shrink: 0;
        }
        .qs-input--color-text { flex: 1; }
        .qs-shortcut-row { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 10px 10px; }
        .qs-shortcut-btn { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text-soft); border-radius: 6px; padding: 4px 7px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s ease; }
        .qs-shortcut-btn:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }

        .ed-preset-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 7px; padding: 0 10px 10px; }
        .ed-preset-btn { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); border-radius: 10px; padding: 10px 12px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.15s ease; }
        .ed-preset-btn:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }

        .ed-radius-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 10px 10px; }
        .ed-radius-btn { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.15s ease; }
        .ed-radius-btn:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }

        .ed-gjs-style-label { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--ed-text-mute); padding: 8px 10px 4px; }
        .ed-style-fields { min-height: 120px; }

        .ed-global-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px; border-bottom: 1px solid var(--ed-border); }
        .ed-global-card__title { margin: 0; font-size: 13px; font-weight: 700; color: var(--ed-text); }
        .ed-global-card__subtitle { margin: 3px 0 0; font-size: 11px; color: var(--ed-text-soft); line-height: 1.5; }
        .ed-global-reset { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text-soft); border-radius: 8px; padding: 6px 9px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.15s ease; }
        .ed-global-reset:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }
        .ed-global-presets { display: flex; gap: 6px; padding: 10px 10px 0; }
        .ed-global-preset { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); border-radius: 10px; padding: 8px 12px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.15s ease; }
        .ed-global-preset:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }
        .ed-global-grid { display: grid; grid-template-columns: 1fr; gap: 10px; padding: 10px; }
        .ed-global-field { display: flex; flex-direction: column; gap: 6px; }
        .ed-global-field label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ed-text-mute); }
        .ed-global-input { width: 100%; border: 1px solid var(--ed-border); background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text); border-radius: 8px; padding: 7px 10px; font-family: var(--font); font-size: 12px; outline: none; transition: all 0.15s ease; }
        .ed-global-input:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 3px rgba(239,159,39,.10); }
        .ed-global-inline { display: flex; align-items: center; gap: 8px; }
        .ed-global-inline input[type="range"] { flex: 1; accent-color: var(--ed-accent); }
        .ed-global-inline span { min-width: 50px; text-align: right; color: var(--ed-text-soft); font-size: 11px; font-weight: 600; }

        .ed-code-shell { padding: 12px 10px 18px; display: flex; flex-direction: column; gap: 10px; }
        .ed-code-card { background: var(--ed-panel); border: 1px solid var(--ed-border); border-radius: 14px; padding: 14px; box-shadow: var(--shadow-sm); }
        .ed-code-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .ed-code-title { margin: 0; font-size: 13px; font-weight: 700; color: var(--ed-text); }
        .ed-code-subtitle { margin: 4px 0 0; font-size: 11px; color: var(--ed-text-soft); line-height: 1.5; }
        .ed-import-switch { display: flex; gap: 6px; margin-bottom: 12px; }
        .ed-switch-btn { flex: 1; border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text-soft); border-radius: 10px; padding: 9px 12px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.15s ease; }
        .ed-switch-btn.is-active, .ed-switch-btn:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }
        .ed-code-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .ed-code-field label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ed-text-mute); }
        .ed-code-field textarea { width: 100%; border: 1px solid var(--ed-border); background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text); border-radius: 10px; padding: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.65; resize: vertical; outline: none; transition: all 0.15s ease; }
        .ed-code-field textarea:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 3px rgba(239,159,39,.10); }
        .ed-code-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ed-code-primary, .ed-code-secondary, .ed-example-btn { border-radius: 10px; padding: 9px 14px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
        .ed-code-primary { border: 1px solid transparent; background: linear-gradient(135deg,var(--ed-accent),var(--ed-accent-dark)); color: #fff; box-shadow: 0 10px 22px rgba(242,140,24,.24); }
        .ed-code-primary:hover { transform: translateY(-1px); }
        .ed-code-secondary, .ed-example-btn { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); }
        .ed-code-secondary:hover, .ed-example-btn:hover { border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); color: var(--ed-accent); }
        .ed-code-notice { margin-top: 10px; font-size: 11px; color: var(--ed-accent); font-weight: 600; }
        .ed-example-list { display: flex; flex-direction: column; gap: 8px; }
        .ed-example-note { margin-top: 12px; padding: 10px; border-radius: 10px; background: var(--ed-shell-soft); border: 1px solid var(--ed-border); color: var(--ed-text-soft); font-size: 11px; line-height: 1.6; }

        .ed-link-card { background: var(--ed-panel); border: 1px solid var(--ed-border); border-radius: 12px; padding: 12px; box-shadow: var(--shadow-sm); }
        .ed-link-card__head { margin-bottom: 10px; }
        .ed-link-card__title { font-size: 13px; font-weight: 700; color: var(--ed-text); }
        .ed-link-card__subtitle { margin-top: 3px; font-size: 11px; line-height: 1.5; color: var(--ed-text-soft); }
        .ed-link-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .ed-link-field label { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ed-text-mute); }
        .ed-link-field input { width: 100%; min-height: 34px; border-radius: 8px; border: 1px solid var(--ed-border); background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text); font-size: 12px; padding: 0 10px; outline: none; }
        .ed-link-field input:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 3px rgba(242,140,24,.10); }
        .ed-link-check { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; color: var(--ed-text-soft); cursor: pointer; }
        .ed-link-check input { accent-color: var(--ed-accent); }
        .ed-link-check code { font-family: ui-monospace, monospace; font-size: 11px; color: var(--ed-accent); }
        .ed-link-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .ed-link-primary, .ed-link-secondary { border-radius: 8px; padding: 9px 12px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all .15s ease; }
        .ed-link-primary { border: 1px solid transparent; color: #fff; background: linear-gradient(135deg,var(--ed-accent),var(--ed-accent-dark)); box-shadow: 0 8px 18px rgba(242,140,24,.22); }
        .ed-link-secondary { border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); }
        .ed-link-primary:hover, .ed-link-secondary:hover { transform: translateY(-1px); }
        .ed-link-help { margin-top: 10px; font-size: 11px; line-height: 1.55; color: var(--ed-text-soft); }

        .ed-media-shell { display: flex; flex-direction: column; gap: 14px; padding: 12px; }
        .ed-media-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ed-media-toolbar { display: flex; flex-direction: column; gap: 10px; }
        .ed-media-search { width: 100%; min-height: 38px; border-radius: 10px; border: 1px solid var(--ed-border); background: ${dark ? "#171D27" : "#FFFFFF"}; color: var(--ed-text); padding: 0 12px; outline: none; font: inherit; }
        .ed-media-search:focus { border-color: var(--ed-accent-soft-border); box-shadow: 0 0 0 4px rgba(239,159,39,.10); }
        .ed-media-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .ed-media-actions { display: flex; align-items: center; gap: 10px; }
        .ed-media-notice { font-size: 11px; font-weight: 700; color: var(--ed-success); }
        .ed-media-error { border: 1px solid rgba(239,68,68,.18); background: rgba(239,68,68,.08); color: var(--ed-danger); border-radius: 10px; padding: 10px 12px; font-size: 12px; }
        .ed-media-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .ed-media-card { display: grid; grid-template-columns: 92px 1fr; gap: 12px; padding: 12px; border-radius: 14px; border: 1px solid var(--ed-border); background: var(--ed-panel); box-shadow: var(--shadow-sm); }
        .ed-media-preview { width: 92px; height: 92px; border-radius: 12px; overflow: hidden; border: 1px solid var(--ed-border); background: var(--ed-shell-soft); display: flex; align-items: center; justify-content: center; }
        .ed-media-preview img, .ed-media-preview video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ed-media-file { font-size: 28px; }
        .ed-media-card__body { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .ed-media-name { font-size: 12px; font-weight: 700; color: var(--ed-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ed-media-meta { font-size: 10px; font-weight: 800; letter-spacing: .08em; color: var(--ed-text-mute); }
        .ed-media-card__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ed-media-btn { border-radius: 8px; padding: 8px 10px; border: 1px solid var(--ed-border); background: var(--ed-shell-soft); color: var(--ed-text); font-size: 11px; font-weight: 700; cursor: pointer; transition: all .15s ease; }
        .ed-media-btn:hover { transform: translateY(-1px); border-color: var(--ed-accent-soft-border); background: var(--ed-accent-soft); }
        .ed-media-btn--primary { border-color: transparent; background: linear-gradient(135deg,var(--ed-accent),var(--ed-accent-dark)); color: #fff; box-shadow: 0 8px 18px rgba(242,140,24,.22); }
        .ed-media-empty { border: 1px dashed var(--ed-border); border-radius: 12px; padding: 18px 14px; text-align: center; color: var(--ed-text-soft); font-size: 12px; }

        /* ── GrapesJS overrides ── */
        .gjs-pn-panels { display: none !important; }
        .gjs-editor { background: transparent !important; }
        .gjs-cv-canvas { background: ${dark ? "#1D2430" : "#E9EEF5"} !important; width: 100% !important; height: 100% !important; top: 0 !important; border-radius: 24px !important; }
        .gjs-frame-wrapper, .gjs-cv-canvas iframe { background: ${dark ? "#ffffff" : "#f6f4ef"} !important; }
        .gjs-block-categories { background: transparent !important; }
        .gjs-block-category { border-bottom: 1px solid var(--ed-border) !important; }
        .gjs-block-category .gjs-title { background: var(--ed-panel-soft) !important; color: var(--ed-text-soft) !important; font-family: var(--font) !important; font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; padding: 10px 12px !important; border-bottom: 1px solid var(--ed-border) !important; cursor: pointer; }
        .gjs-block-category .gjs-title:hover { background: var(--ed-shell-soft) !important; color: var(--ed-accent) !important; }
        .gjs-blocks-c { display: grid !important; grid-template-columns: 1fr !important; gap: 8px !important; padding: 10px !important; background: transparent !important; }
        .gjs-block { background: var(--ed-panel) !important; border: 1px solid var(--ed-border) !important; border-radius: 10px !important; padding: 10px 12px !important; text-align: left !important; font-family: var(--font) !important; font-size: 11px !important; color: var(--ed-text-soft) !important; cursor: grab !important; transition: all 0.15s ease !important; min-height: 58px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: center !important; gap: 6px !important; box-shadow: var(--shadow-sm) !important; }
        .gjs-block:hover { border-color: var(--ed-accent-soft-border) !important; color: var(--ed-accent) !important; background: var(--ed-accent-soft) !important; transform: translateY(-1px) !important; }
        .gjs-block-label { font-size: 11px !important; font-weight: 600 !important; }
        .gjs-layer { background: transparent !important; border-bottom: 1px solid var(--ed-border) !important; color: var(--ed-text-soft) !important; font-family: var(--font) !important; font-size: 12px !important; }
        .gjs-layer.gjs-selected, .gjs-layer:hover { background: var(--ed-accent-soft) !important; color: var(--ed-text) !important; }

        /* Style manager: native GrapesJS panels — bien visibles */
        .gjs-sm-sectors { padding-bottom: 10px !important; }
        .gjs-sm-sector { margin: 8px 0 0 !important; background: var(--ed-panel) !important; border: 1px solid var(--ed-border) !important; border-radius: 10px !important; overflow: hidden !important; box-shadow: var(--shadow-sm) !important; }
        .gjs-sm-sector-title { background: var(--ed-panel-soft) !important; color: var(--ed-text) !important; font-family: var(--font) !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; padding: 10px 12px !important; border-bottom: 1px solid var(--ed-border) !important; cursor: pointer; display: flex !important; align-items: center !important; justify-content: space-between !important; }
        .gjs-sm-sector-title:hover { background: var(--ed-shell-soft) !important; color: var(--ed-accent) !important; }
        .gjs-sm-properties { background: var(--ed-panel) !important; padding: 4px 0 !important; }
        .gjs-sm-property { padding: 8px 10px !important; border-bottom: 1px solid var(--ed-border) !important; background: transparent !important; }
        .gjs-sm-property:last-child { border-bottom: none !important; }
        .gjs-sm-label, .gjs-label { color: var(--ed-text-soft) !important; font-family: var(--font) !important; font-size: 11px !important; font-weight: 600 !important; margin-bottom: 5px !important; }
        .gjs-field, .gjs-sm-input-holder { background: ${dark ? "#171D27" : "#FFFFFF"} !important; border: 1px solid var(--ed-border) !important; border-radius: 8px !important; min-height: 32px !important; box-shadow: none !important; }
        .gjs-field input, .gjs-field select, .gjs-field textarea, .gjs-sm-input-holder input, .gjs-sm-input-holder select, .gjs-sm-input-holder textarea { background: transparent !important; color: var(--ed-text) !important; font-family: var(--font) !important; font-size: 12px !important; font-weight: 500 !important; border: none !important; padding: 6px 8px !important; width: 100% !important; outline: none !important; }
        .gjs-field select, .gjs-sm-input-holder select { appearance: none !important; cursor: pointer !important; }
        .gjs-field:focus-within, .gjs-sm-input-holder:focus-within { border-color: var(--ed-accent-soft-border) !important; box-shadow: 0 0 0 3px rgba(239,159,39,.10) !important; }

        /* Color picker GrapesJS */
        .gjs-field-color { display: flex !important; align-items: center !important; gap: 6px !important; padding: 3px 6px !important; }
        .gjs-field-color input[type="text"] { flex: 1 !important; }
        .gjs-field-color-picker { width: 24px !important; height: 24px !important; border-radius: 5px !important; border: 1px solid var(--ed-border) !important; cursor: pointer !important; flex-shrink: 0 !important; }
        .sp-container { background: var(--ed-panel) !important; border: 1px solid var(--ed-border) !important; border-radius: 12px !important; box-shadow: var(--shadow-lg) !important; }
        .sp-picker-container { border-right: none !important; }
        .sp-input { background: var(--ed-shell-soft) !important; border: 1px solid var(--ed-border) !important; color: var(--ed-text) !important; border-radius: 6px !important; }
        .sp-choose { background: var(--ed-accent) !important; border-color: var(--ed-accent-dark) !important; }
        .sp-cancel { color: var(--ed-text-soft) !important; }

        /* Unit selector */
        .gjs-field-units { background: var(--ed-shell-soft) !important; border-left: 1px solid var(--ed-border) !important; border-radius: 0 8px 8px 0 !important; }
        .gjs-field-units select { color: var(--ed-text) !important; font-size: 11px !important; }
        .gjs-field-integer { display: flex !important; align-items: center !important; }
        .gjs-field-integer .gjs-field-el { flex: 1 !important; }
        .gjs-input-unit { background: var(--ed-shell-soft) !important; color: var(--ed-text-soft) !important; border-left: 1px solid var(--ed-border) !important; padding: 0 6px !important; font-size: 10px !important; cursor: pointer !important; border-radius: 0 7px 7px 0 !important; }

        /* Selector manager */
        .gjs-clm-tags { padding: 8px !important; gap: 5px !important; background: transparent !important; }
        .gjs-tag { background: var(--ed-accent-soft) !important; color: var(--ed-accent) !important; border: 1px solid var(--ed-accent-soft-border) !important; border-radius: 999px !important; padding: 4px 8px !important; font-size: 11px !important; font-weight: 700 !important; }

        /* Traits */
        .gjs-trt-trait { padding: 9px 10px !important; border-bottom: 1px solid var(--ed-border) !important; background: transparent !important; }
        .gjs-trt-trait:last-child { border-bottom: none !important; }

        /* Selection highlight */
        .gjs-selected { outline: 2px solid var(--ed-accent) !important; outline-offset: -1px !important; }
        .gjs-hovered { outline: 1px dashed rgba(239,159,39,.55) !important; }

        .gjs-toolbar { background: ${dark ? "rgba(19,19,24,.98)" : "rgba(255,255,255,.96)"} !important; border: 1px solid var(--ed-accent-soft-border) !important; border-radius: 12px !important; box-shadow: var(--shadow-lg) !important; backdrop-filter: blur(10px) !important; }
        .gjs-toolbar-item { color: var(--ed-text-soft) !important; padding: 6px 8px !important; transition: all 0.15s ease !important; }
        .gjs-toolbar-item:hover { color: var(--ed-accent) !important; background: var(--ed-accent-soft) !important; }

        .gjs-mdl-dialog { background: var(--ed-panel) !important; border: 1px solid var(--ed-border) !important; border-radius: 18px !important; box-shadow: var(--shadow-lg) !important; color: var(--ed-text) !important; }
        .gjs-mdl-header { background: var(--ed-panel-soft) !important; border-bottom: 1px solid var(--ed-border) !important; border-radius: 18px 18px 0 0 !important; padding: 12px 16px !important; }
        .gjs-mdl-title { font-family: var(--font) !important; font-size: 13px !important; font-weight: 700 !important; color: var(--ed-text) !important; }
        .gjs-mdl-btn-close { color: var(--ed-text-soft) !important; }
        .gjs-mdl-btn-close:hover { color: var(--ed-danger) !important; }
        .gjs-badge { background: linear-gradient(135deg,var(--ed-accent),var(--ed-accent-dark)) !important; color: #fff !important; border-radius: 999px !important; font-size: 10px !important; font-weight: 700 !important; padding: 2px 6px !important; }
        .gjs-placeholder { background: rgba(239,159,39,.08) !important; border: 2px dashed rgba(239,159,39,.45) !important; border-radius: 10px !important; }
        .gjs-one-bg, .gjs-two-color, .gjs-three-bg, .gjs-four-color { color: inherit !important; background: transparent !important; }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(239,159,39,.18); border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(239,159,39,.32); }

        @keyframes gjs-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1280px) {
          .ed-body--studio { grid-template-columns: 56px auto 1fr 300px; }
          .ed-rightbar { width: 300px; min-width: 300px; }
        }
        @media (max-width: 1120px) {
          .ed-rightbar { display: none; }
          .ed-body--studio { grid-template-columns: 56px auto 1fr; }
        }
      `}</style>
    </div>
  );
}