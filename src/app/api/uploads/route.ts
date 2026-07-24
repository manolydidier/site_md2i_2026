import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

import { UPLOADS_ROOT, listUploadFiles } from '@/app/lib/uploads'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || '200')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const type = (searchParams.get('type') || 'all').toLowerCase()
    const folder = (searchParams.get('folder') || '').replace(/^\/+|\/+$/g, '')

    const targetDir = folder
      ? path.join(UPLOADS_ROOT, folder)
      : UPLOADS_ROOT

    const files = await listUploadFiles(targetDir)

    let filtered = files

    if (type === 'image') {
      filtered = files.filter((f) => f.type === 'image')
    } else if (type === 'file') {
      filtered = files.filter((f) => f.type === 'file')
    }

    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[GET /api/uploads]', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
