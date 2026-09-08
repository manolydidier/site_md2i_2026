import nextDynamic from 'next/dynamic'
import { buildMetadata } from '../../seo'
import { getInitialProducts } from '../../lib/public-products'

export const dynamic = 'force-dynamic'

const PublicProductsPage = nextDynamic(() => import('./PublicProductsPage'))

export const metadata = buildMetadata({
  title: 'Produits SARA et logiciels de gestion de projets',
  description:
    'Découvrez les solutions SARA de MD2I : gestion de projets FED, multi-bailleurs, multi-devises, suivi-évaluation, comptabilité, paie, licences et démonstrations.',
  path: '/produits',
  keywords: [
    'produits SARA',
    'SARA FED DP ULTIMATE',
    'SARA FED ON ULTIMATE',
    'SARA PAIE',
    'SARA NSA',
    'LUGAF',
    'SARA M&E',
    'Plan de passation des marchés',
    'logiciel multi-bailleurs',
  ],
})

export default async function Page() {
  const initial = await getInitialProducts()

  return (
    <PublicProductsPage
      initialProducts={initial?.products}
      initialCategories={initial?.categories}
      initialPagination={initial?.pagination}
    />
  )
}
