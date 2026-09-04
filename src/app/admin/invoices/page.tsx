"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePermissions } from "@/(permisionGuard)/context/PermissionsContext";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  RefreshCcw,
} from "lucide-react";
import { formatDate as formatDateShared } from "@/app/lib/format-date";

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  client: string;
  projectName: string;
  invoiceDate: string | null;
  totalTtc: string | number;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
  documentType: "FACTURE" | "PROFORMA";
};

const STATUS_LABELS: Record<InvoiceListItem["status"], string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PAID: "Payée",
  CANCELLED: "Annulée",
};

function formatAmount(value: string | number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(value)
  );
}

function formatDate(value: string | null) {
  return formatDateShared(value, { style: "numeric" });
}

export default function InvoicesListPage() {
  const { can } = usePermissions();
  const canCreate = can("invoices", "canCreate");
  const canUpdate = can("invoices", "canUpdate");
  const canDelete = can("invoices", "canDelete");

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (client.trim()) params.set("client", client.trim());
    if (project.trim()) params.set("project", project.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [page, client, project, dateFrom, dateTo]);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/invoices?${query}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors du chargement.");

      setInvoices(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!window.confirm(`Supprimer la facture ${invoiceNumber} ? Cette action peut être annulée par un administrateur.`)) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.titleRow}>
          <div style={s.iconBadge}>
            <FileText size={22} />
          </div>
          <div>
            <h1 style={s.title}>Factures</h1>
            <p style={s.subtitle}>Gestion des factures MD2I — création, édition, export Excel/PDF.</p>
          </div>
        </div>

        {canCreate && (
          <Link href="/admin/invoices/new" style={s.primaryButton}>
            <Plus size={16} />
            Créer une facture
          </Link>
        )}
      </header>

      <section style={s.filters}>
        <div style={s.filterField}>
          <Search size={14} style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Filtrer par client…"
            value={client}
            onChange={(e) => { setPage(1); setClient(e.target.value); }}
            style={s.filterInput}
          />
        </div>

        <div style={s.filterField}>
          <input
            type="text"
            placeholder="Filtrer par projet…"
            value={project}
            onChange={(e) => { setPage(1); setProject(e.target.value); }}
            style={s.filterInput}
          />
        </div>

        <div style={s.filterField}>
          <label style={s.filterLabel}>Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
            style={s.filterInput}
          />
        </div>

        <div style={s.filterField}>
          <label style={s.filterLabel}>Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
            style={s.filterInput}
          />
        </div>

        <button type="button" onClick={loadInvoices} style={s.refreshButton} disabled={loading}>
          <RefreshCcw size={14} />
        </button>
      </section>

      {error && <div style={s.errorBox}>{error}</div>}

      <section style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>N° facture</th>
              <th style={s.th}>Date</th>
              <th style={s.th}>Client</th>
              <th style={s.th}>Projet</th>
              <th style={{ ...s.th, textAlign: "right" }}>Total (Ar)</th>
              <th style={s.th}>Statut</th>
              <th style={{ ...s.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td style={s.tdEmpty} colSpan={7}>Chargement…</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td style={s.tdEmpty} colSpan={7}>Aucune facture trouvée.</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={s.td}>
                    {invoice.invoiceNumber}
                    {invoice.documentType === "PROFORMA" && <span style={s.proformaBadge}>Proforma</span>}
                  </td>
                  <td style={s.td}>{formatDate(invoice.invoiceDate)}</td>
                  <td style={s.td}>{invoice.client}</td>
                  <td style={s.td}>{invoice.projectName}</td>
                  <td style={{ ...s.td, textAlign: "right" }}>{formatAmount(invoice.totalTtc)}</td>
                  <td style={s.td}>
                    <span style={s.statusBadge}>{STATUS_LABELS[invoice.status]}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <div style={s.actions}>
                      <Link href={`/admin/invoices/${invoice.id}/view`} style={s.iconLink} title="Voir">
                        <Eye size={15} />
                      </Link>
                      {canUpdate && (
                        <Link href={`/admin/invoices/${invoice.id}`} style={s.iconLink} title="Modifier">
                          <Pencil size={15} />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                          disabled={deletingId === invoice.id}
                          style={s.iconButtonDanger}
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={s.pagination}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={s.pageBtn}>
              Précédent
            </button>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Page {page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={s.pageBtn}>
              Suivant
            </button>
          </div>
        )}
      </section>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 22, flexWrap: "wrap" },
  titleRow: { display: "flex", alignItems: "center", gap: 14 },
  iconBadge: { width: 50, height: 50, borderRadius: 16, background: "rgba(239,159,39,0.1)", border: "1px solid rgba(239,159,39,0.25)", color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" },
  title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" },
  subtitle: { margin: "5px 0 0", color: MUTED, fontSize: 14 },
  primaryButton: { height: 44, padding: "0 18px", borderRadius: 11, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, background: ORANGE, color: "#1a0d00", textDecoration: "none", border: "1px solid rgba(239,159,39,0.25)" },
  filters: { display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" },
  filterField: { display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 14px", borderRadius: 11, background: SURFACE, border: `1px solid ${BORDER}` },
  filterLabel: { fontSize: 12, color: MUTED, fontWeight: 700 },
  filterInput: { border: "none", outline: "none", fontSize: 13, background: "transparent", minWidth: 130 },
  refreshButton: { width: 44, height: 44, borderRadius: 11, background: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED },
  errorBox: { marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", fontSize: 13, fontWeight: 600 },
  card: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 8, boxSizing: "border-box", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "12px 14px", color: MUTED, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${BORDER}` },
  td: { padding: "13px 14px", borderBottom: `1px solid ${BORDER}` },
  tdEmpty: { padding: "32px 14px", textAlign: "center", color: MUTED },
  statusBadge: { display: "inline-flex", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#334155" },
  proformaBadge: { display: "inline-flex", marginLeft: 8, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: "#FEF3C7", color: "#92400E" },
  actions: { display: "flex", gap: 6, justifyContent: "flex-end" },
  iconLink: { width: 34, height: 34, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", color: MUTED, border: `1px solid ${BORDER}`, textDecoration: "none" },
  iconButtonDanger: { width: 34, height: 34, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#991B1B", border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "16px 0 8px" },
  pageBtn: { height: 36, padding: "0 14px", borderRadius: 9, border: `1px solid ${BORDER}`, background: SURFACE, cursor: "pointer", fontSize: 13, fontWeight: 600 },
};
