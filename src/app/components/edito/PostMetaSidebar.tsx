"use client";

import { useTheme } from "@/app/context/ThemeContext";
import { generateSlug } from "@/app/lib/utils/slug";
import { useEffect, useRef, useState, useCallback } from "react";

export interface PostMeta {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string;
  tags: string[];
  authorId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostMetaSidebarProps {
  open: boolean;
  onClose: () => void;
  meta: PostMeta;
  onMetaChange: (meta: PostMeta) => void;
  onTitleChange: (title: string) => void;
  postId?: string;
}

const ORANGE = "#EF9F27";

export default function PostMetaSidebar({
  open,
  onClose,
  meta,
  onMetaChange,
  onTitleChange,
  postId,
}: PostMetaSidebarProps) {
  const { dark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugTimeout, setSlugTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const c = {
    shell: dark ? "#0B0B0E" : "#FFFFFF",
    shellSoft: dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
    border: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)",
    text: dark ? "#F2EFEA" : "#181818",
    textSoft: dark ? "rgba(255,255,255,.52)" : "rgba(0,0,0,.56)",
    textMute: dark ? "rgba(255,255,255,.30)" : "rgba(0,0,0,.34)",
    hover: dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
    iconBtn: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
    inputBg: dark ? "#131318" : "#FFFFFF",
    softBg: dark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
    success: "#22c55e",
    danger: "#ef4444",
    warning: "#fb923c",
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});

    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (slugTimeout) clearTimeout(slugTimeout);
    };
  }, [slugTimeout]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  const checkSlug = useCallback(
    (slug: string) => {
      if (!slug) {
        setSlugAvailable(null);
        setCheckingSlug(false);
        return;
      }

      if (slugTimeout) clearTimeout(slugTimeout);

      setCheckingSlug(true);

      const t = setTimeout(async () => {
        try {
          const params = new URLSearchParams({ slug });
          if (postId) params.set("excludeId", postId);

          const res = await fetch(`/api/posts/check-slug?${params}`);
          const { available } = await res.json();
          setSlugAvailable(available);
        } catch {
          setSlugAvailable(null);
        } finally {
          setCheckingSlug(false);
        }
      }, 500);

      setSlugTimeout(t);
    },
    [postId, slugTimeout]
  );

  const update = (field: keyof PostMeta, value: unknown) => {
    onMetaChange({ ...meta, [field]: value });
  };

  const toggleTag = (tagId: string) => {
    const next = meta.tags.includes(tagId)
      ? meta.tags.filter((t) => t !== tagId)
      : [...meta.tags, tagId];

    update("tags", next);
  };

  const handleRegenerateSlug = () => {
    const s = generateSlug(meta.title);
    update("slug", s);
    checkSlug(s);
  };

  const handleSelectedFile = (file: File | null) => {
    setSelectedImage(file);
    setUploadError("");
    setUploadSuccess("");
  };

  const handleImageUpload = async () => {
  if (!selectedImage) {
    setUploadError("Choisissez une image d'abord.");
    setUploadSuccess("");
    return;
  }

  setUploadingImage(true);
  setUploadError("");
  setUploadSuccess("");

  try {
    const formData = new FormData();
    formData.append("file", selectedImage);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Échec de l'upload.");
    }

    // Met à jour immédiatement le state local
    update("coverImage", data.url);

    // Si le post existe déjà, on persiste immédiatement en base
    if (postId) {
      const patchRes = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverImage: data.url,
        }),
      });

      const patchData = await patchRes.json();

      if (!patchRes.ok) {
        throw new Error(
          patchData?.error || "Image uploadée, mais non enregistrée en base."
        );
      }
    }

    setUploadSuccess(
      postId
        ? "Image uploadée et enregistrée en base."
        : "Image uploadée. Cliquez ensuite sur Brouillon ou Publier pour enregistrer le post."
    );

    setSelectedImage(null);
    setImagePreviewUrl("");
  } catch (error) {
    setUploadError(
      error instanceof Error ? error.message : "Erreur pendant l'upload."
    );
    setUploadSuccess("");
  } finally {
    setUploadingImage(false);
  }
};

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl("");
    setUploadError("");
    setUploadSuccess("");
  };

  const removeImageCompletely = () => {
    clearSelectedImage();
    update("coverImage", "");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);

    const file = e.dataTransfer.files?.[0] || null;
    if (file && file.type.startsWith("image/")) {
      handleSelectedFile(file);
    } else {
      setUploadError("Déposez une image valide.");
      setUploadSuccess("");
    }
  };

  const currentPreview = imagePreviewUrl || meta.coverImage;

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
            <div className="sidebar-heading__icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>

            <div>
              <h2 className="sidebar-title">Post Settings</h2>
              <p className="sidebar-subtitle">Configuration du contenu</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-body">
          <div className="field-group">
            <label className="field-label">
              Title <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              value={meta.title}
              placeholder="My awesome post…"
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              Slug <span className="field-required">*</span>
            </label>

            <div className="slug-wrapper">
              <input
                className={`field-input field-input--with-btn ${
                  slugAvailable === false ? "field-input--error" : ""
                } ${slugAvailable === true ? "field-input--success" : ""}`}
                type="text"
                value={meta.slug}
                placeholder="my-awesome-post"
                onChange={(e) => {
                  update("slug", e.target.value);
                  checkSlug(e.target.value);
                }}
              />

              <button
                type="button"
                className="slug-regen"
                onClick={handleRegenerateSlug}
                title="Regenerate from title"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <polyline points="23 20 23 14 17 14" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
              </button>
            </div>

            {checkingSlug && (
              <p className="field-hint field-hint--neutral">Checking…</p>
            )}
            {!checkingSlug && slugAvailable === false && (
              <p className="field-hint field-hint--error">
                This slug is already taken
              </p>
            )}
            {!checkingSlug && slugAvailable === true && (
              <p className="field-hint field-hint--success">
                Slug is available ✓
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">Status</label>

            <div className="status-buttons">
              {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`status-btn status-btn--${s.toLowerCase()} ${
                    meta.status === s ? "active" : ""
                  }`}
                  onClick={() => update("status", s)}
                >
                  {s === "DRAFT" && "📝 "}
                  {s === "PUBLISHED" && "🚀 "}
                  {s === "ARCHIVED" && "📦 "}
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Excerpt</label>
            <textarea
              className="field-textarea"
              value={meta.excerpt}
              placeholder="Short description for previews and SEO…"
              rows={4}
              onChange={(e) => update("excerpt", e.target.value)}
            />
            <p className="field-hint field-hint--neutral">
              {meta.excerpt.length}/160 characters
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">Cover Image</label>

            <div className="image-upload-shell">
              <div className="image-upload-top">
                <div className="image-upload-texts">
                  <h4 className="image-upload-title">Image de couverture</h4>
                  <p className="image-upload-subtitle">
                    Déposez une image ou cliquez pour la choisir
                  </p>
                </div>

                {currentPreview && (
                  <button
                    type="button"
                    className="image-clear-btn"
                    onClick={removeImageCompletely}
                  >
                    Retirer
                  </button>
                )}
              </div>

              <div
                className={`image-dropzone ${isDraggingImage ? "is-dragging" : ""}`}
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  className="image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleSelectedFile(file);
                  }}
                />

                <div className="image-dropzone__icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <div className="image-dropzone__content">
                  <strong>Choisir ou déposer une image</strong>
                  <span>JPG, PNG, WEBP, GIF</span>
                </div>
              </div>

              {currentPreview && (
                <div className="image-preview-card">
                  <div className="image-preview-media">
                    <img
                      src={currentPreview}
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    <div className="image-preview-overlay">
                      <span className="image-preview-badge">
                        {selectedImage ? "Aperçu local" : "Image enregistrée"}
                      </span>
                    </div>
                  </div>

                  <div className="image-preview-meta">
                    <div className="image-preview-meta__row">
                      <span className="image-preview-label">Source</span>
                      <span className="image-preview-value">
                        {selectedImage ? "Fichier local" : "Image enregistrée"}
                      </span>
                    </div>

                    {selectedImage && (
                      <>
                        <div className="image-preview-meta__row">
                          <span className="image-preview-label">Nom</span>
                          <span className="image-preview-value image-preview-value--truncate">
                            {selectedImage.name}
                          </span>
                        </div>

                        <div className="image-preview-meta__row">
                          <span className="image-preview-label">Taille</span>
                          <span className="image-preview-value">
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </>
                    )}

                    <div className="image-preview-meta__row">
                      <span className="image-preview-label">Chemin</span>
                      <span className="image-preview-value image-preview-value--truncate">
                        {meta.coverImage || "Pas encore uploadée"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <input
                className="field-input"
                type="text"
                value={meta.coverImage}
                placeholder="/uploads/posts/mon-image.jpg"
                onChange={(e) => update("coverImage", e.target.value)}
              />

              <div className="image-actions">
                <button
                  type="button"
                  className="image-upload-btn"
                  onClick={handleImageUpload}
                  disabled={uploadingImage || !selectedImage}
                >
                  {uploadingImage ? "Upload en cours..." : "Uploader l'image"}
                </button>

                <button
                  type="button"
                  className="image-secondary-btn"
                  onClick={clearSelectedImage}
                  disabled={!selectedImage}
                >
                  Annuler
                </button>
              </div>

              {uploadError && (
                <p className="field-hint field-hint--error">{uploadError}</p>
              )}

              {uploadSuccess && (
                <p className="field-hint field-hint--success">{uploadSuccess}</p>
              )}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Category</label>
            <select
              className="field-select"
              value={meta.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
            >
              <option value="">— No category —</option>
              {categories.map((categ) => (
                <option key={categ.id} value={categ.id}>
                  {categ.name}
                </option>
              ))}
            </select>
          </div>

          {tags.length > 0 && (
            <div className="field-group">
              <label className="field-label">Tags</label>
              <div className="tags-grid">
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag.id}
                    className={`tag-chip ${
                      meta.tags.includes(tag.id) ? "tag-chip--active" : ""
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <span>{tag.name}</span>
                    {meta.tags.includes(tag.id) && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">
              Author ID <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              value={meta.authorId}
              placeholder="UUID of the author"
              onChange={(e) => update("authorId", e.target.value)}
            />
            <p className="field-hint field-hint--neutral">
              In production, this comes from the authenticated session.
            </p>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: ${dark ? "rgba(0,0,0,.48)" : "rgba(0,0,0,.22)"};
          backdrop-filter: blur(3px);
          z-index: 99;
          animation: fadeIn 0.18s ease;
        }

        .meta-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          height: 100%;
          width: 380px;
          max-width: calc(100vw - 18px);
          background: ${c.shell};
          border-left: 1px solid ${c.border};
          display: flex;
          flex-direction: column;
          z-index: 100;
          transform: translateX(100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${dark
            ? "-16px 0 40px rgba(0,0,0,.45)"
            : "-12px 0 34px rgba(0,0,0,.10)"};
          color: ${c.text};
          font-family: "DM Sans", system-ui, sans-serif;
        }

        .meta-sidebar--open {
          transform: translateX(0);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          min-height: 72px;
          border-bottom: 1px solid ${c.border};
          background: ${c.shell};
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
          color: ${ORANGE};
          background: rgba(239, 159, 39, 0.08);
          border: 1px solid rgba(239, 159, 39, 0.2);
          box-shadow: ${dark ? "0 0 14px rgba(239,159,39,.10)" : "none"};
        }

        .sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: ${c.text};
          line-height: 1.1;
        }

        .sidebar-subtitle {
          margin: 4px 0 0;
          font-size: 12px;
          color: ${c.textMute};
          line-height: 1.2;
        }

        .sidebar-close {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid ${c.border};
          background: ${c.iconBtn};
          color: ${c.textSoft};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .sidebar-close:hover {
          background: rgba(239, 159, 39, 0.08);
          border-color: rgba(239, 159, 39, 0.28);
          color: ${ORANGE};
        }

        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 159, 39, 0.18) transparent;
          background: ${c.shell};
        }

        .sidebar-body::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar-body::-webkit-scrollbar-thumb {
          background: rgba(239, 159, 39, 0.18);
          border-radius: 999px;
        }

        .sidebar-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 14px;
          border: 1px solid ${c.border};
          border-radius: 16px;
          background: ${c.shellSoft};
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: ${c.textMute};
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .field-required {
          color: ${c.danger};
        }

        .field-input,
        .field-select,
        .field-textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.text};
          font-size: 13px;
          font-family: inherit;
          padding: 11px 13px;
          transition: all 0.15s ease;
          resize: vertical;
        }

        .field-input::placeholder,
        .field-textarea::placeholder {
          color: ${c.textMute};
        }

        .field-input:focus,
        .field-select:focus,
        .field-textarea:focus {
          outline: none;
          border-color: rgba(239, 159, 39, 0.42);
          box-shadow: 0 0 0 3px rgba(239, 159, 39, 0.12);
        }

        .field-input--with-btn {
          padding-right: 42px;
        }

        .field-input--error {
          border-color: rgba(239, 68, 68, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
        }

        .field-input--success {
          border-color: rgba(34, 197, 94, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
        }

        .field-select {
          appearance: none;
          cursor: pointer;
        }

        .field-hint {
          margin: 0;
          font-size: 11px;
          line-height: 1.35;
        }

        .field-hint--neutral {
          color: ${c.textMute};
        }

        .field-hint--error {
          color: ${c.danger};
        }

        .field-hint--success {
          color: ${c.success};
        }

        .slug-wrapper {
          position: relative;
        }

        .slug-regen {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 9px;
          border: 1px solid transparent;
          background: transparent;
          color: ${c.textMute};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .slug-regen:hover {
          color: ${ORANGE};
          background: rgba(239, 159, 39, 0.08);
          border-color: rgba(239, 159, 39, 0.2);
        }

        .status-buttons {
          display: flex;
          gap: 8px;
        }

        .status-btn {
          flex: 1;
          min-width: 0;
          border-radius: 12px;
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.textSoft};
          font-size: 11px;
          font-weight: 600;
          padding: 10px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .status-btn:hover {
          background: ${c.hover};
          color: ${c.text};
          border-color: ${c.border};
        }

        .status-btn--draft.active {
          background: ${dark
            ? "rgba(255,255,255,.07)"
            : "rgba(0,0,0,.045)"};
          color: ${c.text};
          border-color: ${c.border};
        }

        .status-btn--published.active {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.28);
          color: ${c.success};
        }

        .status-btn--archived.active {
          background: rgba(251, 146, 60, 0.1);
          border-color: rgba(251, 146, 60, 0.28);
          color: ${c.warning};
        }

        .image-upload-shell {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .image-upload-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .image-upload-texts {
          min-width: 0;
        }

        .image-upload-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: ${c.text};
        }

        .image-upload-subtitle {
          margin: 4px 0 0;
          font-size: 12px;
          color: ${c.textMute};
          line-height: 1.45;
        }

        .image-clear-btn {
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.textSoft};
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .image-clear-btn:hover {
          color: ${ORANGE};
          border-color: rgba(239, 159, 39, 0.28);
          background: rgba(239, 159, 39, 0.08);
        }

        .image-dropzone {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 16px;
          border: 1px dashed rgba(239, 159, 39, 0.32);
          background: rgba(239, 159, 39, 0.06);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .image-dropzone:hover,
        .image-dropzone.is-dragging {
          background: rgba(239, 159, 39, 0.10);
          border-color: rgba(239, 159, 39, 0.46);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.10);
        }

        .image-file-input {
          display: none;
        }

        .image-dropzone__icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${ORANGE};
          background: rgba(239, 159, 39, 0.12);
          border: 1px solid rgba(239, 159, 39, 0.18);
          flex-shrink: 0;
        }

        .image-dropzone__content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .image-dropzone__content strong {
          font-size: 13px;
          color: ${c.text};
        }

        .image-dropzone__content span {
          font-size: 12px;
          color: ${c.textMute};
        }

        .image-preview-card {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid ${c.border};
          background: ${c.inputBg};
        }

        .image-preview-media {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 14px;
          overflow: hidden;
          background: ${c.softBg};
          border: 1px solid ${c.border};
          flex-shrink: 0;
        }

        .image-preview-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .image-preview-overlay {
          position: absolute;
          inset: auto 8px 8px 8px;
          display: flex;
          justify-content: flex-start;
        }

        .image-preview-badge {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(11, 11, 14, 0.72);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }

        .image-preview-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .image-preview-meta__row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .image-preview-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${c.textMute};
        }

        .image-preview-value {
          font-size: 12px;
          color: ${c.text};
          font-weight: 600;
        }

        .image-preview-value--truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .image-actions {
          display: flex;
          gap: 10px;
        }

        .image-upload-btn {
          flex: 1;
          border: 1px solid rgba(239, 159, 39, 0.28);
          background: rgba(239, 159, 39, 0.08);
          color: ${ORANGE};
          border-radius: 12px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .image-upload-btn:hover:not(:disabled) {
          background: rgba(239, 159, 39, 0.14);
          border-color: rgba(239, 159, 39, 0.40);
        }

        .image-upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .image-secondary-btn {
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.textSoft};
          border-radius: 12px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .image-secondary-btn:hover:not(:disabled) {
          color: ${c.text};
          background: ${c.hover};
        }

        .image-secondary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.textSoft};
          font-size: 11px;
          font-weight: 600;
          padding: 7px 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tag-chip:hover {
          background: ${c.hover};
          color: ${c.text};
          border-color: ${c.border};
        }

        .tag-chip--active {
          background: rgba(239, 159, 39, 0.08);
          border-color: rgba(239, 159, 39, 0.28);
          color: ${ORANGE};
          box-shadow: inset 0 0 0 1px rgba(239, 159, 39, 0.08);
        }

        @media (max-width: 640px) {
          .meta-sidebar {
            width: 100vw;
            max-width: 100vw;
          }

          .sidebar-body {
            padding: 14px;
          }

          .field-group {
            padding: 12px;
          }

          .image-preview-card {
            grid-template-columns: 1fr;
          }

          .image-preview-media {
            width: 100%;
            height: 200px;
          }

          .image-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}