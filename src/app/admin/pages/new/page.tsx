'use client'

import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'
import PageStudio from '../_components/PageStudio'

export default function NewPagePage() {
  const { can, loading } = usePermissions()

  if (!loading && !can('pages', 'canCreate')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de créer une page.
        </p>
      </div>
    )
  }

  return <PageStudio mode="create" canUpdate />
}
