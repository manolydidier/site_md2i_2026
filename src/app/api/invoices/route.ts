// src/app/api/invoices/route.ts
// GET  /api/invoices — liste paginée avec filtres client/date/projet
// POST /api/invoices — création d'une facture avec ses lignes

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { invoiceSchema, computeInvoiceTotals } from "@/app/lib/invoices/schema";
import { invoiceAmountInWords } from "@/app/lib/invoices/amount-in-words";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logInfo(label: string, data?: Record<string, unknown>) {
  console.log(`[invoices-api][${label}]`, data || {});
}

function logError(label: string, data?: Record<string, unknown>) {
  console.error(`[invoices-api][${label}]`, data || {});
}

/** Propose un numéro de facture au format FA-{année}-{séquence sur 4 chiffres}. */
async function suggestInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `FA-${year}-`;

  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

// ─── GET /api/invoices ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoices", action: "canList" });
  if (!guard.ok) return guard.response;

  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 20));
  const client = searchParams.get("client") || undefined;
  const project = searchParams.get("project") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const search = searchParams.get("search") || undefined;

  // Suggestion de numéro pour le formulaire de création (appelé avec ?suggestNumber=1)
  if (searchParams.get("suggestNumber")) {
    const invoiceNumber = await suggestInvoiceNumber();
    return NextResponse.json({ invoiceNumber });
  }

  const where = {
    deletedAt: null,

    ...(client ? { client: { contains: client, mode: "insensitive" as const } } : {}),
    ...(project ? { projectName: { contains: project, mode: "insensitive" as const } } : {}),

    ...(dateFrom || dateTo
      ? {
          invoiceDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),

    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" as const } },
            { client: { contains: search, mode: "insensitive" as const } },
            { projectName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          invoiceNumber: true,
          client: true,
          projectName: true,
          invoiceDate: true,
          totalTtc: true,
          status: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      data: invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError("GET_ERROR", { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json({ error: "Erreur lors du chargement des factures." }, { status: 500 });
  }
}

// ─── POST /api/invoices ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoices", action: "canCreate" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

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
    const tmpRatePercent = data.tmpRatePercent ?? 8;

    const invoice = await prisma.$transaction(async (tx) => {
      return tx.invoice.create({
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
          status: data.status || "DRAFT",
          userId: session.user.id,
          lines: {
            create: computedLines.map((line) => ({
              libelle: line.libelle,
              unite: line.unite || null,
              quantite: line.quantite,
              prixUnitaire: line.prixUnitaire,
              montant: line.montant,
              sortOrder: line.sortOrder,
            })),
          },
        },
        include: { lines: { orderBy: { sortOrder: "asc" } } },
      });
    });

    logInfo("POST_SUCCESS", { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });

    return NextResponse.json({ data: invoice }, { status: 201 });
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

    logError("POST_ERROR", { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json({ error: "Erreur lors de la création de la facture." }, { status: 500 });
  }
}
