'use client'

import { usePermissions } from '@/(permisionGuard)/context/PermissionsContext'
import ProjectStudio from '../_components/ProjectStudio'

export default function NewProjectPage() {
  const { can, loading } = usePermissions()

  if (!loading && !can('projects', 'canCreate')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de créer un projet.
        </p>
      </div>
    )
  }

  return <ProjectStudio mode="create" canUpdate />
}
