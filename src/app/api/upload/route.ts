import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  // Documents / files
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

function getExtensionFromMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "application/pdf":
      return ".pdf";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    case "application/vnd.ms-excel":
      return ".xls";
    case "text/csv":
      return ".csv";
    case "application/zip":
    case "application/x-zip-compressed":
      return ".zip";
    default:
      return "";
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Format non autorisé. Utilisez JPG, PNG, WEBP, GIF, PDF, XLSX, XLS, CSV ou ZIP.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop lourd. Maximum 20 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension =
      getExtensionFromMime(file.type) ||
      path.extname(file.name || "").toLowerCase() ||
      "";

    const safeBaseName =
      path
        .basename(file.name || "file", path.extname(file.name || ""))
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "file";

    const fileName = `${Date.now()}-${randomUUID()}-${safeBaseName}${extension}`;

    const relativeDir = path.join("uploads", "posts");
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    const absolutePath = path.join(absoluteDir, fileName);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, buffer);

    const publicUrl = `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);

    return NextResponse.json(
      { error: "Impossible d'uploader le fichier." },
      { status: 500 }
    );
  }
}