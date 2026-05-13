// lib/email/import-export.ts
// Import CSV/Excel et export CSV des contacts
// Packages requis : xlsx, papaparse

import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ImportRow, ImportResult } from "@/app/types/email-marketing";

// ─── IMPORT ───────────────────────────────────────────────────────────────────

/**
 * Parse un fichier CSV ou Excel (Buffer) et retourne les lignes normalisées.
 * Colonnes attendues : email (obligatoire), firstName, lastName, phone
 * Colonnes alternatives tolérées : "Email", "E-mail", "Prénom", "Nom", etc.
 */
export async function parseContactFile(
  buffer: Buffer,
  mimeType: string
): Promise<{ rows: ImportRow[]; errors: string[] }> {
  const errors: string[] = [];
  let rows: ImportRow[] = [];

  try {
    if (mimeType.includes("csv") || mimeType.includes("text/plain")) {
      // ── CSV ──
      const text = buffer.toString("utf-8");
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      if (result.errors.length) {
        errors.push(...result.errors.map((e) => e.message));
      }
      rows = result.data.map(normalizeRow);
    } else {
      // ── Excel (.xlsx, .xls) ──
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: "",
        raw: false,
      });
      rows = raw.map(normalizeRow);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    errors.push(`Erreur de lecture : ${message}`);
  }

  return { rows, errors };
}

/** Normalise les noms de colonnes (case-insensitive, accents tolérés) */
function normalizeRow(raw: Record<string, string>): ImportRow {
  const find = (keys: string[]) => {
    for (const key of keys) {
      const found = Object.keys(raw).find(
        (k) => k.toLowerCase().replace(/[^a-z]/g, "") === key.toLowerCase().replace(/[^a-z]/g, "")
      );
      if (found) return raw[found]?.trim() || undefined;
    }
    return undefined;
  };

  return {
    email: find(["email", "mail", "email", "courriel"]) || "",
    firstName: find(["firstname", "prenom", "prénom", "first", "givenname"]),
    lastName: find(["lastname", "nom", "last", "surname", "familyname"]),
    phone: find(["phone", "telephone", "téléphone", "tel", "mobile"]),
  };
}

/**
 * Importe les lignes dans la BDD via Prisma
 * Retourne un résumé : succès, échecs, erreurs
 */
export async function importContactsToDB(
  rows: ImportRow[],
  userId: string,
  groupId?: string
): Promise<ImportResult> {
  // Import dynamique de prisma pour éviter les soucis SSR
  const { prisma } = await import("@/app/lib/prisma");

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      result.failed++;
      result.errors.push({ row: i + 2, email: row.email || "(vide)", error: "Email invalide" });
      continue;
    }

    try {
      await prisma.contact.upsert({
        where: { email_userId: { email: row.email.toLowerCase(), userId } },
        create: {
          email: row.email.toLowerCase(),
          firstName: row.firstName || null,
          lastName: row.lastName || null,
          phone: row.phone || null,
          userId,
          groupId: groupId || null,
        },
        update: {
          firstName: row.firstName || undefined,
          lastName: row.lastName || undefined,
          phone: row.phone || undefined,
          ...(groupId ? { groupId } : {}),
        },
      });
      result.success++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "DB error";
      result.failed++;
      result.errors.push({ row: i + 2, email: row.email, error: message });
    }
  }

  return result;
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/** Génère un CSV en mémoire à partir d'une liste de contacts */
export function exportContactsToCSV(
  contacts: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    group?: { name: string } | null;
    createdAt: Date;
  }[]
): string {
  const rows = contacts.map((c) => ({
    email: c.email,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    phone: c.phone || "",
    group: c.group?.name || "",
    createdAt: c.createdAt.toISOString().split("T")[0],
  }));

  return Papa.unparse(rows, {
    header: true,
    columns: ["email", "firstName", "lastName", "phone", "group", "createdAt"],
  });
}

/** Génère un fichier Excel en mémoire */
export function exportContactsToExcel(
  contacts: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    group?: { name: string } | null;
    createdAt: Date;
  }[]
): Buffer {
  const rows = contacts.map((c) => ({
    Email: c.email,
    Prénom: c.firstName || "",
    Nom: c.lastName || "",
    Téléphone: c.phone || "",
    Groupe: c.group?.name || "",
    "Date ajout": c.createdAt.toISOString().split("T")[0],
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
