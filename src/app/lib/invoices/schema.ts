// src/app/lib/invoices/schema.ts
// Schémas zod partagés entre les routes de création et de mise à jour des
// factures (src/app/api/invoices/route.ts et src/app/api/invoices/[id]/route.ts).

import { z } from "zod";
import { textRunsSchema } from "./style";

export const invoiceLineSchema = z.object({
  id: z.string().uuid().optional(),
  libelle: z.string().trim().min(1, "Libellé requis"),
  libelleRuns: textRunsSchema.optional().nullable(),
  unite: z.string().trim().max(50).optional().nullable(),
  quantite: z.coerce.number().min(0, "Quantité invalide"),
  prixUnitaire: z.coerce.number().min(0, "Prix unitaire invalide"),
  sortOrder: z.coerce.number().int().optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1, "Numéro de facture requis").max(50),
  supplier: z.string().trim().min(1, "Fournisseur requis").max(255),
  client: z.string().trim().min(1, "Client requis").max(255),
  projectName: z.string().trim().min(1, "Projet requis"),
  projectAddress: z.string().trim().max(2000).optional().nullable(),
  invoiceDate: z.coerce.date({ message: "Date invalide" }),
  object: z.string().trim().min(1, "Objet requis"),
  lotDescription: z.string().trim().optional().nullable(),
  contractRef: z.string().trim().max(255).optional().nullable(),
  tmpRatePercent: z.coerce.number().min(0).max(100).optional(),
  bankName: z.string().trim().max(255).optional().nullable(),
  accountHolder: z.string().trim().max(255).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  bankCode: z.string().trim().max(20).optional().nullable(),
  branchCode: z.string().trim().max(20).optional().nullable(),
  ribKey: z.string().trim().max(10).optional().nullable(),
  bic: z.string().trim().max(20).optional().nullable(),
  iban: z.string().trim().max(50).optional().nullable(),
  signature: z.string().trim().max(255).optional().nullable(),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]).optional(),
  supplierId: z.string().uuid().optional().nullable(),
  paymentModeId: z.string().uuid().optional().nullable(),
  dateTypeId: z.string().uuid().optional().nullable(),
  headerId: z.string().uuid().optional().nullable(),
  footerId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;

/** Recalcule le montant de chaque ligne (quantite * prixUnitaire) et le total TTC — jamais fait confiance à des valeurs envoyées par le client. */
export function computeInvoiceTotals(lines: InvoiceLineInput[]) {
  const computedLines = lines.map((line, index) => ({
    ...line,
    sortOrder: line.sortOrder ?? index,
    // Le libellé texte brut reste toujours cohérent avec les runs stylés
    // (recherche, tri, export CSV, repli si le style est retiré plus tard).
    // `libelleRuns` normalisé à `null` (jamais `undefined`) pour qu'un tableau
    // vide efface bien les runs existants lors d'une mise à jour.
    libelle:
      line.libelleRuns && line.libelleRuns.length > 0
        ? line.libelleRuns.map((run) => run.text).join("")
        : line.libelle,
    libelleRuns: line.libelleRuns && line.libelleRuns.length > 0 ? line.libelleRuns : null,
    montant: Math.round(line.quantite * line.prixUnitaire * 100) / 100,
  }));

  const totalTtc = Math.round(
    computedLines.reduce((sum, line) => sum + line.montant, 0) * 100
  ) / 100;

  if (totalTtc <= 0) {
    throw new Error("Le total TTC doit être supérieur à zéro.");
  }

  return { computedLines, totalTtc };
}
