import PublicProductsPage from './PublicProductsPage'
import { buildMetadata } from '../../seo'

export const dynamic = 'force-dynamic'

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

export default function Page() {
  return <PublicProductsPage />
}
