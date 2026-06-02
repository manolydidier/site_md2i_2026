import HeroSection from '../components/HomePage/herosection/HeroSection'
import PublicArticlesPage from '../components/Articles/PublicArticlesPage'
import OrganisationSection from '../components/HomePage/organisation/OrganisationSection'
import PublicProductsPage from './produits/PublicProductsPage'
import TechListe from '../components/footer/TechListe'
import { buildMetadata } from '../seo'

export const metadata = buildMetadata({
  title: 'Logiciels SARA pour projets FED, multi-bailleurs et suivi-évaluation',
  description:
    'MD2I conçoit les logiciels SARA pour la gestion financière, administrative, comptable et opérationnelle des projets de développement, avec formation et appui-maintenance.',
  path: '/',
  keywords: [
    'logiciels SARA',
    'gestion projet FED',
    'gestion projet Union Européenne',
    'SARA FED DP ULTIMATE',
    'SARA M&E',
    'logiciel gestion financière projet',
  ],
})

export default function Home() {
  return (
    <>
      <HeroSection />
      {/* <HomePage /> */}
      <PublicArticlesPage/>
      <OrganisationSection />
      <PublicProductsPage />
      <TechListe />
    </>
  )
}
