import type { ReactNode } from 'react'
import { buildMetadata } from '../../seo'

export const metadata = buildMetadata({
  title: 'Services MD2I - appui, formation, maintenance et développement logiciel',
  description:
    'MD2I accompagne les projets de développement : assistance technique, gestion financière et comptable, conception de logiciels, licences SARA, formation, support et maintenance.',
  path: '/services',
  keywords: [
    'services MD2I',
    'appui maintenance logiciel',
    'formation SARA',
    'assistance technique projet',
    'contrôle de gestion projet',
    'préparation audit projet',
    'développement logiciel sur mesure',
    'support utilisateurs SARA',
  ],
})

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children
}
