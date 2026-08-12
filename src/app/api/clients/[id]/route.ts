// src/app/api/clients/[id]/route.ts
// PATCH  /api/clients/:id — mise à jour
// DELETE /api/clients/:id — suppression douce

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { sanitizeRichHtml } from "@/app/lib/invoices/sanitize-html";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  content: z.string().max(20000).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

async function unsetOtherDefaults(exceptId: string) {
  await prisma.client.updateMany({
    where: { deletedAt: null, id: { not: exceptId } },
    data: { isDefault: false },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isDefault === true) {
    await unsetOtherDefaults(id);
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      content: parsed.data.content !== undefined ? sanitizeRichHtml(parsed.data.content) : existing.content,
      isDefault: parsed.data.isDefault ?? existing.isDefault,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    },
  });

  return NextResponse.json({ data: client });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canDelete" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date(), isDefault: false },
  });

  return NextResponse.json({ success: true });
}
