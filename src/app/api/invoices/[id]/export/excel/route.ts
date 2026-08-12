// src/app/api/invoices/[id]/export/excel/route.ts
// GET /api/invoices/:id/export/excel — export .xlsx fidèle au modèle
// FS01_2025_PRODUIR (feuille "Feuil1", plage A8:J49).

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

function formatDateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "invoices", action: "canList" });
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MD2I";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Facture", { views: [{ showGridLines: false }] });

  sheet.columns = [
    { width: 3 },
    { width: 66 },
    { width: 12 },
    { width: 11 },
    { width: 20 },
    { width: 22 },
    { width: 16 },
    { width: 17 },
  ];

  const baseFont = { name: "Calibri", size: 12 } as const;

  // ── Fournisseur / Client ──────────────────────────────────────────────
  sheet.getCell("B8").value = `Fournisseur: ${invoice.supplier}`;
  sheet.getCell("B8").font = { ...baseFont, bold: true, underline: true };

  sheet.mergeCells("D8:F8");
  sheet.getCell("D8").value = `Client: ${invoice.client}`;
  sheet.getCell("D8").font = { ...baseFont, bold: true, underline: true };

  // ── Projet (nom + adresse) ────────────────────────────────────────────
  sheet.mergeCells("D10:F13");
  const projectCell = sheet.getCell("D10");
  projectCell.value = [invoice.projectName, invoice.projectAddress].filter(Boolean).join("\n");
  projectCell.font = baseFont;
  projectCell.alignment = { wrapText: true, vertical: "top" };

  // ── Date / Objet / Lot / Référence ────────────────────────────────────
  sheet.getCell("B16").value = `Date: ${formatDateFr(invoice.invoiceDate)}`;
  sheet.getCell("B16").font = { ...baseFont, bold: true };

  sheet.getCell("B17").value = `Objet: ${invoice.object}`;
  sheet.getCell("B17").font = baseFont;

  if (invoice.lotDescription) {
    sheet.mergeCells("B18:F19");
    const lotCell = sheet.getCell("B18");
    lotCell.value = invoice.lotDescription;
    lotCell.font = baseFont;
    lotCell.alignment = { wrapText: true, vertical: "top" };
  }

  sheet.getCell("B21").value = `Réf: ${invoice.contractRef || ""}`;
  sheet.getCell("B21").font = baseFont;

  // ── Tableau des lignes ─────────────────────────────────────────────────
  const headerRowIndex = 28;
  const headers = ["LIBELLE", "UNITE", "QUANTITE", "PRIX UNITAIRE/Ar", "MONTANT/Ar"];
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 48.75;

  headers.forEach((label, index) => {
    const cell = headerRow.getCell(2 + index); // colonne B = 2
    cell.value = label;
    cell.font = { ...baseFont, bold: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  let rowIndex = headerRowIndex + 1;

  for (const line of invoice.lines) {
    const row = sheet.getRow(rowIndex);
    row.getCell(2).value = line.libelle;
    row.getCell(3).value = line.unite || "";
    row.getCell(4).value = Number(line.quantite);
    row.getCell(5).value = Number(line.prixUnitaire);
    row.getCell(6).value = Number(line.montant);

    for (let col = 2; col <= 6; col += 1) {
      const cell = row.getCell(col);
      cell.font = baseFont;
      cell.border = THIN_BORDER;
      if (col >= 4) cell.numFmt = "#,##0.00";
      if (col === 2) cell.alignment = { wrapText: true, vertical: "top" };
    }

    rowIndex += 1;
  }

  // ── Total TTC ──────────────────────────────────────────────────────────
  const totalRowIndex = rowIndex;
  sheet.mergeCells(`B${totalRowIndex}:E${totalRowIndex}`);
  const totalLabelCell = sheet.getCell(`B${totalRowIndex}`);
  totalLabelCell.value = "MONTANT TOTAL TTC/AR";
  totalLabelCell.font = { ...baseFont, bold: true };
  totalLabelCell.border = THIN_BORDER;
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  const totalValueCell = sheet.getCell(`F${totalRowIndex}`);
  totalValueCell.value = Number(invoice.totalTtc);
  totalValueCell.font = { ...baseFont, bold: true };
  totalValueCell.border = THIN_BORDER;
  totalValueCell.numFmt = '#,##0.00 "Ar"';
  totalValueCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Montant en lettres ─────────────────────────────────────────────────
  const wordsRowIndex = totalRowIndex + 3;
  sheet.mergeCells(`B${wordsRowIndex}:F${wordsRowIndex + 1}`);
  const wordsCell = sheet.getCell(`B${wordsRowIndex}`);
  wordsCell.value = `Montant en lettres: ${invoice.amountInWords || ""}`;
  wordsCell.font = baseFont;
  wordsCell.alignment = { wrapText: true, vertical: "top" };

  // ── Signature ──────────────────────────────────────────────────────────
  const signatureRowIndex = wordsRowIndex + 3;
  sheet.getCell(`B${signatureRowIndex}`).value = `Nom, Fonction et Signature: ${invoice.signature || ""}`;
  sheet.getCell(`B${signatureRowIndex}`).font = baseFont;

  // ── Coordonnées bancaires ──────────────────────────────────────────────
  const bankHeaderRow = signatureRowIndex + 2;
  sheet.mergeCells(`B${bankHeaderRow}:H${bankHeaderRow}`);
  sheet.getCell(`B${bankHeaderRow}`).value = "Nom complet & adresse de la banque pour le paiement:";
  sheet.getCell(`B${bankHeaderRow}`).font = { ...baseFont, bold: true };

  const bankNameRow = bankHeaderRow + 1;
  sheet.mergeCells(`B${bankNameRow}:H${bankNameRow}`);
  sheet.getCell(`B${bankNameRow}`).value = invoice.bankName || "";
  sheet.getCell(`B${bankNameRow}`).font = baseFont;

  const holderRow = bankNameRow + 2;
  sheet.mergeCells(`B${holderRow}:F${holderRow}`);
  sheet.getCell(`B${holderRow}`).value = `Nom du détenteur: ${invoice.accountHolder || ""}`;
  sheet.getCell(`B${holderRow}`).font = baseFont;

  const accountRow = holderRow + 1;
  sheet.mergeCells(`B${accountRow}:G${accountRow}`);
  sheet.getCell(`B${accountRow}`).value = `Numéro de compte: ${invoice.accountNumber || ""}`;
  sheet.getCell(`B${accountRow}`).font = baseFont;

  const bankCodeRow = accountRow + 1;
  sheet.getCell(`B${bankCodeRow}`).value = `Code Banque:${invoice.bankCode || ""}`;
  sheet.getCell(`B${bankCodeRow}`).font = baseFont;

  const branchCodeRow = bankCodeRow + 1;
  sheet.getCell(`B${branchCodeRow}`).value = `Code Guichet:${invoice.branchCode || ""}`;
  sheet.getCell(`B${branchCodeRow}`).font = baseFont;

  const ribKeyRow = branchCodeRow + 1;
  sheet.getCell(`B${ribKeyRow}`).value = `Clé RIB:${invoice.ribKey || ""}`;
  sheet.getCell(`B${ribKeyRow}`).font = baseFont;

  const bicRow = ribKeyRow + 1;
  sheet.mergeCells(`B${bicRow}:F${bicRow}`);
  sheet.getCell(`B${bicRow}`).value = `BIC: ${invoice.bic || ""}`;
  sheet.getCell(`B${bicRow}`).font = baseFont;

  const ibanRow = bicRow + 1;
  sheet.mergeCells(`B${ibanRow}:F${ibanRow}`);
  sheet.getCell(`B${ibanRow}`).value = `IBAN: ${invoice.iban || ""}`;
  sheet.getCell(`B${ibanRow}`).font = baseFont;

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Facture-${invoice.invoiceNumber}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
