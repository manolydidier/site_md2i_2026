// components/email-marketing/ImportContactsModal.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useGroups } from "@/app/hooks/useEmailMarketing";
import type { ImportResult } from "@/app/types/email-marketing";
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ImportContactsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportContactsModal({
  onClose,
  onSuccess,
}: ImportContactsModalProps) {
  const { groups } = useGroups();

  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    (ImportResult & { total: number }) | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert("Formats acceptés : CSV, Excel (.xlsx, .xls)");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (groupId) {
        formData.append("groupId", groupId);
      }

      const res = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur d'importation");
        return;
      }

      setResult(data);

      if (data.success > 0) {
        setTimeout(onSuccess, 2000);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-backdrop">
      <div className="import-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon">
              <Upload className="h-4 w-4" />
            </div>

            <div>
              <h3>Importer des contacts</h3>
              <p>Ajoutez des contacts depuis un fichier CSV ou Excel.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-box">
            <p>
              Formats acceptés : <strong>CSV</strong> ou <strong>Excel</strong>.
            </p>
            <p>
              Colonnes attendues : <code>email</code>, <code>firstName</code>,{" "}
              <code>lastName</code>, <code>phone</code>.
            </p>
            <p>
              La colonne <strong>email est obligatoire</strong>.
            </p>
          </div>

          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`dropzone ${isDragging ? "is-dragging" : ""} ${
              file ? "has-file" : ""
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFile(selectedFile);
              }}
            />

            {file ? (
              <div className="file-state">
                <div className="file-icon success">
                  <FileText className="h-6 w-6" />
                </div>

                <div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-file-state">
                <div className="file-icon">
                  <Upload className="h-6 w-6" />
                </div>

                <div>
                  <p className="drop-title">Glissez votre fichier ici</p>
                  <p className="drop-subtitle">ou cliquez pour parcourir</p>
                </div>
              </div>
            )}
          </div>

          <div className="field-group">
            <label>Assigner au groupe</label>

            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Sans groupe</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {result && (
            <div className="result-boxes">
              <div className="result-box success">
                <CheckCircle className="h-5 w-5" />

                <p>
                  <strong>{result.success}</strong> contact(s) importé(s) sur{" "}
                  {result.total}
                </p>
              </div>

              {result.failed > 0 && (
                <div className="result-box failed">
                  <div className="result-title">
                    <AlertCircle className="h-5 w-5" />
                    <strong>{result.failed} échec(s)</strong>
                  </div>

                  <ul>
                    {result.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>
                        Ligne {error.row} — {error.email} : {error.error}
                      </li>
                    ))}

                    {result.errors.length > 10 && (
                      <li>
                        ...et {result.errors.length - 10} autre(s) erreur(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Annuler
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={!file || loading}
              className="primary-btn"
            >
              {loading ? (
                <span className="loading-label">
                  <span className="spinner" />
                  Importation...
                </span>
              ) : (
                "Importer"
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .import-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          padding: 20px;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .import-modal {
          width: 100%;
          max-width: 540px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
          overflow: hidden;
        }

        .modal-header {
          min-height: 76px;
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .modal-title-row {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef9f27;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.22);
        }

        .modal-header h3 {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.35;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .icon-btn:hover {
          color: #111827;
          background: #f9fafb;
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-box {
          padding: 13px 14px;
          border-radius: 13px;
          border: 1px solid rgba(239, 159, 39, 0.22);
          background: rgba(239, 159, 39, 0.08);
          color: #92400e;
          font-size: 13px;
          line-height: 1.5;
        }

        .info-box p {
          margin: 0;
        }

        .info-box p + p {
          margin-top: 4px;
        }

        .info-box code {
          padding: 2px 5px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.65);
          color: #7c2d12;
          font-size: 12px;
          font-weight: 700;
        }

        .dropzone {
          min-height: 178px;
          padding: 26px;
          border-radius: 15px;
          border: 2px dashed #d1d5db;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            box-shadow 0.15s ease;
        }

        .dropzone:hover,
        .dropzone.is-dragging {
          border-color: rgba(239, 159, 39, 0.55);
          background: rgba(239, 159, 39, 0.06);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.08);
        }

        .dropzone.has-file {
          border-color: rgba(34, 197, 94, 0.45);
          background: rgba(34, 197, 94, 0.06);
        }

        .empty-file-state,
        .file-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .file-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef9f27;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.22);
        }

        .file-icon.success {
          color: #16a34a;
          background: #dcfce7;
          border-color: #bbf7d0;
        }

        .drop-title,
        .file-name {
          margin: 0;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
        }

        .drop-subtitle,
        .file-size {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-group label {
          color: #374151;
          font-size: 12px;
          font-weight: 800;
        }

        .field-group select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border-radius: 11px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          outline: none;
          font-size: 14px;
          transition: 0.15s ease;
        }

        .field-group select:focus {
          border-color: rgba(239, 159, 39, 0.55);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.1);
        }

        .result-boxes {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .result-box {
          padding: 13px 14px;
          border-radius: 13px;
          font-size: 13px;
        }

        .result-box.success {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #166534;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
        }

        .result-box.success p {
          margin: 0;
        }

        .result-box.failed {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .result-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .result-box ul {
          margin: 0;
          padding-left: 18px;
          max-height: 130px;
          overflow-y: auto;
          font-size: 12px;
          line-height: 1.5;
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding-top: 2px;
        }

        .secondary-btn,
        .primary-btn {
          height: 42px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .secondary-btn {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #374151;
        }

        .secondary-btn:hover {
          background: #f9fafb;
        }

        .primary-btn {
          border: 1px solid rgba(239, 159, 39, 0.28);
          background: #ef9f27;
          color: #1a0d00;
        }

        .primary-btn:hover {
          background: #e8911f;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid rgba(26, 13, 0, 0.28);
          border-top-color: #1a0d00;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 560px) {
          .import-backdrop {
            align-items: flex-end;
            padding: 12px;
          }

          .import-modal {
            max-width: none;
            border-radius: 18px;
          }

          .modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}