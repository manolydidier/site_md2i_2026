'use client'

import { useTheme } from '@/app/context/ThemeContext'
import { generateSlug } from '@/app/lib/utils/slug'
import { useRef, useState } from 'react'

export type ProjectMeta = {
  title: string
  slug: string
  excerpt: string
  coverImage: string
  images: string[]
  techStack: string[]
  projectUrl: string
  githubUrl: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

interface ProjectMetaSidebarProps {
  open: boolean
  onClose: () => void
  meta: ProjectMeta
  onMetaChange: React.Dispatch<React.SetStateAction<ProjectMeta>>
  onTitleChange: (title: string) => void
}

const ORANGE = '#EF9F27'

export default function ProjectMetaSidebar({
  open,
  onClose,
  meta,
  onMetaChange,
  onTitleChange,
}: ProjectMetaSidebarProps) {
  const { dark } = useTheme()
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [techInput, setTechInput] = useState('')

  const c = {
    shell: dark ? '#0B0B0E' : '#FFFFFF',
    shellSoft: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    text: dark ? '#F2EFEA' : '#181818',
    textSoft: dark ? 'rgba(255,255,255,.52)' : 'rgba(0,0,0,.56)',
    textMute: dark ? 'rgba(255,255,255,.30)' : 'rgba(0,0,0,.34)',
    hover: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
    iconBtn: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
    inputBg: dark ? '#131318' : '#FFFFFF',
    softBg: dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#fb923c',
  }

  const update = <K extends keyof ProjectMeta>(field: K, value: ProjectMeta[K]) => {
    onMetaChange((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegenerateSlug = () => update('slug', generateSlug(meta.title))

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Échec de l'upload.")
    return data.url as string
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingCover(true)
    setUploadError('')
    try {
      update('coverImage', await uploadFile(file))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur pendant l'upload.")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingGallery(true)
    setUploadError('')
    try {
      const urls = await Promise.all(files.map(uploadFile))
      update('images', [...meta.images, ...urls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur pendant l'upload.")
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeImage = (url: string) => update('images', meta.images.filter((item) => item !== url))

  const addTech = () => {
    const value = techInput.trim()
    if (!value || meta.techStack.includes(value)) {
      setTechInput('')
      return
    }
    update('techStack', [...meta.techStack, value])
    setTechInput('')
  }

  const removeTech = (value: string) => update('techStack', meta.techStack.filter((item) => item !== value))

  if (!open) return null

  return (
    <>
      <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="meta-sidebar meta-sidebar--open">
        <div className="sidebar-header">
          <div className="sidebar-heading">
            <div className="sidebar-heading__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="sidebar-title">Project Settings</h2>
              <p className="sidebar-subtitle">Configuration du projet</p>
            </div>
          </div>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-body">
          {/* ── Title ── */}
          <div className="field-group">
            <label className="field-label">
              Titre <span className="field-required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              value={meta.title}
              placeholder="Ex : Refonte plateforme e-commerce"
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          {/* ── Slug ── */}
          <div className="field-group">
            <label className="field-label">Slug</label>
            <div className="slug-wrapper">
              <input
                className="field-input field-input--with-btn"
                type="text"
                value={meta.slug}
                placeholder="refonte-plateforme-e-commerce"
                onChange={(e) => update('slug', e.target.value)}
              />
              <button type="button" className="slug-regen" onClick={handleRegenerateSlug} title="Régénérer depuis le titre">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <polyline points="23 20 23 14 17 14" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Status ── */}
          <div className="field-group">
            <label className="field-label">Statut</label>
            <div className="status-buttons">
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`status-btn status-btn--${s.toLowerCase()} ${meta.status === s ? 'active' : ''}`}
                  onClick={() => update('status', s)}
                >
                  {s === 'DRAFT' && '📝 '}
                  {s === 'PUBLISHED' && '🚀 '}
                  {s === 'ARCHIVED' && '📦 '}
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* ── Excerpt ── */}
          <div className="field-group">
            <label className="field-label">Extrait</label>
            <textarea
              className="field-textarea"
              value={meta.excerpt}
              placeholder="Résumé court du projet…"
              rows={4}
              onChange={(e) => update('excerpt', e.target.value)}
            />
          </div>

          {/* ── Cover image ── */}
          <div className="field-group">
            <label className="field-label">Image de couverture</label>
            <div className="cover-row">
              {meta.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.coverImage} alt="" className="cover-preview" />
              ) : (
                <div className="cover-preview cover-preview--empty">Aucune</div>
              )}
              <div className="cover-actions">
                <button type="button" className="image-upload-btn" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                  {uploadingCover ? 'Envoi…' : 'Téléverser'}
                </button>
                {meta.coverImage && (
                  <button type="button" className="image-secondary-btn" onClick={() => update('coverImage', '')}>
                    Retirer
                  </button>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden-input" />
            </div>
          </div>

          {/* ── Gallery ── */}
          <div className="field-group">
            <label className="field-label">Galerie</label>
            <div className="gallery-grid">
              {meta.images.map((url) => (
                <div key={url} className="gallery-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" />
                  <button type="button" className="gallery-thumb__remove" onClick={() => removeImage(url)} aria-label="Retirer">×</button>
                </div>
              ))}
              <button type="button" className="gallery-add" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                {uploadingGallery ? '…' : '+ Ajouter'}
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden-input" />
            </div>
            {uploadError && <p className="field-hint field-hint--error">{uploadError}</p>}
          </div>

          {/* ── Tech stack ── */}
          <div className="field-group">
            <label className="field-label">Technologies</label>
            <div className="tech-chips">
              {meta.techStack.map((tech) => (
                <span key={tech} className="tech-chip">
                  {tech}
                  <button type="button" onClick={() => removeTech(tech)} aria-label={`Retirer ${tech}`}>×</button>
                </span>
              ))}
            </div>
            <div className="tech-input-row">
              <input
                className="field-input"
                type="text"
                value={techInput}
                placeholder="Ex : Next.js — Entrée pour ajouter"
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech() } }}
              />
              <button type="button" className="image-secondary-btn" onClick={addTech}>Ajouter</button>
            </div>
          </div>

          {/* ── Links ── */}
          <div className="field-group">
            <label className="field-label">Lien du projet</label>
            <input
              className="field-input"
              type="url"
              value={meta.projectUrl}
              placeholder="https://…"
              onChange={(e) => update('projectUrl', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Lien GitHub</label>
            <input
              className="field-input"
              type="url"
              value={meta.githubUrl}
              placeholder="https://github.com/…"
              onChange={(e) => update('githubUrl', e.target.value)}
            />
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: ${dark ? 'rgba(0,0,0,.48)' : 'rgba(0,0,0,.22)'};
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
          box-shadow: ${dark ? '-16px 0 40px rgba(0,0,0,.45)' : '-12px 0 34px rgba(0,0,0,.10)'};
          color: ${c.text};
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .meta-sidebar--open { transform: translateX(0); }

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

        .sidebar-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }

        .sidebar-heading__icon {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${ORANGE};
          background: rgba(239,159,39,0.08);
          border: 1px solid rgba(239,159,39,0.2);
          box-shadow: ${dark ? '0 0 14px rgba(239,159,39,.10)' : 'none'};
        }

        .sidebar-title { margin: 0; font-size: 15px; font-weight: 700; color: ${c.text}; line-height: 1.1; }
        .sidebar-subtitle { margin: 4px 0 0; font-size: 12px; color: ${c.textMute}; line-height: 1.2; }

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

        .sidebar-close:hover { background: rgba(239,159,39,0.08); border-color: rgba(239,159,39,0.28); color: ${ORANGE}; }

        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          scrollbar-width: thin;
          scrollbar-color: rgba(239,159,39,0.18) transparent;
          background: ${c.shell};
        }

        .sidebar-body::-webkit-scrollbar { width: 5px; }
        .sidebar-body::-webkit-scrollbar-thumb { background: rgba(239,159,39,0.18); border-radius: 999px; }
        .sidebar-body::-webkit-scrollbar-track { background: transparent; }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 14px;
          border: 1px solid ${c.border};
          border-radius: 16px;
          background: ${c.shellSoft};
        }

        .field-label { font-size: 11px; font-weight: 700; color: ${c.textMute}; text-transform: uppercase; letter-spacing: 0.08em; }
        .field-required { color: ${c.danger}; }

        .field-input, .field-textarea {
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

        .field-input::placeholder, .field-textarea::placeholder { color: ${c.textMute}; }

        .field-input:focus, .field-textarea:focus {
          outline: none;
          border-color: rgba(239,159,39,0.42);
          box-shadow: 0 0 0 3px rgba(239,159,39,0.12);
        }

        .field-input--with-btn { padding-right: 42px; }

        .field-hint { margin: 0; font-size: 11px; line-height: 1.35; }
        .field-hint--error { color: ${c.danger}; }

        .slug-wrapper { position: relative; }

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

        .slug-regen:hover { color: ${ORANGE}; background: rgba(239,159,39,0.08); border-color: rgba(239,159,39,0.2); }

        .status-buttons { display: flex; gap: 8px; }

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

        .status-btn:hover { background: ${c.hover}; color: ${c.text}; border-color: ${c.border}; }
        .status-btn--draft.active { background: ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.045)'}; color: ${c.text}; border-color: ${c.border}; }
        .status-btn--published.active { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.28); color: ${c.success}; }
        .status-btn--archived.active { background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.28); color: ${c.warning}; }

        .hidden-input { display: none; }

        .cover-row { display: flex; align-items: center; gap: 12px; }

        .cover-preview {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid ${c.border};
          background: ${c.softBg};
          flex-shrink: 0;
        }

        .cover-preview--empty {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: ${c.textMute};
        }

        .cover-actions { display: flex; flex-direction: column; gap: 8px; }

        .image-upload-btn {
          border: 1px solid rgba(239,159,39,0.28);
          background: rgba(239,159,39,0.08);
          color: ${ORANGE};
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .image-upload-btn:hover:not(:disabled) { background: rgba(239,159,39,0.14); border-color: rgba(239,159,39,0.40); }
        .image-upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .image-secondary-btn {
          border: 1px solid ${c.border};
          background: ${c.inputBg};
          color: ${c.textSoft};
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .image-secondary-btn:hover { color: ${c.text}; background: ${c.hover}; }

        .gallery-grid { display: flex; flex-wrap: wrap; gap: 8px; }

        .gallery-thumb {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid ${c.border};
          background: ${c.softBg};
        }

        .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .gallery-thumb__remove {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: none;
          background: rgba(220,38,38,0.9);
          color: #fff;
          font-size: 10px;
          line-height: 1;
          cursor: pointer;
        }

        .gallery-add {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          border: 1px dashed ${c.border};
          background: transparent;
          color: ${c.textMute};
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .gallery-add:hover:not(:disabled) { border-color: rgba(239,159,39,0.45); color: ${ORANGE}; }
        .gallery-add:disabled { opacity: 0.6; cursor: not-allowed; }

        .tech-chips { display: flex; flex-wrap: wrap; gap: 6px; }

        .tech-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(239,159,39,0.10);
          color: ${ORANGE};
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(239,159,39,0.22);
        }

        .tech-chip button {
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
        }

        .tech-input-row { display: flex; gap: 8px; }
        .tech-input-row .field-input { flex: 1; }

        @media (max-width: 640px) {
          .meta-sidebar { width: 100vw; max-width: 100vw; }
          .sidebar-body { padding: 14px; }
          .field-group { padding: 12px; }
        }
      `}</style>
    </>
  )
}
