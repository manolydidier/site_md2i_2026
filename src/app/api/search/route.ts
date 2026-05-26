import { NextRequest, NextResponse } from 'next/server'
import { searchSite } from '@/app/lib/search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q') ?? ''
    const scope = searchParams.get('scope') ?? 'all'
    const limitParam = searchParams.get('limit') ?? '6'
    const limit = Number(limitParam)

    const data = await searchSite({
      query,
      scope,
      limit: Number.isFinite(limit) ? limit : 6,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[SEARCH_ERROR]', error)

    return NextResponse.json(
      {
        message: 'Erreur pendant la recherche.',
      },
      { status: 500 }
    )
  }
}