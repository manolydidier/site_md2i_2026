"use client";

import { PostMeta } from "./PostMetaSidebar";

interface EditorHeaderProps {
  meta: PostMeta;
  mode: "create" | "edit";
  isSaving: boolean;
  saveStatus: "idle" | "saved" | "error";
  deviceMode: "desktop" | "tablet" | "mobile";
  onSaveDraft: () => void;
  onPublish: () => void;
  onOpenMeta: () => void;
  onBack: () => void;
}

export default function EditorHeader({
  meta,
  mode,
  isSaving,
  saveStatus,
  onSaveDraft,
  onPublish,
  onOpenMeta,
  onBack,
}: EditorHeaderProps) {
  return (
    <header className="editor-header">
      {/* Left */}
      <div className="editor-header__left">
        <button className="btn-icon" onClick={onBack} title="Back to posts">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className="editor-breadcrumb">
          <span className="breadcrumb-root">Posts</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            {meta.title || (mode === "create" ? "New Post" : "Edit Post")}
          </span>
        </div>

        <span className={`status-badge status-badge--${meta.status.toLowerCase()}`}>
          {meta.status}
        </span>
      </div>

      {/* Right */}
      <div className="editor-header__right">
        {saveStatus === "saved" && (
          <span className="save-indicator save-indicator--success">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="save-indicator save-indicator--error">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Error saving
          </span>
        )}

        <button className="btn-meta" onClick={onOpenMeta}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
          </svg>
          Post Settings
        </button>

        <button
          className="btn-draft"
          onClick={onSaveDraft}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="btn-spinner" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          )}
          Save Draft
        </button>

        <button
          className="btn-publish"
          onClick={onPublish}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="btn-spinner btn-spinner--light" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          )}
          {meta.status === "PUBLISHED" ? "Update" : "Publish"}
        </button>
      </div>

      <style jsx>{`
        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 54px;
          min-height: 54px;
          background: #181c27;
          border-bottom: 1px solid #2a2f3e;
          gap: 12px;
          position: relative;
          z-index: 50;
        }

        .editor-header__left,
        .editor-header__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(42, 47, 62, 0.6);
          border: 1px solid #2a2f3e;
          border-radius: 8px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .btn-icon:hover {
          background: rgba(129, 140, 248, 0.1);
          border-color: #818cf8;
          color: #818cf8;
        }

        .editor-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .breadcrumb-root { color: #6b7280; }
        .breadcrumb-sep { color: #374151; }
        .breadcrumb-current {
          color: #e8eaf0;
          font-weight: 500;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid;
        }

        .status-badge--draft {
          background: rgba(107, 114, 128, 0.15);
          border-color: rgba(107, 114, 128, 0.4);
          color: #9ca3af;
        }

        .status-badge--published {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.35);
          color: #4ade80;
        }

        .status-badge--archived {
          background: rgba(251, 146, 60, 0.12);
          border-color: rgba(251, 146, 60, 0.35);
          color: #fb923c;
        }

        .save-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }

        .save-indicator--success { color: #4ade80; background: rgba(34, 197, 94, 0.08); }
        .save-indicator--error { color: #f87171; background: rgba(248, 113, 113, 0.08); }

        .btn-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: rgba(42, 47, 62, 0.6);
          border: 1px solid #2a2f3e;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .btn-meta:hover {
          background: rgba(129, 140, 248, 0.1);
          border-color: #818cf8;
          color: #818cf8;
        }

        .btn-draft {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(42, 47, 62, 0.8);
          border: 1px solid #374151;
          border-radius: 8px;
          color: #d1d5db;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .btn-draft:hover:not(:disabled) {
          background: #232840;
          border-color: #4b5563;
          color: #e8eaf0;
        }

        .btn-draft:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-publish {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border: 1px solid rgba(99, 102, 241, 0.5);
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }

        .btn-publish:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f52e0, #6b76f0);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
        }

        .btn-publish:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(100, 100, 100, 0.3);
          border-top-color: #9ca3af;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .btn-spinner--light {
          border-color: rgba(255,255,255,0.3);
          border-top-color: white;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}