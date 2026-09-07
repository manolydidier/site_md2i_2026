import dynamic from 'next/dynamic'
import PublicArticlesPage from '../components/Articles/PublicArticlesPage'
import OrganisationSection from '../components/HomePage/organisation/OrganisationSection'
import PublicProductsPage from './produits/PublicProductsPage'
import TechListe from '../components/footer/TechListe'
import { buildMetadata } from '../seo'

// Code-splitté (garde le rendu serveur — le contenu du premier slide reste
// dans le HTML initial pour le SEO/no-JS) pour que le bundle three.js de la
// scène 3D ne soit plus inliné dans le chunk principal de la page d'accueil.
const HeroSection = dynamic(() => import('../components/HomePage/herosection/HeroSection'))

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
