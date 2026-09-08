import dynamic from 'next/dynamic'
import { buildMetadata } from '../../seo'
import { getInitialArticles } from '../../lib/public-articles'

const PublicArticlesPage = dynamic(() => import('../../components/Articles/PublicArticlesPage'))

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

export default async function ArticlesPage() {
  const initial = await getInitialArticles()

  return (
    <PublicArticlesPage
      initialArticles={initial?.articles}
      initialCategories={initial?.categories}
      initialPagination={initial?.pagination}
    />
  )
}
