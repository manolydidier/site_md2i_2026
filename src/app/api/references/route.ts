import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

type ReferenceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type FieldErrors = Record<string, string>;

const ALLOWED_STATUSES: ReferenceStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const ALLOWED_SORT_FIELDS = [
  'title',
  'client',
  'country',
  'date',
  'category',
  'createdAt',
  'updatedAt',
] as const;

function validationError(fieldErrors: FieldErrors, status = 400) {
  return NextResponse.json(
    {
      error: 'Validation error',
      fieldErrors,
    },
    { status }
  );
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function serializeReference(reference: any) {
  return {
    ...reference,
    lat: Number(reference.lat),
    lng: Number(reference.lng),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const search = searchParams.get('search')?.trim() || '';
    const statusParam = searchParams.get('status');
    const category = searchParams.get('category')?.trim() || '';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (statusParam && ALLOWED_STATUSES.includes(statusParam as ReferenceStatus)) {
      where.status = statusParam;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validSortBy = ALLOWED_SORT_FIELDS.includes(sortBy as any)
      ? sortBy
      : 'createdAt';

    const [rawReferences, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validSortBy]: sortDir },
      }),
      prisma.reference.count({ where }),
    ]);

    const references = rawReferences.map(serializeReference);

    return NextResponse.json({
      data: references,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/references] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      details,
      image,
      date,
      client,
      country,
      code,
      lat,
      lng,
      category,
      tags = [],
      impact,
      technologies = [],
      team,
      duration,
      budget,
      status = 'PUBLISHED',
    } = body;

    const fieldErrors: FieldErrors = {};

    if (!title?.trim()) fieldErrors.title = 'Le titre est requis';
    if (!slug?.trim()) fieldErrors.slug = 'Le slug est requis';
    if (!client?.trim()) fieldErrors.client = 'Le client est requis';
    if (!country?.trim()) fieldErrors.country = 'Le pays est requis';
    if (!category?.trim()) fieldErrors.category = 'La catégorie est requise';
    if (!excerpt?.trim()) fieldErrors.excerpt = "L'extrait est requis";
    if (!details?.trim()) fieldErrors.details = 'Le détail complet est requis';

    const parsedLat = Number(lat ?? 0);
    const parsedLng = Number(lng ?? 0);

    if (!Number.isFinite(parsedLat)) fieldErrors.lat = 'Latitude invalide';
    if (!Number.isFinite(parsedLng)) fieldErrors.lng = 'Longitude invalide';

    if (!ALLOWED_STATUSES.includes(status)) {
      fieldErrors.status = 'Statut invalide';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return validationError(fieldErrors, 400);
    }

    const normalizedSlug = normalizeSlug(String(slug));

    const existing = await prisma.reference.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existing) {
      return validationError(
        { slug: 'Une référence avec ce slug existe déjà' },
        409
      );
    }

    const reference = await prisma.reference.create({
      data: {
        title: String(title).trim(),
        slug: normalizedSlug,
        excerpt: String(excerpt ?? ''),
        details: String(details ?? ''),
        image: image?.trim() || '',
        date: date || new Date().getFullYear().toString(),
        client: String(client).trim(),
        country: String(country).trim(),
        code: (code || 'fr').toLowerCase(),
        lat: parsedLat,
        lng: parsedLng,
        category: String(category).trim(),
        tags: normalizeStringArray(tags),
        impact: impact ? String(impact).trim() : null,
        technologies: normalizeStringArray(technologies),
        team: team ? String(team).trim() : null,
        duration: duration ? String(duration).trim() : null,
        budget: budget ? String(budget).trim() : null,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json(serializeReference(reference), { status: 201 });
  } catch (error) {
    console.error('[POST /api/references] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}