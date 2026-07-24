'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'

interface OrphanFile {
  id: string
  url: string
  name: string
  size: number
  createdAt: string
  type: 'image' | 'file'
  ext: string
  ageMs: number
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatAge(ageMs: number) {
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000))
  return days <= 1 ? '1 jour' : `${days} jours`
}

export default function UploadsPage() {
  const { can, loading: permLoading } = usePermissions()
  const canRead = can('uploads', 'canRead')
  const canDelete = can('uploads', 'canDelete')

  const [files, setFiles] = useState<OrphanFile[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchOrphans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/uploads/orphans')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur pendant le chargement.')
      setFiles(json.data || [])
      setTotalSize(json.totalSize || 0)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canRead) fetchOrphans()
  }, [canRead, fetchOrphans])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.size === files.length ? new Set() : new Set(files.map((f) => f.id))))
  }

  async function handleDelete() {
    if (selected.size === 0) return
    if (!confirm(`Supprimer définitivement ${selected.size} fichier(s) ?`)) return

    setDeleting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/uploads/orphans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur pendant la suppression.')
      setMessage(`${json.deleted.length} fichier(s) supprimé(s).`)
      await fetchOrphans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.')
    } finally {
      setDeleting(false)
    }
  }

  if (!permLoading && !canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de consulter la médiathèque.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Médiathèque — fichiers orphelins</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Fichiers uploadés (public/uploads) qui ne sont référencés par aucun article, produit,
              projet ou profil utilisateur, et vieux d&apos;au moins 24h.
            </p>
          </div>
          <button
            onClick={fetchOrphans}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
        ) : files.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
            Aucun fichier orphelin détecté.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selected.size === files.length && files.length > 0}
                  onChange={toggleAll}
                />
                {files.length} fichier(s) — {formatSize(totalSize)} au total
              </label>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={selected.size === 0 || deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40"
                >
                  {deleting ? 'Suppression…' : `Supprimer (${selected.size})`}
                </button>
              )}
            </div>

            <ul className="divide-y divide-gray-100">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(file.id)}
                    onChange={() => toggle(file.id)}
                  />
                  {file.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-400">
                      {file.ext.replace('.', '').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatSize(file.size)} · {formatAge(file.ageMs)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
