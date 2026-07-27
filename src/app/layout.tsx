import type { Metadata } from 'next'
import { DM_Sans, Fraunces, Roboto } from 'next/font/google'
import Providers from './providers'
import {
  MD2I_DEFAULT_DESCRIPTION,
  MD2I_DEFAULT_TITLE,
  MD2I_KEYWORDS,
  MD2I_ORGANIZATION_JSON_LD,
  SITE_URL,
} from './seo'

const fontBody = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const fontDisplay = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const fontHeading = Roboto({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'MD2I',
  title: {
    default: MD2I_DEFAULT_TITLE,
    template: '%s | MD2I',
  },
  description: MD2I_DEFAULT_DESCRIPTION,
  keywords: MD2I_KEYWORDS,
  authors: [{ name: 'MD2I', url: SITE_URL }],
  creator: 'MD2I',
  publisher: 'MD2I',
  category: 'Software',
  classification:
    'Logiciels de gestion de projets, suivi-évaluation, appui-maintenance et développement logiciel sur mesure',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: MD2I_DEFAULT_TITLE,
    description: MD2I_DEFAULT_DESCRIPTION,
    url: '/',
    siteName: 'MD2I',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'MD2I - Logiciels SARA et solutions de gestion de projets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: MD2I_DEFAULT_TITLE,
    description: MD2I_DEFAULT_DESCRIPTION,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontHeading.variable}`}
    >
      <body style={{ margin: 0 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(MD2I_ORGANIZATION_JSON_LD),
          }}
        />
        <Providers>
          {children}   {/* ← plus de NavbarWrapper ici */}
        </Providers>
      </body>
    </html>
  )
}
