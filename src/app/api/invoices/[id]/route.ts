// src/app/api/invoices/[id]/route.ts
// GET    /api/invoices/:id — facture complète avec ses lignes (total recalculé)
// PUT    /api/invoices/:id — mise à jour complète (ajout/suppression de lignes)
// DELETE /api/invoices/:id — suppression douce (soft delete)

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { invoiceSchema, computeInvoiceTotals } from "@/app/lib/invoices/schema";
import { invoiceAmountInWords } from "@/app/lib/invoices/amount-in-words";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logError(label: string, data?: Record<string, unknown>) {
  console.error(`[invoices-api][${label}]`, data || {});
}

async function loadInvoice(id: string) {
  return prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      supplierRef: true,
      paymentMode: true,
      dateType: true,
      header: true,
      footer: true,
      clientRef: true,
    },
  });
}

// ─── GET /api/invoices/:id ──────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "invoices", action: "canList" });
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const invoice = await loadInvoice(id);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  // Le total est recalculé à partir des lignes plutôt que de faire confiance
  // à la valeur stockée, pour garantir la cohérence à chaque accès.
  const recalculatedTotal = invoice.lines.reduce(
    (sum, line) => sum + Number(line.montant),
    0
  );

  return NextResponse.json({
    data: { ...invoice, totalTtc: Math.round(recalculatedTotal * 100) / 100 },
  });
}

// ─── PUT /api/invoices/:id ───────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "invoices", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const existing = await loadInvoice(id);

  if (!existing) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const parsed = invoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const { computedLines, totalTtc } = computeInvoiceTotals(data.lines);
    const tmpRatePercent = data.tmpRatePercent ?? Number(existing.tmpRatePercent);

    const existingLineIds = new Set(existing.lines.map((line) => line.id));
    const incomingLineIds = new Set(
      computedLines.filter((line) => line.id).map((line) => line.id as string)
    );
    const idsToDelete = [...existingLineIds].filter((lineId) => !incomingLineIds.has(lineId));

    const invoice = await prisma.$transaction(async (tx) => {
      if (idsToDelete.length > 0) {
        await tx.invoiceLine.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      // Re-snapshot des coordonnées fournisseur / contenu client si
      // (re)sélectionnés, même logique qu'à la création.
      const [supplierRecord, clientRecord] = await Promise.all([
        data.supplierId ? tx.invoiceSupplier.findUnique({ where: { id: data.supplierId } }) : null,
        data.clientId ? tx.client.findUnique({ where: { id: data.clientId } }) : null,
      ]);

      for (const line of computedLines) {
        const lineData = {
          libelle: line.libelle,
          libelleRuns: line.libelleRuns ?? Prisma.JsonNull,
          unite: line.unite || null,
          quantite: line.quantite,
          prixUnitaire: line.prixUnitaire,
          montant: line.montant,
          sortOrder: line.sortOrder,
        };

        if (line.id && existingLineIds.has(line.id)) {
          await tx.invoiceLine.update({ where: { id: line.id }, data: lineData });
        } else {
          await tx.invoiceLine.create({ data: { ...lineData, invoiceId: id } });
        }
      }

      return tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber: data.invoiceNumber,
          supplier: data.supplier,
          client: data.client,
          projectName: data.projectName,
          projectAddress: data.projectAddress || null,
          invoiceDate: data.invoiceDate,
          object: data.object,
          lotDescription: data.lotDescription || null,
          contractRef: data.contractRef || null,
          totalTtc,
          tmpRatePercent,
          amountInWords: invoiceAmountInWords(totalTtc, tmpRatePercent),
          bankName: data.bankName || null,
          accountHolder: data.accountHolder || null,
          accountNumber: data.accountNumber || null,
          bankCode: data.bankCode || null,
          branchCode: data.branchCode || null,
          ribKey: data.ribKey || null,
          bic: data.bic || null,
          iban: data.iban || null,
          signature: data.signature || null,
          status: data.status || existing.status,
          supplierId: data.supplierId || null,
          paymentModeId: data.paymentModeId || null,
          dateTypeId: data.dateTypeId || null,
          headerId: data.headerId || null,
          footerId: data.footerId || null,
          clientId: data.clientId || null,
          ...(data.supplierId
            ? {
                supplierAddress: supplierRecord?.address || null,
                supplierPhone: supplierRecord?.phone || null,
                supplierEmail: supplierRecord?.email || null,
                supplierStatNumber: supplierRecord?.statNumber || null,
                supplierNif: supplierRecord?.nif || null,
                supplierRcs: supplierRecord?.rcs || null,
              }
            : {}),
          ...(data.clientId ? { clientContent: clientRecord?.content ?? undefined } : {}),
        },
        include: { lines: { orderBy: { sortOrder: "asc" } } },
      });
    });

    return NextResponse.json({ data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message.includes("total TTC")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ce numéro de facture existe déjà." },
        { status: 409 }
      );
    }

    logError("PUT_ERROR", { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json({ error: "Erreur lors de la mise à jour de la facture." }, { status: 500 });
  }
}

// ─── DELETE /api/invoices/:id ────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "invoices", action: "canDelete" });
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const existing = await loadInvoice(id);

  if (!existing) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  await prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
