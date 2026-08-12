// src/app/api/invoice-payment-modes/route.ts
// GET  /api/invoice-payment-modes — liste (hors soft-delete)
// POST /api/invoice-payment-modes — création

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis").max(100),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const modes = await prisma.paymentMode.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ data: modes });
}

export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canCreate" });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mode = await prisma.paymentMode.create({
    data: {
      label: parsed.data.label,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: mode }, { status: 201 });
}
