import PublicArticlesPage from '../../components/Articles/PublicArticlesPage'
import { buildMetadata } from '../../seo'

export const metadata = buildMetadata({
  title: 'Articles et publications MD2I | MD2I',
  description:
    'Retrouvez les articles, actualites et publications MD2I autour des logiciels SARA, de la gestion de projets, du suivi-evaluation et des solutions digitales.',
  path: '/articles',
  keywords: [
    'articles MD2I',
    'publications MD2I',
    'actualites MD2I',
    'logiciels SARA',
    'gestion de projets',
    'suivi evaluation',
  ],
})

export default function ArticlesPage() {
  return <PublicArticlesPage />
}
