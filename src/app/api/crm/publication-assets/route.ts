import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizeFileName(value: string) {
  const extension = path.extname(value).toLowerCase();
  const baseName = path
    .basename(value, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseName || "document"}-${Date.now()}${extension}`;
}

export async function POST(request: NextRequest) {
  const guard = await withPermission(request, { allowAnyAuth: true });
  if (!guard.ok) return guard.response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "Fichier manquant.",
      },
      {
        status: 400,
      }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: "Fichier trop volumineux. Maximum autorise : 10 Mo.",
      },
      {
        status: 400,
      }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Type de fichier non autorise: ${file.type || "inconnu"}`,
      },
      {
        status: 400,
      }
    );
  }

  const safeName = sanitizeFileName(file.name);
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "crm-publications"
  );
  const uploadPath = path.join(uploadDir, safeName);

  await mkdir(uploadDir, {
    recursive: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(uploadPath, buffer);

  return NextResponse.json({
    name: file.name,
    storedName: safeName,
    url: `/uploads/crm-publications/${safeName}`,
    size: file.size,
    type: file.type,
  });
}