import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

type ReferenceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type FieldErrors = Record<string, string>

const ALLOWED_STATUSES = new Set<ReferenceStatus>([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
])

function validationError(fieldErrors: FieldErrors, status = 400) {
  return NextResponse.json(
    {
      error: 'Validation error',
      fieldErrors,
    },
    { status }
  )
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeCode(value: string) {
  return value.trim().toLowerCase()
}

function toNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
}

function serializeReference(reference: any) {
  return {
    ...reference,
    lat: Number(reference.lat),
    lng: Number(reference.lng),
  }
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/references/[id]'>
) {
  try {
    const { id } = await ctx.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid reference id' }, { status: 400 })
    }

    const reference = await prisma.reference.findUnique({
      where: { id },
    })

    if (!reference) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
    }

    return NextResponse.json(serializeReference(reference))
  } catch (error) {
    console.error('[GET /api/references/[id]] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/references/[id]'>
) {
  try {
    const { id } = await ctx.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid reference id' }, { status: 400 })
    }

    const body = await request.json()

    const existing = await prisma.reference.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const fieldErrors: FieldErrors = {}

    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (!title) fieldErrors.title = 'Le titre est requis'
      else updateData.title = title
    }

    if (body.slug !== undefined) {
      const slug = normalizeSlug(String(body.slug))
      if (!slug) {
        fieldErrors.slug = 'Le slug est requis'
      } else {
        if (slug !== existing.slug) {
          const slugConflict = await prisma.reference.findUnique({
            where: { slug },
          })

          if (slugConflict && slugConflict.id !== id) {
            fieldErrors.slug = 'Une référence avec ce slug existe déjà'
          }
        }

        updateData.slug = slug
      }
    }

    if (body.client !== undefined) {
      const client = String(body.client).trim()
      if (!client) fieldErrors.client = 'Le client est requis'
      else updateData.client = client
    }

    if (body.country !== undefined) {
      const country = String(body.country).trim()
      if (!country) fieldErrors.country = 'Le pays est requis'
      else updateData.country = country
    }

    if (body.category !== undefined) {
      const category = String(body.category).trim()
      if (!category) fieldErrors.category = 'La catégorie est requise'
      else updateData.category = category
    }

    if (body.excerpt !== undefined) {
      const excerpt = String(body.excerpt).trim()
      if (!excerpt) fieldErrors.excerpt = "L'extrait est requis"
      else updateData.excerpt = String(body.excerpt)
    }

    if (body.details !== undefined) {
      const details = String(body.details).trim()
      if (!details) fieldErrors.details = 'Le détail complet est requis'
      else updateData.details = String(body.details)
    }

    if (body.image !== undefined) {
      updateData.image = String(body.image ?? '')
    }

    if (body.date !== undefined) {
      updateData.date = String(body.date ?? '')
    }

    if (body.code !== undefined) {
      updateData.code = normalizeCode(String(body.code))
    }

    if (body.lat !== undefined) {
      const lat = toNumber(body.lat)
      if (lat === null) fieldErrors.lat = 'Latitude invalide'
      else updateData.lat = lat
    }

    if (body.lng !== undefined) {
      const lng = toNumber(body.lng)
      if (lng === null) fieldErrors.lng = 'Longitude invalide'
      else updateData.lng = lng
    }

    if (body.tags !== undefined) {
      updateData.tags = normalizeStringArray(body.tags)
    }

    if (body.technologies !== undefined) {
      updateData.technologies = normalizeStringArray(body.technologies)
    }

    if (body.impact !== undefined) {
      updateData.impact = body.impact ? String(body.impact).trim() : null
    }

    if (body.team !== undefined) {
      updateData.team = body.team ? String(body.team).trim() : null
    }

    if (body.duration !== undefined) {
      updateData.duration = body.duration ? String(body.duration).trim() : null
    }

    if (body.budget !== undefined) {
      updateData.budget = body.budget ? String(body.budget).trim() : null
    }

    if (body.gjsComponents !== undefined) {
      updateData.gjsComponents = body.gjsComponents
    }

    if (body.gjsStyles !== undefined) {
      updateData.gjsStyles = body.gjsStyles
    }

    if (body.gjsHtml !== undefined) {
      updateData.gjsHtml = body.gjsHtml ? String(body.gjsHtml) : null
    }

    if (body.gjsJs !== undefined) {
      updateData.gjsJs = body.gjsJs ? String(body.gjsJs) : null
    }

    if (body.authorId !== undefined) {
      if (body.authorId === null || body.authorId === '') {
        updateData.authorId = null
      } else {
        const authorId = String(body.authorId)
        if (!isUuid(authorId)) {
          fieldErrors.authorId = 'authorId doit être un UUID valide'
        } else {
          updateData.authorId = authorId
        }
      }
    }

    if (body.status !== undefined) {
      const status = String(body.status) as ReferenceStatus

      if (!ALLOWED_STATUSES.has(status)) {
        fieldErrors.status = 'Statut invalide'
      } else {
        updateData.status = status

        if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
          updateData.publishedAt = new Date()
        } else if (status !== 'PUBLISHED') {
          updateData.publishedAt = null
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return validationError(fieldErrors, 400)
    }

    const reference = await prisma.reference.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(serializeReference(reference))
  } catch (error) {
    console.error('[PATCH /api/references/[id]] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/references/[id]'>
) {
  try {
    const { id } = await ctx.params

    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Invalid reference id' }, { status: 400 })
    }

    const existing = await prisma.reference.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
    }

    await prisma.reference.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[DELETE /api/references/[id]] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}