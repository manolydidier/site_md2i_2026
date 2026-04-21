import PublicFooter from '../components/footer/publicfooter'
import PublicNavbar from '../components/PublicNavbar'
import "../../app/globals.css";
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