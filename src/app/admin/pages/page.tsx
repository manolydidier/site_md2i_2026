'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'

interface PageRow {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  createdAt: string
  author: { firstName: string | null; lastName: string | null; email: string }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  ARCHIVED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function getAuthorLabel(author: PageRow['author']) {
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ').trim()
  return name || author.email
}

export default function PagesPage() {
  const { can, loading: permLoading } = usePermissions()
  const canRead   = can('pages', 'canRead') || can('pages', 'canList')
  const canCreate = can('pages', 'canCreate')
  const canUpdate = can('pages', 'canUpdate')
  const canDelete = can('pages', 'canDelete')

  const [pages,    setPages]    = useState<PageRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res  = await fetch(`/api/pages?${params}`)
      const json = await res.json()
      setPages(json.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchPages() }, [fetchPages])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/pages/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      fetchPages()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  if (!permLoading && !canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de consulter les pages.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
          </div>
          {canCreate && (
            <Link
              href="/admin/pages/new"
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
            >
              + Nouvelle page
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 flex-wrap">
          <input
            type="search"
            placeholder="Rechercher une page…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-gray-400 text-sm">Aucune page</p>
              {canCreate && (
                <Link href="/admin/pages/new" className="text-amber-600 text-sm font-medium hover:underline">
                  Créer la première page →
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Page</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Auteur</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Mis à jour</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map(page => (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{page.title}</p>
                      <code className="text-xs text-gray-400">{page.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[page.status]}`}>
                        {STATUS_LABELS[page.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{getAuthorLabel(page.author)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(page.publishedAt || page.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {canUpdate && (
                          <Link
                            href={`/admin/pages/${page.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:text-amber-700 transition-colors"
                          >
                            Modifier
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(page.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Supprimer la page ?</h2>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
