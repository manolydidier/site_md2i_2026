// src/app/api/invoices/[id]/export/pdf/route.tsx
// GET /api/invoices/:id/export/pdf — export PDF paginé et imprimable.

import { NextRequest, NextResponse } from "next/server";
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  underline: { textDecoration: "underline" },
  section: { marginBottom: 10 },
  table: { marginTop: 14, borderWidth: 1, borderColor: "#94a3b8" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f1f5f9", borderBottomWidth: 1, borderBottomColor: "#94a3b8" },
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
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, textAlign: "center", fontSize: 8, color: "#64748b" },
});

function formatDateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

type InvoiceWithLines = NonNullable<Awaited<ReturnType<typeof loadInvoice>>>;

async function loadInvoice(id: string) {
  return prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });
}

function InvoicePdf({ invoice }: { invoice: InvoiceWithLines }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.row}>
          <Text style={[styles.bold, styles.underline]}>Fournisseur: {invoice.supplier}</Text>
          <Text style={[styles.bold, styles.underline]}>Client: {invoice.client}</Text>
        </View>

        <View style={styles.section}>
          <Text>{invoice.projectName}</Text>
          {invoice.projectAddress ? <Text>{invoice.projectAddress}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>Date: {formatDateFr(invoice.invoiceDate)}</Text>
          <Text>Objet: {invoice.object}</Text>
          {invoice.lotDescription ? <Text>{invoice.lotDescription}</Text> : null}
          {invoice.contractRef ? <Text>Réf: {invoice.contractRef}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellLibelle, styles.bold]}>LIBELLE</Text>
            <Text style={[styles.cellUnite, styles.bold]}>UNITE</Text>
            <Text style={[styles.cellQty, styles.bold]}>QUANTITE</Text>
            <Text style={[styles.cellPrix, styles.bold]}>PRIX UNITAIRE/Ar</Text>
            <Text style={[styles.cellMontant, styles.bold]}>MONTANT/Ar</Text>
          </View>

          {invoice.lines.map((line) => (
            <View style={styles.tableRow} key={line.id} wrap={false}>
              <Text style={styles.cellLibelle}>{line.libelle}</Text>
              <Text style={styles.cellUnite}>{line.unite || ""}</Text>
              <Text style={styles.cellQty}>{formatAmount(Number(line.quantite))}</Text>
              <Text style={styles.cellPrix}>{formatAmount(Number(line.prixUnitaire))}</Text>
              <Text style={styles.cellMontant}>{formatAmount(Number(line.montant))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>MONTANT TOTAL TTC/AR</Text>
          <Text style={styles.totalValue}>{formatAmount(Number(invoice.totalTtc))} Ar</Text>
        </View>

        <View style={styles.wordsBox}>
          <Text>Montant en lettres: {invoice.amountInWords}</Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text>Nom, Fonction et Signature: {invoice.signature || ""}</Text>
        </View>

        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>Nom complet & adresse de la banque pour le paiement:</Text>
          {invoice.bankName ? <Text>{invoice.bankName}</Text> : null}
          {invoice.accountHolder ? <Text>Nom du détenteur: {invoice.accountHolder}</Text> : null}
          {invoice.accountNumber ? <Text>Numéro de compte: {invoice.accountNumber}</Text> : null}
          {invoice.bankCode ? <Text>Code Banque: {invoice.bankCode}</Text> : null}
          {invoice.branchCode ? <Text>Code Guichet: {invoice.branchCode}</Text> : null}
          {invoice.ribKey ? <Text>Clé RIB: {invoice.ribKey}</Text> : null}
          {invoice.bic ? <Text>BIC: {invoice.bic}</Text> : null}
          {invoice.iban ? <Text>IBAN: {invoice.iban}</Text> : null}
        </View>

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
  const invoice = await loadInvoice(id);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoicePdf invoice={invoice} />);
  const filename = `Facture-${invoice.invoiceNumber}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
