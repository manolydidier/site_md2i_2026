import PublicNavbar from '../components/PublicNavbar'
import HomePage from '../components/HomePage'
import HeroSection from '../components/HomePage/herosection/HeroSection'
import PublicArticlesPage from '../components/Articles/PublicArticlesPage'


export default function Home() {
  return (
    <>
      <HeroSection />
      {/* <HomePage /> */}
      <PublicArticlesPage/>
    </>
  )
}