"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileDown, FileSpreadsheet, Pencil } from "lucide-react";
import { toCssStyle, DEFAULT_LIBELLE_STYLE, type TextStyle, type TextLine, type TextRun } from "@/app/lib/invoices/style";

type InvoiceLine = {
  id: string;
  libelle: string;
  libelleRuns: TextRun[] | null;
  unite: string | null;
  quantite: string | number;
  prixUnitaire: string | number;
  montant: string | number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  supplier: string;
  client: string;
  projectName: string;
  projectAddress: string | null;
  invoiceDate: string;
  object: string;
  lotDescription: string | null;
  contractRef: string | null;
  totalTtc: string | number;
  amountInWords: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  bankCode: string | null;
  branchCode: string | null;
  ribKey: string | null;
  bic: string | null;
  iban: string | null;
  signature: string | null;
  lines: InvoiceLine[];
  supplierAddress: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  supplierStatNumber: string | null;
  supplierNif: string | null;
  supplierRcs: string | null;
  paymentMode: { label: string } | null;
  dateType: { label: string } | null;
  header: { imageUrl: string; altText: string | null } | null;
  footer: { lines: TextLine[] } | null;
  clientContent: string | null;
};

function formatAmount(value: string | number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function InvoiceViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [libelleStyle, setLibelleStyle] = useState<TextStyle>(DEFAULT_LIBELLE_STYLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`, { cache: "no-store" }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur lors du chargement.");
        return json.data as Invoice;
      }),
      fetch(`/api/invoice-document-settings`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([invoiceData, settingsJson]) => {
        setInvoice(invoiceData);
        if (settingsJson?.data?.libelleStyle) setLibelleStyle(settingsJson.data.libelleStyle);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={s.page}>Chargement…</div>;
  if (error || !invoice) return <div style={s.page}>{error || "Facture introuvable."}</div>;

  return (
    <div style={s.page}>
      <style>{`
        @media print {
          .invoice-view-toolbar { display: none !important; }
          .invoice-view-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="invoice-view-toolbar" style={s.toolbar}>
        <Link href="/admin/invoices" style={s.backLink}>
          <ArrowLeft size={14} />
          Retour aux factures
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/admin/invoices/${id}`} style={s.secondaryButton}>
            <Pencil size={14} />
            Modifier
          </Link>
          <a href={`/api/invoices/${id}/export/excel`} style={s.secondaryButton}>
            <FileSpreadsheet size={14} />
            Exporter en Excel
          </a>
          <a href={`/api/invoices/${id}/export/pdf`} style={s.primaryButton}>
            <FileDown size={14} />
            Exporter en PDF
          </a>
        </div>
      </div>

      <div className="invoice-view-card" style={s.card}>
        {invoice.header && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <Image
              src={invoice.header.imageUrl}
              alt={invoice.header.altText || "En-tête"}
              width={700}
              height={100}
              style={{ width: "100%", height: "auto", maxHeight: 100, objectFit: "contain" }}
              unoptimized
            />
          </div>
        )}

        <div style={s.invoiceNumberRow}>N° Facture : {invoice.invoiceNumber}</div>

        <div style={s.partiesGrid}>
          <div style={s.partyBox}>
            <div style={s.partyLabel}>Fournisseur</div>
            <div style={s.partyName}>{invoice.supplier}</div>
            {invoice.supplierAddress && <div style={s.partyLine}>{invoice.supplierAddress}</div>}
            {invoice.supplierPhone && <div style={s.partyLine}>Tél : {invoice.supplierPhone}</div>}
            {invoice.supplierEmail && <div style={s.partyLine}>Email : {invoice.supplierEmail}</div>}
            {invoice.supplierStatNumber && <div style={s.partyLine}>N° Stat : {invoice.supplierStatNumber}</div>}
            {invoice.supplierNif && <div style={s.partyLine}>NIF : {invoice.supplierNif}</div>}
            {invoice.supplierRcs && <div style={s.partyLine}>RCS : {invoice.supplierRcs}</div>}
          </div>
          <div style={s.partyBox}>
            <div style={s.partyLabel}>Client</div>
            <div style={s.partyName}>{invoice.client}</div>
            {invoice.clientContent && (
              <div style={s.clientRichContent} dangerouslySetInnerHTML={{ __html: invoice.clientContent }} />
            )}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.value}>{invoice.projectName}</div>
          {invoice.projectAddress && <div style={s.muted}>{invoice.projectAddress}</div>}
        </div>

        <div style={s.section}>
          <div><strong>{invoice.dateType?.label || "Date"} :</strong> {formatDate(invoice.invoiceDate)}</div>
          <div><strong>Objet :</strong> {invoice.object}</div>
          {invoice.lotDescription && <div>{invoice.lotDescription}</div>}
          {invoice.contractRef && <div><strong>Réf :</strong> {invoice.contractRef}</div>}
          {invoice.paymentMode?.label && <div><strong>Mode de paiement :</strong> {invoice.paymentMode.label}</div>}
        </div>

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>LIBELLE</th>
              <th style={s.th}>UNITE</th>
              <th style={{ ...s.th, textAlign: "right" }}>QUANTITE</th>
              <th style={{ ...s.th, textAlign: "right" }}>PRIX UNITAIRE/Ar</th>
              <th style={{ ...s.th, textAlign: "right" }}>MONTANT/Ar</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td style={s.td}>
                  {line.libelleRuns && line.libelleRuns.length > 0 ? (
                    line.libelleRuns.map((run, index) => (
                      <span key={index} style={run.style ? toCssStyle(run.style) : undefined}>
                        {run.text}
                      </span>
                    ))
                  ) : (
                    <span style={toCssStyle(libelleStyle)}>{line.libelle}</span>
                  )}
                </td>
                <td style={s.td}>{line.unite || ""}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{formatAmount(line.quantite)}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{formatAmount(line.prixUnitaire)}</td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700 }}>{formatAmount(line.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={s.totalRow}>
          <span style={s.totalLabel}>MONTANT TOTAL TTC/AR</span>
          <span style={s.totalValue}>{formatAmount(invoice.totalTtc)} Ar</span>
        </div>

        {invoice.amountInWords && (
          <div style={s.wordsBox}>Montant en lettres : <strong>{invoice.amountInWords}</strong></div>
        )}

        <div style={s.section}>
          Nom, Fonction et Signature : {invoice.signature || ""}
        </div>

        <div style={s.bankSection}>
          <div style={s.bankTitle}>Nom complet & adresse de la banque pour le paiement :</div>
          {invoice.bankName && <div>{invoice.bankName}</div>}
          {invoice.accountHolder && <div>Nom du détenteur : {invoice.accountHolder}</div>}
          {invoice.accountNumber && <div>Numéro de compte : {invoice.accountNumber}</div>}
          {invoice.bankCode && <div>Code Banque : {invoice.bankCode}</div>}
          {invoice.branchCode && <div>Code Guichet : {invoice.branchCode}</div>}
          {invoice.ribKey && <div>Clé RIB : {invoice.ribKey}</div>}
          {invoice.bic && <div>BIC : {invoice.bic}</div>}
          {invoice.iban && <div>IBAN : {invoice.iban}</div>}
        </div>

        {invoice.footer?.lines && invoice.footer.lines.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            {invoice.footer.lines.map((line, index) => (
              <div key={index} style={toCssStyle(line.style)}>{line.text}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ORANGE = "#EF9F27";
const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";

const s: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: BG, color: TEXT, padding: 32, boxSizing: "border-box" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED, textDecoration: "none" },
  primaryButton: { height: 40, padding: "0 16px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, background: ORANGE, color: "#1a0d00", textDecoration: "none" },
  secondaryButton: { height: 40, padding: "0 16px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, background: SURFACE, color: TEXT, border: `1px solid ${BORDER}`, textDecoration: "none" },
  card: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 32, maxWidth: 900, margin: "0 auto", boxShadow: "0 12px 34px rgba(15,23,42,0.06)" },
  invoiceNumberRow: { textAlign: "right", fontSize: 13, fontWeight: 800, marginBottom: 10, color: TEXT },
  partiesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 },
  partyBox: { background: "#F1F5F9", borderRadius: 10, padding: 14 },
  partyLabel: { fontSize: 11, fontWeight: 800, color: MUTED, textTransform: "uppercase", marginBottom: 4 },
  partyName: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  partyLine: { fontSize: 12.5, color: "#334155", marginTop: 2 },
  clientRichContent: { fontSize: 12.5, color: "#334155", marginTop: 4, lineHeight: 1.6 },
  label: { fontSize: 11, color: MUTED, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: 700 },
  muted: { fontSize: 13, color: MUTED },
  section: { marginBottom: 16, fontSize: 13.5, lineHeight: 1.7 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 },
  th: { textAlign: "left", padding: "10px 12px", background: "#F1F5F9", border: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 800, textTransform: "uppercase" },
  td: { padding: "10px 12px", border: `1px solid ${BORDER}` },
  totalRow: { display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "baseline", marginBottom: 14 },
  totalLabel: { fontSize: 13, fontWeight: 800 },
  totalValue: { fontSize: 20, fontWeight: 800 },
  wordsBox: { padding: 12, borderRadius: 10, background: "#F8FAFC", border: `1px solid ${BORDER}`, fontSize: 13, marginBottom: 20, lineHeight: 1.6 },
  bankSection: { marginTop: 12, paddingTop: 14, borderTop: `1px solid ${BORDER}`, fontSize: 13, lineHeight: 1.8 },
  bankTitle: { fontWeight: 800, marginBottom: 4 },
};
