'use client'

import { useTheme } from '@/app/context/ThemeContext'
import { generateSlug } from '@/app/lib/utils/slug'

export type PageMeta = {
  title: string
  slug: string
  description: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

interface PageMetaSidebarProps {
  open: boolean
  onClose: () => void
  meta: PageMeta
  onMetaChange: React.Dispatch<React.SetStateAction<PageMeta>>
  onTitleChange: (title: string) => void
}

const ORANGE = '#EF9F27'

export default function PageMetaSidebar({
  open,
  onClose,
  meta,
  onMetaChange,
  onTitleChange,
}: PageMetaSidebarProps) {
  const { dark } = useTheme()

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
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#fb923c',
  }

  const update = <K extends keyof PageMeta>(field: K, value: PageMeta[K]) => {
    onMetaChange((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegenerateSlug = () => update('slug', generateSlug(meta.title))

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
              <h2 className="sidebar-title">Page Settings</h2>
              <p className="sidebar-subtitle">Configuration de la page</p>
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
              placeholder="Ex : Mentions légales"
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
                placeholder="mentions-legales"
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

          {/* ── Description ── */}
          <div className="field-group">
            <label className="field-label">Description</label>
            <textarea
              className="field-textarea"
              value={meta.description}
              placeholder="Description courte de la page (méta / SEO)…"
              rows={4}
              onChange={(e) => update('description', e.target.value)}
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

        @media (max-width: 640px) {
          .meta-sidebar { width: 100vw; max-width: 100vw; }
          .sidebar-body { padding: 14px; }
          .field-group { padding: 12px; }
        }
      `}</style>
    </>
  )
}
