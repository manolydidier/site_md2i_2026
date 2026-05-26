import PublicFooter from '../components/footer/publicfooter'
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
      {children}
      <PublicFooter />
    </PublicThemeShell>
  )
}
