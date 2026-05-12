// app/api/contacts/import/route.ts
// POST multipart/form-data → import CSV ou Excel

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  parseContactFile,
  importContactsToDB,
} from "@/app/lib/email/import-export";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const groupId = formData.get("groupId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  const allowedTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
  ];

  if (
    !allowedTypes.includes(file.type) &&
    !file.name.match(/\.(csv|xlsx|xls)$/i)
  ) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez CSV ou Excel." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { rows, errors: parseErrors } = await parseContactFile(
    buffer,
    file.type
  );

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error: "Aucun contact trouvé dans le fichier",
        parseErrors,
      },
      { status: 400 }
    );
  }

  const result = await importContactsToDB(
    rows,
    session.user.id,
    groupId || undefined
  );

  return NextResponse.json({
    ...result,
    parseErrors,
    total: rows.length,
  });
}