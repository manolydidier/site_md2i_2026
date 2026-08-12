"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft } from "lucide-react";
import InvoiceLinesGrid, { type InvoiceLineRow } from "./InvoiceLinesGrid";
import { invoiceAmountInWords } from "@/app/lib/invoices/amount-in-words";

type HeaderFields = {
  invoiceNumber: string;
  supplier: string;
  client: string;
  projectName: string;
  projectAddress: string;
  invoiceDate: string;
  object: string;
  lotDescription: string;
  contractRef: string;
  tmpRatePercent: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  bankCode: string;
  branchCode: string;
  ribKey: string;
  bic: string;
  iban: string;
  signature: string;
};

const EMPTY_HEADER: HeaderFields = {
  invoiceNumber: "",
  supplier: "MD2I Madagascar",
  client: "",
  projectName: "",
  projectAddress: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  object: "",
  lotDescription: "",
  contractRef: "",
  tmpRatePercent: 8,
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  bankCode: "",
  branchCode: "",
  ribKey: "",
  bic: "",
  iban: "",
  signature: "",
};

function newRowId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(invoiceId);

  const { register, handleSubmit, reset, watch } = useForm<HeaderFields>({
    defaultValues: EMPTY_HEADER,
  });

  const [lines, setLines] = useState<InvoiceLineRow[]>([
    { rowId: newRowId(), libelle: "", unite: "", quantite: 0, prixUnitaire: 0 },
  ]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isEdit) {
      // Facture en création : propose un numéro auto-généré.
      fetch("/api/invoices?suggestNumber=1")
        .then((res) => res.json())
        .then((data) => {
          if (data.invoiceNumber) reset({ ...EMPTY_HEADER, invoiceNumber: data.invoiceNumber });
        })
        .catch(() => {});
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur lors du chargement.");

        const invoice = json.data;

        reset({
          invoiceNumber: invoice.invoiceNumber,
          supplier: invoice.supplier,
          client: invoice.client,
          projectName: invoice.projectName,
          projectAddress: invoice.projectAddress || "",
          invoiceDate: String(invoice.invoiceDate).slice(0, 10),
          object: invoice.object,
          lotDescription: invoice.lotDescription || "",
          contractRef: invoice.contractRef || "",
          tmpRatePercent: Number(invoice.tmpRatePercent),
          bankName: invoice.bankName || "",
          accountHolder: invoice.accountHolder || "",
          accountNumber: invoice.accountNumber || "",
          bankCode: invoice.bankCode || "",
          branchCode: invoice.branchCode || "",
          ribKey: invoice.ribKey || "",
          bic: invoice.bic || "",
          iban: invoice.iban || "",
          signature: invoice.signature || "",
        });

        setLines(
          (invoice.lines || []).map((line: {
            id: string; libelle: string; unite: string | null; quantite: string | number; prixUnitaire: string | number;
          }) => ({
            rowId: line.id,
            id: line.id,
            libelle: line.libelle,
            unite: line.unite || "",
            quantite: Number(line.quantite),
            prixUnitaire: Number(line.prixUnitaire),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, isEdit]);

  const totalTtc = useMemo(
    () =>
      Math.round(
        lines.reduce((sum, line) => sum + (Number(line.quantite) || 0) * (Number(line.prixUnitaire) || 0), 0) * 100
      ) / 100,
    [lines]
  );

  const tmpRatePercentWatched = watch("tmpRatePercent");
  const tmpRatePercent = Number(tmpRatePercentWatched) || 8;

  const amountInWords = useMemo(
    () => (totalTtc > 0 ? invoiceAmountInWords(totalTtc, tmpRatePercent) : ""),
    [totalTtc, tmpRatePercent]
  );

  const onSubmit = handleSubmit(async (header) => {
    setError(null);
    setFieldErrors({});

    if (lines.length === 0) {
      setError("Ajoutez au moins une ligne à la facture.");
      return;
    }

    if (totalTtc <= 0) {
      setError("Le total TTC doit être supérieur à zéro.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...header,
        tmpRatePercent: Number(header.tmpRatePercent) || 8,
        lines: lines.map((line, index) => ({
          id: line.id,
          libelle: line.libelle,
          unite: line.unite,
          quantite: Number(line.quantite) || 0,
          prixUnitaire: Number(line.prixUnitaire) || 0,
          sortOrder: index,
        })),
      };

      const res = await fetch(isEdit ? `/api/invoices/${invoiceId}` : "/api/invoices", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error && typeof json.error === "object" && "fieldErrors" in json.error) {
          setFieldErrors(json.error.fieldErrors || {});
        }
        throw new Error(typeof json.error === "string" ? json.error : "Erreur lors de l'enregistrement.");
      }

      router.push(`/admin/invoices/${json.data.id}/view`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  });

  if (loading) {
    return <div style={s.page}><div style={s.card}>Chargement…</div></div>;
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <Link href="/admin/invoices" style={s.backLink}>
            <ArrowLeft size={14} />
            Retour aux factures
          </Link>
          <h1 style={s.title}>{isEdit ? "Modifier la facture" : "Nouvelle facture"}</h1>
        </div>

        <button type="button" onClick={onSubmit} disabled={saving} style={s.primaryButton}>
          <Save size={16} />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </header>

      {error && <div style={s.errorBox}>{error}</div>}

      <form onSubmit={onSubmit}>
        <section style={s.card}>
          <h2 style={s.cardTitle}>Informations générales</h2>
          <div style={s.grid2}>
            <Field label="N° facture" errors={fieldErrors.invoiceNumber}>
              <input {...register("invoiceNumber", { required: true })} style={s.input} />
            </Field>
            <Field label="Fournisseur" errors={fieldErrors.supplier}>
              <input {...register("supplier", { required: true })} style={s.input} />
            </Field>
            <Field label="Client" errors={fieldErrors.client}>
              <input {...register("client", { required: true })} style={s.input} />
            </Field>
            <Field label="Date" errors={fieldErrors.invoiceDate}>
              <input type="date" {...register("invoiceDate", { required: true })} style={s.input} />
            </Field>
            <Field label="Nom du projet" errors={fieldErrors.projectName}>
              <input {...register("projectName", { required: true })} style={s.input} />
            </Field>
            <Field label="Adresse du projet">
              <input {...register("projectAddress")} style={s.input} />
            </Field>
            <Field label="Référence contrat">
              <input {...register("contractRef")} style={s.input} />
            </Field>
            <Field label="Taux TMP (%)">
              <input type="number" step="0.1" min={0} max={100} {...register("tmpRatePercent")} style={s.input} />
            </Field>
          </div>

          <Field label="Objet" errors={fieldErrors.object}>
            <textarea {...register("object", { required: true })} style={s.textarea} rows={2} />
          </Field>

          <Field label="Description du lot">
            <textarea {...register("lotDescription")} style={s.textarea} rows={2} />
          </Field>
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Lignes de facturation</h2>
          <InvoiceLinesGrid rows={lines} onChange={setLines} />

          <div style={s.totalRow}>
            <span style={s.totalLabel}>MONTANT TOTAL TTC</span>
            <span style={s.totalValue}>
              {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(totalTtc)} Ar
            </span>
          </div>

          {amountInWords && (
            <div style={s.wordsBox}>
              Montant en lettres : {amountInWords}
            </div>
          )}
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Coordonnées bancaires & signature</h2>
          <div style={s.grid2}>
            <Field label="Banque"><input {...register("bankName")} style={s.input} /></Field>
            <Field label="Titulaire du compte"><input {...register("accountHolder")} style={s.input} /></Field>
            <Field label="Numéro de compte"><input {...register("accountNumber")} style={s.input} /></Field>
            <Field label="Code banque"><input {...register("bankCode")} style={s.input} /></Field>
            <Field label="Code guichet"><input {...register("branchCode")} style={s.input} /></Field>
            <Field label="Clé RIB"><input {...register("ribKey")} style={s.input} /></Field>
            <Field label="BIC"><input {...register("bic")} style={s.input} /></Field>
            <Field label="IBAN"><input {...register("iban")} style={s.input} /></Field>
          </div>
          <Field label="Nom, fonction et signature">
            <input {...register("signature")} style={s.input} />
          </Field>
        </section>
      </form>
    </div>
  );
}

function Field({ label, errors, children }: { label: string; errors?: string[]; children: React.ReactNode }) {
  return (
    <label style={s.fieldGroup}>
      <span style={s.fieldLabel}>{label}</span>
      {children}
      {errors && errors.length > 0 && <span style={s.fieldError}>{errors[0]}</span>}
    </label>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED, textDecoration: "none", marginBottom: 8 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  primaryButton: { height: 44, padding: "0 20px", borderRadius: 11, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, background: ORANGE, color: "#1a0d00", border: "1px solid rgba(239,159,39,0.25)", cursor: "pointer" },
  errorBox: { marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", fontSize: 13, fontWeight: 600 },
  card: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, marginBottom: 18, boxSizing: "border-box" },
  cardTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 800 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: 700, color: "#374151" },
  fieldError: { fontSize: 11, color: "#DC2626", fontWeight: 700 },
  input: { height: 42, borderRadius: 10, border: `1px solid ${BORDER}`, padding: "0 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { borderRadius: 10, border: `1px solid ${BORDER}`, padding: 12, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" },
  totalRow: { display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` },
  totalLabel: { fontSize: 13, fontWeight: 800, color: "#374151" },
  totalValue: { fontSize: 20, fontWeight: 800, color: TEXT },
  wordsBox: { marginTop: 12, padding: 12, borderRadius: 10, background: "#F8FAFC", border: `1px solid ${BORDER}`, fontSize: 13, color: "#334155", lineHeight: 1.6 },
};
