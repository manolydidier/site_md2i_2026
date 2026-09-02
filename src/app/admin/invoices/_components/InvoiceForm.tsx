"use client";

import { forwardRef, useEffect, useMemo, useState, type CSSProperties, type SelectHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, FileText, Users, Rows3, LayoutTemplate, Landmark, ChevronDown, Hash } from "lucide-react";
import InvoiceLinesGrid, { type InvoiceLineRow } from "./InvoiceLinesGrid";
import { invoiceAmountInWords } from "@/app/lib/invoices/amount-in-words";
import { DEFAULT_LIBELLE_STYLE, type TextStyle } from "@/app/lib/invoices/style";

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
  taxLabel: string;
  currency: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  bankCode: string;
  branchCode: string;
  ribKey: string;
  bic: string;
  iban: string;
  signature: string;
  supplierId: string;
  paymentModeId: string;
  headerId: string;
  footerId: string;
  clientId: string;
  documentType: "FACTURE" | "PROFORMA";
  showDocumentType: boolean;
};

const EMPTY_HEADER: HeaderFields = {
  invoiceNumber: "",
  supplier: "MD2I Madagascar",
  client: "",
  projectName: "",
  projectAddress: "",
  invoiceDate: "",
  object: "",
  lotDescription: "",
  contractRef: "",
  tmpRatePercent: 8,
  taxLabel: "taxes sur les marchés publics (TMP)",
  currency: "Ar",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  bankCode: "",
  branchCode: "",
  ribKey: "",
  bic: "",
  iban: "",
  signature: "",
  supplierId: "",
  paymentModeId: "",
  headerId: "",
  footerId: "",
  clientId: "",
  documentType: "FACTURE",
  showDocumentType: true,
};

const TABS = [
  { key: "general", label: "Général", description: "Numéro, date, objet et références de la facture.", icon: FileText },
  { key: "parties", label: "Fournisseur & client", description: "Qui émet la facture, à qui elle est adressée.", icon: Users },
  { key: "lines", label: "Lignes", description: "Le détail facturé et le total.", icon: Rows3 },
  { key: "layout", label: "Mise en page", description: "En-tête et pied de page du document.", icon: LayoutTemplate },
  { key: "bank", label: "Banque & signature", description: "Coordonnées de paiement et signataire.", icon: Landmark },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type RefOption = { id: string; name?: string; label?: string };

function newRowId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(invoiceId);
  const [tab, setTab] = useState<TabKey>("general");

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<HeaderFields>({
    defaultValues: EMPTY_HEADER,
  });

  const [lines, setLines] = useState<InvoiceLineRow[]>([
    { rowId: newRowId(), libelle: "", unite: "", quantite: 0, prixUnitaire: 0 },
  ]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [suppliers, setSuppliers] = useState<RefOption[]>([]);
  const [clients, setClients] = useState<RefOption[]>([]);
  const [paymentModes, setPaymentModes] = useState<RefOption[]>([]);
  const [headers, setHeaders] = useState<RefOption[]>([]);
  const [footers, setFooters] = useState<RefOption[]>([]);
  const [libelleStyle, setLibelleStyle] = useState<TextStyle>(DEFAULT_LIBELLE_STYLE);
  const [numberPrefixes, setNumberPrefixes] = useState({ FACTURE: "FA-", PROFORMA: "PRO-" });

  useEffect(() => {
    Promise.all([
      fetch("/api/invoice-suppliers").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/invoice-payment-modes").then((r) => r.json()),
      fetch("/api/invoice-headers").then((r) => r.json()),
      fetch("/api/invoice-footers").then((r) => r.json()),
      fetch("/api/invoice-document-settings").then((r) => r.json()),
    ])
      .then(([s, c, p, h, f, settings]) => {
        setSuppliers(s.data || []);
        setClients(c.data || []);
        setPaymentModes(p.data || []);
        setHeaders(h.data || []);
        setFooters(f.data || []);
        if (settings?.data?.libelleStyle) setLibelleStyle(settings.data.libelleStyle);
        setNumberPrefixes({
          FACTURE: settings?.data?.facturePrefix || "FA-",
          PROFORMA: settings?.data?.proformaPrefix || "PRO-",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;

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
          invoiceDate: invoice.invoiceDate ? String(invoice.invoiceDate).slice(0, 10) : "",
          object: invoice.object,
          lotDescription: invoice.lotDescription || "",
          contractRef: invoice.contractRef || "",
          tmpRatePercent: Number(invoice.tmpRatePercent),
          taxLabel: invoice.taxLabel || "taxes sur les marchés publics (TMP)",
          currency: invoice.currency || "Ar",
          bankName: invoice.bankName || "",
          accountHolder: invoice.accountHolder || "",
          accountNumber: invoice.accountNumber || "",
          bankCode: invoice.bankCode || "",
          branchCode: invoice.branchCode || "",
          ribKey: invoice.ribKey || "",
          bic: invoice.bic || "",
          iban: invoice.iban || "",
          signature: invoice.signature || "",
          supplierId: invoice.supplierId || "",
          paymentModeId: invoice.paymentModeId || "",
          headerId: invoice.headerId || "",
          footerId: invoice.footerId || "",
          clientId: invoice.clientId || "",
          documentType: invoice.documentType || "FACTURE",
          showDocumentType: invoice.showDocumentType ?? true,
        });

        setLines(
          (invoice.lines || []).map((line: {
            id: string; libelle: string; libelleRuns: InvoiceLineRow["libelleRuns"]; unite: string | null; quantite: string | number; prixUnitaire: string | number;
          }) => ({
            rowId: line.id,
            id: line.id,
            libelle: line.libelle,
            libelleRuns: line.libelleRuns ?? null,
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

  const documentTypeWatched = watch("documentType");
  const [lastSuggestedNumber, setLastSuggestedNumber] = useState<string | null>(null);

  useEffect(() => {
    const docType = documentTypeWatched === "PROFORMA" ? "PROFORMA" : "FACTURE";

    if (!isEdit) {
      // Facture en création : le numéro auto-suggéré suit le type de document
      // choisi (préfixe Facture/Proforma configurable) et se met à jour si
      // l'utilisateur change de type — sauf s'il a déjà modifié le numéro
      // proposé à la main, auquel cas on ne l'écrase pas.
      fetch(`/api/invoices?suggestNumber=1&documentType=${docType}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.invoiceNumber) return;
          const current = getValues("invoiceNumber");
          if (!current || current === lastSuggestedNumber) {
            setValue("invoiceNumber", data.invoiceNumber);
          }
          setLastSuggestedNumber(data.invoiceNumber);
        })
        .catch(() => {});
      return;
    }

    // Facture existante : on ne régénère pas un nouveau numéro (la séquence
    // doit rester la même), on échange juste le préfixe si le numéro suit
    // encore le format préfixe+année+séquence de l'autre type.
    const current = getValues("invoiceNumber");
    if (!current) return;
    const targetPrefix = numberPrefixes[docType];
    const otherPrefix = numberPrefixes[docType === "PROFORMA" ? "FACTURE" : "PROFORMA"];
    if (otherPrefix && current.startsWith(otherPrefix) && !current.startsWith(targetPrefix)) {
      setValue("invoiceNumber", targetPrefix + current.slice(otherPrefix.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentTypeWatched, isEdit]);

  const supplierIdWatched = watch("supplierId");
  const clientIdWatched = watch("clientId");

  useEffect(() => {
    if (!supplierIdWatched) return;
    const found = suppliers.find((item) => item.id === supplierIdWatched);
    if (found?.name) setValue("supplier", found.name);
  }, [supplierIdWatched, suppliers, setValue]);

  useEffect(() => {
    if (!clientIdWatched) return;
    const found = clients.find((item) => item.id === clientIdWatched);
    if (found?.name) setValue("client", found.name);
  }, [clientIdWatched, clients, setValue]);

  const totalTtc = useMemo(
    () =>
      Math.round(
        lines.reduce((sum, line) => sum + (Number(line.quantite) || 0) * (Number(line.prixUnitaire) || 0), 0) * 100
      ) / 100,
    [lines]
  );

  const tmpRatePercentWatched = watch("tmpRatePercent");
  const tmpRatePercent = Number(tmpRatePercentWatched) || 8;
  const taxLabelWatched = watch("taxLabel");
  const taxLabel = taxLabelWatched?.trim() || "taxes sur les marchés publics (TMP)";

  const amountInWords = useMemo(
    () => (totalTtc > 0 ? invoiceAmountInWords(totalTtc, tmpRatePercent, taxLabel) : ""),
    [totalTtc, tmpRatePercent, taxLabel]
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
        taxLabel: header.taxLabel?.trim() || "taxes sur les marchés publics (TMP)",
        currency: header.currency?.trim() || "Ar",
        supplierId: header.supplierId || null,
        paymentModeId: header.paymentModeId || null,
        headerId: header.headerId || null,
        footerId: header.footerId || null,
        clientId: header.clientId || null,
        documentType: header.documentType || "FACTURE",
        lines: lines.map((line, index) => ({
          id: line.id,
          libelle: line.libelle,
          libelleRuns: line.libelleRuns && line.libelleRuns.length > 0 ? line.libelleRuns : null,
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
    return (
      <div style={s.page}>
        <div style={{ textAlign: "center", color: MUTED, fontSize: 13, padding: "60px 0" }}>Chargement…</div>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div style={s.page} className="inv-form">
      <style>{`
        .inv-form input:not([type="checkbox"]):focus,
        .inv-form select:focus,
        .inv-form textarea:focus {
          outline: none;
          border-color: ${ORANGE};
          box-shadow: 0 0 0 3px rgba(239,159,39,0.14);
        }
        .inv-form input[type="checkbox"]:not(.inv-switch) { accent-color: ${ORANGE}; width: 15px; height: 15px; cursor: pointer; }
        .inv-primary-btn:hover:not(:disabled) { filter: brightness(1.04); }
        .inv-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .inv-date-btn:hover { background: #F1F0EC; }

        .inv-select-wrap { position: relative; }
        .inv-select { appearance: none; -webkit-appearance: none; -moz-appearance: none; padding-right: 30px !important; cursor: pointer; width: 100%; }
        .inv-select-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #A8A29E; pointer-events: none; }
        .inv-form input:hover:not(:focus):not(:disabled),
        .inv-form select:hover:not(:focus):not(:disabled),
        .inv-form textarea:hover:not(:focus) { border-color: #C9C4BB; }

        .inv-switch { appearance: none; -webkit-appearance: none; width: 36px; height: 21px; border-radius: 999px; background: #E7E4DD; border: 1px solid #D6D3CE; position: relative; cursor: pointer; transition: background .15s ease, border-color .15s ease; flex-shrink: 0; }
        .inv-switch::after { content: ""; position: absolute; top: 1px; left: 1px; width: 17px; height: 17px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(28,25,23,0.2); transition: transform .15s ease; }
        .inv-switch:checked { background: ${ORANGE}; border-color: ${ORANGE}; }
        .inv-switch:checked::after { transform: translateX(15px); }

        .inv-workspace { display: grid; grid-template-columns: 208px 1fr; background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 12px; overflow: hidden; }
        .inv-rail { display: flex; flex-direction: column; gap: 1px; padding: 12px 8px; border-right: 1px solid ${BORDER}; background: #FBFAF9; }
        .inv-rail-item { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; border: none; background: transparent; color: #57534E; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; transition: background .12s ease, color .12s ease; }
        .inv-rail-item:hover:not(.active) { background: #F1F0EC; color: #1C1917; }
        .inv-rail-item.active { background: ${SURFACE}; color: #1C1917; box-shadow: inset 2px 0 0 ${ORANGE}; font-weight: 700; }
        .inv-rail-item svg { flex-shrink: 0; color: #A8A29E; }
        .inv-rail-item.active svg { color: ${ORANGE}; }
        .inv-content { padding: 30px 34px; min-width: 0; }

        @media (max-width: 760px) {
          .inv-workspace { grid-template-columns: 1fr; border-radius: 10px; }
          .inv-rail { flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid ${BORDER}; padding: 8px; }
          .inv-rail-item.active { box-shadow: inset 0 -2px 0 ${ORANGE}; }
          .inv-content { padding: 20px; }
        }
      `}</style>

      <header style={s.header}>
        <div>
          <Link href="/admin/invoices" style={s.backLink}>
            <ArrowLeft size={14} />
            Retour aux factures
          </Link>
          <h1 style={s.title}>{isEdit ? "Modifier la facture" : "Nouvelle facture"}</h1>
          <p style={s.subtitle}>
            {isEdit ? `Facture ${watch("invoiceNumber") || ""}` : "Renseignez les informations ci-dessous, puis enregistrez."}
          </p>
        </div>

        <button type="button" onClick={onSubmit} disabled={saving} style={s.primaryButton} className="inv-primary-btn">
          <Save size={16} />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </header>

      {error && <div style={s.errorBox}>{error}</div>}

      <div className="inv-workspace">
        <nav className="inv-rail">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inv-rail-item${isActive ? " active" : ""}`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="inv-content">
          <h2 style={s.sectionHeading}>{activeTab.label}</h2>
          <p style={s.sectionSubheading}>{activeTab.description}</p>

          <form onSubmit={onSubmit}>
            {tab === "general" && (
          <section>
            <Subsection title="Identification">
              <div style={s.grid2}>
                <Field label="N° facture" required errors={fieldErrors.invoiceNumber}>
                  <div style={{ position: "relative" }}>
                    <Hash size={14} style={s.inputIconLeft} />
                    <input
                      {...register("invoiceNumber", { required: true })}
                      style={{ ...s.input, paddingLeft: 30 }}
                    />
                  </div>
                </Field>
                <Field label="Date (facultative)" errors={fieldErrors.invoiceDate}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="date" {...register("invoiceDate")} style={{ ...s.input, flex: 1, minWidth: 0 }} />
                    <button
                      type="button"
                      onClick={() => setValue("invoiceDate", new Date().toISOString().slice(0, 10))}
                      style={s.dateTodayButton}
                      className="inv-date-btn"
                    >
                      Aujourd&apos;hui
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("invoiceDate", "")}
                      style={s.dateTodayButton}
                      className="inv-date-btn"
                      title="Effacer la date"
                    >
                      Vider
                    </button>
                  </div>
                </Field>
              </div>
            </Subsection>

            <Subsection title="Type de document">
              <Field label="Type">
                <Select {...register("documentType")} style={{ maxWidth: 280 }}>
                  <option value="FACTURE">Facture</option>
                  <option value="PROFORMA">Facture Proforma</option>
                </Select>
              </Field>
              <label style={s.checkboxRow}>
                <input type="checkbox" className="inv-switch" {...register("showDocumentType")} />
                <span>Afficher &quot;FACTURE&quot; / &quot;FACTURE PROFORMA&quot; sur le document</span>
              </label>
            </Subsection>

            <Subsection title="Contenu">
              <Field label="Objet" required errors={fieldErrors.object}>
                <textarea {...register("object", { required: true })} style={s.textarea} rows={2} />
              </Field>
              <Field label="Description du lot">
                <textarea {...register("lotDescription")} style={s.textarea} rows={2} />
              </Field>
            </Subsection>

            <Subsection title="Compléments" last>
              <div style={s.grid2}>
                <Field label="Référence contrat">
                  <input {...register("contractRef")} style={s.input} />
                </Field>
                <Field label="Mode de paiement">
                  <Select {...register("paymentModeId")}>
                    <option value="">— Non défini —</option>
                    {paymentModes.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Devise">
                  <input
                    list="currency-options"
                    placeholder="Ar"
                    {...register("currency")}
                    style={s.input}
                    title="Devise affichée sur la facture (Ar, EUR, USD...)"
                  />
                  <datalist id="currency-options">
                    <option value="Ar" />
                    <option value="EUR" />
                    <option value="USD" />
                  </datalist>
                </Field>
              </div>

              <Field label="Mention fiscale">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    list="tax-label-options"
                    placeholder="taxes sur les marchés publics (TMP)"
                    {...register("taxLabel")}
                    style={{ ...s.input, flex: 1, minWidth: 0 }}
                    title="Texte inséré tel quel dans la mention « ... y compris les {texte} de X% »"
                  />
                  <datalist id="tax-label-options">
                    <option value="taxes sur les marchés publics (TMP)" />
                    <option value="toutes taxes comprises (TTC)" />
                  </datalist>
                  <div style={{ position: "relative", width: 90, flexShrink: 0 }}>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      {...register("tmpRatePercent")}
                      style={{ ...s.input, width: "100%", paddingRight: 28 }}
                    />
                    <span style={s.inputSuffix}>%</span>
                  </div>
                </div>
                <p style={s.taxPreview}>
                  Aperçu : « … y compris les {taxLabel || "…"} de {tmpRatePercent}% »
                </p>
              </Field>
            </Subsection>
          </section>
        )}

        {tab === "parties" && (
          <section>
            <div style={s.partiesSplit}>
              <div>
                <div style={s.partyPanelTitle}>Fournisseur</div>
                <Field label="Fiche fournisseur">
                  <Select {...register("supplierId")}>
                    <option value="">— Saisie libre —</option>
                    {suppliers.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nom affiché sur la facture" required errors={fieldErrors.supplier}>
                  <input {...register("supplier", { required: true })} style={s.input} />
                </Field>
              </div>

              <div>
                <div style={s.partyPanelTitle}>Client</div>
                <Field label="Fiche client">
                  <Select {...register("clientId")}>
                    <option value="">— Saisie libre —</option>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nom affiché sur la facture" required errors={fieldErrors.client}>
                  <input {...register("client", { required: true })} style={s.input} />
                </Field>
              </div>
            </div>

            <Subsection title="Projet" last>
              <div style={s.grid2}>
                <Field label="Nom du projet" required errors={fieldErrors.projectName}>
                  <input {...register("projectName", { required: true })} style={s.input} />
                </Field>
                <Field label="Adresse du projet">
                  <input {...register("projectAddress")} style={s.input} />
                </Field>
              </div>
            </Subsection>
          </section>
        )}

        {tab === "lines" && (
          <section>
            <InvoiceLinesGrid rows={lines} onChange={setLines} libelleStyle={libelleStyle} />

            <div style={s.totalRow}>
              <span style={s.totalLabel}>Montant total TTC</span>
              <span style={s.totalValue}>
                {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(totalTtc)} {watch("currency") || "Ar"}
              </span>
            </div>
            {amountInWords && (
              <div style={s.wordsBox}>
                <span style={s.wordsLabel}>En lettres —</span> {amountInWords}
              </div>
            )}
          </section>
        )}

        {tab === "layout" && (
          <section>
            <div style={s.grid2}>
              <Field label="En-tête">
                <Select {...register("headerId")}>
                  <option value="">— Aucun —</option>
                  {headers.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Pied de page">
                <Select {...register("footerId")}>
                  <option value="">— Aucun —</option>
                  {footers.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <p style={s.helpText}>
              Gérer les fournisseurs, modes de paiement, types de date, en-têtes, pieds de page et le style LIBELLE
              depuis <Link href="/admin/invoices/settings" style={{ color: "#EF9F27", fontWeight: 700 }}>Paramètres de facturation</Link>.
            </p>
          </section>
        )}

        {tab === "bank" && (
          <section>
            <Subsection title="Compte">
              <div style={s.grid2}>
                <Field label="Banque"><input {...register("bankName")} style={s.input} /></Field>
                <Field label="Titulaire du compte"><input {...register("accountHolder")} style={s.input} /></Field>
                <Field label="Numéro de compte"><input {...register("accountNumber")} style={s.input} /></Field>
              </div>
            </Subsection>

            <Subsection title="Codes bancaires">
              <div style={s.grid2}>
                <Field label="Code banque"><input {...register("bankCode")} style={s.input} /></Field>
                <Field label="Code guichet"><input {...register("branchCode")} style={s.input} /></Field>
                <Field label="Clé RIB"><input {...register("ribKey")} style={s.input} /></Field>
                <Field label="BIC"><input {...register("bic")} style={s.input} /></Field>
                <Field label="IBAN"><input {...register("iban")} style={s.input} /></Field>
              </div>
            </Subsection>

            <Subsection title="Signature" last>
              <Field label="Nom, fonction et signature">
                <input {...register("signature")} style={s.input} />
              </Field>
            </Subsection>
          </section>
        )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Subsection({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ ...s.subsection, ...(last ? { marginBottom: 0, paddingBottom: 0, borderBottom: "none" } : {}) }}>
      <div style={s.subsectionTitle}>{title}</div>
      {children}
    </div>
  );
}

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { children, style, ...props },
  ref
) {
  return (
    <div className="inv-select-wrap">
      <select ref={ref} {...props} className="inv-select" style={{ ...s.input, ...style }}>
        {children}
      </select>
      <ChevronDown size={15} className="inv-select-chevron" />
    </div>
  );
});

function Field({
  label,
  required,
  errors,
  children,
}: {
  label: string;
  required?: boolean;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <label style={s.fieldGroup}>
      <span style={s.fieldLabel}>
        {label}
        {required && <span style={s.requiredMark}> *</span>}
      </span>
      {children}
      {errors && errors.length > 0 && <span style={s.fieldError}>{errors[0]}</span>}
    </label>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_DEEP = "#B4610F";
const BG = "#F8F7F4";
const SURFACE = "#FFFFFF";
const BORDER = "#E7E4DD";
const TEXT = "#1C1917";
const MUTED = "#6B6660";

const s: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: BG, color: TEXT, padding: 32, boxSizing: "border-box" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED, textDecoration: "none", marginBottom: 10 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: MUTED },
  primaryButton: { height: 40, padding: "0 18px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, background: ORANGE, color: "#1a0d00", border: "none", cursor: "pointer" },
  errorBox: { marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: SURFACE, color: "#B42318", borderLeft: "3px solid #E11D48", fontSize: 13, fontWeight: 600 },
  sectionHeading: { margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" },
  sectionSubheading: { margin: "4px 0 24px", fontSize: 12.5, color: MUTED },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  fieldLabel: { fontSize: 11.5, fontWeight: 600, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.03em" },
  requiredMark: { color: ORANGE_DEEP },
  fieldError: { fontSize: 11, color: "#DC2626", fontWeight: 700 },
  input: { height: 38, borderRadius: 7, border: `1px solid ${BORDER}`, padding: "0 11px", fontSize: 13.5, outline: "none", boxSizing: "border-box", background: SURFACE, transition: "border-color 0.15s ease, box-shadow 0.15s ease" },
  textarea: { borderRadius: 7, border: `1px solid ${BORDER}`, padding: 10, fontSize: 13.5, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", background: SURFACE, transition: "border-color 0.15s ease, box-shadow 0.15s ease" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 22, paddingTop: 16, borderTop: `1px solid ${BORDER}` },
  totalLabel: { fontSize: 12, fontWeight: 600, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.03em" },
  totalValue: { fontSize: 21, fontWeight: 700, color: ORANGE_DEEP },
  wordsBox: { marginTop: 8, fontSize: 12.5, color: MUTED, lineHeight: 1.6, textAlign: "right" },
  wordsLabel: { fontWeight: 600, color: "#78716C" },
  helpText: { fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.6 },
  dateTodayButton: { height: 38, padding: "0 11px", borderRadius: 7, border: `1px solid ${BORDER}`, background: SURFACE, color: "#44403C", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, height: 38, fontSize: 13, color: "#44403C" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#44403C", marginTop: 4 },
  inputIconLeft: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A8A29E", pointerEvents: "none" },
  inputSuffix: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, color: MUTED, pointerEvents: "none" },
  taxPreview: { fontSize: 12, color: MUTED, marginTop: 6, fontStyle: "italic" },
  subsection: { marginBottom: 26, paddingBottom: 26, borderBottom: `1px solid ${BORDER}` },
  subsectionTitle: { fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 },
  partiesSplit: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28, marginBottom: 26, paddingBottom: 26, borderBottom: `1px solid ${BORDER}` },
  partyPanelTitle: { fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 },
};
