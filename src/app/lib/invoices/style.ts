// src/app/lib/invoices/style.ts
// Type de style texte partagé entre l'aperçu web (CSS), l'export Excel
// (exceljs) et l'export PDF (@react-pdf/renderer), utilisé pour la colonne
// LIBELLE et pour chaque ligne de pied de page. Un seul modèle de données,
// trois adaptateurs "peinture" — voir plan du module Factures.

import type { CSSProperties } from "react";
import { z } from "zod";

// Polices garanties disponibles à la fois dans le navigateur, dans Excel
// (police système Windows/Office) et mappées vers une police standard PDF.
export const SAFE_FONT_FAMILIES = [
  "Calibri",
  "Arial",
  "Times New Roman",
  "Verdana",
  "Georgia",
] as const;

export type SafeFontFamily = (typeof SAFE_FONT_FAMILIES)[number];

export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNMENTS)[number];

export type TextStyle = {
  fontFamily: SafeFontFamily;
  fontSize: number;
  color: string;
  backgroundColor: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
};

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide (format attendu: #RRGGBB).");

export const textStyleSchema = z.object({
  fontFamily: z.enum(SAFE_FONT_FAMILIES),
  fontSize: z.number().min(6).max(72),
  color: hexColor,
  backgroundColor: hexColor.nullable(),
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),
  align: z.enum(TEXT_ALIGNMENTS),
}) satisfies z.ZodType<TextStyle>;

export const textLineSchema = z.object({
  text: z.string().min(1, "Le texte est requis.").max(300),
  style: textStyleSchema,
});

export const textLinesSchema = z.array(textLineSchema).max(20);

export type TextLine = z.infer<typeof textLineSchema>;

// ── Runs (style optionnel par mot/segment — colonne LIBELLE) ───────────────
// `style: null` = segment non stylé (texte brut), répond au besoin "choisir
// si on veut appliquer le style ou pas" mot par mot, sans introduire de HTML.
export const textRunSchema = z.object({
  text: z.string().min(1, "Le texte est requis.").max(500),
  style: textStyleSchema.nullable(),
});

export const textRunsSchema = z.array(textRunSchema).max(200);

export type TextRun = z.infer<typeof textRunSchema>;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Calibri",
  fontSize: 12,
  color: "#111827",
  backgroundColor: null,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
};

export const DEFAULT_LIBELLE_STYLE: TextStyle = {
  ...DEFAULT_TEXT_STYLE,
};

// ── Adaptateur CSS (aperçu web) ───────────────────────────────────────────
export function toCssStyle(style: TextStyle): CSSProperties {
  return {
    fontFamily: `"${style.fontFamily}", sans-serif`,
    fontSize: style.fontSize,
    color: style.color,
    backgroundColor: style.backgroundColor || undefined,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: style.align,
  };
}

// ── Adaptateur Excel (exceljs) ────────────────────────────────────────────
function hexToArgb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

export function toExcelCellStyle(style: TextStyle) {
  return {
    font: {
      name: style.fontFamily,
      size: style.fontSize,
      bold: style.bold,
      italic: style.italic,
      underline: style.underline,
      color: { argb: hexToArgb(style.color) },
    },
    fill: style.backgroundColor
      ? ({
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: hexToArgb(style.backgroundColor) },
        } as const)
      : undefined,
    alignment: { horizontal: style.align, vertical: "top", wrapText: true } as const,
  };
}

// ── Adaptateur PDF (@react-pdf/renderer) ──────────────────────────────────
// react-pdf ne connaît nativement que Helvetica / Times-Roman / Courier
// (et leurs variantes gras/italique résolues automatiquement) — chaque
// police "sûre" est donc mappée vers l'équivalent standard le plus proche.
const PDF_FONT_MAP: Record<SafeFontFamily, string> = {
  Calibri: "Helvetica",
  Arial: "Helvetica",
  Verdana: "Helvetica",
  Georgia: "Times-Roman",
  "Times New Roman": "Times-Roman",
};

export function toPdfStyle(style: TextStyle) {
  return {
    fontFamily: PDF_FONT_MAP[style.fontFamily],
    fontSize: style.fontSize,
    color: style.color,
    backgroundColor: style.backgroundColor || undefined,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: style.align,
  } as const;
}
