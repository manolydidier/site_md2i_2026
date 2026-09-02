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
const GRAY_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

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
    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0, footer: 0 },
    };

    // Largeurs reprises telles quelles du fichier modèle réel
    // (public/FS01_2025_PRODUIR_cellules.xlsx, inspecté directement) : A sert
    // de marge, LIBELLE fusionne B:D, puis UNITE/QUANTITE/PRIX/MONTANT
    // occupent chacun une colonne dédiée E/F/G/H.
    sheet.columns = [
      { width: 0.5 },  // A — marge
      { width: 17 },   // B
      { width: 27 },   // C
      { width: 22.15 },// D
      { width: 11.85 },// E
      { width: 11.29 },// F
      { width: 20.57 },// G
      { width: 22.57 },// H
    ];

    /** Boîte fusionnée grisée (Fournisseur/Client), plusieurs lignes empilées, bordure optionnelle. */
    function partyBox(
      range: string,
      lines: { text: string; bold?: boolean; underline?: boolean }[],
      opts: { bordered?: boolean } = {}
    ) {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(":")[0]);
      cell.value = {
        richText: lines
          .filter((line) => line.text)
          .map((line, i, arr) => ({
            font: { ...baseFont, bold: Boolean(line.bold), underline: Boolean(line.underline) },
            text: line.text + (i < arr.length - 1 ? "\n" : ""),
          })),
      };
      cell.fill = GRAY_FILL;
      cell.alignment = { wrapText: true, vertical: "top" };
      if (opts.bordered) cell.border = THIN_BORDER;
      return cell;
    }

    /**
     * Ligne "libellé: valeur" (une seule colonne fusionnée B:C, pas de
     * libellé si `label` est vide) — grille Fournisseur. Bordure gauche/droite
     * sur chaque ligne, haut seulement sur la première, bas seulement sur la
     * dernière : un seul cadre extérieur, sans cadriage interne.
     */
    function partyFieldRow(
      rowIndex: number,
      segments: { label: string; value: string }[],
      opts: { first?: boolean; last?: boolean }
    ) {
      sheet.mergeCells(`B${rowIndex}:C${rowIndex}`);
      const cell = sheet.getCell(`B${rowIndex}`);
      const runs: { font: Partial<ExcelJS.Font>; text: string }[] = [];
      segments.forEach((seg, i) => {
        if (seg.label) runs.push({ font: { ...baseFont, size: 9 }, text: `${seg.label}: ` });
        runs.push({ font: { ...baseFont, size: 9, bold: !seg.label }, text: seg.value });
        if (i < segments.length - 1) runs.push({ font: { ...baseFont, size: 9 }, text: "   •   " });
      });
      cell.value = { richText: runs };
      cell.fill = GRAY_FILL;
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        left: { style: "thin" },
        right: { style: "thin" },
        ...(opts.first ? { top: { style: "thin" } } : {}),
        ...(opts.last ? { bottom: { style: "thin" } } : {}),
      };
    }

    /** Petite table fine à 2 cellules (en-tête + valeur), ex. N° Facture / Mode de paiement. */
    function labelValueBox(headerAddr: string, valueAddr: string, label: string, value: string) {
      const headerCell = sheet.getCell(headerAddr);
      headerCell.value = label;
      headerCell.font = { ...baseFont, size: 10 };
      headerCell.fill = GRAY_FILL;
      headerCell.alignment = { horizontal: "center", vertical: "middle" };
      headerCell.border = THIN_BORDER;

      const valueCell = sheet.getCell(valueAddr);
      valueCell.value = value;
      valueCell.font = { ...baseFont, bold: true, size: 10 };
      valueCell.fill = GRAY_FILL;
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.border = THIN_BORDER;
    }

    /** Titre de section pleine largeur (souligné, sans fond) — section bancaire. */
    function sectionHeading(rowIndex: number, text: string) {
      sheet.mergeCells(`B${rowIndex}:H${rowIndex}`);
      const cell = sheet.getCell(`B${rowIndex}`);
      cell.value = text;
      cell.font = { ...baseFont, underline: true };
    }

    /** Champ "libellé (B) | valeur en gras (C:H fusionné)" — section bancaire. */
    function bankField(rowIndex: number, label: string, value: string) {
      const labelCell = sheet.getCell(`B${rowIndex}`);
      labelCell.value = label;
      labelCell.font = baseFont;

      sheet.mergeCells(`C${rowIndex}:H${rowIndex}`);
      const valueCell = sheet.getCell(`C${rowIndex}`);
      valueCell.value = value;
      valueCell.font = { ...baseFont, bold: true };
    }

    // ── En-tête (image) ────────────────────────────────────────────────────
    // Ancre étendue sur toute la largeur du contenu (A:H), pour correspondre
    // à l'emprise réelle de l'en-tête dans le modèle
    // (public/FS01_2025_PRODUIR_cellules.xlsx : nom + slogan s'étendent sur
    // toute la largeur B:H, sur 3 lignes) plutôt qu'une position devinée.
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
        sheet.getRow(1).height = 15.75;
        sheet.addImage(imageId, "A1:H4");
        r = 6;
      } catch {
        // En-tête introuvable sur le disque — export sans image plutôt qu'en échec.
        r = 2;
      }
    }

    // ── Titre du document (FACTURE / FACTURE PROFORMA) — affichage optionnel ──
    if (invoice.showDocumentType) {
      sheet.mergeCells(`B${r}:H${r}`);
      const titleCell = sheet.getCell(`B${r}`);
      titleCell.value = invoice.documentTypeLabel;
      titleCell.font = { ...baseFont, bold: true, size: 16 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      r += 2;
    }

    // ── Fournisseur / Client — libellé au-dessus de la boîte grisée, plus
    // grand que le contenu (hors de la zone de cadrage/fond). Fournisseur en
    // grille libellé/valeur (B/C), Client fusionné (F:H), séparés par
    // l'espace naturel des colonnes D/E — reprend la disposition du modèle
    // réel (public/FS01_2025_PRODUIR_cellules.xlsx : Fournisseur en B6/B8:C14,
    // Client en F6/F8:H12). ──────────────────────────────────────────────────
    const boxTop = r + 1;

    function partyLabel(range: string, label: string) {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(":")[0]);
      cell.value = label;
      cell.font = { ...baseFont, size: 16, bold: true, underline: true };
      cell.alignment = { vertical: "middle" };
    }

    sheet.getRow(boxTop).height = 22;
    partyLabel(`B${boxTop}:B${boxTop}`, "Fournisseur");
    partyLabel(`F${boxTop}:H${boxTop}`, "Client");

    const boxRowTop = boxTop + 1;

    // Nom seul (pas de libellé "Raison sociale"), puis un champ par ligne, et
    // NIF/RCS combinés sur une seule ligne séparés par « • ».
    const supplierRows: { label: string; value: string }[][] = [
      [{ label: "", value: invoice.supplier.name }],
      ...(invoice.supplier.address ? [[{ label: "Adresse", value: invoice.supplier.address }]] : []),
      ...(invoice.supplier.phone ? [[{ label: "Téléphone", value: invoice.supplier.phone }]] : []),
      ...(invoice.supplier.email ? [[{ label: "E-mail", value: invoice.supplier.email }]] : []),
      ...(invoice.supplier.statNumber ? [[{ label: "N° Stat", value: invoice.supplier.statNumber }]] : []),
    ];
    const nifRcsSegments = [
      ...(invoice.supplier.nif ? [{ label: "NIF", value: invoice.supplier.nif }] : []),
      ...(invoice.supplier.rcs ? [{ label: "RCS", value: invoice.supplier.rcs }] : []),
    ];
    if (nifRcsSegments.length > 0) supplierRows.push(nifRcsSegments);

    supplierRows.forEach((segments, i) => {
      partyFieldRow(boxRowTop + i, segments, { first: i === 0, last: i === supplierRows.length - 1 });
    });
    const boxRowBottom = boxRowTop + Math.max(supplierRows.length, 4) - 1;

    const clientTextLines = invoice.clientParagraphs
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.runs.map((run) => run.text).join(""));

    partyBox(
      `F${boxRowTop}:H${boxRowBottom}`,
      [
        { text: invoice.client, bold: true },
        ...clientTextLines.map((text) => ({ text })),
      ],
      { bordered: true }
    );

    r = boxRowBottom + 3;

    // Images du client (si présentes) : ancrées sous la boîte, faute de pouvoir
    // les intégrer dans le texte d'une cellule Excel.
    for (const paragraph of invoice.clientParagraphs) {
      if (paragraph.type !== "image") continue;
      try {
        const absolutePath = path.join(process.cwd(), "public", paragraph.url);
        const buffer = await readFile(absolutePath);
        const extension = path.extname(paragraph.url).replace(".", "").toLowerCase();
        const imageId = workbook.addImage({
          buffer: buffer as unknown as ExcelJS.Buffer,
          extension: (["png", "jpeg", "gif"].includes(extension) ? extension : "png") as "png" | "jpeg" | "gif",
        });
        sheet.addImage(imageId, { tl: { col: 5, row: r - 1 }, ext: { width: 160, height: 100 } });
        r += 6;
      } catch {
        // Image introuvable sur le disque — paragraphe ignoré plutôt qu'échec de l'export.
      }
    }

    // ── Date (mention toujours visible, valeur facultative) / Objet / Lot /
    // Référence — libellé seul en B, valeur fusionnée C:H (reprend
    // FS01_2025_PRODUIR_cellules.xlsx lignes 17/18/21) ──────────────────────
    const dateCell = sheet.getCell(`B${r}`);
    dateCell.value = `Date: ${invoice.invoiceDateLabel}`;
    dateCell.font = { ...baseFont, bold: true };
    r += 2;

    sheet.getCell(`B${r}`).value = { richText: [{ font: { ...baseFont, bold: true, underline: true }, text: "Objet:" }] };
    sheet.mergeCells(`C${r}:H${r}`);
    const objetCell = sheet.getCell(`C${r}`);
    objetCell.value = invoice.object;
    objetCell.font = baseFont;
    objetCell.alignment = { wrapText: true };
    r += 1;

    if (invoice.lotDescription) {
      sheet.mergeCells(`C${r}:H${r + 1}`);
      const lotCell = sheet.getCell(`C${r}`);
      lotCell.value = invoice.lotDescription;
      lotCell.font = baseFont;
      lotCell.alignment = { wrapText: true, vertical: "top" };
      r += 2;
    }

    r += 2; // espace avant la référence

    sheet.getCell(`B${r}`).value = { richText: [{ font: { ...baseFont, bold: true, underline: true }, text: "Réf:" }] };
    sheet.mergeCells(`C${r}:H${r}`);
    const refCell = sheet.getCell(`C${r}`);
    refCell.value = invoice.contractRef || "";
    refCell.font = baseFont;
    r += 2; // espace entre la référence et le N° Facture

    // ── N° Facture / Mode de paiement — chacun sur sa propre colonne (B / D),
    // C sert d'espaceur naturel (reprend FS01_2025_PRODUIR_cellules.xlsx
    // lignes 23-24 : B23/B24 et D23/D24, sans fusion) ───────────────────────
    sheet.getRow(r).height = 20;
    sheet.getRow(r + 1).height = 22;
    labelValueBox(`B${r}`, `B${r + 1}`, "N° Facture", invoice.invoiceNumber);
    if (invoice.paymentModeLabel) {
      labelValueBox(`D${r}`, `D${r + 1}`, "Mode de paiement", invoice.paymentModeLabel);
    }
    r += 3;

    const nextRow = r;

    // ── Tableau des lignes — LIBELLE fusionné B:D, UNITE/QUANTITE/PRIX/MONTANT
    // sur colonnes dédiées E/F/G/H, sans fond sur l'en-tête (reprend
    // FS01_2025_PRODUIR_cellules.xlsx lignes 26-30) ──────────────────────────
  const headerRowIndex = nextRow;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 48.75;

  sheet.mergeCells(`B${headerRowIndex}:D${headerRowIndex}`);
  const tableHeaders: [string, string][] = [
    ["B", "LIBELLE"],
    ["E", "UNITE"],
    ["F", "QUANTITE"],
    ["G", `PRIX UNITAIRE/${invoice.currency}`],
    ["H", `MONTANT/${invoice.currency}`],
  ];
  tableHeaders.forEach(([col, label]) => {
    const cell = sheet.getCell(`${col}${headerRowIndex}`);
    cell.value = label;
    cell.font = { ...baseFont, bold: true };
    cell.fill = GRAY_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  let rowIndex = headerRowIndex + 1;
  const libelleExcelStyle = toExcelCellStyle(invoice.libelleStyle);

  for (const line of invoice.lines) {
    const row = sheet.getRow(rowIndex);
    sheet.mergeCells(`B${rowIndex}:D${rowIndex}`);

    row.getCell(5).value = line.unite || "";
    row.getCell(6).value = line.quantite || null;
    row.getCell(7).value = line.prixUnitaire || null;
    row.getCell(8).value = line.montant || null;

    for (let col = 5; col <= 8; col += 1) {
      const cell = row.getCell(col);
      cell.font = baseFont;
      cell.border = THIN_BORDER;
      if (col >= 6) cell.numFmt = "#,##0.00";
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

  // ── Total TTC — libellé fusionné B:G, valeur en H ────────────────────────
  const totalRowIndex = rowIndex;
  sheet.mergeCells(`B${totalRowIndex}:G${totalRowIndex}`);
  const totalLabelCell = sheet.getCell(`B${totalRowIndex}`);
  totalLabelCell.value = `MONTANT TOTAL TTC/${invoice.currency.toUpperCase()}`;
  totalLabelCell.font = { ...baseFont, bold: true };
  totalLabelCell.border = THIN_BORDER;
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  const totalValueCell = sheet.getCell(`H${totalRowIndex}`);
  totalValueCell.value = invoice.totalTtc;
  totalValueCell.font = { ...baseFont, bold: true };
  totalValueCell.border = THIN_BORDER;
  totalValueCell.numFmt = `#,##0.00 "${invoice.currency.replace(/"/g, "")}"`;
  totalValueCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Montant en lettres — libellé et valeur dans une seule cellule fusionnée ──
  const wordsRowIndex = totalRowIndex + 3;
  sheet.getRow(wordsRowIndex).height = 31.5;
  sheet.mergeCells(`B${wordsRowIndex}:H${wordsRowIndex}`);
  const wordsCell = sheet.getCell(`B${wordsRowIndex}`);
  wordsCell.value = {
    richText: [
      { font: baseFont, text: "Montant en lettres: " },
      { font: { ...baseFont, bold: true }, text: invoice.amountInWords || "" },
    ],
  };
  wordsCell.alignment = { wrapText: true, vertical: "top" };

  // ── Coordonnées bancaires — libellé seul en B, valeur en gras fusionnée
  // C:H (reprend lignes 36-46) ──────────────────────────────────────────────
  const bankHeaderRow = wordsRowIndex + 3;
  sectionHeading(bankHeaderRow, "Nom complet & adresse de la banque pour le paiement:");

  const bankNameRow = bankHeaderRow + 1;
  bankField(bankNameRow, "Banque", invoice.bankName || "");

  const holderHeaderRow = bankNameRow + 1;
  sectionHeading(holderHeaderRow, "Nom du détenteur et numéro de compte complet");

  const holderRow = holderHeaderRow + 1;
  bankField(holderRow, "Nom du détenteur", invoice.accountHolder || "");

  const accountRow = holderRow + 1;
  bankField(accountRow, "Numéro de compte", invoice.accountNumber || "");

  const bankCodeRow = accountRow + 1;
  bankField(bankCodeRow, "Code Banque", invoice.bankCode || "");

  const branchCodeRow = bankCodeRow + 1;
  bankField(branchCodeRow, "Code Guichet", invoice.branchCode || "");

  const ribKeyRow = branchCodeRow + 1;
  bankField(ribKeyRow, "Clé RIB", invoice.ribKey || "");

  const bicRow = ribKeyRow + 1;
  bankField(bicRow, "BIC", invoice.bic || "");

  const ibanRow = bicRow + 1;
  bankField(ibanRow, "IBAN", invoice.iban || "");

  // ── Signature (après la section bancaire, comme dans le modèle) ─────────
  const signatureRowIndex = ibanRow + 3;
  sheet.getRow(signatureRowIndex).height = 30;
  sheet.getCell(`B${signatureRowIndex}`).value = `Nom, Fonction et Signature: ${invoice.signature || ""}`;
  sheet.getCell(`B${signatureRowIndex}`).font = baseFont;

  sheet.mergeCells(`C${signatureRowIndex}:D${signatureRowIndex}`);
  const signatureBoxCell = sheet.getCell(`C${signatureRowIndex}`);
  signatureBoxCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF99" } };
  signatureBoxCell.border = THIN_BORDER;

  // ── Pied de page personnalisé (pleine largeur B:H), ancré près du bas
  // d'une page A4 plutôt que collé au contenu qui le précède ───────────────
  const A4_FOOTER_ROW = 58;
  let footerRow = Math.max(signatureRowIndex + 4, A4_FOOTER_ROW);
  for (const line of invoice.footerLines) {
    const style = toExcelCellStyle(line.style);
    sheet.mergeCells(`B${footerRow}:H${footerRow}`);
    const cell = sheet.getCell(`B${footerRow}`);
    cell.value = line.text;
    cell.font = style.font;
    if (style.fill) cell.fill = style.fill;
    cell.alignment = style.alignment;
    footerRow += 1;
  }

    const buffer = await workbook.xlsx.writeBuffer();
    const filenamePrefix = invoice.documentType === "PROFORMA" ? "Facture-Proforma" : "Facture";
    const filename = `${filenamePrefix}-${invoice.invoiceNumber}.xlsx`;

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
