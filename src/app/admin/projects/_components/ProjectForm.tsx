'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProjectData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  images: string[]
  techStack: string[]
  projectUrl: string | null
  githubUrl: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  gjsHtml: string | null
}

interface ProjectFormProps {
  mode: 'create' | 'edit'
  initial?: ProjectData
  canUpdate: boolean
}

const DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProjectForm({ mode, initial, canUpdate }: ProjectFormProps) {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const readOnly = mode === 'edit' && !canUpdate

  const [title,       setTitle]       = useState(initial?.title ?? '')
  const [slug,        setSlug]        = useState(initial?.slug ?? '')
  const [slugLocked,  setSlugLocked]  = useState(mode === 'edit')
  const [excerpt,     setExcerpt]     = useState(initial?.excerpt ?? '')
  const [coverImage,  setCoverImage]  = useState(initial?.coverImage ?? '')
  const [images,      setImages]      = useState<string[]>(initial?.images ?? [])
  const [techStack,   setTechStack]   = useState<string[]>(initial?.techStack ?? [])
  const [techInput,   setTechInput]   = useState('')
  const [projectUrl,  setProjectUrl]  = useState(initial?.projectUrl ?? '')
  const [githubUrl,   setGithubUrl]   = useState(initial?.githubUrl ?? '')
  const [status,      setStatus]      = useState(initial?.status ?? 'DRAFT')
  const [gjsHtml,     setGjsHtml]     = useState(initial?.gjsHtml ?? '')

  const [uploadingCover,  setUploadingCover]  = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugLocked) setSlug(slugify(value))
  }

  function addTech() {
    const value = techInput.trim()
    if (!value || techStack.includes(value)) {
      setTechInput('')
      return
    }
    setTechStack(prev => [...prev, value])
    setTechInput('')
  }

  function removeTech(value: string) {
    setTechStack(prev => prev.filter(item => item !== value))
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Échec de l'upload.")
    return data.url as string
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingCover(true)
    setError('')
    try {
      const url = await uploadFile(file)
      setCoverImage(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur pendant l'upload.")
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingGallery(true)
    setError('')
    try {
      const urls = await Promise.all(files.map(uploadFile))
      setImages(prev => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur pendant l'upload.")
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(item => item !== url))
  }

  async function handleSubmit(e: React.FormEvent, publish?: boolean) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Le titre est requis.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      images,
      techStack,
      projectUrl: projectUrl || null,
      githubUrl: githubUrl || null,
      gjsHtml: gjsHtml || null,
      status: publish ? 'PUBLISHED' : status,
    }

    try {
      const res = await fetch(
        mode === 'create' ? '/api/projects' : `/api/projects/${initial?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Erreur pendant l’enregistrement.')
        return
      }

      router.push('/admin/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/projects" className="text-xs text-amber-600 hover:underline">← Retour aux projets</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {mode === 'create' ? 'Nouveau projet' : 'Modifier le projet'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <fieldset disabled={readOnly} className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ex : Refonte plateforme e-commerce"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlugLocked(true); setSlug(e.target.value) }}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => { setSlugLocked(false); setSlug(slugify(title)) }}
                  className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ↺
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Extrait</label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Résumé court du projet…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image de couverture</label>
              <div className="flex items-center gap-3">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">Aucune</div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-amber-300 transition-colors disabled:opacity-50"
                  >
                    {uploadingCover ? 'Envoi…' : 'Téléverser une image'}
                  </button>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Galerie</label>
              <div className="flex flex-wrap gap-3">
                {images.map(url => (
                  <div key={url} className="relative group/img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="w-16 h-16 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs hover:border-amber-300 hover:text-amber-600 transition-colors disabled:opacity-50"
                >
                  {uploadingGallery ? '…' : '+ Ajouter'}
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Technologies</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {techStack.map(tech => (
                  <span key={tech} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-amber-200">
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="text-amber-500 hover:text-amber-800">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech() } }}
                  placeholder="Ex : Next.js — Entrée pour ajouter"
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien du projet</label>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={e => setProjectUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien GitHub</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu détaillé (HTML)</label>
              <textarea
                rows={8}
                value={gjsHtml}
                onChange={e => setGjsHtml(e.target.value)}
                placeholder="Contenu HTML libre de la page projet…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl font-mono resize-y focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Champ HTML brut en attendant l&apos;éditeur visuel — un futur upgrade pourra brancher l&apos;éditeur GrapesJS déjà utilisé pour les produits.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ProjectData['status'])}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </div>
        </fieldset>

        {!readOnly && (
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer en brouillon' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={e => handleSubmit(e, true)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Publier'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
