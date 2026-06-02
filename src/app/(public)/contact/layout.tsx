import type { ReactNode } from 'react'
import { buildMetadata } from '../../seo'

export const metadata = buildMetadata({
  title: 'Contact MD2I - support SARA, maintenance et demande de projet',
  description:
    'Contactez MD2I France ou MD2I Madagascar pour une demande de logiciel SARA, appui-maintenance, téléassistance, formation ou accompagnement de projet.',
  path: '/contact',
  keywords: [
    'contact MD2I',
    'support SARA',
    'maintenance logiciel SARA',
    'assistance utilisateurs',
    'téléassistance MD2I',
    'formation logiciel projet',
  ],
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
