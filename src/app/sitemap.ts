import type { MetadataRoute } from 'next'
import { SITE_URL } from './seo'

const staticRoutes = [
  { path: '/', priority: 1 },
  { path: '/produits', priority: 0.95 },
  { path: '/services', priority: 0.9 },
  { path: '/reference', priority: 0.8 },
  { path: '/a-propos', priority: 0.72 },
  { path: '/contact', priority: 0.7 },
  { path: '/contact-commercial', priority: 0.7 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
    priority: route.priority,
  }))
}
