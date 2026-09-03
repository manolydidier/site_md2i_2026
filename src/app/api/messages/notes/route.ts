// src/app/api/messages/notes/route.ts
// POST   — ajoute une note interne ou une entrée "réponse envoyée" sur un message
// DELETE — retire une note (auteur ou permission de suppression)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "messages", action: "canUpdate" });
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => null);
    const messageId = String(body?.messageId || "");
    const text = String(body?.body || "").trim();
    const type = body?.type === "REPLY" ? "REPLY" : "NOTE";

    if (!UUID_RE.test(messageId)) {
      return NextResponse.json({ ok: false, error: "Message invalide." }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ ok: false, error: "Le contenu de la note est requis." }, { status: 400 });
    }

    const author = guard.session.user;
    const authorName = author.name || author.email || "Admin";

    const [note] = await prisma.$transaction([
      prisma.contactMessageNote.create({
        data: {
          messageId,
          authorId: author.id,
          authorName,
          type,
          body: text,
        },
      }),
      ...(type === "REPLY"
        ? [
            prisma.contactMessage.update({
              where: { id: messageId },
              data: { status: "REPLIED" as const },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true, note });
  } catch (error) {
    console.error("[messages/notes][POST]", error);
    return NextResponse.json({ ok: false, error: "Impossible d'ajouter la note." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "messages", action: "canUpdate" });
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => null);
    const id = String(body?.id || "");

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: "Note invalide." }, { status: 400 });
    }

    const note = await prisma.contactMessageNote.findUnique({ where: { id } });

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note introuvable." }, { status: 404 });
    }

    const isAuthor = note.authorId && note.authorId === guard.session.user.id;

    if (!isAuthor) {
      const deleteGuard = await withPermission(request, { resource: "messages", action: "canDelete" });
      if (!deleteGuard.ok) return deleteGuard.response;
    }

    await prisma.contactMessageNote.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[messages/notes][DELETE]", error);
    return NextResponse.json({ ok: false, error: "Impossible de supprimer la note." }, { status: 500 });
  }
}
