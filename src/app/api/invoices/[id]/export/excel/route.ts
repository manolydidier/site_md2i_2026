// src/app/api/invoices/[id]/export/excel/route.ts
// GET /api/invoices/:id/export/excel — export .xlsx fidèle au modèle
// FS01_2025_PRODUIR (feuille "Feuil1", plage A8:J49), complété par le
// numéro de facture, l'en-tête, le pied de page et le style LIBELLE.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import {
  invoiceDocumentInclude,
  buildInvoiceDocumentModel,
  getLibelleStyle,
} from "@/app/lib/invoices/document-model";
import { toExcelCellStyle } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

const baseFont = { name: "Calibri", size: 12 } as const;
const GRAY_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "invoices", action: "canList" });
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const [record, libelleStyle] = await Promise.all([
      prisma.invoice.findFirst({ where: { id, deletedAt: null }, include: invoiceDocumentInclude }),
      getLibelleStyle(),
    ]);

    if (!record) {
      return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    }

    const invoice = buildInvoiceDocumentModel(record, libelleStyle);

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

    /** Cellule fusionnée avec fond gris (boîte Fournisseur/Client). */
    function grayCell(range: string, value: string, opts: { bold?: boolean; size?: number } = {}) {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(":")[0]);
      cell.value = value;
      cell.font = { ...baseFont, bold: Boolean(opts.bold), size: opts.size || baseFont.size };
      cell.fill = GRAY_FILL;
      cell.alignment = { wrapText: true, vertical: "top" };
      return cell;
    }

    // ── En-tête (image) ────────────────────────────────────────────────────
    let r = 2;
    if (invoice.header) {
      try {
        const absolutePath = path.join(process.cwd(), "public", invoice.header.imageUrl);
        const buffer = await readFile(absolutePath);
        const extension = path.extname(invoice.header.imageUrl).replace(".", "").toLowerCase();
        const imageId = workbook.addImage({
          buffer: buffer as unknown as ExcelJS.Buffer,
          extension: (["png", "jpeg", "gif"].includes(extension) ? extension : "png") as "png" | "jpeg" | "gif",
        });
        sheet.addImage(imageId, { tl: { col: 1, row: 0 }, ext: { width: 500, height: 80 } });
        r = 6;
      } catch {
        // En-tête introuvable sur le disque — export sans image plutôt qu'en échec.
        r = 2;
      }
    }

    // ── Numéro de facture ──────────────────────────────────────────────────
    sheet.mergeCells(`D${r}:F${r}`);
    const numberCell = sheet.getCell(`D${r}`);
    numberCell.value = `N° Facture : ${invoice.invoiceNumber}`;
    numberCell.font = { ...baseFont, bold: true, size: 13 };
    numberCell.alignment = { horizontal: "right", vertical: "middle" };
    r += 2;

    // ── Fournisseur / Client (boîtes grises, empilées) ─────────────────────
    grayCell(`B${r}:C${r}`, "FOURNISSEUR", { bold: true, size: 10 });
    grayCell(`D${r}:F${r}`, "CLIENT", { bold: true, size: 10 });
    r += 1;

    grayCell(`B${r}:C${r}`, invoice.supplier.name, { bold: true, size: 13 });
    grayCell(`D${r}:F${r}`, invoice.client, { bold: true, size: 13 });
    r += 1;

    grayCell(`B${r}:C${r}`, invoice.supplier.address || "", {});
    grayCell(`D${r}:F${r}`, "", {});
    r += 1;

    const supplierContact = [
      invoice.supplier.phone ? `Tél: ${invoice.supplier.phone}` : null,
      invoice.supplier.email ? `Email: ${invoice.supplier.email}` : null,
    ].filter(Boolean).join("  ");
    grayCell(`B${r}:C${r}`, supplierContact, {});
    grayCell(`D${r}:F${r}`, "", {});
    r += 1;

    const supplierRefs = [
      invoice.supplier.statNumber ? `N° Stat: ${invoice.supplier.statNumber}` : null,
      invoice.supplier.nif ? `NIF: ${invoice.supplier.nif}` : null,
      invoice.supplier.rcs ? `RCS: ${invoice.supplier.rcs}` : null,
    ].filter(Boolean).join("  ");
    grayCell(`B${r}:C${r}`, supplierRefs, {});
    grayCell(`D${r}:F${r}`, "", {});
    r += 2;

    // ── Contenu client (paragraphes texte/image issus du richtext) ─────────
    for (const paragraph of invoice.clientParagraphs) {
      if (paragraph.type === "text") {
        sheet.mergeCells(`D${r}:F${r}`);
        const cell = sheet.getCell(`D${r}`);
        cell.value = {
          richText: paragraph.runs.map((run) => ({
            font: {
              name: baseFont.name,
              size: 10,
              bold: run.bold,
              italic: run.italic,
              underline: run.underline,
              color: run.color ? { argb: `FF${run.color.replace("#", "").toUpperCase()}` } : undefined,
            },
            text: run.text,
          })),
        };
        cell.alignment = { wrapText: true, vertical: "top" };
        r += 1;
      } else {
        try {
          const absolutePath = path.join(process.cwd(), "public", paragraph.url);
          const buffer = await readFile(absolutePath);
          const extension = path.extname(paragraph.url).replace(".", "").toLowerCase();
          const imageId = workbook.addImage({
            buffer: buffer as unknown as ExcelJS.Buffer,
            extension: (["png", "jpeg", "gif"].includes(extension) ? extension : "png") as "png" | "jpeg" | "gif",
          });
          sheet.addImage(imageId, { tl: { col: 3, row: r - 1 }, ext: { width: 160, height: 100 } });
          r += 6;
        } catch {
          // Image introuvable sur le disque — paragraphe ignoré plutôt qu'échec de l'export.
        }
      }
    }
    if (invoice.clientParagraphs.length > 0) r += 1;

    // ── Projet (nom + adresse) ────────────────────────────────────────────
    sheet.mergeCells(`B${r}:F${r + 1}`);
    const projectCell = sheet.getCell(`B${r}`);
    projectCell.value = [invoice.projectName, invoice.projectAddress].filter(Boolean).join("\n");
    projectCell.font = baseFont;
    projectCell.alignment = { wrapText: true, vertical: "top" };
    r += 3;

    // ── Date / Objet / Lot / Référence / Mode de paiement ──────────────────
    sheet.getCell(`B${r}`).value = `${invoice.dateTypeLabel || "Date"}: ${invoice.invoiceDateLabel}`;
    sheet.getCell(`B${r}`).font = { ...baseFont, bold: true };
    r += 1;

    sheet.getCell(`B${r}`).value = `Objet: ${invoice.object}`;
    sheet.getCell(`B${r}`).font = baseFont;
    r += 1;

    if (invoice.lotDescription) {
      sheet.mergeCells(`B${r}:F${r + 1}`);
      const lotCell = sheet.getCell(`B${r}`);
      lotCell.value = invoice.lotDescription;
      lotCell.font = baseFont;
      lotCell.alignment = { wrapText: true, vertical: "top" };
      r += 2;
    }

    sheet.getCell(`B${r}`).value = `Réf: ${invoice.contractRef || ""}`;
    sheet.getCell(`B${r}`).font = baseFont;
    r += 1;

    if (invoice.paymentModeLabel) {
      sheet.getCell(`B${r}`).value = `Mode de paiement: ${invoice.paymentModeLabel}`;
      sheet.getCell(`B${r}`).font = { ...baseFont, bold: true };
      r += 1;
    }

    const nextRow = r;

    // ── Tableau des lignes ─────────────────────────────────────────────────
  const headerRowIndex = nextRow + 6;
  const headers = ["LIBELLE", "UNITE", "QUANTITE", "PRIX UNITAIRE/Ar", "MONTANT/Ar"];
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 48.75;

  headers.forEach((label, index) => {
    const cell = headerRow.getCell(2 + index);
    cell.value = label;
    cell.font = { ...baseFont, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  let rowIndex = headerRowIndex + 1;
  const libelleExcelStyle = toExcelCellStyle(invoice.libelleStyle);

  for (const line of invoice.lines) {
    const row = sheet.getRow(rowIndex);
    row.getCell(3).value = line.unite || "";
    row.getCell(4).value = line.quantite;
    row.getCell(5).value = line.prixUnitaire;
    row.getCell(6).value = line.montant;

    for (let col = 3; col <= 6; col += 1) {
      const cell = row.getCell(col);
      cell.font = baseFont;
      cell.border = THIN_BORDER;
      if (col >= 4) cell.numFmt = "#,##0.00";
    }

    // Style LIBELLE : par mot/segment (libelleRuns) si défini, sinon style
    // global personnalisable, sans écraser les bordures.
    const libelleCell = row.getCell(2);
    if (line.libelleRuns && line.libelleRuns.length > 0) {
      libelleCell.value = {
        richText: line.libelleRuns.map((run) => ({
          font: run.style ? toExcelCellStyle(run.style).font : baseFont,
          text: run.text,
        })),
      };
      libelleCell.alignment = { wrapText: true, vertical: "top" };
    } else {
      libelleCell.value = line.libelle;
      libelleCell.font = libelleExcelStyle.font;
      if (libelleExcelStyle.fill) libelleCell.fill = libelleExcelStyle.fill;
      libelleCell.alignment = libelleExcelStyle.alignment;
    }
    libelleCell.border = THIN_BORDER;

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
  totalValueCell.value = invoice.totalTtc;
  totalValueCell.font = { ...baseFont, bold: true };
  totalValueCell.border = THIN_BORDER;
  totalValueCell.numFmt = '#,##0.00 "Ar"';
  totalValueCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Montant en lettres (mention normale, valeur en gras) ────────────────
  const wordsRowIndex = totalRowIndex + 3;
  sheet.mergeCells(`B${wordsRowIndex}:F${wordsRowIndex + 1}`);
  const wordsCell = sheet.getCell(`B${wordsRowIndex}`);
  wordsCell.value = {
    richText: [
      { font: baseFont, text: "Montant en lettres: " },
      { font: { ...baseFont, bold: true, size: 13 }, text: invoice.amountInWords || "" },
    ],
  };
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

  // ── Pied de page personnalisé ────────────────────────────────────────────
  let footerRow = ibanRow + 2;
  for (const line of invoice.footerLines) {
    const style = toExcelCellStyle(line.style);
    sheet.mergeCells(`B${footerRow}:F${footerRow}`);
    const cell = sheet.getCell(`B${footerRow}`);
    cell.value = line.text;
    cell.font = style.font;
    if (style.fill) cell.fill = style.fill;
    cell.alignment = style.alignment;
    footerRow += 1;
  }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Facture-${invoice.invoiceNumber}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("[invoices-excel-export][ERROR]", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du fichier Excel.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
