'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'

interface SiteSettings {
  contactEmail: string | null
  contactPhone: string | null
  contactPhoneHref: string | null
  address: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
  facebookUrl: string | null
  xUrl: string | null
  maintenanceMode: boolean
}

const EMPTY_SETTINGS: SiteSettings = {
  contactEmail: '',
  contactPhone: '',
  contactPhoneHref: '',
  address: '',
  websiteUrl: '',
  linkedinUrl: '',
  facebookUrl: '',
  xUrl: '',
  maintenanceMode: false,
}

export default function SettingsPage() {
  const { can, loading: permLoading } = usePermissions()
  const canRead = can('settings', 'canRead')
  const canUpdate = can('settings', 'canUpdate')

  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (res.ok && json.data) {
        setSettings({
          contactEmail: json.data.contactEmail ?? '',
          contactPhone: json.data.contactPhone ?? '',
          contactPhoneHref: json.data.contactPhoneHref ?? '',
          address: json.data.address ?? '',
          websiteUrl: json.data.websiteUrl ?? '',
          linkedinUrl: json.data.linkedinUrl ?? '',
          facebookUrl: json.data.facebookUrl ?? '',
          xUrl: json.data.xUrl ?? '',
          maintenanceMode: Boolean(json.data.maintenanceMode),
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canRead) fetchSettings()
  }, [canRead, fetchSettings])

  const update = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erreur pendant l'enregistrement.")
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  if (!permLoading && !canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de consulter les paramètres.
        </p>
      </div>
    )
  }

  const readOnly = !canUpdate

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du site</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Coordonnées, réseaux sociaux et mode maintenance affichés sur le site public.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
        ) : (
          <fieldset disabled={readOnly} className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Contact</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de contact</label>
                <input
                  type="email"
                  value={settings.contactEmail ?? ''}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  placeholder="contact@md2i.eu"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone (affiché)</label>
                  <input
                    type="text"
                    value={settings.contactPhone ?? ''}
                    onChange={(e) => update('contactPhone', e.target.value)}
                    placeholder="+261 20 22 627 26"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone (lien tel:)</label>
                  <input
                    type="text"
                    value={settings.contactPhoneHref ?? ''}
                    onChange={(e) => update('contactPhoneHref', e.target.value)}
                    placeholder="+261202262726"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={settings.address ?? ''}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="MD2I Madagascar, Lot VA 20 E Tsiadana, Antananarivo 101, Madagascar"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site web</label>
                <input
                  type="url"
                  value={settings.websiteUrl ?? ''}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                  placeholder="https://md2i.eu"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Réseaux sociaux</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn</label>
                <input
                  type="url"
                  value={settings.linkedinUrl ?? ''}
                  onChange={(e) => update('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook</label>
                <input
                  type="url"
                  value={settings.facebookUrl ?? ''}
                  onChange={(e) => update('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">X (Twitter)</label>
                <input
                  type="url"
                  value={settings.xUrl ?? ''}
                  onChange={(e) => update('xUrl', e.target.value)}
                  placeholder="https://x.com/…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => update('maintenanceMode', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-sm font-medium text-gray-700">Mode maintenance</span>
              </label>
              <p className="text-xs text-gray-400 mt-1.5 ml-7">
                Signale au site public qu&apos;une maintenance est en cours (à consommer côté front public si besoin).
              </p>
            </div>
          </fieldset>
        )}

        {canUpdate && !loading && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Enregistré</span>}
          </div>
        )}
      </form>
    </div>
  )
}
