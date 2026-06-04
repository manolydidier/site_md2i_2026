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
      <PublicNavbar />
      <PublicBreadcrumbs />
      {children}
      <PublicFooter />
    </PublicThemeShell>
  )
}
