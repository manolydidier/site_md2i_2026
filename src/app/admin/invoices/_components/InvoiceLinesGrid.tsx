"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AgGridReact,
} from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  type ColDef,
  type CellStyle,
  type CellValueChangedEvent,
  type ICellRendererParams,
} from "ag-grid-community";
import { Trash2, Plus, Pencil } from "lucide-react";
import { toCssStyle, type TextStyle, type TextRun } from "@/app/lib/invoices/style";
import LibelleRunsEditor from "./LibelleRunsEditor";

ModuleRegistry.registerModules([AllCommunityModule]);

export type InvoiceLineRow = {
  rowId: string;
  id?: string;
  libelle: string;
  libelleRuns?: TextRun[] | null;
  unite: string;
  quantite: number;
  prixUnitaire: number;
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function DeleteRowButton(props: ICellRendererParams<InvoiceLineRow> & { onDelete: (rowId: string) => void }) {
  if (!props.data) return null;

  return (
    <button
      type="button"
      onClick={() => props.onDelete(props.data!.rowId)}
      title="Supprimer la ligne"
      style={{
        width: 28,
        height: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #FECACA",
        background: "#FEF2F2",
        color: "#991B1B",
        borderRadius: 7,
        cursor: "pointer",
        marginTop: 4,
      }}
    >
      <Trash2 size={13} />
    </button>
  );
}

function LibelleCellRenderer(props: ICellRendererParams<InvoiceLineRow> & { onEditRuns: (rowId: string) => void }) {
  if (!props.data) return null;
  const runs = props.data.libelleRuns;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {runs && runs.length > 0
          ? runs.map((run, i) => (
              <span
                key={i}
                style={{
                  fontWeight: run.style?.bold ? 700 : undefined,
                  fontStyle: run.style?.italic ? "italic" : undefined,
                  textDecoration: run.style?.underline ? "underline" : undefined,
                  color: run.style?.color,
                }}
              >
                {run.text}
              </span>
            ))
          : props.data.libelle}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          props.onEditRuns(props.data!.rowId);
        }}
        title="Styler le libellé mot par mot"
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #E5E7EB",
          background: "#F8FAFC",
          color: "#334155",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}

export default function InvoiceLinesGrid({
  rows,
  onChange,
  libelleStyle,
}: {
  rows: InvoiceLineRow[];
  onChange: (rows: InvoiceLineRow[]) => void;
  libelleStyle?: TextStyle;
}) {
  const handleDelete = useCallback(
    (rowId: string) => {
      onChange(rows.filter((row) => row.rowId !== rowId));
    },
    [rows, onChange]
  );

  const handleAddRow = useCallback(() => {
    onChange([
      ...rows,
      {
        rowId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        libelle: "",
        unite: "",
        quantite: 0,
        prixUnitaire: 0,
      },
    ]);
  }, [rows, onChange]);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<InvoiceLineRow>) => {
      if (!event.data) return;

      // Une édition directe du texte libelle invalide les runs stylés déjà
      // définis (ils référenceraient l'ancien texte) — repli sur texte brut.
      const editedLibelle = event.colDef.field === "libelle" && event.oldValue !== event.newValue;
      const nextData = editedLibelle ? { ...event.data, libelleRuns: null } : event.data;

      onChange(rows.map((row) => (row.rowId === nextData.rowId ? { ...nextData } : row)));
    },
    [rows, onChange]
  );

  const [editingRunsRowId, setEditingRunsRowId] = useState<string | null>(null);
  const editingRow = rows.find((row) => row.rowId === editingRunsRowId) || null;

  const columnDefs = useMemo<ColDef<InvoiceLineRow>[]>(
    () => [
      {
        field: "libelle",
        headerName: "Libellé",
        editable: true,
        flex: 3,
        cellDataType: "text",
        cellStyle: libelleStyle ? (toCssStyle(libelleStyle) as unknown as CellStyle) : undefined,
        cellRenderer: (params: ICellRendererParams<InvoiceLineRow>) => (
          <LibelleCellRenderer {...params} onEditRuns={setEditingRunsRowId} />
        ),
      },
      { field: "unite", headerName: "Unité", editable: true, flex: 1, cellDataType: "text" },
      {
        field: "quantite",
        headerName: "Quantité",
        editable: true,
        flex: 1,
        cellDataType: "number",
        type: "numericColumn",
        valueParser: (p) => Math.max(0, Number(p.newValue) || 0),
      },
      {
        field: "prixUnitaire",
        headerName: "Prix unitaire (Ar)",
        editable: true,
        flex: 1.3,
        cellDataType: "number",
        type: "numericColumn",
        valueParser: (p) => Math.max(0, Number(p.newValue) || 0),
        valueFormatter: (p) => (p.value != null ? currencyFormatter.format(p.value) : ""),
      },
      {
        headerName: "Montant (Ar)",
        editable: false,
        flex: 1.3,
        type: "numericColumn",
        valueGetter: (p) =>
          Math.round((Number(p.data?.quantite) || 0) * (Number(p.data?.prixUnitaire) || 0) * 100) / 100,
        valueFormatter: (p) => (p.value != null ? currencyFormatter.format(p.value) : ""),
        cellStyle: { fontWeight: 700, background: "#F8FAFC" },
      },
      {
        headerName: "",
        width: 56,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<InvoiceLineRow>) => (
          <DeleteRowButton {...params} onDelete={handleDelete} />
        ),
      },
    ],
    [handleDelete, libelleStyle, setEditingRunsRowId]
  );

  return (
    <div>
      <div
        className="ag-theme-quartz"
        style={{ height: Math.max(220, rows.length * 46 + 60), width: "100%" }}
      >
        <AgGridReact<InvoiceLineRow>
          theme={themeQuartz}
          rowData={rows}
          columnDefs={columnDefs}
          getRowId={(p) => p.data.rowId}
          onCellValueChanged={handleCellValueChanged}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          domLayout="normal"
        />
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        style={{
          marginTop: 10,
          height: 38,
          padding: "0 14px",
          borderRadius: 9,
          border: "1px dashed #CBD5E1",
          background: "#F8FAFC",
          color: "#334155",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Plus size={14} />
        Ajouter une ligne
      </button>

      {editingRow && (
        <LibelleRunsEditor
          libelle={editingRow.libelle}
          initialRuns={editingRow.libelleRuns ?? null}
          onClose={() => setEditingRunsRowId(null)}
          onSave={(runs) => {
            onChange(
              rows.map((row) =>
                row.rowId === editingRow.rowId
                  ? { ...row, libelleRuns: runs, libelle: runs.map((r) => r.text).join("") }
                  : row
              )
            );
            setEditingRunsRowId(null);
          }}
        />
      )}
    </div>
  );
}
