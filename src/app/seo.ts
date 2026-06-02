import type { Metadata } from 'next'

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://md2i.eu'
).replace(/\/$/, '')

export const MD2I_DEFAULT_TITLE =
  'MD2I | Logiciel de gestion de projet FED, multi-bailleurs et multi-devises'

export const MD2I_DEFAULT_DESCRIPTION =
  'MD2I conçoit les logiciels SARA et accompagne les projets de développement avec des solutions de gestion FED, multi-bailleurs, multi-devises, suivi-évaluation, formation et appui-maintenance.'

export const MD2I_KEYWORDS = [
  'MD2I',
  'MD 2 I',
  'Management Development International Informatique',
  'SARA',
  'SARA ULTIMATE',
  'SARA FED',
  'SARA EDF',
  'SARA M&E',
  'SARA Management Evaluation',
  'logiciel gestion de projet FED',
  'logiciel gestion projets Union Européenne',
  'logiciel multi-bailleurs',
  'logiciel multi-devises',
  'logiciel multi-projets',
  'gestion financière de projet',
  'gestion comptable de projet',
  'suivi évaluation projet',
  'monitoring and evaluation software',
  'logiciel comptabilité projet',
  'logiciel développement international',
  'appui maintenance logiciel',
  'formation utilisateurs logiciel',
  'développement logiciel sur mesure',
  'assistance technique projet',
  'gestion administrative et financière',
  'projets de développement',
  'bailleurs de fonds',
  'Madagascar',
  'Paris',
  'Antananarivo',
]

export const MD2I_ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MD2I',
  alternateName: [
    'MD 2 I',
    'MD2I France',
    'MD2I Madagascar',
    'Management Development International & Informatique',
  ],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  foundingDate: '1987',
  description: MD2I_DEFAULT_DESCRIPTION,
  email: ['france@md2i.eu', 'madagascar@md2i.eu'],
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: "55 Rue de l'Université, 2 Rue Villersexel",
      postalCode: '75007',
      addressLocality: 'Paris',
      addressCountry: 'FR',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Lot VA 20 E Tsiadana, BP 4132',
      postalCode: '101',
      addressLocality: 'Antananarivo',
      addressCountry: 'MG',
    },
  ],
  areaServed: ['Europe', 'Africa', 'Asia', 'Oceania', 'Americas'],
  knowsAbout: [
    'Project management software',
    'EDF project management',
    'Multi-donor project accounting',
    'Monitoring and evaluation',
    'Software maintenance',
    'Capacity building',
  ],
}

type BuildMetadataOptions = {
  title?: string
  description?: string
  path?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
}

function normalizePath(path = '/') {
  return path.startsWith('/') ? path : `/${path}`
}

export function buildMetadata({
  title,
  description = MD2I_DEFAULT_DESCRIPTION,
  path = '/',
  keywords = [],
  image = '/logo.png',
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const canonical = normalizePath(path)
  const resolvedTitle = title || MD2I_DEFAULT_TITLE
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`

  return {
    title: resolvedTitle,
    description,
    keywords: Array.from(new Set([...MD2I_KEYWORDS, ...keywords])),
    alternates: {
      canonical,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: 'MD2I',
      locale: 'fr_FR',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'MD2I - Logiciels SARA et solutions de gestion de projets',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  }
}
