import PublicFooter from '../components/footer/publicfooter'
import PublicNavbar from '../components/PublicNavbar'

export default function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
      <PublicFooter/>
    </>
  )
}