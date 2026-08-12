// src/app/api/invoice-document-settings/route.ts
// GET   /api/invoice-document-settings — réglage global (singleton), avec repli par défaut
// PATCH /api/invoice-document-settings — mise à jour du style LIBELLE global

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { DEFAULT_LIBELLE_STYLE, textStyleSchema } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";

const SETTINGS_ID = "default";

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const settings = await prisma.invoiceDocumentSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, libelleStyle: DEFAULT_LIBELLE_STYLE },
  });

  return NextResponse.json({ data: settings });
}

export async function PATCH(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = textStyleSchema.safeParse(body?.libelleStyle);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await prisma.invoiceDocumentSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { libelleStyle: parsed.data },
    create: { id: SETTINGS_ID, libelleStyle: parsed.data },
  });

  await logAudit({
    actorId: guard.session.user.id,
    action: "update",
    entity: "invoice_document_settings",
    entityId: SETTINGS_ID,
    metadata: parsed.data,
    req,
  });

  return NextResponse.json({ data: settings });
}
