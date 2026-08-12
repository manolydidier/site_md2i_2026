// src/app/lib/invoices/document-model.ts
// Résout une facture (relations fournisseur/en-tête/pied de page/mode de
// paiement/type de date incluses) en un objet simple, déjà formaté, unique
// source de vérité consommée à l'identique par la page de visualisation,
// l'export Excel et l'export PDF — élimine la duplication de logique métier
// entre les trois moteurs de rendu (voir plan du module Factures).

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";
import { invoiceAmountInWords } from "./amount-in-words";
import {
  DEFAULT_LIBELLE_STYLE,
  textLinesSchema,
  textRunsSchema,
  textStyleSchema,
  type TextLine,
  type TextRun,
  type TextStyle,
} from "./style";
import { parseRichHtmlToParagraphs, type RichParagraph } from "./html-to-paragraphs";

export const invoiceDocumentInclude = {
  lines: { orderBy: { sortOrder: "asc" } },
  supplierRef: true,
  paymentMode: true,
  dateType: true,
  header: true,
  footer: true,
  clientRef: true,
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof invoiceDocumentInclude;
}>;

export type InvoiceDocumentModel = {
  id: string;
  invoiceNumber: string;
  supplier: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    statNumber: string | null;
    nif: string | null;
    rcs: string | null;
  };
  client: string;
  clientContentHtml: string;
  clientParagraphs: RichParagraph[];
  projectName: string;
  projectAddress: string | null;
  invoiceDate: Date;
  invoiceDateLabel: string;
  dateTypeLabel: string | null;
  object: string;
  lotDescription: string | null;
  contractRef: string | null;
  paymentModeLabel: string | null;
  lines: {
    libelle: string;
    libelleRuns: TextRun[] | null;
    unite: string | null;
    quantite: number;
    prixUnitaire: number;
    montant: number;
  }[];
  totalTtc: number;
  amountInWords: string;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  bankCode: string | null;
  branchCode: string | null;
  ribKey: string | null;
  bic: string | null;
  iban: string | null;
  signature: string | null;
  header: { imageUrl: string; altText: string | null } | null;
  footerLines: TextLine[];
  libelleStyle: TextStyle;
};

/** Charge le réglage global de style LIBELLE (singleton), avec repli sur le style par défaut. */
export async function getLibelleStyle(): Promise<TextStyle> {
  const settings = await prisma.invoiceDocumentSettings.findUnique({ where: { id: "default" } });
  if (!settings) return DEFAULT_LIBELLE_STYLE;

  const parsed = textStyleSchema.safeParse(settings.libelleStyle);
  return parsed.success ? parsed.data : DEFAULT_LIBELLE_STYLE;
}

function formatDateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function buildInvoiceDocumentModel(
  invoice: InvoiceWithRelations,
  libelleStyle: TextStyle
): InvoiceDocumentModel {
  // Le total est recalculé à partir des lignes à chaque accès (convention déjà
  // en place ailleurs dans ce module), jamais depuis la valeur stockée.
  const recalculatedTotal = invoice.lines.reduce((sum, line) => sum + Number(line.montant), 0);
  const totalTtc = Math.round(recalculatedTotal * 100) / 100;
  const tmpRatePercent = Number(invoice.tmpRatePercent);
  const amountInWords = totalTtc > 0 ? invoiceAmountInWords(totalTtc, tmpRatePercent) : invoice.amountInWords || "";

  const footerLinesParsed = textLinesSchema.safeParse(invoice.footer?.lines ?? []);
  const footerLines = footerLinesParsed.success ? footerLinesParsed.data : [];

  const clientContentHtml = invoice.clientContent || "";
  const clientParagraphs = clientContentHtml ? parseRichHtmlToParagraphs(clientContentHtml) : [];

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    supplier: {
      name: invoice.supplier,
      address: invoice.supplierAddress,
      phone: invoice.supplierPhone,
      email: invoice.supplierEmail,
      statNumber: invoice.supplierStatNumber,
      nif: invoice.supplierNif,
      rcs: invoice.supplierRcs,
    },
    client: invoice.client,
    clientContentHtml,
    clientParagraphs,
    projectName: invoice.projectName,
    projectAddress: invoice.projectAddress,
    invoiceDate: invoice.invoiceDate,
    invoiceDateLabel: formatDateFr(invoice.invoiceDate),
    dateTypeLabel: invoice.dateType?.label ?? null,
    object: invoice.object,
    lotDescription: invoice.lotDescription,
    contractRef: invoice.contractRef,
    paymentModeLabel: invoice.paymentMode?.label ?? null,
    lines: invoice.lines.map((line) => {
      const runsParsed = textRunsSchema.safeParse(line.libelleRuns ?? []);
      const runs = runsParsed.success && runsParsed.data.length > 0 ? runsParsed.data : null;

      return {
        libelle: line.libelle,
        libelleRuns: runs,
        unite: line.unite,
        quantite: Number(line.quantite),
        prixUnitaire: Number(line.prixUnitaire),
        montant: Number(line.montant),
      };
    }),
    totalTtc,
    amountInWords,
    bankName: invoice.bankName,
    accountHolder: invoice.accountHolder,
    accountNumber: invoice.accountNumber,
    bankCode: invoice.bankCode,
    branchCode: invoice.branchCode,
    ribKey: invoice.ribKey,
    bic: invoice.bic,
    iban: invoice.iban,
    signature: invoice.signature,
    header: invoice.header ? { imageUrl: invoice.header.imageUrl, altText: invoice.header.altText } : null,
    footerLines,
    libelleStyle,
  };
}
