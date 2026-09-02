// src/app/api/invoice-document-settings/route.ts
// GET   /api/invoice-document-settings — réglage global (singleton), avec repli par défaut
// PATCH /api/invoice-document-settings — mise à jour du style LIBELLE global

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { DEFAULT_LIBELLE_STYLE, textStyleSchema } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";

const SETTINGS_ID = "default";

const patchSchema = z.object({
  libelleStyle: textStyleSchema.optional(),
  facturePrefix: z.string().max(20).optional(),
  proformaPrefix: z.string().max(20).optional(),
});

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
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { libelleStyle, facturePrefix, proformaPrefix } = parsed.data;

  const settings = await prisma.invoiceDocumentSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      ...(libelleStyle ? { libelleStyle } : {}),
      ...(facturePrefix !== undefined ? { facturePrefix } : {}),
      ...(proformaPrefix !== undefined ? { proformaPrefix } : {}),
    },
    create: {
      id: SETTINGS_ID,
      libelleStyle: libelleStyle || DEFAULT_LIBELLE_STYLE,
      ...(facturePrefix !== undefined ? { facturePrefix } : {}),
      ...(proformaPrefix !== undefined ? { proformaPrefix } : {}),
    },
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
