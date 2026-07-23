// app/api/contacts/export/route.ts
// GET /api/contacts/export?format=csv|xlsx&groupId=...&crmStatusOptionId=...&crmSource=...

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import type { CrmContactStatus, CrmLeadSource } from "@/generated/prisma/client";
import {
  exportContactsToCSV,
  exportContactsToExcel,
} from "@/app/lib/email/import-export";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "contacts", action: "canExport" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  const { searchParams } = req.nextUrl;

  const format = searchParams.get("format") || "csv";
  const groupId = searchParams.get("groupId") || undefined;
  const crmStatus = searchParams.get("crmStatus") as CrmContactStatus | null;
  const crmStatusOptionId = searchParams.get("crmStatusOptionId") || undefined;
  const crmSource = searchParams.get("crmSource") as CrmLeadSource | null;

  const contacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
      ...(groupId ? { groupId } : {}),
      ...(crmStatus ? { crmStatus } : {}),
      ...(crmStatusOptionId ? { crmStatusOptionId } : {}),
      ...(crmSource ? { crmSource } : {}),
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      crmCompany: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      crmStatusOption: {
        select: {
          id: true,
          key: true,
          label: true,
          color: true,
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
    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(body, {
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