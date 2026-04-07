import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type UploadItem = {
  id: string
  url: string
  name: string
  size: number
  createdAt: string
  updatedAt: string
  type: 'image' | 'file'
  ext: string
}

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
])

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return walk(fullPath)
      }

      if (entry.isFile()) {
        return [fullPath]
      }

      return []
    })
  )

  return results.flat()
}

function toPublicUrl(absPath: string) {
  const rel = path.relative(path.join(process.cwd(), 'public'), absPath)
  return '/' + rel.split(path.sep).join('/')
}

function detectType(ext: string): 'image' | 'file' {
  return IMAGE_EXTENSIONS.has(ext.toLowerCase()) ? 'image' : 'file'
}

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

    try {
      await fs.access(targetDir)
    } catch {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    const filePaths = await walk(targetDir)

    const files = await Promise.all(
      filePaths.map(async (filePath) => {
        const stats = await fs.stat(filePath)
        const ext = path.extname(filePath).toLowerCase()
        const itemType = detectType(ext)

        const item: UploadItem = {
          id: filePath,
          url: toPublicUrl(filePath),
          name: path.basename(filePath),
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          type: itemType,
          ext,
        }

        return item
      })
    )

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