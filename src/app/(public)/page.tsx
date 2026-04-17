import PublicNavbar from '../components/PublicNavbar'
import HomePage from '../components/HomePage'
import HeroSection from '../components/HomePage/herosection/HeroSection'
import PublicArticlesPage from '../components/Articles/PublicArticlesPage'
import OrganisationSection from '../components/HomePage/organisation/OrganisationSection'
import ProductsSection from '../components/HomePage/products/ProductsSection'
import PublicProductsPage from './produits/PublicProductsPage'
import TechListe from '../components/footer/TechListe'


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