// app/api/contacts/export/route.ts
// GET /api/contacts/export?format=csv|xlsx&groupId=...

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import {
  exportContactsToCSV,
  exportContactsToExcel,
} from "@/app/lib/email/import-export";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") || "csv";
  const groupId = searchParams.get("groupId") || undefined;

  const contacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
      ...(groupId ? { groupId } : {}),
    },
    include: {
      group: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10000,
  });

  const filename = `contacts-${new Date().toISOString().split("T")[0]}`;

  if (format === "xlsx") {
    const buffer = exportContactsToExcel(contacts);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const csv = exportContactsToCSV(contacts);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}