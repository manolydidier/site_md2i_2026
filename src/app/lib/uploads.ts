import { promises as fs } from "fs";
import path from "path";

import { prisma } from "@/app/lib/prisma";

export type UploadItem = {
  id: string;
  url: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  type: "image" | "file";
  ext: string;
};

export const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

// En dessous de ce seuil, un fichier fraîchement uploadé n'est pas considéré
// comme orphelin : le formulaire qui l'a envoyé (article, produit, projet…)
// peut ne pas être encore enregistré, l'upload ayant lieu au choix du fichier,
// avant la sauvegarde du formulaire.
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export async function walkUploads(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return walkUploads(fullPath);
      }

      if (entry.isFile()) {
        return [fullPath];
      }

      return [];
    })
  );

  return results.flat();
}

export function toPublicUploadUrl(absPath: string) {
  const rel = path.relative(path.join(process.cwd(), "public"), absPath);
  return "/" + rel.split(path.sep).join("/");
}

function detectUploadType(ext: string): "image" | "file" {
  return IMAGE_EXTENSIONS.has(ext.toLowerCase()) ? "image" : "file";
}

export async function listUploadFiles(rootDir: string = UPLOADS_ROOT): Promise<UploadItem[]> {
  try {
    await fs.access(rootDir);
  } catch {
    return [];
  }

  const filePaths = await walkUploads(rootDir);

  return Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      const item: UploadItem = {
        id: filePath,
        url: toPublicUploadUrl(filePath),
        name: path.basename(filePath),
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
        type: detectUploadType(ext),
        ext,
      };

      return item;
    })
  );
}

// Résout un identifiant de fichier (chemin absolu tel que renvoyé par
// listUploadFiles) en s'assurant qu'il reste bien dans public/uploads —
// empêche toute tentative de traversée de répertoire (../../etc) depuis un
// id fourni par le client.
export function resolveUploadId(id: string): string {
  const resolved = path.resolve(id);
  const rootWithSep = UPLOADS_ROOT + path.sep;

  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(rootWithSep)) {
    throw new Error("Identifiant de fichier invalide.");
  }

  return resolved;
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return decodeURIComponent(url.trim());
  } catch {
    return url.trim();
  }
}

// Recense toutes les URLs d'upload encore référencées par un enregistrement
// en base, tous modèles confondus — sert à déterminer quels fichiers sous
// public/uploads sont orphelins.
export async function getReferencedUploadUrls(): Promise<Set<string>> {
  const [users, posts, products, projects] = await Promise.all([
    prisma.user.findMany({
      where: { avatarUrl: { not: null } },
      select: { avatarUrl: true },
    }),
    prisma.post.findMany({
      where: { coverImage: { not: null } },
      select: { coverImage: true },
    }),
    prisma.product.findMany({
      select: { coverImage: true, images: true },
    }),
    prisma.project.findMany({
      select: { coverImage: true, images: true },
    }),
  ]);

  const referenced = new Set<string>();

  const add = (url: string | null | undefined) => {
    const normalized = normalizeUrl(url);
    if (normalized) referenced.add(normalized);
  };

  users.forEach((u) => add(u.avatarUrl));
  posts.forEach((p) => add(p.coverImage));
  products.forEach((p) => {
    add(p.coverImage);
    p.images.forEach(add);
  });
  projects.forEach((p) => {
    add(p.coverImage);
    p.images.forEach(add);
  });

  return referenced;
}

export type OrphanUploadItem = UploadItem & { ageMs: number };

export async function findOrphanedUploads(
  minAgeMs: number = ORPHAN_MIN_AGE_MS
): Promise<OrphanUploadItem[]> {
  const [files, referenced] = await Promise.all([
    listUploadFiles(),
    getReferencedUploadUrls(),
  ]);

  const now = Date.now();

  return files
    .filter((file) => !referenced.has(normalizeUrl(file.url) as string))
    .map((file) => ({ ...file, ageMs: now - new Date(file.createdAt).getTime() }))
    .filter((file) => file.ageMs >= minAgeMs);
}
