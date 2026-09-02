// src/app/api/invoices/[id]/export/pdf/route.tsx
// GET /api/invoices/:id/export/pdf — export PDF paginé et imprimable.

import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import {
  invoiceDocumentInclude,
  buildInvoiceDocumentModel,
  getLibelleStyle,
  type InvoiceDocumentModel,
} from "@/app/lib/invoices/document-model";
import { toPdfStyle } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  headerImage: { width: "100%", maxHeight: 130, objectFit: "contain", marginBottom: 14 },
  documentTitle: { fontFamily: "Helvetica-Bold", fontSize: 18, textAlign: "center", marginBottom: 14 },
  partiesRow: { flexDirection: "row", gap: 18, marginBottom: 14 },
  partyColumn: { flex: 1 },
  partyBox: { backgroundColor: "#F1F5F9", borderRadius: 4, padding: 10 },
  partyBoxBordered: { borderWidth: 1, borderColor: "#94a3b8" },
  partyHeading: { fontFamily: "Helvetica-Bold", fontSize: 15, color: "#111827", marginBottom: 6, textDecoration: "underline" },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 3 },
  partyLine: { fontSize: 9, color: "#334155", marginTop: 1 },
  supplierGrid: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 4, overflow: "hidden" },
  supplierRow: { flexDirection: "row", backgroundColor: "#F1F5F9" },
  supplierValue: { flex: 1, fontSize: 8.5, padding: 5 },
  miniTableRow: { flexDirection: "row", gap: 30, marginTop: 0, marginBottom: 14 },
  miniTableBox: { flex: 1, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#CBD5E1" },
  miniTableLabel: { fontSize: 9, textAlign: "center", padding: 4, borderBottomWidth: 1, borderBottomColor: "#CBD5E1" },
  miniTableValue: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center", padding: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  underline: { textDecoration: "underline" },
  section: { marginBottom: 6 },
  table: { marginTop: 14, borderWidth: 1, borderColor: "#94a3b8" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#F1F5F9", borderBottomWidth: 1, borderBottomColor: "#94a3b8" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  cellLibelle: { flex: 3, padding: 5, borderRightWidth: 1, borderRightColor: "#e2e8f0" },
  cellUnite: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: "#e2e8f0", textAlign: "center" },
  cellQty: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: "#e2e8f0", textAlign: "right" },
  cellPrix: { flex: 1.3, padding: 5, borderRightWidth: 1, borderRightColor: "#e2e8f0", textAlign: "right" },
  cellMontant: { flex: 1.3, padding: 5, textAlign: "right" },
  totalRow: { flexDirection: "row", marginTop: 6, justifyContent: "flex-end" },
  totalLabel: { fontFamily: "Helvetica-Bold", marginRight: 10 },
  totalValue: { fontFamily: "Helvetica-Bold" },
  wordsBox: { marginTop: 14, padding: 8, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  bankSection: { marginTop: 22, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#cbd5e1" },
  bankTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  footerBlock: { marginTop: 18 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, textAlign: "center", fontSize: 8, color: "#64748b" },
});

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatAmountOrBlank(value: number) {
  return value ? formatAmount(value) : "";
}

function InvoicePdf({ invoice, headerImagePath }: { invoice: InvoiceDocumentModel; headerImagePath: string | null }) {
  const libelleStyle = toPdfStyle(invoice.libelleStyle);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image ici vient de @react-pdf/renderer (primitive PDF sans prop alt), pas du HTML */}
        {headerImagePath ? <Image src={headerImagePath} style={styles.headerImage} /> : null}

        {invoice.showDocumentType ? <Text style={styles.documentTitle}>{invoice.documentTypeLabel}</Text> : null}

        <View style={styles.partiesRow}>
          <View style={styles.partyColumn}>
            <Text style={styles.partyHeading}>Fournisseur</Text>
            <View style={styles.supplierGrid}>
              <View style={styles.supplierRow}>
                <Text style={[styles.supplierValue, styles.bold]}>{invoice.supplier.name}</Text>
              </View>
              {(
                [
                  ["Adresse", invoice.supplier.address],
                  ["Téléphone", invoice.supplier.phone],
                  ["E-mail", invoice.supplier.email],
                  ["N° Stat", invoice.supplier.statNumber],
                ] as [string, string | null][]
              )
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <View key={label} style={styles.supplierRow}>
                    <Text style={styles.supplierValue}>{label}: {value}</Text>
                  </View>
                ))}
              {(invoice.supplier.nif || invoice.supplier.rcs) && (
                <View style={styles.supplierRow}>
                  <Text style={styles.supplierValue}>
                    {[
                      invoice.supplier.nif ? `NIF: ${invoice.supplier.nif}` : null,
                      invoice.supplier.rcs ? `RCS: ${invoice.supplier.rcs}` : null,
                    ]
                      .filter(Boolean)
                      .join("   •   ")}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.partyColumn}>
            <Text style={styles.partyHeading}>Client</Text>
            <View style={[styles.partyBox, styles.partyBoxBordered]}>
              <Text style={styles.partyName}>{invoice.client}</Text>
              {invoice.clientParagraphs.map((paragraph, index) =>
                paragraph.type === "text" ? (
                  <Text key={index} style={styles.partyLine}>
                    {paragraph.runs.map((run, runIndex) => (
                      <Text
                        key={runIndex}
                        style={{
                          fontFamily: run.bold ? "Helvetica-Bold" : "Helvetica",
                          fontStyle: run.italic ? "italic" : "normal",
                          textDecoration: run.underline ? "underline" : "none",
                          color: run.color || undefined,
                        }}
                      >
                        {run.text}
                      </Text>
                    ))}
                  </Text>
                ) : (
                  // eslint-disable-next-line jsx-a11y/alt-text -- Image @react-pdf/renderer, pas HTML
                  <Image
                    key={index}
                    src={path.join(process.cwd(), "public", paragraph.url)}
                    style={{ width: "100%", maxHeight: 60, objectFit: "contain", marginTop: 4 }}
                  />
                )
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>Date: {invoice.invoiceDateLabel}</Text>
          <Text>
            <Text style={[styles.bold, styles.underline]}>Objet: </Text>
            {invoice.object}
          </Text>
          {invoice.lotDescription ? <Text style={{ marginTop: 8 }}>{invoice.lotDescription}</Text> : null}
          {invoice.contractRef ? <Text style={{ marginTop: 10 }}>Réf: {invoice.contractRef}</Text> : null}
        </View>

        <View style={styles.miniTableRow}>
          <View style={styles.miniTableBox}>
            <Text style={styles.miniTableLabel}>N° Facture</Text>
            <Text style={styles.miniTableValue}>{invoice.invoiceNumber}</Text>
          </View>
          {invoice.paymentModeLabel ? (
            <View style={styles.miniTableBox}>
              <Text style={styles.miniTableLabel}>Mode de paiement</Text>
              <Text style={styles.miniTableValue}>{invoice.paymentModeLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellLibelle, styles.bold]}>LIBELLE</Text>
            <Text style={[styles.cellUnite, styles.bold]}>UNITE</Text>
            <Text style={[styles.cellQty, styles.bold]}>QUANTITE</Text>
            <Text style={[styles.cellPrix, styles.bold]}>PRIX UNITAIRE/{invoice.currency}</Text>
            <Text style={[styles.cellMontant, styles.bold]}>MONTANT/{invoice.currency}</Text>
          </View>

          {invoice.lines.map((line, index) => (
            <View style={styles.tableRow} key={index} wrap={false}>
              <Text style={styles.cellLibelle}>
                {line.libelleRuns && line.libelleRuns.length > 0 ? (
                  line.libelleRuns.map((run, runIndex) => (
                    <Text key={runIndex} style={run.style ? toPdfStyle(run.style) : undefined}>
                      {run.text}
                    </Text>
                  ))
                ) : (
                  <Text style={libelleStyle}>{line.libelle}</Text>
                )}
              </Text>
              <Text style={styles.cellUnite}>{line.unite || ""}</Text>
              <Text style={styles.cellQty}>{formatAmountOrBlank(line.quantite)}</Text>
              <Text style={styles.cellPrix}>{formatAmountOrBlank(line.prixUnitaire)}</Text>
              <Text style={styles.cellMontant}>{formatAmountOrBlank(line.montant)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>MONTANT TOTAL TTC/{invoice.currency.toUpperCase()}</Text>
          <Text style={styles.totalValue}>{formatAmount(invoice.totalTtc)} {invoice.currency}</Text>
        </View>

        <View style={styles.wordsBox}>
          <Text>Montant en lettres: <Text style={styles.bold}>{invoice.amountInWords}</Text></Text>
        </View>

        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>Nom complet & adresse de la banque pour le paiement:</Text>
          {invoice.bankName ? <Text>Banque: <Text style={styles.bold}>{invoice.bankName}</Text></Text> : null}
          <Text style={[styles.bankTitle, { marginTop: 8 }]}>Nom du détenteur et numéro de compte complet</Text>
          {invoice.accountHolder ? <Text>Nom du détenteur: <Text style={styles.bold}>{invoice.accountHolder}</Text></Text> : null}
          {invoice.accountNumber ? <Text>Numéro de compte: <Text style={styles.bold}>{invoice.accountNumber}</Text></Text> : null}
          {invoice.bankCode ? <Text>Code Banque: <Text style={styles.bold}>{invoice.bankCode}</Text></Text> : null}
          {invoice.branchCode ? <Text>Code Guichet: <Text style={styles.bold}>{invoice.branchCode}</Text></Text> : null}
          {invoice.ribKey ? <Text>Clé RIB: <Text style={styles.bold}>{invoice.ribKey}</Text></Text> : null}
          {invoice.bic ? <Text>BIC: <Text style={styles.bold}>{invoice.bic}</Text></Text> : null}
          {invoice.iban ? <Text>IBAN: <Text style={styles.bold}>{invoice.iban}</Text></Text> : null}
        </View>

        <View style={{ marginTop: 18 }}>
          <Text>Nom, Fonction et Signature: {invoice.signature || ""}</Text>
        </View>

        {invoice.footerLines.length > 0 && (
          <View style={styles.footerBlock}>
            {invoice.footerLines.map((line, index) => (
              <Text key={index} style={toPdfStyle(line.style)}>
                {line.text}
              </Text>
            ))}
          </View>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Facture ${invoice.invoiceNumber} — page ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

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
    const headerImagePath = invoice.header ? path.join(process.cwd(), "public", invoice.header.imageUrl) : null;

    const buffer = await renderToBuffer(<InvoicePdf invoice={invoice} headerImagePath={headerImagePath} />);
    const filenamePrefix = invoice.documentType === "PROFORMA" ? "Facture-Proforma" : "Facture";
    const filename = `${filenamePrefix}-${invoice.invoiceNumber}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("[invoices-pdf-export][ERROR]", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
