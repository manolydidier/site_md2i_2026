import PublicFooter from '../components/footer/publicfooter'
import PublicBreadcrumbs from '../components/PublicBreadcrumbs'
import PublicNavbar from '../components/PublicNavbar'
import PublicThemeShell from './PublicThemeShell'
import '../../app/globals.css'
import './public-theme.css'

export default function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <PublicThemeShell>
      <a className="public-skip-link" href="#public-main-content">
        Aller au contenu
      </a>
      <PublicNavbar />
      <PublicBreadcrumbs />
      <div id="public-main-content" className="public-main-content">
        {children}
      </div>
      <PublicFooter />
    </PublicThemeShell>
  )
}
