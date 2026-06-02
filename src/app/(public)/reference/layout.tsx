import type { ReactNode } from 'react'
import { buildMetadata } from '../../seo'

export const metadata = buildMetadata({
  title: 'Références MD2I - projets de développement et déploiements SARA',
  description:
    'Explorez les références MD2I : logiciels SARA, systèmes de gestion, suivi-évaluation, formation et appui-maintenance pour projets de développement dans de nombreux pays.',
  path: '/reference',
  keywords: [
    'références MD2I',
    'déploiements SARA',
    'projets Union Européenne',
    'projets de développement Madagascar',
    'logiciel gestion projet international',
    'suivi-évaluation projet',
  ],
})

export default function ReferenceLayout({ children }: { children: ReactNode }) {
  return children
}
