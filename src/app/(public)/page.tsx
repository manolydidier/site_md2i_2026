import dynamic from 'next/dynamic'
import { buildMetadata } from '../seo'
import { getInitialArticles } from '../lib/public-articles'
import { getInitialProducts } from '../lib/public-products'

// Chaque section est code-splittée dans son propre chunk (garde le rendu
// serveur par défaut — le contenu reste dans le HTML initial pour le
// SEO/no-JS) plutôt que d'inliner ~4000 lignes de composants clients
// (react-i18next + framer-motion + TechListe à lui seul fait plus de 2800
// lignes) dans le bundle JS principal de la page d'accueil.
const HeroSection = dynamic(() => import('../components/HomePage/herosection/HeroSection'))
const PublicArticlesPage = dynamic(() => import('../components/Articles/PublicArticlesPage'))
const OrganisationSection = dynamic(() => import('../components/HomePage/organisation/OrganisationSection'))
const PublicProductsPage = dynamic(() => import('./produits/PublicProductsPage'))
const TechListe = dynamic(() => import('../components/footer/TechListe'))

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

export default async function Home() {
  const [initialArticles, initialProducts] = await Promise.all([
    getInitialArticles(),
    getInitialProducts(),
  ])

  return (
    <>
      <HeroSection />
      {/* <HomePage /> */}
      <PublicArticlesPage
        initialArticles={initialArticles?.articles}
        initialCategories={initialArticles?.categories}
        initialPagination={initialArticles?.pagination}
      />
      <OrganisationSection />
      <PublicProductsPage
        initialProducts={initialProducts?.products}
        initialCategories={initialProducts?.categories}
        initialPagination={initialProducts?.pagination}
      />
      <TechListe />
    </>
  )
}
