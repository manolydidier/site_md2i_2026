"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, FileSpreadsheet, Pencil } from "lucide-react";

type InvoiceLine = {
  id: string;
  libelle: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur lors du chargement.");
        setInvoice(json.data);
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
        <div style={s.headerRow}>
          <div>
            <div style={s.label}>Fournisseur</div>
            <div style={s.value}>{invoice.supplier}</div>
          </div>
          <div>
            <div style={s.label}>Client</div>
            <div style={s.value}>{invoice.client}</div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.value}>{invoice.projectName}</div>
          {invoice.projectAddress && <div style={s.muted}>{invoice.projectAddress}</div>}
        </div>

        <div style={s.section}>
          <div><strong>Date :</strong> {formatDate(invoice.invoiceDate)}</div>
          <div><strong>Objet :</strong> {invoice.object}</div>
          {invoice.lotDescription && <div>{invoice.lotDescription}</div>}
          {invoice.contractRef && <div><strong>Réf :</strong> {invoice.contractRef}</div>}
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
                <td style={s.td}>{line.libelle}</td>
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
          <div style={s.wordsBox}>Montant en lettres : {invoice.amountInWords}</div>
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
  headerRow: { display: "flex", justifyContent: "space-between", marginBottom: 18, fontWeight: 700, textDecoration: "underline" },
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
