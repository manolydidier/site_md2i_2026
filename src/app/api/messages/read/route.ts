import { ContactStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  getMessageId,
  redirectBack,
  requireAdminApiAuth,
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
    const authResponse = await requireAdminApiAuth(request);

    if (authResponse) return authResponse;

    if (isJsonRequest(request)) {
      const body = await request.json();

      const formData = new FormData();
      formData.set("id", String(body.id || ""));

      const id = getMessageId(formData);

      const message = await prisma.contactMessage.update({
        where: { id },
        data: {
          status: "READ" as ContactStatus,
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        ok: true,
        message,
      });
    }

    const formData = await request.formData();
    const id = getMessageId(formData);

    await prisma.contactMessage.update({
      where: { id },
      data: {
        status: "READ" as ContactStatus,
      },
    });

    return redirectBack(request, formData);
  } catch (error) {
    console.error("[admin/messages/read]", error);

    if (isJsonRequest(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible de marquer le message comme lu.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/admin/messages", request.url), {
      status: 303,
    });
  }
}