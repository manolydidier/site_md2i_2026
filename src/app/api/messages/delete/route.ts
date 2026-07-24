import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import {
  getMessageId,
  redirectBack,
} from "@/app/lib/messages/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isJsonRequest(request: NextRequest) {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
}

export async function POST(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "messages", action: "canDelete" });
    if (!guard.ok) return guard.response;

    if (isJsonRequest(request)) {
      const body = await request.json();

      const formData = new FormData();
      formData.set("id", String(body.id || ""));

      const id = getMessageId(formData);

      await prisma.contactMessage.delete({
        where: { id },
      });

      return NextResponse.json({
        ok: true,
      });
    }

    const formData = await request.formData();
    const id = getMessageId(formData);

    await prisma.contactMessage.delete({
      where: { id },
    });

    return redirectBack(request, formData);
  } catch (error) {
    console.error("[admin/messages/delete]", error);

    if (isJsonRequest(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible de supprimer le message.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/admin/messages", request.url), {
      status: 303,
    });
  }
}