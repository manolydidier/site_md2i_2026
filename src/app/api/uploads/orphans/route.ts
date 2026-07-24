import { unlink } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";

import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import {
  findOrphanedUploads,
  getReferencedUploadUrls,
  resolveUploadId,
  toPublicUploadUrl,
} from "@/app/lib/uploads";

// Fichiers sous public/uploads qui ne sont référencés par aucun
// enregistrement (avatar, article, produit, projet) et vieux d'au moins 24h.
export async function GET(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "uploads", action: "canRead" });
    if (!guard.ok) return guard.response;

    const orphans = await findOrphanedUploads();
    const totalSize = orphans.reduce((sum, file) => sum + file.size, 0);

    return NextResponse.json({
      success: true,
      data: orphans,
      totalSize,
    });
  } catch (error) {
    console.error("[GET /api/uploads/orphans]", error);

    return NextResponse.json(
      { success: false, error: "Impossible de lister les fichiers orphelins." },
      { status: 500 }
    );
  }
}

// Supprime les fichiers dont les identifiants sont fournis — jamais de
// suppression globale implicite : le client doit envoyer la liste exacte
// des fichiers à supprimer (issue d'un GET préalable revu par l'admin).
export async function DELETE(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "uploads", action: "canDelete" });
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier sélectionné." },
        { status: 400 }
      );
    }

    // On revérifie que chaque fichier est toujours orphelin au moment de la
    // suppression, pour éviter une course avec un enregistrement qui l'aurait
    // référencé entre le GET et ce DELETE.
    const referenced = await getReferencedUploadUrls();

    const deleted: string[] = [];
    const failed: { id: string; reason: string }[] = [];

    for (const id of ids as string[]) {
      try {
        const resolvedPath = resolveUploadId(id);
        const url = toPublicUploadUrl(resolvedPath);

        if (referenced.has(url)) {
          failed.push({ id, reason: "Fichier désormais référencé, non supprimé." });
          continue;
        }

        await unlink(resolvedPath);
        deleted.push(url);
      } catch (error) {
        failed.push({
          id,
          reason: error instanceof Error ? error.message : "Erreur inconnue.",
        });
      }
    }

    if (deleted.length > 0) {
      await logAudit({
        actorId: guard.session.user.id,
        action: "bulk_delete",
        entity: "upload_file",
        metadata: { count: deleted.length, files: deleted },
        req: request,
      });
    }

    return NextResponse.json({
      success: failed.length === 0,
      deleted,
      failed,
    });
  } catch (error) {
    console.error("[DELETE /api/uploads/orphans]", error);

    return NextResponse.json(
      { success: false, error: "Impossible de supprimer les fichiers sélectionnés." },
      { status: 500 }
    );
  }
}
