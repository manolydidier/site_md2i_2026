import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'MD2i — Cabinet IT',
  description: 'Cabinet IT — Solutions digitales',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <Providers>
          {children}   {/* ← plus de NavbarWrapper ici */}
        </Providers>
      </body>
    </html>
  )
}