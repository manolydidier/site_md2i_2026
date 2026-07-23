'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'

// ── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  _count: { posts: number }
}

interface FormState {
  name: string
  slug: string
  description: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { can, loading: permLoading } = usePermissions()
  const canRead   = can('categories', 'canRead') || can('categories', 'canList')
  const canCreate = can('categories', 'canCreate')
  const canUpdate = can('categories', 'canUpdate')
  const canDelete = can('categories', 'canDelete')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  // Modal state
  const [modal,      setModal]      = useState<null | 'create' | Category>(null)
  const [form,       setForm]       = useState<FormState>({ name: '', slug: '', description: '' })
  const [slugLocked, setSlugLocked] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/categories')
      const json = await res.json()
      setCategories(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filtered = categories.filter(cat =>
    !search.trim() ||
    cat.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.trim().toLowerCase())
  )

  // ── Open modal ────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ name: '', slug: '', description: '' })
    setSlugLocked(false)
    setErrors({})
    setModal('create')
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '' })
    setSlugLocked(true)
    setErrors({})
    setModal(cat)
  }

  // ── Form helpers ──────────────────────────────────────────────────────
  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: slugLocked ? f.slug : slugify(name) }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Le nom est requis'
    if (!form.slug.trim()) e.slug = 'Le slug est requis'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug invalide (minuscules, chiffres et tirets)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const isEdit = modal !== 'create'
    const id     = isEdit ? (modal as Category).id : null

    try {
      const res = await fetch(
        isEdit ? `/api/categories/${id}` : '/api/categories',
        {
          method:  isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:        form.name,
            slug:        form.slug,
            description: form.description || null,
          }),
        }
      )

      if (!res.ok) {
        const j = await res.json()
        if (j.error?.includes('slug existe déjà')) setErrors({ slug: 'Ce slug est déjà utilisé' })
        return
      }

      setModal(null)
      fetchCategories()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      fetchCategories()
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
          Vous n&apos;avez pas la permission de consulter les catégories.
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories d&apos;articles</h1>
            <p className="text-sm text-gray-500 mt-0.5">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
          </div>
          {canCreate && (
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
            >
              + Nouvelle catégorie
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <input
            type="search"
            placeholder="Rechercher une catégorie…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-gray-400 text-sm">Aucune catégorie</p>
              {canCreate && (
                <button onClick={openCreate} className="text-amber-600 text-sm font-medium hover:underline">
                  Créer la première catégorie →
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Nom</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Slug</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Articles</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Créée le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{cat.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        cat._count.posts > 0
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat._count.posts}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(cat.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canUpdate && (
                          <button
                            onClick={() => openEdit(cat)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:text-amber-700 transition-colors"
                          >
                            Modifier
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(cat.id)}
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

      {/* Create / Edit modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex : Actualités"
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => { setSlugLocked(true); setForm(f => ({ ...f, slug: e.target.value })) }}
                    placeholder="actualites"
                    className={`flex-1 px-4 py-2.5 text-sm border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => { setSlugLocked(false); setForm(f => ({ ...f, slug: slugify(f.name) })) }}
                    className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    ↺
                  </button>
                </div>
                {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description optionnelle…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : modal === 'create' ? 'Créer' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Supprimer la catégorie ?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Les articles liés seront décatégorisés. Cette action est irréversible.
            </p>
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
